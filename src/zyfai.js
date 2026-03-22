import { ZyfaiSDK } from "@zyfai/sdk";
import { createPublicClient, createWalletClient, custom, http, parseEther } from "viem";
import { base } from "viem/chains";

// ── Config ────────────────────────────────────────────────────────────────────

const CHAIN_ID = 8453; // Base mainnet

// Token addresses on Base mainnet
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

const BALANCE_OF_ABI = [{
  name: "balanceOf", type: "function", stateMutability: "view",
  inputs:  [{ name: "account", type: "address" }],
  outputs: [{ type: "uint256" }],
}];

// ── Helpers ───────────────────────────────────────────────────────────────────

function createSdk() {
  const apiKey = (import.meta.env.VITE_ZYFAI_API_KEY ?? '').trim();
  console.log('[ZyFAI] createSdk — apiKey prefix:', apiKey.slice(0, 10) + '…', 'length:', apiKey.length);
  const sdk = new ZyfaiSDK({ apiKey });

  // ── CORS proxy ───────────────────────────────────────────────────────────
  // Both api.zyf.ai (execution) and defiapi.zyf.ai (data) use origin-based
  // CORS whitelisting — yieldling.vercel.app is not whitelisted, so every
  // browser request is blocked.  Redirect both SDK axios clients to our
  // Vercel edge rewrites which forward the calls server-to-server.
  if (typeof window !== 'undefined') {
    const origin       = window.location.origin;
    const execProxy    = `${origin}/api/zyfai`;
    const dataProxy    = `${origin}/api/zyfai-data`;
    sdk.httpClient.client.defaults.baseURL     = execProxy;   // api.zyf.ai/api/v1
    sdk.httpClient.dataClient.defaults.baseURL = dataProxy;   // defiapi.zyf.ai/api/v2
    console.log('[ZyFAI] createSdk — exec proxy:', execProxy, '| data proxy:', dataProxy);
  }

  return sdk;
}

// ── Chain utilities ───────────────────────────────────────────────────────────

const BASE_CHAIN_ID_HEX = "0x2105"; // 8453 decimal

/**
 * Ensure the connected wallet is on Base mainnet (chainId 8453).
 * If the wallet is on a different chain, prompts to switch.
 * If Base is not yet added to the wallet, adds it first then switches.
 *
 * Resolves silently if already on Base; throws if the user rejects the switch.
 *
 * @param {object} provider - EIP-1193 provider
 */
export async function ensureBaseChain(provider) {
  const current = await provider.request({ method: "eth_chainId" });
  if (current === BASE_CHAIN_ID_HEX) return; // already on Base

  const BASE_PARAMS = {
    chainId:           BASE_CHAIN_ID_HEX,
    chainName:         "Base",
    rpcUrls:           ["https://mainnet.base.org"],
    nativeCurrency:    { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://basescan.org"],
  };

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID_HEX }],
    });
  } catch (err) {
    // 4902 = chain not added to wallet yet
    const code = err?.code ?? err?.data?.originalError?.code;
    if (code === 4902) {
      await provider.request({ method: "wallet_addEthereumChain", params: [BASE_PARAMS] });
      // After adding, switch explicitly (some wallets need it)
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_CHAIN_ID_HEX }],
      });
    } else {
      throw err;
    }
  }
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Deposit into the ZyFAI AI-optimised yield strategy.
 *
 * @param {number} amount           - Human-readable amount (e.g. 100 = 100 USDC, 0.01 = 0.01 WETH)
 * @param {string} walletAddress    - User's EOA wallet address
 * @param {"USDC"|"WETH"} asset     - Asset to deposit (default: "USDC")
 * @param {object} provider         - EIP-1193 provider (Privy wallet or window.ethereum)
 * @returns {{ zyfai: object, smartWallet: string }}
 */
