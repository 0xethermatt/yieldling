import { useState } from "react";
import NurseryScreen from "./Nursery.jsx";
import { depositToZyfai } from "./zyfai.js";
// ── Fonts injected globally ──────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&family=Anybody:ital,wght@0,900;1,900&display=swap";
document.head.appendChild(fontLink);
// ── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #080810;
    --surface: #10101c;
    --surface2: #181828;
    --border: #22223a;
    --accent: #7c6aff;
    --accent2: #ff6ab0;
    --accent3: #6affd4;
    --accent4: #ffd76a;
    --text: #eeeef8;
    --dim: #6a6a8a;
    --safe: #6affd4;
    --warn: #ffd76a;
    --danger: #ff6a6a;
    --font: 'Nunito', sans-serif;
    --mono: 'Space Mono', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); }
  /* ── NAV ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 28px;
    background: rgba(8,8,16,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .nav-logo {
    font-size: 20px; font-weight: 900; letter-spacing: -0.5px;
    font-family: 'Anybody', var(--font); font-style: italic;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .nav-tabs { display: flex; gap: 6px; }
  .nav-tab {
    background: none; border: 1px solid var(--border);
    color: var(--dim); padding: 7px 16px; border-radius: 20px;
    font-family: var(--font); font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }
  .nav-tab:hover { border-color: var(--accent); color: var(--text); }
  .nav-tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }
  .nav-wallet {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none; color: #fff; padding: 8px 18px; border-radius: 20px;
    font-family: var(--font); font-size: 13px; font-weight: 800; cursor: pointer;
  }
  /* ── SCREENS ── */
  .screen { min-height: 100vh; padding-top: 70px; position: relative; }
  /* starfield */
  .stars {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,.25) 0%, transparent 100%),
      radial-gradient(1px 1px at 55% 12%, rgba(255,255,255,.18) 0%, transparent 100%),
      radial-gradient(1px 1px at 78% 65%, rgba(255,255,255,.22) 0%, transparent 100%),
      radial-gradient(1px 1px at 38% 82%, rgba(255,255,255,.14) 0%, transparent 100%),
      radial-gradient(1px 1px at 92% 38%, rgba(255,255,255,.18) 0%, transparent 100%),
      radial-gradient(2px 2px at 88% 18%, rgba(124,106,255,.4) 0%, transparent 100%),
      radial-gradient(2px 2px at 25% 55%, rgba(106,255,212,.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 62% 90%, rgba(255,106,176,.25) 0%, transparent 100%);
  }
  /* ── LANDING ── */
  .landing {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center;
    padding: 120px 24px 80px; position: relative;
  }
  .landing-glow {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(124,106,255,.12) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    pointer-events: none;
  }
  .hero-tag {
    display: inline-block;
    background: rgba(124,106,255,.12); border: 1px solid rgba(124,106,255,.35);
    color: var(--accent); font-size: 11px; font-weight: 800;
    letter-spacing: 2px; text-transform: uppercase;
    padding: 6px 16px; border-radius: 20px; margin-bottom: 24px;
    position: relative; z-index: 1;
  }
  .hero-egg {
    font-size: 110px; position: relative; z-index: 1;
    animation: float 3s ease-in-out infinite;
    filter: drop-shadow(0 0 40px rgba(124,106,255,.6));
    margin-bottom: 28px; cursor: pointer; user-select: none;
    transition: transform .1s;
  }
  .hero-egg:active { transform: scale(.93); }
  .hero-egg.crack { animation: crack .45s ease-out; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
  @keyframes crack {
    0%{transform:rotate(0) scale(1)} 25%{transform:rotate(-6deg) scale(1.1)}
    60%{transform:rotate(5deg) scale(1.05)} 100%{transform:rotate(0) scale(1)}
  }
  .hero-h1 {
    font-size: clamp(38px,7vw,70px); font-weight: 900; line-height: 1.05;
    letter-spacing: -2px; margin-bottom: 18px; position: relative; z-index: 1;
    font-family: 'Anybody', var(--font); font-style: italic;
  }
  .hero-h1 span {
    background: linear-gradient(135deg, var(--accent), var(--accent2), var(--accent3));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero-sub {
    font-size: 17px; color: var(--dim); max-width: 460px; line-height: 1.65;
    margin-bottom: 36px; font-weight: 600; position: relative; z-index: 1;
  }
  .hero-cta {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none; color: #fff; font-family: var(--font);
    font-size: 17px; font-weight: 900; padding: 17px 46px; border-radius: 50px;
    cursor: pointer; position: relative; z-index: 1;
    box-shadow: 0 8px 32px rgba(124,106,255,.4);
    transition: all .3s;
  }
  .hero-cta:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(124,106,255,.5); }
  .hero-stats {
    display: flex; gap: 48px; margin-top: 64px; flex-wrap: wrap;
    justify-content: center; position: relative; z-index: 1;
  }
  .hero-stat .val {
    font-size: 28px; font-weight: 900;
    background: linear-gradient(135deg, var(--accent3), var(--accent));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero-stat .lbl {
    font-size: 11px; color: var(--dim); font-weight: 700;
    text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;
  }
  /* ── ADOPT ── */
  .adopt-wrap {
    display: flex; align-items: center; justify-content: center;
    padding: 100px 24px 60px; min-height: 100vh;
  }
  .adopt-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 24px; padding: 40px; width: 100%; max-width: 500px;
    position: relative; z-index: 1;
  }
  .adopt-card h2 { font-size: 26px; font-weight: 900; margin-bottom: 6px; }
  .adopt-card > p { color: var(--dim); font-size: 14px; font-weight: 600; margin-bottom: 30px; }
  .field-label {
    display: block; font-size: 11px; font-weight: 800; color: var(--dim);
    text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;
  }
  .amount-wrap { margin-bottom: 24px; }
  .amount-input {
    width: 100%; background: var(--bg); border: 1px solid var(--border);
    border-radius: 14px; padding: 15px 20px;
    font-family: var(--mono); font-size: 26px; font-weight: 700;
    color: var(--text); outline: none; transition: border-color .2s;
  }
  .amount-input:focus { border-color: var(--accent); }
  .risk-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 26px; }
  .risk-card {
    background: var(--bg); border: 2px solid var(--border);
    border-radius: 14px; padding: 14px 8px; text-align: center;
    cursor: pointer; transition: all .2s;
  }
  .risk-card:hover { border-color: var(--accent); }
  .risk-card.sel { border-color: var(--accent); background: rgba(124,106,255,.08); }
  .risk-card .r-emoji { font-size: 30px; margin-bottom: 6px; }
  .risk-card .r-name { font-size: 12px; font-weight: 800; margin-bottom: 3px; }
  .risk-card .r-apy { font-size: 13px; font-weight: 900; }
  .r-safe { color: var(--safe); }
  .r-turbo { color: var(--warn); }
  .r-max { color: var(--accent2); }
  .proj-box {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 14px; padding: 18px; margin-bottom: 22px;
  }
  .proj-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 0; font-size: 14px;
  }
  .proj-key { color: var(--dim); font-weight: 600; }
  .proj-val { font-weight: 800; }
  .c-green { color: var(--safe); }
  .c-purple { color: var(--accent); }
  .c-yellow { color: var(--warn); }
  .c-pink { color: var(--accent2); }
  .adopt-btn {
    width: 100%; background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none; color: #fff; font-family: var(--font);
    font-size: 17px; font-weight: 900; padding: 17px;
    border-radius: 14px; cursor: pointer; transition: all .3s;
    box-shadow: 0 4px 24px rgba(124,106,255,.3);
  }
  .adopt-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(124,106,255,.5); }
  /* ── NURSERY ── */
  .nursery {
    max-width: 960px; margin: 0 auto;
    padding: 90px 24px 60px; position: relative; z-index: 1;
  }
  .nursery-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
  }
  .nursery-header h2 { font-size: 26px; font-weight: 900; margin-bottom: 4px; }
  .nursery-header p { color: var(--dim); font-size: 14px; font-weight: 600; }
  .evo-badge {
    background: linear-gradient(135deg, var(--accent4), var(--accent2));
    color: #1a0800; font-size: 12px; font-weight: 900;
    padding: 7px 16px; border-radius: 20px;
  }
  .nursery-grid {
    display: grid; grid-template-columns: 340px 1fr; gap: 18px;
  }
  @media(max-width:700px){ .nursery-grid{grid-template-columns:1fr;} }
  /* pet panel */
  .pet-panel {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 22px; padding: 30px 24px;
    display: flex; flex-direction: column; align-items: center;
    position: relative; overflow: hidden;
  }
  .pet-panel::before {
    content:''; position:absolute; top:-60px; left:50%; transform:translateX(-50%);
    width:220px; height:220px; border-radius:50%;
    background: radial-gradient(circle, rgba(124,106,255,.18) 0%, transparent 70%);
    pointer-events:none;
  }
  .pet-emoji {
    font-size: 96px; position: relative; z-index: 1;
    filter: drop-shadow(0 0 28px rgba(124,106,255,.55));
    margin-bottom: 14px; cursor: pointer; user-select: none;
    animation: petbounce 2.2s ease-in-out infinite;
    transition: filter .3s;
  }
  .pet-emoji.anxious { animation: shake .45s ease-in-out infinite; filter: drop-shadow(0 0 28px rgba(255,215,106,.7)); }
  .pet-emoji.danger  { animation: shake .25s ease-in-out infinite; filter: drop-shadow(0 0 28px rgba(255,106,106,.8)); }
  @keyframes petbounce { 0%,100%{transform:translateY(0) rotate(0)} 35%{transform:translateY(-10px) rotate(-3deg)} 65%{transform:translateY(-5px) rotate(2deg)} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-7px) rotate(-4deg)} 75%{transform:translateX(7px) rotate(4deg)} }
  .pet-name { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
  .pet-level { font-size: 11px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
  .bar-wrap { width: 100%; margin-bottom: 12px; }
  .bar-labels { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: var(--dim); margin-bottom: 6px; }
  .bar-track { width: 100%; height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; transition: width .6s ease; }
  .bar-health { background: linear-gradient(90deg, var(--safe), #4af0b8); }
  .bar-xp    { background: linear-gradient(90deg, var(--accent), var(--accent2)); }
  .bar-warn  { background: linear-gradient(90deg, var(--warn), #ffaa6a); }
  .emotion-pill {
    font-size: 13px; font-weight: 800; padding: 7px 16px; border-radius: 20px;
    margin-top: 8px; transition: all .3s;
  }
  .emotion-ok   { background: rgba(106,255,212,.12); border: 1px solid rgba(106,255,212,.35); color: var(--safe); }
  .emotion-warn { background: rgba(255,215,106,.12); border: 1px solid rgba(255,215,106,.35); color: var(--warn); }
  .emotion-bad  { background: rgba(255,106,106,.12); border: 1px solid rgba(255,106,106,.35); color: var(--danger); }
  .unwind-btn {
    margin-top: 18px; background: none;
    border: 1px solid rgba(255,106,106,.3); color: rgba(255,106,106,.6);
    font-family: var(--font); font-size: 12px; font-weight: 800;
    padding: 8px 18px; border-radius: 20px; cursor: pointer; transition: all .2s;
  }
  .unwind-btn:hover { background: rgba(255,106,106,.08); color: var(--danger); border-color: var(--danger); }
  /* right stats */
  .stats-col { display: flex; flex-direction: column; gap: 14px; }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 18px; padding: 18px 20px;
    display: flex; align-items: center; gap: 16px;
    transition: border-color .2s; cursor: default;
  }
  .stat-card:hover { border-color: var(--accent); }
  .stat-icon { font-size: 26px; flex-shrink: 0; }
  .stat-lbl { font-size: 11px; font-weight: 800; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .stat-val { font-size: 22px; font-weight: 900; font-family: var(--mono); }
  .stat-sub { font-size: 12px; color: var(--dim); font-weight: 600; margin-top: 2px; }
  /* hood panel */
  .hood-panel {
    grid-column: 1 / -1; background: var(--surface);
    border: 1px solid var(--border); border-radius: 18px; overflow: hidden;
  }
  .hood-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 22px; cursor: pointer; user-select: none;
  }
  .hood-header h3 { font-size: 12px; font-weight: 800; color: var(--dim); text-transform: uppercase; letter-spacing: 1.5px; }
  .hood-chevron { font-size: 14px; color: var(--dim); transition: transform .3s; }
  .hood-chevron.open { transform: rotate(180deg); }
  .hood-body {
    display: grid; grid-template-columns: repeat(4,1fr); gap: 12px;
    padding: 0 22px 22px; display: none;
  }
  .hood-body.open { display: grid; }
  @media(max-width:600px){ .hood-body{ grid-template-columns: repeat(2,1fr); } }
  .hood-stat {
    background: var(--bg); border-radius: 12px; padding: 14px; text-align: center;
  }
  .hood-val { font-family: var(--mono); font-size: 17px; font-weight: 700; margin-bottom: 4px; }
  .hood-lbl { font-size: 10px; color: var(--dim); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  /* ── EVOLUTION OVERLAY ── */
  .evo-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.92);
    z-index: 300; display: none;
    flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 24px;
  }
  .evo-overlay.show { display: flex; }
  .evo-pet {
    font-size: 120px; margin-bottom: 24px;
    animation: evoIn .8s cubic-bezier(.175,.885,.32,1.275);
    filter: drop-shadow(0 0 60px rgba(255,215,106,.8));
  }
  @keyframes evoIn { 0%{transform:scale(.3) rotate(-20deg);opacity:0} 70%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  .evo-overlay h2 {
    font-size: 52px; font-weight: 900; letter-spacing: -2px; margin-bottom: 10px;
    font-family: 'Anybody', var(--font); font-style: italic;
    background: linear-gradient(135deg, var(--accent4), var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .evo-overlay p { color: var(--dim); font-size: 16px; margin-bottom: 32px; font-weight: 600; line-height: 1.6; }
  .evo-close {
    background: linear-gradient(135deg, var(--accent4), var(--accent2));
    border: none; color: #1a0800; font-family: var(--font);
    font-size: 16px; font-weight: 900; padding: 15px 38px;
    border-radius: 50px; cursor: pointer; transition: transform .2s;
  }
  .evo-close:hover { transform: scale(1.04); }
  .particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .particle {
    position: absolute; width: 8px; height: 8px; border-radius: 50%;
    animation: pfly 1.6s ease-out forwards;
  }
  @keyframes pfly { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0} }
  /* yield tick */
  @keyframes ytick { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .ytick { animation: ytick .25s ease-out; }
`;
const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);
// ── Data ─────────────────────────────────────────────────────────────────────
const TIERS = [
  { emoji: "🐣", name: "Hatchling", apy: 0.07, loops: 2, cls: "r-safe",  label: "~7% APY"  },
  { emoji: "🐉", name: "Dragon",    apy: 0.14, loops: 4, cls: "r-turbo", label: "~14% APY" },
  { emoji: "⚡", name: "Legend",    apy: 0.22, loops: 6, cls: "r-max",   label: "~22% APY" },
];
const EVOLUTIONS = [
  { threshold: 0,   emoji: "🥚",  name: "Egg",      level: "Level 0" },
  { threshold: 1,   emoji: "🐣",  name: "Hatchling", level: "Level 1" },
  { threshold: 10,  emoji: "🐾",  name: "Pup",       level: "Level 2" },
  { threshold: 30,  emoji: "🐲",  name: "Drake",     level: "Level 3" },
  { threshold: 80,  emoji: "🐉",  name: "Dragon",    level: "Level 4" },
  { threshold: 200, emoji: "⭐",  name: "Starborn",  level: "Level 5" },
];
function getEvolution(yield_) {
  let evo = EVOLUTIONS[0];
  for (const e of EVOLUTIONS) { if (yield_ >= e.threshold) evo = e; }
  return evo;
}
function fmt(n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
// ── Components ───────────────────────────────────────────────────────────────
function Stars() { return <div className="stars" />; }
function Nav({ screen, setScreen, walletAddress, connectWallet }) {
  const tabs = ["landing", "adopt", "nursery"];
  const labels = ["Home", "Adopt", "Nursery"];
  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : "Connect Wallet";
  return (
    <nav className="nav">
      <div className="nav-logo">🥚 Yieldling</div>
      <div className="nav-tabs">
        {tabs.map((t, i) => (
          <button key={t} className={`nav-tab ${screen === t ? "active" : ""}`} onClick={() => setScreen(t)}>
            {labels[i]}
          </button>
        ))}
      </div>
      <button className="nav-wallet" onClick={!walletAddress ? connectWallet : undefined}>
        {shortAddr}
      </button>
    </nav>
  );
}
// ── Landing ──────────────────────────────────────────────────────────────────
function Landing({ setScreen }) {
  const [cracking, setCracking] = useState(false);
  const crack = () => {
    setCracking(true);
    setTimeout(() => setCracking(false), 500);
  };
  return (
    <div className="screen landing">
      <div className="landing-glow" />
      <div className="hero-tag">🥚 Yieldling — Powered by ZyFAI · Lido wstETH · AAVE</div>
      <div className={`hero-egg ${cracking ? "crack" : ""}`} onClick={crack}>🥚</div>
      <h1 className="hero-h1">Your savings,<br /><span>alive.</span></h1>
      <p className="hero-sub">
        Adopt a pet. Deposit once. Watch it grow on an automated wstETH looping strategy —
        no jargon, no dashboards, just a creature that thrives when your money works.
      </p>
      <button className="hero-cta" onClick={() => setScreen("adopt")}>Adopt Your Pet →</button>
      <div className="hero-stats">
        {[["$2.4M","Total Deposited"],["847","Pets Alive"],["14.2%","Avg APY"],["$0","Liquidations Ever"]].map(([v,l]) => (
          <div className="hero-stat" key={l}><div className="val">{v}</div><div className="lbl">{l}</div></div>
        ))}
      </div>
    </div>
  );
}
// ── Adopt ────────────────────────────────────────────────────────────────────
function Adopt({ setScreen, walletAddress, connectWallet, setSmartWalletAddress }) {
  const [amount, setAmount] = useState(1000);
  const [tierIdx, setTierIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tier = TIERS[tierIdx];
  const yearly = amount * tier.apy;
  const monthly = yearly / 12;

  const handleAdopt = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await depositToZyfai(amount, walletAddress);
      setSmartWalletAddress(result.smartWallet);
      setScreen("nursery");
    } catch (err) {
      console.error("[Adopt] deposit failed:", err);
      setError("Deposit failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen adopt-wrap">
      <div className="adopt-card">
        <h2>Adopt your Yieldling 🥚</h2>
        <p>Choose your deposit and how hard you want your money to work.</p>
        <div className="amount-wrap">
          <label className="field-label">Deposit Amount (USDC)</label>
          <input className="amount-input" type="number" value={amount}
            onChange={e => setAmount(parseFloat(e.target.value) || 0)} />
        </div>
        <label className="field-label" style={{marginBottom:10}}>Risk Tier</label>
        <div className="risk-grid">
          {TIERS.map((t, i) => (
            <div key={t.name} className={`risk-card ${tierIdx === i ? "sel" : ""}`} onClick={() => setTierIdx(i)}>
              <div className="r-emoji">{t.emoji}</div>
              <div className="r-name">{t.name}</div>
              <div className={`r-apy ${t.cls}`}>{t.label}</div>
            </div>
          ))}
        </div>
        <div className="proj-box">
          {[
            ["Deposit",        `$${fmt(amount)}`,         ""],
            ["Asset",          "wstETH (Lido)",           "c-purple"],
            ["Loop Depth",     `${tier.loops}×`,          "c-purple"],
            ["Monthly Yield",  `+$${fmt(monthly)}`,       "c-green"],
            ["Yearly Yield",   `+$${fmt(yearly)}`,        "c-green"],
            ["Principal Risk", "None ✓",                  "c-green"],
          ].map(([k, v, c]) => (
            <div className="proj-row" key={k}>
              <span className="proj-key">{k}</span>
              <span className={`proj-val ${c}`}>{v}</span>
            </div>
          ))}
        </div>
        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
            {error}
          </p>
        )}
        {walletAddress ? (
          <button className="adopt-btn" onClick={handleAdopt} disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "⏳ Depositing…" : `🥚 Adopt your Yieldling for $${fmt(amount)}`}
          </button>
        ) : (
          <button className="adopt-btn" onClick={connectWallet}>
            🔌 Connect Wallet to Continue
          </button>
        )}
      </div>
    </div>
  );
}
// ── Nursery ──────────────────────────────────────────────────────────────────
// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [walletAddress, setWalletAddress] = useState(null);
  const [smartWalletAddress, setSmartWalletAddress] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) { alert("MetaMask (or another wallet) not found."); return; }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWalletAddress(accounts[0]);
  };

  return (
    <>
      <Stars />
      <Nav screen={screen} setScreen={setScreen} walletAddress={walletAddress} connectWallet={connectWallet} />
      {screen === "landing"  && <Landing  setScreen={setScreen} />}
      {screen === "adopt"    && (
        <Adopt
          setScreen={setScreen}
          walletAddress={walletAddress}
          connectWallet={connectWallet}
          setSmartWalletAddress={setSmartWalletAddress}
        />
      )}
      {screen === "nursery"  && (
        <NurseryScreen
          walletAddress={walletAddress}
          smartWalletAddress={smartWalletAddress}
        />
      )}
    </>
  );
}
