# 🥚 Yieldling

**Your savings, alive.**

Yieldling is a DeFi yield app that turns boring deposits into a living creature. Adopt a pet, deposit once, and watch it grow as your money earns automated yield through a wstETH looping strategy — no jargon, no dashboards.

**Live app → [yieldling.vercel.app](https://yieldling.vercel.app)**

---

## What it does

- Deposit USDC → ZyFAI converts it to wstETH and runs an automated looping strategy across Aave/Compound on Base
- Your pet (Ziggy) evolves as your yield grows: Egg → Hatchling → Pup → Drake → Dragon → Starborn
- Emergency Unwind returns your principal at any time
- On-chain principal tracking via `YieldPetTreasury.sol` ensures yield can never dip into your deposit

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite 5 (JSX) |
| Wallet | wagmi · viem · MetaMask |
| Yield strategy | [ZyFAI SDK](https://docs.zyf.ai) — wstETH looping on Base via Lido + Aave |
| Smart contract | Solidity 0.8.27 · Hardhat 2 · OpenZeppelin Ownable |
| Testnet | Base Sepolia (chain 84532) |
| Hosting | Vercel |

---

## Smart contract

**YieldPetTreasury** — deployed on Base Sepolia

```
0xC26c2CB8331DEB96A05fBc7Db5d26d1FAd341E3F
```

[View on BaseScan](https://sepolia.basescan.org/address/0xC26c2CB8331DEB96A05fBc7Db5d26d1FAd341E3F)

The contract:
- Holds wstETH principal per user
- Exposes `getSpendableYield(address)` — current value minus original deposit
- `withdrawYield()` enforces that only yield (never principal) can be taken
- `emergencyUnwind()` — owner-only, returns full principal instantly

---

## Project structure

```
src/
  App.jsx          # Landing, Adopt, Nav — routing + wallet state
  Nursery.jsx      # Pet UI — yield display, needs, evolution overlay
  zyfai.js         # ZyFAI SDK + viem contract calls
contracts/
  YieldPetTreasury.sol
scripts/
  deploy.js        # Hardhat deploy → Base Sepolia
deployments.json   # Deployed addresses by chain ID
```

---

## Local development

```bash
npm install
npm run dev
```

Create a `.env` file:

```
VITE_ZYFAI_API_KEY=your_key_here
VITE_CONTRACT_ADDRESS=0xC26c2CB8331DEB96A05fBc7Db5d26d1FAd341E3F
PRIVATE_KEY=your_wallet_private_key   # for Hardhat deployments only
```

Get a ZyFAI API key at [sdk.zyf.ai](https://sdk.zyf.ai).

## Deploy contract

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network baseSepolia
```