export async function depositToZyfai(amount, walletAddress, asset = "USDC", provider = window.ethereum, strategy = "conservative") {
  console.log(`[ZyFAI] ── depositToZyfai ──────────────────────────────────`);
  console.log(`[ZyFAI] amount: ${amount}, asset: ${asset}, strategy: ${strategy}, wallet: ${walletAddress}`);
  console.log(`[ZyFAI] chainId: ${CHAIN_ID}, provider type: ${provider?.constructor?.name ?? typeof provider}`);

  const sdk = createSdk();

  // Step 1 — connect account with the wallet's EIP-1193 provider
  console.log("[ZyFAI] Step 1: connecting account...");
  try {
    await sdk.connectAccount(provider, CHAIN_ID);
    console.log("[ZyFAI] Step 1 ✓ account connected");
  } catch (e) {
    console.error("[ZyFAI] Step 1 ✗ connectAccount failed:", e?.message, e?.code, e?.stack);
    throw e;
  }

  // Step 2 — resolve smart wallet address
  console.log("[ZyFAI] Step 2: getting smart wallet address...");
  let wallet;
  try {
    wallet = await sdk.getSmartWalletAddress(walletAddress, CHAIN_ID);
    console.log(`[ZyFAI] Step 2 ✓ smart wallet: ${wallet.address}, deployed: ${wallet.isDeployed}`);
  } catch (e) {
    console.error("[ZyFAI] Step 2 ✗ getSmartWalletAddress failed:", e?.message, e?.code, e?.stack);
    throw e;
  }

  // Step 3 — deploy Safe if not yet on-chain
  if (!wallet.isDeployed) {
    console.log("[ZyFAI] Step 3: deploying safe...");
    try {
      await sdk.deploySafe(walletAddress, CHAIN_ID, strategy);
      console.log("[ZyFAI] Step 3 ✓ safe deployed with strategy:", strategy);
    } catch (e) {
      console.error("[ZyFAI] Step 3 ✗ deploySafe failed:", e?.message, e?.code, e?.stack);
      throw e;
    }
  } else {
    console.log("[ZyFAI] Step 3: safe already deployed — skipping");
  }

  // Step 4 — create / verify session key
  console.log("[ZyFAI] Step 4: creating session key...");
  try {
    await sdk.createSessionKey(walletAddress, CHAIN_ID);
    const user = await sdk.getUserDetails();
    console.log(`[ZyFAI] Step 4: getUserDetails →`, JSON.stringify(user, null, 2));
    if (!user.hasActiveSessionKey) {
      console.warn("[ZyFAI] Step 4: session key not active — retrying once...");
      await sdk.createSessionKey(walletAddress, CHAIN_ID);
      const retry = await sdk.getUserDetails();
      console.log(`[ZyFAI] Step 4 retry: getUserDetails →`, JSON.stringify(retry, null, 2));
      if (!retry.hasActiveSessionKey) {
        throw new Error("[ZyFAI] Session key activation failed after retry.");
      }
    }
    console.log("[ZyFAI] Step 4 ✓ session key active");
  } catch (e) {
    console.error("[ZyFAI] Step 4 ✗ createSessionKey failed:", e?.message, e?.code, e?.stack);
    throw e;
  }

  // Step 4.5 — for WETH deposits, check ETH balance then wrap native ETH → WETH
  if (asset === "WETH") {
    console.log(`[ZyFAI] Step 4.5: checking ETH balance before wrap...`);
    const client = createPublicClient({ chain: base, transport: http() });

    // 4.5a — check native ETH balance
    let ethBalanceWei;
    try {
      ethBalanceWei = await client.getBalance({ address: walletAddress });
    } catch (e) {
      console.error("[ZyFAI] Step 4.5a ✗ getBalance failed:", e?.message);
      throw new Error("Could not read ETH balance. Check your connection and try again.");
    }
    const amountWei = parseEther(amount.toString());
    // Require deposit amount + ~0.0005 ETH buffer for gas
    const gasBudgetWei = parseEther("0.0005");
    console.log(`[ZyFAI] Step 4.5a: ETH balance ${Number(ethBalanceWei) / 1e18} ETH, need ${amount} ETH + gas`);
    if (ethBalanceWei < amountWei + gasBudgetWei) {
      const have = (Number(ethBalanceWei) / 1e18).toFixed(6);
      const need = (Number(amountWei + gasBudgetWei) / 1e18).toFixed(6);
      console.error(`[ZyFAI] Step 4.5a ✗ Insufficient ETH: have ${have}, need ${need}`);
      throw new Error(`Insufficient ETH balance. You have ${have} ETH on Base but need at least ${need} ETH (deposit + gas).`);
    }

    // 4.5b — wrap ETH → WETH
    console.log(`[ZyFAI] Step 4.5b: wrapping ${amount} ETH → WETH on Base...`);
    try {
      await wrapEthToWeth(amount, provider, walletAddress);
      console.log("[ZyFAI] Step 4.5b ✓ ETH wrapped to WETH");
    } catch (e) {
      console.error("[ZyFAI] Step 4.5b ✗ ETH wrap failed:", e?.message, e?.code);
      // Translate common provider errors into readable messages
      if (e?.code === 4001 || e?.message?.includes("rejected") || e?.message?.includes("denied")) {
        throw new Error("Transaction rejected. Please approve the ETH → WETH wrap in your wallet.");
      }
      if (e?.message?.includes("insufficient funds")) {
        throw new Error("Insufficient ETH to cover the wrap transaction and gas fees.");
      }
      throw new Error(`ETH wrap failed: ${e?.message ?? "unknown error"}`);
    }

    // 4.5c — verify WETH balance landed; wait 3s first then retry up to 3× at 2s intervals
    const WETH_ABI = [{ name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] }];
    console.log("[ZyFAI] Step 4.5c: waiting 3s for WETH balance to settle...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    let wethConfirmed = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const wethBalance = await client.readContract({ address: WETH_ADDRESS, abi: WETH_ABI, functionName: "balanceOf", args: [walletAddress] });
        console.log(`[ZyFAI] Step 4.5c attempt ${attempt}: WETH balance = ${Number(wethBalance) / 1e18} WETH`);
        if (wethBalance >= amountWei) {
          console.log("[ZyFAI] Step 4.5c ✓ WETH balance confirmed");
          wethConfirmed = true;
          break;
        }
        console.warn(`[ZyFAI] Step 4.5c attempt ${attempt}: balance ${Number(wethBalance) / 1e18} < needed ${amount} — retrying...`);
      } catch (e) {
        console.warn(`[ZyFAI] Step 4.5c attempt ${attempt} readContract error (non-fatal):`, e?.message);
      }
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 2000));
    }
    if (!wethConfirmed) {
      console.warn("[ZyFAI] Step 4.5c ⚠ WETH balance not confirmed after retries — proceeding anyway");
    }
  }

  // Step 5 — build amount in base units and deposit
  // USDC = 6 decimals  →  100 USDC  = "100000000"
  // WETH = 18 decimals →  0.01 WETH = "10000000000000000"
  const amountUnits = asset === "WETH"
    ? String(parseEther(amount.toString()))   // BigInt → string
    : String(Math.round(amount * 1_000_000));

  console.log(`[ZyFAI] Step 5: depositing — ${amount} ${asset} = ${amountUnits} base units`);
  let result;
  try {
    // 4th arg is the asset string ("USDC" | "WETH") — SDK looks up the token address internally
    result = await sdk.depositFunds(walletAddress, CHAIN_ID, amountUnits, asset);
    console.log("[ZyFAI] Step 5 ✓ deposit complete:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("[ZyFAI] Step 5 ✗ depositFunds failed:", e?.message, e?.code, e?.stack);
    if (asset === "WETH") {
      if (e?.message?.includes("allowance") || e?.message?.includes("approve")) {
        throw new Error("WETH allowance issue — ZyFAI could not spend your WETH. This may resolve on retry.");
      }
      if (e?.message?.includes("insufficient") || e?.message?.includes("balance")) {
        throw new Error(`Insufficient WETH balance for deposit. Make sure your wallet has at least ${amount} WETH on Base.`);
      }
    }
    throw e;
  }

  await sdk.disconnectAccount();

  return {
    zyfai: result,
    smartWallet: result.smartWallet ?? wallet.address,
  };
}

