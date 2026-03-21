# 🥚 Yieldling
> The pet that pays you back.

Yieldling is a Tamagotchi-style DeFi app where you adopt a digital creature powered by real yield. Deposit USDC once, ZyFAI automatically optimises your yield across DeFi protocols, and your pet thrives as your money works.

**Live Demo:** https://yieldling.vercel.app

---

## What it does

Users adopt one of two characters and deposit into ZyFAI's yield optimisation engine. The pet's health, mood, and evolution are directly tied to yield performance. No APYs, no dashboards, no jargon — just a creature that grows when your money works.

- 🐾 **Stabby** (USDC) — calm, stable yields routed through Morpho and other lending protocols
- ⚡ **Volty** (WETH) — ETH-native yield strategies *(coming soon)*

Every interaction is a real on-chain transaction. Tapping Feed, Play, or Rest triggers a $2 USDC micro-deposit into ZyFAI via session keys — no wallet popups, no friction. As yield accumulates the creature evolves through four hand-drawn visual stages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, deployed on Vercel |
| Authentication | Privy (email, Google, wallet) |
| Yield Infrastructure | ZyFAI SDK |
| Yield Protocol | Morpho (via ZyFAI routing) |
| Chain | Base mainnet (8453) |

---

## ZyFAI Integration

Yieldling uses the ZyFAI SDK throughout:

- `sdk.connectAccount()` — SIWE authentication with Privy wallet provider
- `sdk.deploySafe()` — deploys a Safe smart wallet for each user
- `sdk.createSessionKey()` — enables gasless micro-transactions on Feed/Play/Rest
- `sdk.depositFunds()` — USDC deposits routed automatically to highest-yield pools
- `sdk.getOnchainEarnings()` — real-time yield tracking powering the pet's XP system
- `sdk.getDailyApyHistory()` — live APY display in the Nursery
- `sdk.getAPYPerStrategy()` — live APY projections on the adopt screen
- `getAvailableProtocols()` — active routes shown in the Under the Hood panel

Capital is automatically spread across the highest-yielding pools on Base. Currently routing through Morpho's High Yield Clearstar USDC pool.

---

## How the Pet Works

| Yield Earned | Evolution Stage |
|---|---|
| $0 | 🥚 Egg (just hatched) |
| $1 | 🐾 Hatchling |
| $10 | 🐲 Drake |
| $50 | 🐉 Legend |

Pet health reflects ZyFAI account status. Feed/Play/Rest buttons trigger $2 USDC micro-deposits, refilling need bars and earning XP toward the next evolution. Need bars deplete slowly over 24-48 hours, bringing users back daily.

---

## Running Locally

```bash
git clone https://github.com/0xethermatt/yieldling
cd yieldling
npm install
```

Create a `.env` file:

```
VITE_ZYFAI_API_KEY=your_zyfai_api_key
VITE_PRIVY_APP_ID=your_privy_app_id
```

```bash
npm run dev
```

---

## Screenshots

| Landing | Character Select | Nursery |
|---|---|---|
| "The pet that pays you back" | Choose Stabby or Volty | Live yield, pet evolution |

---

## Hackathon

Built for the **ZyFAI Native Wallet & Subaccount** track at [Synthesis Hackathon](https://synthesis.md/hack).

**Track criteria met:**
- ✅ ZyFAI subaccount correctly deployed and managed with session key scoping
- ✅ Yield mechanism invisible to end user
- ✅ Consumer app with zero-visible-DeFi yield experience
- ✅ Real deposits actively earning on Base mainnet via Morpho

---

## Team

Built by [@0xethermatt](https://github.com/0xethermatt)
