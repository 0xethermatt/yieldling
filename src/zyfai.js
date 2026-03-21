import { ZyfaiSDK } from "@zyfai/sdk";
import { createPublicClient, http, parseEther } from "viem";
import { baseSepolia } from "viem/chains";

// ── Config ────────────────────────────────────────────────────────────────────

const CHAIN_ID = 84532; // Base Sepolia (switch to 8453 for mainnet)

// USDC on Base Sepolia
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const BALANCE_OF_ABI = [{
  name: "balanceOf", type: "function", stateMutability: "view",
  inputs:  [{ name: "account", type: "address" }],
  outputs: [{ type: "uint256" }],
}];

// ── Helpers ───────────────────────────────────────────────────────────────────

function createSdk() {
  return new ZyfaiSDK({
    apiKey: import.meta.env.VITE_ZYFAI_API_KEY,
  });
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Deposit into the ZyFAI AI-optimised yield strategy.
 *
 * ZyFAI automatically routes funds across the best DeFi protocols on Base —
 * no manual strategy selection, no manual rebalancing.
 *
 * @param {number} amount           - Human-readable amount (e.g. 100 = 100 USDC, 0.05 = 0.05 WETH)
 * @param {string} walletAddress    - User's EOA wallet address
 * @param {"USDC"|"WETH"} asset     - Asset to deposit (default: "USDC")
 * @returns {{ zyfai: object, smartWallet: string }}
 */
export async function depositToZyfai(amount, walletAddress, asset = "USDC") {
  console.log(`[ZyFAI] depositToZyfai — amount: ${amount} ${asset}, wallet: ${walletAddress}`);

  const sdk = createSdk();
  await sdk.connectAccount(window.ethereum, CHAIN_ID);

  const wallet = await sdk.getSmartWalletAddress(walletAddress, CHAIN_ID);
  console.log(`[ZyFAI] Smart wallet: ${wallet.address}, deployed: ${wallet.isDeployed}`);

  if (!wallet.isDeployed) {
    console.log("[ZyFAI] Deploying smart wallet...");
    await sdk.deploySafe(walletAddress, CHAIN_ID, "conservative");
  }

  await sdk.createSessionKey(walletAddress, CHAIN_ID);
  const user = await sdk.getUserDetails();
  if (!user.hasActiveSessionKey) {
    console.log("[ZyFAI] Session key not active — retrying...");
    await sdk.createSessionKey(walletAddress, CHAIN_ID);
    const retry = await sdk.getUserDetails();
    if (!retry.hasActiveSessionKey) {
      throw new Error("[ZyFAI] Session key activation failed. Please try again.");
    }
  }

  // USDC = 6 decimals, WETH = 18 decimals
  const amountUnits = asset === "WETH"
    ? parseEther(amount.toString())
    : String(Math.round(amount * 1_000_000));

  console.log(`[ZyFAI] Depositing ${amountUnits} ${asset} units...`);
  const result = await sdk.depositFunds(walletAddress, CHAIN_ID, amountUnits, { asset });
  console.log("[ZyFAI] Deposit complete:", result);

  await sdk.disconnectAccount();

  return {
    zyfai: result,
    smartWallet: result.smartWallet,
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

/**
 * Fetch individual active positions for a wallet as a structured array.
 * Returns each protocol position the Smart Account is currently deployed in.
 * No wallet connection required — public read-only call.
 *
 * @param {string} walletAddress
 * @param {number} [chainId=8453]
 * @returns {Array<{ protocol: string, token: string, apy: string, value: number }>}
 */
export async function getPositionDetails(walletAddress, chainId = 8453) {
  console.log(`[ZyFAI] getPositionDetails — wallet: ${walletAddress}, chainId: ${chainId}`);
  const sdk = createSdk();
  const result = await sdk.getPositions(walletAddress, chainId);
  console.log("[ZyFAI] getPositionDetails raw:", JSON.stringify(result, null, 2));

  // Try every plausible array location in the response
  const entries =
    Array.isArray(result?.data?.positions) ? result.data.positions :
    Array.isArray(result?.data)            ? result.data            :
    Array.isArray(result?.positions)       ? result.positions       :
    Array.isArray(result)                  ? result                 :
    [];

  return entries
    .filter(p => (p.protocol ?? p.name ?? "").length > 0)
    .map(p => ({
      protocol: p.protocol ?? p.name ?? "Unknown",
      token:    p.token    ?? p.asset ?? p.symbol ?? "",
      apy: (() => {
        const n = parseFloat(p.apy ?? p.APY ?? p.apyPercent ?? 0);
        if (!isFinite(n)) return "—";
        return n < 1 ? (n * 100).toFixed(2) : n.toFixed(2);
      })(),
      value: p.value ?? p.balance ?? p.amount ?? 0,
    }));
}

/**
 * Fetch the current positions / total deposited value for a wallet.
 * No wallet connection required — public read-only call.
 *
 * @param {string} walletAddress
 * @param {number} [chainId=8453]
 * @returns {number} Total deposited value in USD, or 0 on failure
 */
export async function getPositions(walletAddress, chainId = 8453) {
  console.log(`[ZyFAI] getPositions — wallet: ${walletAddress}, chainId: ${chainId}`);
  const sdk = createSdk();
  const result = await sdk.getPositions(walletAddress, chainId);
  console.log("[ZyFAI] getPositions raw:", JSON.stringify(result, null, 2));

  // Try every plausible shape
  if (Array.isArray(result?.data)) {
    return result.data.reduce((s, p) => s + (p.value ?? p.balance ?? p.amount ?? 0), 0);
  }
  const n = result?.data?.total      ??
            result?.data?.totalValue  ??
            result?.total             ??
            result?.totalValue        ??
            result?.value             ??
            (typeof result === "number" ? result : 0);
  return typeof n === "number" && isFinite(n) ? n : 0;
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
  console.log("[ZyFAI] APY history:", result);
  const entries = result?.data ?? [];
  if (!entries.length) return null;
  const latest = entries[entries.length - 1].apy;
  // SDK returns decimal (0.143) — convert to percentage string
  return latest < 1 ? (latest * 100).toFixed(2) : Number(latest).toFixed(2);
}

/**
 * Check the ETH and USDC balance of an address on Base Sepolia.
 * Used to gate embedded-wallet users until they've funded their wallet.
 *
 * @param {string} address - Wallet address to check
 * @returns {{ eth: bigint, usdc: bigint }}
 */
export async function checkWalletBalance(address) {
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
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
export async function ensureSessionKey(walletAddress) {
  console.log(`[ZyFAI] ensureSessionKey — wallet: ${walletAddress}`);
  const sdk = createSdk();
  await sdk.connectAccount(window.ethereum, CHAIN_ID);
  const wallet = await sdk.getSmartWalletAddress(walletAddress, CHAIN_ID);
  if (!wallet.isDeployed) {
    await sdk.deploySafe(walletAddress, CHAIN_ID, "conservative");
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
 * No wallet connection required — public read-only call.
 *
 * @param {"conservative"|"aggressive"} strategy
 * @param {"USDC"|"WETH"} asset
 * @returns {number|null} APY as a percentage (e.g. 7.2), or null on failure
 */
export async function getStrategyApy(strategy, asset) {
  console.log(`[ZyFAI] getStrategyApy — strategy: ${strategy}, asset: ${asset}`);
  const sdk = createSdk();
  const result = await sdk.getAPYPerStrategy(false, 7, strategy, 8453, asset);
  console.log(`[ZyFAI] getStrategyApy(${strategy}, ${asset}) raw:`, result);
  const raw = result?.data?.[0]?.average_apy ?? null;
  if (raw === null || raw === undefined) return null;
  const n = parseFloat(raw);
  if (!isFinite(n)) return null;
  // Normalise: SDK may return decimal (0.072) or percent (7.2)
  return n < 1 ? n * 100 : n;
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
export async function withdrawYield(walletAddress, amount) {
  console.log(`[ZyFAI] withdrawYield — wallet: ${walletAddress}, amount: ${amount ?? "all"}`);
  const sdk = createSdk();
  await sdk.connectAccount(window.ethereum, CHAIN_ID);

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