/**
 * Fetch total yield earned for a ZyFAI smart wallet.
 *
 * @param {string} smartWalletAddress - The smart wallet address (NOT the EOA)
 * @returns {object} Earnings keyed by token, e.g. { "USDC": 12.50, "WETH": 0.002 }
 */
export async function getYieldEarned(smartWalletAddress) {
  console.log(`[ZyFAI] getYieldEarned — smartWallet: ${smartWalletAddress}`);
  const sdk = createSdk();
  const earnings = await sdk.getOnchainEarnings(smartWalletAddress);
  const byToken = earnings.data.totalEarningsByToken;
  console.log("[ZyFAI] Earnings by token:", byToken);
  return byToken;
}

// ── Shared helper: normalise an opportunities array from the SDK ──────────────
function normaliseOpps(result) {
  const entries = Array.isArray(result?.data) ? result.data
    : Array.isArray(result) ? result : [];
  return entries
    .map(e => ({
      protocol: e.protocol ?? e.name ?? "Unknown",
      token:    e.token   ?? e.asset ?? "",
      apy:      (() => { const n = parseFloat(e.apy ?? 0); return n < 1 ? (n * 100).toFixed(2) : n.toFixed(2); })(),
    }))
    .sort((a, b) => parseFloat(b.apy) - parseFloat(a.apy))
    .slice(0, 3);
}

/**
 * Fetch the top conservative yield opportunities on Base mainnet.
 * No wallet connection required — public read-only call.
 *
 * @param {number} [chainId=8453]
 * @returns {Array<{ protocol: string, token: string, apy: string }>}
 */
