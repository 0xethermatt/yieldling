import { ZyfaiSDK } from "@zyfai/sdk";
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { baseSepolia } from "viem/chains";

// ── Config ────────────────────────────────────────────────────────────────────

const CHAIN_ID = 84532; // Base Sepolia (switch to 8453 for mainnet)

/** YieldPetTreasury deployed on Base Sepolia */
const TREASURY_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

/** wstETH on Base Sepolia */
const WSTETH_ADDRESS = "0x13e5FB0B6534BB22cBC59Fae339dbBE0Dc906871";

// ── Minimal ABIs ──────────────────────────────────────────────────────────────

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
];

const TREASURY_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function createSdk() {
  return new ZyfaiSDK({
    apiKey: import.meta.env.VITE_ZYFAI_API_KEY,
  });
}

/**
 * Build viem wallet + public clients from window.ethereum.
 * Returns { walletClient, publicClient }.
 */
function createViemClients() {
  const walletClient = createWalletClient({
    chain: baseSepolia,
    transport: custom(window.ethereum),
  });
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });
  return { walletClient, publicClient };
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Deposit into BOTH the ZyFAI yield strategy AND the YieldPetTreasury contract.
 *
 * Flow:
 *   1. ZyFAI SDK — deploy Safe if needed, create session key, deposit USDC
 *      into the automated wstETH looping strategy.
 *   2. viem — approve wstETH spend on YieldPetTreasury, then call deposit()
 *      to record the principal on-chain for yield enforcement.
 *
 * @param {number} amount        - Human-readable USDC amount (e.g. 100 = 100 USDC)
 * @param {string} walletAddress - User's EOA wallet address
 * @returns {{ zyfai: object, treasury: string }} tx hashes for both legs
 */
export async function depositToZyfai(amount, walletAddress) {
  console.log(`[deposit] amount: ${amount} USDC, wallet: ${walletAddress}`);

  // ── Leg 1: ZyFAI SDK ───────────────────────────────────────────────────────
  const sdk = createSdk();
  await sdk.connectAccount(window.ethereum, CHAIN_ID);

  const wallet = await sdk.getSmartWalletAddress(walletAddress, CHAIN_ID);
  console.log(`[ZyFAI] Smart wallet: ${wallet.address}, deployed: ${wallet.isDeployed}`);

  if (!wallet.isDeployed) {
    console.log("[ZyFAI] Deploying Safe...");
    await sdk.deploySafe(walletAddress, CHAIN_ID, "conservative");
  }

  await sdk.createSessionKey(walletAddress, CHAIN_ID);
  const user = await sdk.getUserDetails();
  if (!user.hasActiveSessionKey) {
    console.log("[ZyFAI] Session key not active, retrying...");
    await sdk.createSessionKey(walletAddress, CHAIN_ID);
    const retry = await sdk.getUserDetails();
    if (!retry.hasActiveSessionKey) {
      throw new Error("[ZyFAI] Session key activation failed. Contact support.");
    }
  }

  // USDC = 6 decimals
  const usdcUnits = String(Math.round(amount * 1_000_000));
  console.log(`[ZyFAI] Depositing ${usdcUnits} USDC units...`);
  const zyfaiResult = await sdk.depositFunds(walletAddress, CHAIN_ID, usdcUnits);
  console.log("[ZyFAI] Deposit complete:", zyfaiResult);
  await sdk.disconnectAccount();

  // ── Leg 2: YieldPetTreasury via viem ──────────────────────────────────────
  // wstETH = 18 decimals; treat the USDC amount as equivalent wstETH units for
  // principal tracking purposes (swap conversion handled off-chain by ZyFAI).
  const wstEthAmount = parseEther(amount.toString());
  const { walletClient, publicClient } = createViemClients();
  const [account] = await walletClient.getAddresses();

  // Check existing allowance; only approve if needed
  const allowance = await publicClient.readContract({
    address: WSTETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account, TREASURY_ADDRESS],
  });

  if (allowance < wstEthAmount) {
    console.log("[Treasury] Approving wstETH spend...");
    const approveTx = await walletClient.writeContract({
      address: WSTETH_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [TREASURY_ADDRESS, wstEthAmount],
      account,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
    console.log("[Treasury] Approval confirmed:", approveTx);
  }

  console.log("[Treasury] Calling deposit()...");
  const depositTx = await walletClient.writeContract({
    address: TREASURY_ADDRESS,
    abi: TREASURY_ABI,
    functionName: "deposit",
    args: [wstEthAmount],
    account,
  });
  await publicClient.waitForTransactionReceipt({ hash: depositTx });
  console.log("[Treasury] deposit() confirmed:", depositTx);

  return {
    zyfai:    zyfaiResult,           // { success, txHash, smartWallet, amount }
    treasury: depositTx,             // on-chain tx hash
    smartWallet: zyfaiResult.smartWallet,
  };
}

/**
 * Fetch total yield earned for a ZyFAI smart wallet (cached).
 *
 * @param {string} smartWalletAddress - The Safe/subaccount address (NOT the EOA)
 */
export async function getYieldEarned(smartWalletAddress) {
  console.log(`[ZyFAI] getYieldEarned — smartWallet: ${smartWalletAddress}`);
  const sdk = createSdk();
  const earnings = await sdk.getOnchainEarnings(smartWalletAddress);
  const byToken = earnings.data.totalEarningsByToken;
  console.log("[ZyFAI] Earnings by token:", byToken);
  // e.g. { "USDC": 150.50, "WETH": 0.05 }
  return byToken;
}

/**
 * Withdraw USDC yield from a ZyFAI account back to the user's EOA.
 * Omit amount to withdraw everything.
 *
 * @param {string} walletAddress - User's EOA wallet address
 * @param {number|undefined} amount - Human-readable USDC amount, or undefined for full withdrawal
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
