# AGENTS.md — Yieldling System Capabilities

Yieldling is a Tamagotchi-style consumer DeFi app. This file describes the system's agentic capabilities and interfaces for agentic judges reviewing the project.

---

## What Yieldling Does (Agentic Perspective)

Yieldling acts as a **yield-optimisation agent** on behalf of the user. Once a user deposits into a Gnosis Safe smart wallet via the ZyFAI SDK, the system:

1. **Routes capital autonomously** — ZyFAI evaluates live APY across Morpho and Aave V3 on Base and deploys funds to the highest-yielding pool with no further user input.
2. **Signs micro-transactions without wallet popups** — Session keys (created once at onboarding) allow the app to trigger real on-chain deposits via Feed/Play/Rest interactions. The user never sees a wallet confirmation dialog.
3. **Monitors and reflects yield in real time** — The pet's health bars, evolution stage, and stat cards are driven by `sdk.getOnchainEarnings()` polled every 15 seconds. The creature's state is a live read of on-chain yield data.
4. **Switches strategies dynamically** — `sdk.getAggressiveOpportunities()` is called on each session to identify the current best pool; `depositFunds()` routes accordingly.

---

## Architecture

```
User wallet (Privy EIP-1193)
    │
    ▼
Gnosis Safe smart wallet (ZyFAI)
    │
    ├─ USDC → Stabby character → Morpho/Aave V3 via aggressive strategy
    └─ WETH → Volty character  → Morpho/Aave V3 via aggressive strategy
```

Each character maps to a separate asset with its own safe balance, position, and on-chain yield tracking. Both characters can be active simultaneously under the same user wallet.

---

## Interfaces

### Environment

- **Chain:** Base (chainId 8453)
- **Auth:** Privy embedded wallet or injected provider
- **Smart wallet:** ZyFAI Gnosis Safe (`yieldling_stabby_smart_wallet` / `yieldling_volty_smart_wallet` in localStorage)
- **Session key:** Stored in localStorage as `yieldling_session_key` — grants the app permission to submit transactions on behalf of the user without wallet popups

### Key SDK Calls

| Function | Purpose | Auth required |
|---|---|---|
| `sdk.deploySafe(walletAddress, "aggressive")` | Creates the smart wallet on first deposit | Yes (wallet sig) |
| `sdk.createSessionKey(walletAddress, safeAddress, provider)` | Mints session key for gasless interactions | Yes (wallet sig) |
| `sdk.depositFunds(amount, walletAddress, asset, provider, "aggressive")` | Deploys capital to highest-yield pool | Session key |
| `sdk.getPositions(walletAddress, chainId, safeAddress, asset)` | Returns total principal deployed | No |
| `sdk.getOnchainEarnings(safeAddress)` | Returns lifetime yield earned per asset | No |
| `sdk.getDailyApyHistory(safeAddress, "7D")` | Returns wallet's own 7-day APY | No |
| `sdk.getAggressiveOpportunities(chainId)` | Returns live top-APY pool list | No |
| `sdk.getAPYPerStrategy("aggressive", asset, chainId)` | Returns current strategy APY | No |
| `getSafeBalance(safeAddress, asset)` | On-chain ERC-20 balance via viem (no SDK auth) | No |

### WETH Flow (Volty)

Volty deposits require ETH → WETH wrapping before ZyFAI deposit:

1. Check existing WETH balance via `balanceOf` on WETH contract (`0x4200000000000000000000000000000000000006`)
2. If insufficient: call `wrapEthToWeth(amount, provider, walletAddress)` — uses `createWalletClient.writeContract()` with explicit `deposit()` ABI
3. Wait for tx receipt + 3s settle delay + 3× retry balance verify
4. Call `sdk.depositFunds(amount, walletAddress, "WETH", provider, "aggressive")`

---

## State Machine (Pet)

| Condition | Pet state | Health bar |
|---|---|---|
| Deposit loaded, balance > 0 | `ok` (float animation) | 100% green gradient |
| No deposit found | `ok` (neutral) | 0% grey |
| Unwind in progress | `anxious` (shake) | 44% amber |
| Unwind complete | `danger` (fast shake) | 20% red |

Evolution stages are driven by cumulative yield (USDC) or ETH earned (WETH):

**Stabby (USDC):** Egg → Baby ($0) → Toddler ($1) → Teen ($10) → Adult ($50)
**Volty (WETH):** Egg → Baby (0 ETH) → Toddler (0.0005 ETH) → Teen (0.005 ETH) → Adult (0.02 ETH)

---

## Data Freshness

| Data | Poll interval | Source |
|---|---|---|
| Total yield earned | 15 seconds | `sdk.getOnchainEarnings()` |
| Deposited principal | 60 seconds | `sdk.getPositions()` (fast path: `getSafeBalance` on mount) |
| Current APY | 60 seconds | `sdk.getDailyApyHistory()` → fallback `sdk.getAPYPerStrategy()` |
| Opportunity routing | 60 seconds | `sdk.getAggressiveOpportunities()` |
| ETH/USD price | On mount | CoinGecko public API |

---

## Security Model

- Session keys grant deposit-only permissions scoped to the user's own safe
- No private keys are ever stored or transmitted
- Privy handles wallet auth; the app receives only an EIP-1193 provider
- WETH wrapping uses `writeContract` with explicit minimal ABI (no raw calldata)

---

## Running Locally

```bash
git clone https://github.com/0xethermatt/yieldling
cd yieldling
npm install
cp .env.example .env   # add VITE_PRIVY_APP_ID and VITE_ZYFAI_API_KEY
npm run dev
```

Live demo: **https://yieldling.vercel.app**