export async function getConservativeOpportunities(chainId = 8453) {
  console.log(`[ZyFAI] getConservativeOpportunities — chainId: ${chainId}`);
  const sdk = createSdk();
  const result = await sdk.getConservativeOpportunities(chainId);
  console.log("[ZyFAI] Conservative opportunities:", result);
  return normaliseOpps(result);
}

/**
 * Fetch the top aggressive yield opportunities on Base mainnet.
 * No wallet connection required — public read-only call.
 *
 * @param {number} [chainId=8453]
 * @returns {Array<{ protocol: string, token: string, apy: string }>}
 */
export async function getAggressiveOpportunities(chainId = 8453) {
  console.log(`[ZyFAI] getAggressiveOpportunities — chainId: ${chainId}`);
  const sdk = createSdk();
  const result = await sdk.getAggressiveOpportunities(chainId);
  console.log("[ZyFAI] Aggressive opportunities:", result);
  return normaliseOpps(result);
}

// ── Internal: parse underlyingAmount / staleBalance raw string → USD float ───
// Both underlyingAmount and staleBalances.balance are in token base units:
//   USDC (6 decimals):  "20000184" → 20.000184
//   WETH (18 decimals): "500000000000000" → 0.0005
function parseTokenAmount(raw, tokenSymbol) {
  if (raw === null || raw === undefined) return 0;
  const decimals = (tokenSymbol ?? "").toUpperCase() === "WETH" ? 1e18 : 1e6;
  const n = typeof raw === "string" && raw.startsWith("0x")
    ? Number(BigInt(raw)) / decimals
    : Number(raw) / decimals;
  return isFinite(n) ? n : 0;
}

/**
 * Fetch individual active positions for a wallet as a structured array.
 *
 * Primary: sdk.getPositions(walletAddress, chainId) — real-time after SIWE auth.
 *   portfolio.positions[]: { protocol_name, token_symbol, pool, pool_apy, underlyingAmount }
 *
 * Fallback: getDailyApyHistory (works without auth, nightly snapshot ~24h lag).
 *
 * @param {string} walletAddress
 * @param {number} [chainId=8453]
 * @param {string} [safeAddress=null]
 * @returns {Array<{ protocol: string, token: string, apy: string, value: number }>}
 */
export async function getPositionDetails(walletAddress, chainId = 8453, safeAddress = null) {
  const sdk = createSdk();

  // ── Primary: sdk.getPositions() ──────────────────────────────────────────
  try {
    const raw = await sdk.getPositions(walletAddress, chainId);
    console.log("[ZyFAI] getPositionDetails sdk.getPositions RAW:", JSON.stringify(raw, null, 2));

    const positions = raw?.portfolio?.positions ?? [];
    if (positions.length > 0) {
      return positions
        .filter(p => p.protocol_name || p.pool)
        .map(p => {
          const sym    = p.token_symbol ?? "USDC";
          const apyN   = parseFloat(p.pool_apy ?? 0);
          return {
            protocol: `${p.protocol_name ?? "Unknown"}${p.pool ? ` · ${p.pool}` : ""}`,
            token:    sym,
            apy:      isFinite(apyN) ? apyN.toFixed(2) : "—",
            value:    parseTokenAmount(p.underlyingAmount, sym),
          };
        });
    }
    console.log("[ZyFAI] getPositionDetails: portfolio.positions empty (no auth?) — falling back to history");
  } catch (e) {
    console.warn("[ZyFAI] getPositionDetails sdk.getPositions failed:", e.message);
  }

  // ── Fallback: getDailyApyHistory ─────────────────────────────────────────
  const queryAddr = safeAddress ?? walletAddress;
  try {
    const result     = await sdk.getDailyApyHistory(queryAddr, "7D");
    const historyObj = result?.history;
    if (!historyObj || typeof historyObj !== "object") return [];
    const dates      = Object.keys(historyObj).sort().reverse();
    const latestDay  = historyObj[dates[0]] ?? {};
    const positions  = latestDay?.positions ?? [];
    const finalApy   = latestDay?.final_weighted_apy ?? {};
    return positions.map(pos => {
      const sym  = pos.tokenSymbol ?? "USDC";
      const apyN = parseFloat(pos.apy ?? finalApy[sym] ?? 0);
      return {
        protocol: `${pos.protocol ?? "Unknown"}${pos.pool ? ` · ${pos.pool}` : ""}`,
        token:    sym,
        apy:      isFinite(apyN) ? apyN.toFixed(2) : "—",
        value:    isFinite(pos.balance) ? pos.balance : 0,
      };
    });
  } catch (e) {
    console.warn("[ZyFAI] getPositionDetails history fallback failed:", e.message);
    return [];
  }
}

