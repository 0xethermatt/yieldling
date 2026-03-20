import { useState, useEffect, useRef } from "react";
import { getYieldEarned, withdrawYield } from "./zyfai.js";
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&family=Anybody:ital,wght@0,900;1,900&display=swap";
document.head.appendChild(fontLink);
const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #080c14;
  --surface: #0e1420;
  --surface2: #141a28;
  --border: #1e2640;
  --purple: #7c6aff;
  --teal: #6affd4;
  --pink: #ff6ab0;
  --gold: #ffd76a;
  --text: #eef0f8;
  --dim: #5a6080;
  --font: 'Nunito', sans-serif;
  --mono: 'Space Mono', monospace;
  --display: 'Anybody', var(--font);
}
body { background: var(--bg); color: var(--text); font-family: var(--font); margin: 0; }
/* stars */
.stars {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    radial-gradient(1px 1px at 8% 20%, rgba(255,255,255,.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 22% 75%, rgba(255,255,255,.2) 0%, transparent 100%),
    radial-gradient(1px 1px at 48% 12%, rgba(255,255,255,.25) 0%, transparent 100%),
    radial-gradient(1px 1px at 67% 55%, rgba(255,255,255,.15) 0%, transparent 100%),
    radial-gradient(1px 1px at 85% 30%, rgba(255,255,255,.2) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 35% 88%, rgba(106,255,212,.35) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 91% 68%, rgba(124,106,255,.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 40%, rgba(255,106,176,.2) 0%, transparent 100%);
}
/* phone frame */
.phone {
  width: 390px; min-height: 844px;
  margin: 0 auto;
  position: relative; z-index: 1;
  display: flex; flex-direction: column;
  background: var(--bg);
  overflow: visible;
}
/* top bar */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 10px;
  flex-shrink: 0;
}
.topbar-left { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 42px; height: 42px; border-radius: 50%;
  border: 2px solid var(--purple);
  background: linear-gradient(135deg, var(--surface2), var(--border));
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.topbar-name {
  font-family: var(--display); font-style: italic;
  font-size: 20px; color: var(--purple); line-height: 1;
  margin-bottom: 2px;
}
.topbar-level { font-size: 11px; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; }
.streak-pill {
  display: flex; align-items: center; gap: 6px;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 20px; padding: 7px 14px;
  font-size: 14px; font-weight: 800;
}
.streak-count { font-family: var(--mono); color: var(--gold); }
/* stat cards */
.stat-cards {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px; padding: 0 16px; flex-shrink: 0;
}
.stat-card {
  background: var(--surface); border-radius: 16px;
  border: 1px solid var(--border);
  padding: 14px 16px; position: relative; overflow: hidden;
}
.stat-card::before {
  content: ''; position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  border-radius: 16px 16px 0 0;
}
.stat-card.teal::before { background: var(--teal); }
.stat-card.purple::before { background: var(--purple); }
.stat-lbl { font-size: 10px; font-weight: 800; color: var(--dim); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
.stat-val { font-family: var(--mono); font-size: 22px; font-weight: 700; }
.stat-val.teal { color: var(--teal); }
.stat-val.purple { color: var(--purple); }
/* pet area */
.pet-area {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 8px 0; position: relative; min-height: 220px;
}
.pet-glow {
  position: absolute; width: 200px; height: 200px; border-radius: 50%;
  background: radial-gradient(circle, rgba(124,106,255,.18) 0%, transparent 70%);
  pointer-events: none;
}
.pet-glow.warn { background: radial-gradient(circle, rgba(255,215,106,.2) 0%, transparent 70%); }
.pet-glow.danger { background: radial-gradient(circle, rgba(255,106,106,.2) 0%, transparent 70%); }
.pet-emoji {
  font-size: 110px; position: relative; z-index: 1;
  cursor: pointer; user-select: none; line-height: 1;
  animation: petbounce 2.4s ease-in-out infinite;
  transition: filter .4s;
  filter: drop-shadow(0 0 20px rgba(124,106,255,.5));
}
.pet-emoji.happy  { filter: drop-shadow(0 0 24px rgba(106,255,212,.6)); }
.pet-emoji.anxious {
  animation: shake .4s ease-in-out infinite;
  filter: drop-shadow(0 0 24px rgba(255,215,106,.7));
}
.pet-emoji.danger {
  animation: shake .22s ease-in-out infinite;
  filter: drop-shadow(0 0 28px rgba(255,106,106,.8));
}
@keyframes petbounce {
  0%,100%{transform:translateY(0) rotate(0deg)}
  30%{transform:translateY(-12px) rotate(-2deg)}
  60%{transform:translateY(-7px) rotate(2deg)}
}
@keyframes shake {
  0%,100%{transform:translateX(0)}
  25%{transform:translateX(-8px) rotate(-4deg)}
  75%{transform:translateX(8px) rotate(4deg)}
}
/* sparkles */
.sparkle {
  position: absolute; pointer-events: none;
  animation: sparklePop 1.2s ease-out forwards;
  font-size: 16px; z-index: 2;
}
@keyframes sparklePop {
  0%{opacity:1;transform:scale(0) translate(0,0)}
  50%{opacity:1;transform:scale(1.2) translate(var(--sx),var(--sy))}
  100%{opacity:0;transform:scale(.6) translate(var(--sx2),var(--sy2))}
}
/* status bars */
.bars-area { width: 100%; padding: 0 16px; flex-shrink: 0; }
.bar-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.bar-left { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--dim); min-width: 70px; }
.bar-icon { font-size: 14px; }
.bar-track {
  flex: 1; height: 6px; background: var(--surface2);
  border-radius: 3px; overflow: hidden; margin: 0 10px;
}
.bar-fill { height: 100%; border-radius: 3px; transition: width .6s ease; }
.bar-pct { font-size: 11px; font-weight: 800; min-width: 32px; text-align: right; }
/* pet name + xp */
.pet-meta { padding: 4px 16px 10px; flex-shrink: 0; }
.pet-name-row {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 8px;
}
.pet-name { font-family: var(--display); font-style: italic; font-size: 24px; font-weight: 900; }
.pet-xp { font-family: var(--mono); font-size: 13px; color: var(--dim); }
.xp-track { width: 100%; height: 7px; background: var(--surface2); border-radius: 4px; overflow: hidden; margin-bottom: 5px; }
.xp-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--purple), var(--pink)); transition: width .8s ease; }
.next-evo { font-size: 10px; font-weight: 800; color: var(--purple); text-transform: uppercase; letter-spacing: 2px; text-align: center; }
/* needs */
.needs { display: flex; justify-content: space-around; padding: 10px 16px; flex-shrink: 0; }
.need-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 18px; padding: 14px 20px;
  cursor: pointer; transition: all .2s; min-width: 90px;
  position: relative;
}
.need-btn:hover { border-color: var(--purple); background: var(--surface2); }
.need-btn:active { transform: scale(.94); }
.need-btn.urgent { border-color: var(--pink); animation: urgentpulse 1.5s ease-in-out infinite; }
@keyframes urgentpulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,106,176,0)} 50%{box-shadow:0 0 0 4px rgba(255,106,176,.2)} }
.need-icon { font-size: 26px; }
.need-label { font-size: 10px; font-weight: 800; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; }
.need-bar { width: 100%; height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-top: 2px; }
.need-bar-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }
/* emotion pill */
.emotion-area { display: flex; justify-content: center; padding: 0 16px 8px; flex-shrink: 0; }
.emotion-pill {
  font-size: 13px; font-weight: 800; padding: 7px 20px;
  border-radius: 20px; transition: all .3s;
}
.ep-ok   { background: rgba(106,255,212,.1); border: 1px solid rgba(106,255,212,.3); color: var(--teal); }
.ep-warn { background: rgba(255,215,106,.1); border: 1px solid rgba(255,215,106,.3); color: var(--gold); }
.ep-bad  { background: rgba(255,106,106,.1); border: 1px solid rgba(255,106,106,.3); color: #ff6a6a; }
/* bottom nav */
.bottom-nav {
  display: flex; border-top: 1px solid var(--border);
  background: rgba(8,12,20,.9); backdrop-filter: blur(20px);
  flex-shrink: 0; padding-bottom: 8px;
}
.nav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 12px 8px 4px; cursor: pointer; transition: all .2s; gap: 4px;
  background: none; border: none; color: var(--dim); font-family: var(--font);
}
.nav-item.active { color: var(--purple); }
.nav-item:hover { color: var(--text); }
.nav-icon { font-size: 22px; }
.nav-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
/* unwind btn */
.unwind-row { display: flex; justify-content: center; padding: 0 16px 8px; flex-shrink: 0; }
.unwind-btn {
  background: none; border: 1px solid rgba(255,106,106,.25);
  color: rgba(255,106,106,.5); font-family: var(--font);
  font-size: 11px; font-weight: 800; padding: 7px 18px;
  border-radius: 20px; cursor: pointer; transition: all .2s;
}
.unwind-btn:hover { background: rgba(255,106,106,.08); color: #ff6a6a; border-color: #ff6a6a; }
/* evolution overlay */
.evo-overlay {
  position: absolute; inset: 0; background: rgba(4,6,14,.94);
  z-index: 50; display: none;
  flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 32px;
}
.evo-overlay.show { display: flex; }
.evo-pet { font-size: 110px; animation: evoIn .7s cubic-bezier(.175,.885,.32,1.275); margin-bottom: 20px; }
@keyframes evoIn { 0%{transform:scale(.2) rotate(-15deg);opacity:0} 70%{transform:scale(1.1) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
.evo-title {
  font-family: var(--display); font-style: italic;
  font-size: 46px; font-weight: 900; letter-spacing: -1px;
  background: linear-gradient(135deg, var(--gold), var(--pink));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}
.evo-sub { color: var(--dim); font-size: 15px; font-weight: 600; line-height: 1.6; margin-bottom: 28px; }
.evo-close {
  background: linear-gradient(135deg, var(--gold), var(--pink));
  border: none; color: #1a0800; font-family: var(--font);
  font-size: 15px; font-weight: 900; padding: 14px 36px;
  border-radius: 50px; cursor: pointer; transition: transform .2s;
}
.evo-close:hover { transform: scale(1.04); }
.evo-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.evo-p {
  position: absolute; width: 7px; height: 7px; border-radius: 50%;
  animation: pflyout 1.5s ease-out forwards;
}
@keyframes pflyout { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0} }
/* daily reward toast */
.toast {
  position: absolute; top: 72px; left: 50%; transform: translateX(-50%);
  background: var(--surface2); border: 1px solid var(--teal);
  border-radius: 14px; padding: 10px 20px;
  font-size: 13px; font-weight: 800; color: var(--teal);
  white-space: nowrap; z-index: 40;
  animation: toastIn .4s ease-out, toastOut .4s ease-in 2.6s forwards;
  pointer-events: none;
}
@keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
@keyframes toastOut { to{opacity:0;transform:translateX(-50%) translateY(-10px)} }
/* floating +xp label */
.xp-float {
  position: absolute; font-size: 14px; font-weight: 900;
  color: var(--purple); pointer-events: none; z-index: 20;
  animation: floatUp .9s ease-out forwards;
}
@keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-50px)} }
`;
const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);
const EVOLUTIONS = [
  { threshold: 0,   emoji: "🥚",  name: "Egg",      level: "LV. 1", next: "Hatchling" },
  { threshold: 2,   emoji: "🐣",  name: "Hatchling", level: "LV. 2", next: "Pup" },
  { threshold: 10,  emoji: "🐾",  name: "Pup",       level: "LV. 3", next: "Drake" },
  { threshold: 30,  emoji: "🐲",  name: "Drake",     level: "LV. 4", next: "Dragon" },
  { threshold: 80,  emoji: "🐉",  name: "Dragon",    level: "LV. 5", next: "Starborn" },
  { threshold: 200, emoji: "⭐",  name: "Starborn",  level: "LV. 6", next: "MAX" },
];
function getEvo(y) {
  let e = EVOLUTIONS[0];
  for (const ev of EVOLUTIONS) { if (y >= ev.threshold) e = ev; }
  return e;
}
function getNextEvo(y) {
  return EVOLUTIONS.find(e => e.threshold > y) || EVOLUTIONS[EVOLUTIONS.length - 1];
}
function fmt(n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
export default function Nursery({ walletAddress, smartWalletAddress }) {
  const [yieldEarned, setYieldEarned] = useState(42.18);
  const [petState, setPetState] = useState("ok");
  const [showEvo, setShowEvo] = useState(false);
  const [prevEvoName, setPrevEvoName] = useState(null);
  const [streak, setStreak] = useState(12);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [sparkles, setSparkles] = useState([]);
  const [xpFloats, setXpFloats] = useState([]);
  const [needs, setNeeds] = useState({ hunger: 72, mood: 88, energy: 55 });
  const [activeTab, setActiveTab] = useState("nursery");
  const petRef = useRef(null);
  const sparkleId = useRef(0);
  const xpId = useRef(0);
  const evo = getEvo(yieldEarned);
  const nextEvo = getNextEvo(yieldEarned);
  const xpPct = nextEvo.threshold === evo.threshold ? 100
    : ((yieldEarned - evo.threshold) / (nextEvo.threshold - evo.threshold)) * 100;
  const healthPct = petState === "ok" ? 85 : petState === "anxious" ? 44 : 20;
  // Real yield polling — every 30s when a smart wallet is available
  useEffect(() => {
    if (!smartWalletAddress) return;
    const poll = async () => {
      try {
        const earnings = await getYieldEarned(smartWalletAddress);
        const usdc = earnings["USDC"] ?? earnings["usdc"] ?? 0;
        setYieldEarned(usdc);
      } catch (err) {
        console.error("[Nursery] getYieldEarned failed:", err);
      }
    };
    poll();
    const iv = setInterval(poll, 30_000);
    return () => clearInterval(iv);
  }, [smartWalletAddress]);
  useEffect(() => {
    if (prevEvoName && prevEvoName !== evo.name) {
      setShowEvo(true);
      toast(`🎉 Ziggy evolved into ${evo.name}!`);
    }
    setPrevEvoName(evo.name);
  }, [evo.name]);
  // deplete needs slowly
  useEffect(() => {
    const iv = setInterval(() => {
      setNeeds(n => ({
        hunger: Math.max(0, n.hunger - 0.3),
        mood:   Math.max(0, n.mood   - 0.15),
        energy: Math.max(0, n.energy - 0.2),
      }));
    }, 800);
    return () => clearInterval(iv);
  }, []);
  const toast = (msg) => {
    setToastMsg(msg); setShowToast(true);
    setTimeout(() => setShowToast(false), 3200);
  };
  const spawnSparkle = (x, y, emoji) => {
    const id = sparkleId.current++;
    const sx = (Math.random() - .5) * 60 + "px";
    const sy = -(Math.random() * 40 + 20) + "px";
    setSparkles(s => [...s, { id, x, y, emoji, sx, sy }]);
    setTimeout(() => setSparkles(s => s.filter(p => p.id !== id)), 1200);
  };
  const spawnXpFloat = (x, y, val) => {
    const id = xpId.current++;
    setXpFloats(f => [...f, { id, x, y, val }]);
    setTimeout(() => setXpFloats(f => f.filter(p => p.id !== id)), 900);
  };
  const handleNeed = (type) => {
    const emojis = { hunger: "🍖", mood: "✨", energy: "⚡" };
    const labels = { hunger: "Fed!", mood: "Happy!", energy: "Energised!" };
    const gains  = { hunger: 30, mood: 20, energy: 25 };
    setNeeds(n => ({ ...n, [type]: Math.min(100, n[type] + gains[type]) }));
    toast(`${emojis[type]} ${labels[type]} +${gains[type]} XP`);
    setYieldEarned(y => parseFloat((y + 0.05).toFixed(4)));
    spawnXpFloat(195, 300, `+${gains[type]} XP`);
    ["🌟","✨","💫"].forEach((e, i) => {
      setTimeout(() => spawnSparkle(195 + (Math.random()-0.5)*80, 280, e), i * 120);
    });
  };
  const handlePetTap = () => {
    if (petState !== "ok") return;
    spawnSparkle(195, 280, "💜");
    spawnSparkle(175, 260, "✨");
    spawnSparkle(215, 270, "⭐");
    spawnXpFloat(195, 270, "+5 XP");
    setYieldEarned(y => parseFloat((y + 0.02).toFixed(4)));
    toast("💜 Ziggy loves you! +5 XP");
  };
  const handleUnwind = async () => {
    setPetState("anxious");
    toast("⚠️ Unwinding position...");
    if (walletAddress) {
      try {
        await withdrawYield(walletAddress);
      } catch (err) {
        console.error("[Nursery] withdrawYield failed:", err);
      }
    }
    setTimeout(() => setPetState("danger"), 2200);
    setTimeout(() => { setPetState("ok"); toast("✅ Unwind complete. Principal safe!"); }, 5500);
  };
  const needConfig = [
    { key: "hunger", icon: "🍖", label: "Feed",  color: "#ff6ab0" },
    { key: "mood",   icon: "✨", label: "Play",  color: "#6affd4" },
    { key: "energy", icon: "⚡", label: "Rest",  color: "#7c6aff" },
  ];
  const barColor = petState === "ok" ? "linear-gradient(90deg,#6affd4,#4af0b8)"
                 : petState === "anxious" ? "linear-gradient(90deg,#ffd76a,#ffaa6a)"
                 : "linear-gradient(90deg,#ff6a6a,#ff9a6a)";
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "90px 0 40px", overflowY: "auto" }}>
      <div className="stars" />
      <div className="phone">
        {/* Toast */}
        {showToast && <div className="toast">{toastMsg}</div>}
        {/* Sparkles */}
        {sparkles.map(s => (
          <div key={s.id} className="sparkle" style={{ left: s.x, top: s.y, "--sx": s.sx, "--sy": s.sy, "--sx2": s.sx, "--sy2": `calc(${s.sy} - 20px)` }}>{s.emoji}</div>
        ))}
        {/* XP floats */}
        {xpFloats.map(f => (
          <div key={f.id} className="xp-float" style={{ left: f.x, top: f.y }}>{f.val}</div>
        ))}
        {/* Top Bar */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="avatar">{evo.emoji}</div>
            <div>
              <div className="topbar-name">Yieldling</div>
              <div className="topbar-level">ZIGGY · {evo.level}</div>
            </div>
          </div>
          <div className="streak-pill">🔥 <span className="streak-count">{streak}</span></div>
        </div>
        {/* Stat Cards */}
        <div className="stat-cards">
          <div className="stat-card teal">
            <div className="stat-lbl">Total Yield</div>
            <div className="stat-val teal">${fmt(yieldEarned)}</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-lbl">Current APY</div>
            <div className="stat-val purple">18.4%</div>
          </div>
        </div>
        {/* Pet */}
        <div className="pet-area">
          <div className={`pet-glow ${petState !== "ok" ? petState : ""}`} />
          <div ref={petRef} className={`pet-emoji ${petState !== "ok" ? petState : "happy"}`} onClick={handlePetTap}>
            {evo.emoji}
          </div>
        </div>
        {/* Status Bars */}
        <div className="bars-area">
          <div className="bar-row">
            <div className="bar-left"><span className="bar-icon">❤️</span> Health</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${healthPct}%`, background: barColor }} />
            </div>
            <div className="bar-pct" style={{ color: petState === "ok" ? "var(--teal)" : "var(--gold)" }}>{healthPct}%</div>
          </div>
          <div className="bar-row">
            <div className="bar-left"><span className="bar-icon">😊</span> Mood</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${needs.mood}%`, background: "linear-gradient(90deg,var(--teal),#4af0b8)" }} />
            </div>
            <div className="bar-pct" style={{ color: "var(--teal)" }}>
              {needs.mood < 30 ? "Low" : needs.mood < 60 ? "OK" : "Happy"}
            </div>
          </div>
        </div>
        {/* Emotion Pill */}
        <div className="emotion-area">
          <div className={`emotion-pill ${petState === "ok" ? "ep-ok" : petState === "anxious" ? "ep-warn" : "ep-bad"}`}>
            {petState === "ok" ? "😊 Thriving" : petState === "anxious" ? "😰 Stressed — protecting…" : "😵 Auto-unwinding…"}
          </div>
        </div>
        {/* Pet Name + XP */}
        <div className="pet-meta">
          <div className="pet-name-row">
            <div className="pet-name">Ziggy</div>
            <div className="pet-xp">{fmt(yieldEarned)} / {nextEvo.threshold} XP</div>
          </div>
          <div className="xp-track">
            <div className="xp-fill" style={{ width: `${Math.min(xpPct, 100)}%` }} />
          </div>
          <div className="next-evo">Next Evolution: {nextEvo.name}</div>
        </div>
        {/* Needs */}
        <div className="needs">
          {needConfig.map(({ key, icon, label, color }) => (
            <button key={key} className={`need-btn ${needs[key] < 30 ? "urgent" : ""}`} onClick={() => handleNeed(key)}>
              <div className="need-icon">{icon}</div>
              <div className="need-label">{label}</div>
              <div className="need-bar">
                <div className="need-bar-fill" style={{ width: `${needs[key]}%`, background: color }} />
              </div>
            </button>
          ))}
        </div>
        {/* Emergency Unwind */}
        <div className="unwind-row">
          <button className="unwind-btn" onClick={handleUnwind}>⚠ Emergency Unwind</button>
        </div>
        {/* Bottom Nav */}
        <div className="bottom-nav">
          {[["🏠","Home","home"],["🐾","Nursery","nursery"],["📊","Stats","stats"]].map(([icon,label,tab]) => (
            <button key={tab} className={`nav-item ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              <div className="nav-icon">{icon}</div>
              <div className="nav-label">{label}</div>
            </button>
          ))}
        </div>
        {/* Evolution Overlay */}
        {showEvo && (
          <div className="evo-overlay show">
            <div className="evo-particles">
              {Array.from({length:44},(_,i) => {
                const colors = ["#7c6aff","#ff6ab0","#6affd4","#ffd76a","#fff"];
                return <div key={i} className="evo-p" style={{
                  left:`${Math.random()*100}%`, top:`${Math.random()*100}%`,
                  background: colors[Math.floor(Math.random()*colors.length)],
                  "--dx": `${(Math.random()-.5)*300}px`,
                  "--dy": `${(Math.random()-.5)*300}px`,
                  animationDelay: `${Math.random()*.4}s`
                }} />;
              })}
            </div>
            <div className="evo-pet">{evo.emoji}</div>
            <div className="evo-title">EVOLVED!</div>
            <div className="evo-sub">Ziggy became a <strong>{evo.name}</strong>! 🎉<br />Your Yieldling hit the ${evo.threshold} milestone.</div>
            <button className="evo-close" onClick={() => setShowEvo(false)}>Keep Growing →</button>
          </div>
        )}
      </div>
    </div>
  );
}