/**
 * Fetch total deposited value for a wallet.
 *
 * Primary: sdk.getPositions() — sums portfolio.positions[].underlyingAmount
 *   PLUS portfolio.staleBalances[].balance (idle funds in Safe awaiting deployment).
 *   Total = deployed capital + idle capital = real-time balance (requires SIWE auth).
 *
 * Fallback: getDailyApyHistory snapshot + on-chain getSafeBalance (no auth needed,
 *   but lags up to 24h for deployed portion; Safe balance is always real-time).
 *
 * @param {string} walletAddress
 * @param {number} [chainId=8453]
 * @param {string} [safeAddress=null]
 * @returns {number} Total USD value, or 0 on failure
 */
export async function getPositions(walletAddress, chainId = 8453, safeAddress = null) {
  console.log(`[ZyFAI] getPositions — wallet: ${walletAddress}, safe: ${safeAddress}`);
  const sdk = createSdk();

  // ── Primary: sdk.getPositions() — real-time when authenticated ───────────
  // Sums underlyingAmount (deployed to protocols) + staleBalances (idle in Safe)
  try {
    const raw = await sdk.getPositions(walletAddress, chainId);
    console.log("[ZyFAI] getPositions sdk.getPositions RAW:", JSON.stringify(raw, null, 2));

    const portfolio     = raw?.portfolio ?? {};
    const positions     = portfolio.positions    ?? [];
    const staleBalances = portfolio.staleBalances ?? [];

    const hasData = positions.length > 0 || staleBalances.length > 0;
    if (hasData) {
      // Sum deployed positions (underlyingAmount = base units)
      const deployedTotal = positions.reduce((s, p) => {
        return s + parseTokenAmount(p.underlyingAmount, p.token_symbol);
      }, 0);

      // Sum idle balances (balance = base units, isPending = not yet deployed)
      const staleTotal = staleBalances.reduce((s, b) => {
        return s + parseTokenAmount(b.balance, b.tokenSymbol);
      }, 0);

      const total = deployedTotal + staleTotal;
      console.log(`[ZyFAI] getPositions real-time — deployed: $${deployedTotal.toFixed(4)}, stale: $${staleTotal.toFixed(4)}, total: $${total.toFixed(4)}`);
      return total;
    }
    console.log("[ZyFAI] getPositions: portfolio empty (no SIWE auth) — falling back");
  } catch (e) {
    console.warn("[ZyFAI] getPositions sdk.getPositions failed:", e.message);
  }

  // ── Fallback: nightly snapshot + real-time on-chain Safe balance ─────────
  const queryAddr = safeAddress ?? walletAddress;
  let deployedTotal = 0;
  try {
    const result     = await sdk.getDailyApyHistory(queryAddr, "7D");
    const historyObj = result?.history;
    if (historyObj && typeof historyObj === "object") {
      const dates     = Object.keys(historyObj).sort().reverse();
      const latestDay = historyObj[dates[0]] ?? {};
      deployedTotal   = (latestDay.positions ?? []).reduce((s, pos) => {
        const bal = pos.balance;
        return s + (typeof bal === "number" && isFinite(bal) ? bal : 0);
      }, 0);
      console.log(`[ZyFAI] getPositions history fallback (${dates[0]}): $${deployedTotal.toFixed(4)}`);
    }
  } catch (e) {
    console.warn("[ZyFAI] getPositions getDailyApyHistory fallback failed:", e.message);
  }

  // Always add real-time Safe on-chain USDC (staleBalances equivalent)
  if (safeAddress) {
    try {
      const usdcBal = await getSafeBalance(safeAddress, "USDC");
      console.log(`[ZyFAI] getPositions safe USDC (on-chain): $${usdcBal.toFixed(4)}, snapshot: $${deployedTotal.toFixed(4)}`);
      return deployedTotal + usdcBal;
    } catch (e) {
      console.warn("[ZyFAI] getPositions getSafeBalance failed:", e.message);
    }
  }

  return deployedTotal;
}

/**
 * Fetch the most recent APY from daily history for a ZyFAI smart wallet.
 *
 * @param {string} smartWalletAddress - The smart wallet address
 * @param {string} [period="30D"]     - History window ("7D" | "30D" | "90D")
 * @returns {string|null} APY percentage string e.g. "14.30", or null on error
 */
export async function getDailyApyHistory(smartWalletAddress, period = "30D") {
  console.log(`[ZyFAI] getDailyApyHistory — smartWallet: ${smartWalletAddress}, period: ${period}`);
  const sdk = createSdk();
  const result = await sdk.getDailyApyHistory(smartWalletAddress, period);
  console.log("[ZyFAI] getDailyApyHistory raw:", JSON.stringify(result?.weightedApyWithRzfiAfterFee ?? result?.history ?? result));

  // ── Primary: top-level weighted APY including fees + Merkl rewards ────────
  // result.weightedApyWithRzfiAfterFee = { "USDC": 5.5058 }  (already %)
  const topLevel = result?.weightedApyWithRzfiAfterFee ?? result?.weightedApyAfterFee;
  if (topLevel && typeof topLevel === "object") {
    const val = topLevel["USDC"] ?? topLevel["WETH"] ?? Object.values(topLevel)[0];
    if (typeof val === "number" && isFinite(val) && val > 0) {
      console.log("[ZyFAI] getDailyApyHistory result (top-level):", val);
      return val.toFixed(2);
    }
  }

  // ── Fallback: most recent day's final_weighted_apy from history object ────
  // result.history = { "2026-03-21": { final_weighted_apy: { "USDC": 5.5058 } } }
  const historyObj = result?.history;
  if (historyObj && typeof historyObj === "object") {
    const dates = Object.keys(historyObj).sort().reverse();
    for (const date of dates) {
      const day = historyObj[date];
      const fwa = day?.final_weighted_apy ?? day?.weighted_apy_after_fee ?? day?.weighted_apy;
      if (fwa && typeof fwa === "object") {
        const v = fwa["USDC"] ?? fwa["WETH"] ?? Object.values(fwa)[0];
        if (typeof v === "number" && isFinite(v) && v > 0) {
          console.log(`[ZyFAI] getDailyApyHistory result (${date}):`, v);
          return v.toFixed(2);
        }
      }
    }
  }

  console.warn("[ZyFAI] getDailyApyHistory: no usable APY found in response");
  return null;
}

/**
 * Get the USDC + WETH balance of the ZyFAI Safe wallet on Base mainnet.
 * Use this to show deposited balance immediately after deposit, before
 * ZyFAI has allocated the funds to a yield strategy.
 *
 * @param {string} safeAddress - The Safe / smart wallet address
 * @param {"USDC"|"WETH"} asset
 * @returns {number} Human-readable balance (USD for USDC, ETH for WETH)
 */
export async function getSafeBalance(safeAddress, asset = "USDC") {
  console.log(`[ZyFAI] getSafeBalance — safe: ${safeAddress}, asset: ${asset}`);
  const client = createPublicClient({ chain: base, transport: http() });
  if (asset === "WETH") {
    const raw = await client.getBalance({ address: safeAddress });
    const eth = Number(raw) / 1e18;
    console.log(`[ZyFAI] getSafeBalance WETH: ${eth}`);
    return eth;
  }
  // USDC
  let raw = 0n;
  try {
    raw = await client.readContract({
      address: USDC_ADDRESS,
      abi: BALANCE_OF_ABI,
      functionName: "balanceOf",
      args: [safeAddress],
    });
  } catch (e) {
    console.warn("[ZyFAI] getSafeBalance USDC readContract failed:", e.message);
  }
  const usdc = Number(raw) / 1e6;
  console.log(`[ZyFAI] getSafeBalance USDC: ${usdc}`);
  return usdc;
}

/**
 * Get the native ETH balance of an address on Base mainnet.
 *
 * @param {string} address
 * @returns {number} ETH balance as a float (e.g. 0.0312)
 */
export async function getEthBalance(address) {
  const client = createPublicClient({ chain: base, transport: http() });
  const wei = await client.getBalance({ address });
  return Number(wei) / 1e18;
}

/**
 * Wrap native ETH to WETH on Base mainnet.
 * Calls the WETH deposit() function and waits for confirmation.
 *
 * @param {number}  amountEth   - Human-readable ETH amount (e.g. 0.001)
 * @param {object}  provider    - EIP-1193 provider
 * @param {string}  walletAddress
 */
async function wrapEthToWeth(amountEth, provider, walletAddress) {
  const amountWei = parseEther(amountEth.toString());
  console.log(`[ZyFAI] wrapEthToWeth: ${amountEth} ETH = ${amountWei} wei`);

  // Use viem walletClient.writeContract so the ABI is encoded correctly.
  // Raw eth_sendTransaction with a hex data selector was being reinterpreted
  // by some providers as a transfer() call instead of deposit().
  const walletClient = createWalletClient({
    account: walletAddress,
    chain: base,
    transport: custom(provider),
  });

  const WETH_DEPOSIT_ABI = [{
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  }];

  const txHash = await walletClient.writeContract({
    address: WETH_ADDRESS,
    abi: WETH_DEPOSIT_ABI,
    functionName: "deposit",
    value: amountWei,
  });
  console.log(`[ZyFAI] wrapEthToWeth tx submitted: ${txHash} — waiting for confirmation...`);

  const client = createPublicClient({ chain: base, transport: http() });
  await client.waitForTransactionReceipt({ hash: txHash });
  console.log(`[ZyFAI] wrapEthToWeth confirmed ✓`);
}

/**
 * Check the ETH and USDC balance of an address on Base Sepolia.
 * Used to gate embedded-wallet users until they've funded their wallet.
 *
 * @param {string} address - Wallet address to check
 * @returns {{ eth: bigint, usdc: bigint }}
 */
export async function checkWalletBalance(address) {
  const client = createPublicClient({ chain: base, transport: http() });
  const eth = await client.getBalance({ address });
  let usdc = 0n;
  try {
    usdc = await client.readContract({
      address: USDC_ADDRESS,
      abi: BALANCE_OF_ABI,
      functionName: "balanceOf",
      args: [address],
    });
  } catch (e) {
    console.warn("[ZyFAI] USDC balanceOf failed:", e.message);
  }
  console.log(`[ZyFAI] Balance — ETH: ${eth}, USDC: ${usdc}`);
  return { eth, usdc };
}

/**
 * Ensure an active ZyFAI session key exists for walletAddress.
 * Call this proactively so subsequent depositToZyfai() calls don't require
 * extra wallet popups.
 *
 * @param {string} walletAddress - User's EOA wallet address
 */
export async function ensureSessionKey(walletAddress, provider = window.ethereum, strategy = "conservative") {
  console.log(`[ZyFAI] ensureSessionKey — wallet: ${walletAddress}, strategy: ${strategy}`);
  const sdk = createSdk();
  await sdk.connectAccount(provider, CHAIN_ID);
  const wallet = await sdk.getSmartWalletAddress(walletAddress, CHAIN_ID);
  if (!wallet.isDeployed) {
    await sdk.deploySafe(walletAddress, CHAIN_ID, strategy);
  }
  const user = await sdk.getUserDetails();
  if (!user.hasActiveSessionKey) {
    await sdk.createSessionKey(walletAddress, CHAIN_ID);
    console.log("[ZyFAI] Session key created.");
  } else {
    console.log("[ZyFAI] Session key already active.");
  }
  await sdk.disconnectAccount();
}

/**
 * Fetch the total value locked (TVL) across all ZyFAI vaults.
 * Uses a direct REST call — no SDK or wallet connection required.
 *
 * Response shape: { tvl: { WETH: number, USDC: number, ... }, total: number }
 *
 * @returns {number} TVL in USD (e.g. 8888828), or 0 on failure
 */
export async function getTvl() {
  console.log("[ZyFAI] getTvl — fetching from REST API...");
  const res  = await fetch("https://api.zyf.ai/api/v1/data/usd-tvl");
  const data = await res.json();
  console.log("[ZyFAI] getTvl response:", data);
  const n = data?.total ?? 0;
  console.log("[ZyFAI] getTvl total:", n);
  return typeof n === "number" && isFinite(n) ? n : 0;
}

/**
 * Fetch the average APY for a specific ZyFAI strategy and asset.
 * Tries the SDK first; falls back to direct REST if the SDK returns no data.
 * No wallet connection required — public read-only call.
 *
 * @param {"conservative"|"aggressive"} strategy
 * @param {"USDC"|"WETH"} asset
 * @returns {number|null} APY as a percentage (e.g. 7.2), or null on failure
 */
export async function getStrategyApy(strategy, asset) {
  console.log(`[ZyFAI] getStrategyApy — strategy: ${strategy}, asset: ${asset}`);

  // ── Primary: SDK (no connectAccount needed — read-only) ───────────────────
  try {
    const sdk = createSdk();
    const result = await sdk.getAPYPerStrategy(false, 7, strategy, 8453, asset);
    console.log(`[ZyFAI] getStrategyApy SDK raw (${strategy}, ${asset}):`, JSON.stringify(result, null, 2));
    // Try every plausible field path
    const raw =
      result?.data?.[0]?.average_apy ??
      result?.data?.average_apy       ??
      result?.average_apy             ??
      result?.apy                     ??
      null;
    console.log(`[ZyFAI] getStrategyApy SDK extracted average_apy:`, raw);
    if (raw !== null && raw !== undefined) {
      const n = parseFloat(raw);
      if (isFinite(n)) {
        const pct = n < 1 ? n * 100 : n;
        console.log(`[ZyFAI] getStrategyApy SDK result (${strategy}, ${asset}): ${pct}%`);
        return pct;
      }
    }
    console.warn(`[ZyFAI] getStrategyApy SDK returned no usable APY — falling back to REST`);
  } catch (err) {
    console.warn(`[ZyFAI] getStrategyApy SDK failed — falling back to REST:`, err?.message ?? err);
  }

  // ── Fallback: direct REST endpoint on defiapi ────────────────────────────
  // SDK converts "conservative" → "safe", "aggressive" → "degen"
  const strategyShort = strategy === "aggressive" ? "degen" : "safe";
  const url = `https://defiapi.zyf.ai/api/v2/rebalance/rebalance-info?strategy=${strategyShort}&chainId=8453&tokenSymbol=${asset}&days=7`;
  console.log(`[ZyFAI] getStrategyApy REST fallback: ${url}`);
  const res  = await fetch(url);
  const data = await res.json();
  console.log(`[ZyFAI] getStrategyApy REST response (${strategy}, ${asset}):`, JSON.stringify(data, null, 2));
  const raw =
    data?.data?.[0]?.average_apy ??
    data?.data?.average_apy       ??
    data?.average_apy             ??
    data?.apy                     ??
    null;
  console.log(`[ZyFAI] getStrategyApy REST extracted average_apy:`, raw);
  if (raw === null || raw === undefined) return null;
  const n = parseFloat(raw);
  if (!isFinite(n)) return null;
  const pct = n < 1 ? n * 100 : n;
  console.log(`[ZyFAI] getStrategyApy REST result (${strategy}, ${asset}): ${pct}%`);
  return pct;
}

/**
 * Fetch the average APY across ZyFAI conservative opportunities on Base mainnet.
 * No wallet connection required — public read-only call.
 *
 * @returns {number|null} Average APY as a percentage (e.g. 11.8), or null on failure
 */
export async function getAvgApy() {
  console.log("[ZyFAI] getAvgApy — fetching...");
  const sdk = createSdk();
  const raw = await sdk.getConservativeOpportunities(8453);
  // Log the FULL raw response so we can see exactly what shape it is
  console.log("[ZyFAI] getAvgApy raw response:", JSON.stringify(raw, null, 2));

  // Try every plausible array location
  const entries =
    Array.isArray(raw?.data)         ? raw.data         :
    Array.isArray(raw?.opportunities) ? raw.opportunities :
    Array.isArray(raw?.results)       ? raw.results       :
    Array.isArray(raw)                ? raw               :
    [];

  console.log("[ZyFAI] getAvgApy entries count:", entries.length);
  if (!entries.length) return null;

  // Each entry's apy field may be a decimal (0.118) or already a percent (11.8)
  const apyValues = entries
    .map(e => {
      const raw = e.apy ?? e.APY ?? e.apyPercent ?? null;
      if (raw === null || raw === undefined) return null;
      const n = parseFloat(raw);
      if (!isFinite(n)) return null;
      // Normalise: if < 1 it's a decimal fraction → multiply by 100
      return n < 1 ? n * 100 : n;
    })
    .filter(n => n !== null);

  console.log("[ZyFAI] getAvgApy normalised APY values:", apyValues);
  if (!apyValues.length) return null;

  const avg = apyValues.reduce((s, v) => s + v, 0) / apyValues.length;
  console.log("[ZyFAI] getAvgApy result:", avg);
  return avg;
}

/**
 * Withdraw funds from a ZyFAI account back to the user's EOA.
 * Omit amount to withdraw everything.
 *
 * @param {string} walletAddress    - User's EOA wallet address
 * @param {number} [amount]         - Human-readable USDC amount, or omit for full withdrawal
 */
export async function withdrawYield(walletAddress, amount, provider = window.ethereum) {
  console.log(`[ZyFAI] withdrawYield — wallet: ${walletAddress}, amount: ${amount ?? "all"}`);
  const sdk = createSdk();
  await sdk.connectAccount(provider, CHAIN_ID);

  let result;
  if (amount !== undefined) {
    const amountUnits = String(Math.round(amount * 1_000_000));
    console.log(`[ZyFAI] Withdrawing ${amountUnits} USDC units...`);
    result = await sdk.withdrawFunds(walletAddress, CHAIN_ID, amountUnits);
  } else {
    console.log("[ZyFAI] Withdrawing all funds...");
    result = await sdk.withdrawFunds(walletAddress, CHAIN_ID);
  }

  console.log("[ZyFAI] Withdrawal complete:", result);
  await sdk.disconnectAccount();
  return result;
}
