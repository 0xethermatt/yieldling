import { useState, useEffect, useRef, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import {
  depositToZyfai,
  ensureSessionKey,
  getYieldEarned,
  getDailyApyHistory,
  getStrategyApy,
  getConservativeOpportunities,
  getAggressiveOpportunities,
  getPositions,
  getPositionDetails,
  withdrawYield,
} from "./zyfai.js";
const PET_NAME_KEY = "yieldling_pet_name";
import stabby1 from "./assets/stabby-1.png";
import stabby2 from "./assets/stabby-2.png";
import stabby3 from "./assets/stabby-3.png";
import stabby4 from "./assets/stabby-4.png";
import volty1  from "./assets/volty-1.png";
import volty2  from "./assets/volty-2.png";
import volty3  from "./assets/volty-3.png";
import volty4  from "./assets/volty-4.png";

const CHAR_IMGS = {
  stabby: [stabby1, stabby2, stabby3, stabby4],
  volty:  [volty1,  volty2,  volty3,  volty4],
};
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
  display: flex; flex-direction: column; align-items: center;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 20px; padding: 6px 14px 5px;
  gap: 1px; cursor: default;
}
.streak-top { display: flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 800; }
.streak-count { font-family: var(--mono); color: var(--gold); }
.streak-lbl { font-size: 9px; font-weight: 800; color: var(--dim); text-transform: uppercase; letter-spacing: 1.5px; }
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
.stat-card.teal::before   { background: var(--teal); }
.stat-card.purple::before { background: var(--purple); }
.stat-card.dim::before    { background: rgba(238,240,248,.15); }
.stat-card.wide { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; }
.stat-lbl { font-size: 10px; font-weight: 800; color: var(--dim); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
.stat-card.wide .stat-lbl { margin-bottom: 0; }
.stat-val { font-family: var(--mono); font-size: 22px; font-weight: 700; }
.stat-val.teal   { color: var(--teal); }
.stat-val.purple { color: var(--purple); }
.stat-val.white  { color: var(--text); }
/* pet area */
.pet-area {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 8px 0; position: relative; min-height: 260px;
}
.pet-glow {
  position: absolute; width: 260px; height: 260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(124,106,255,.18) 0%, transparent 70%);
  pointer-events: none;
}
.pet-glow.warn { background: radial-gradient(circle, rgba(255,215,106,.2) 0%, transparent 70%); }
.pet-glow.danger { background: radial-gradient(circle, rgba(255,106,106,.2) 0%, transparent 70%); }
.pet-img {
  width: 180px; height: 180px; object-fit: contain;
  position: relative; z-index: 1;
  cursor: pointer; user-select: none; display: block;
  animation: petFloat 2.5s ease-in-out infinite;
  transition: filter .4s;
  filter: drop-shadow(0 0 20px rgba(124,106,255,.5));
}
.pet-img.happy   { filter: drop-shadow(0 0 28px rgba(106,255,212,.65)); }
.pet-img.anxious {
  animation: petShakeAnxious .45s ease-in-out infinite;
  filter: drop-shadow(0 0 28px rgba(255,215,106,.75));
}
.pet-img.danger  {
  animation: petShakeDanger .2s ease-in-out infinite;
  filter: drop-shadow(0 0 32px rgba(255,106,106,.85));
}
@keyframes petFloat {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-10px); }
}
@keyframes petShakeAnxious {
  0%,100% { transform: translateX(0) rotate(0deg); }
  25%     { transform: translateX(-8px) rotate(-3deg); }
  75%     { transform: translateX(8px) rotate(3deg); }
}
@keyframes petShakeDanger {
  0%,100% { transform: translateX(0) rotate(0deg); }
  25%     { transform: translateX(-11px) rotate(-5deg); }
  75%     { transform: translateX(11px) rotate(5deg); }
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
.need-icon { font-size: 26px; transition: opacity .2s; }
.need-label { font-size: 10px; font-weight: 800; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; }
.need-bar { width: 100%; height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-top: 2px; }
.need-bar-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }
/* loading / disabled states */
.need-btn:disabled { opacity: .45; cursor: not-allowed; transform: none !important; }
.need-btn.tapping  { border-color: var(--purple) !important; }
.need-btn.tapping .need-icon { opacity: 0; }
.need-spinner {
  position: absolute; top: 50%; left: 50%; margin-top: -22px; margin-left: -11px;
  width: 22px; height: 22px; border: 2.5px solid rgba(255,255,255,.15);
  border-top-color: var(--purple); border-radius: 50%;
  animation: spin .65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
/* low-need pulse reminder */
.need-btn.remind {
  animation: needRemind 1.2s ease-in-out 3;
}
@keyframes needRemind {
  0%,100% { box-shadow: 0 0 0 0 rgba(124,106,255,0); }
  50%      { box-shadow: 0 0 0 6px rgba(124,106,255,.3); border-color: var(--purple); }
}
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
/* under the hood */
.hood-row {
  flex-shrink: 0; border-top: 1px solid var(--border);
  margin: 0 16px 8px;
}
.hood-toggle {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  background: none; border: none; color: var(--dim); font-family: var(--font);
  font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;
  padding: 10px 0 8px; cursor: pointer; transition: color .2s;
}
.hood-toggle:hover { color: var(--text); }
.hood-chevron { transition: transform .3s; display: inline-block; }
.hood-chevron.open { transform: rotate(180deg); }
.hood-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px; padding-bottom: 10px;
}
.hood-cell {
  background: var(--surface2); border-radius: 10px;
  padding: 10px 12px;
}
.hood-cell-lbl { font-size: 9px; font-weight: 800; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.hood-cell-val { font-family: var(--mono); font-size: 13px; font-weight: 700; }
/* protocol rows */
.hood-section-lbl { font-size: 9px; font-weight: 800; color: var(--dim); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
.hood-protocol-row {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surface2); border-radius: 10px; padding: 10px 12px;
  margin-bottom: 6px;
}
.hood-protocol-name { font-size: 12px; font-weight: 800; }
.hood-protocol-token { font-size: 10px; color: var(--dim); font-weight: 700; margin-top: 2px; }
.hood-protocol-apy { font-family: var(--mono); font-size: 14px; font-weight: 700; color: var(--teal); }
.hood-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
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
/* ── INFO BUTTONS & TOOLTIP ── */
.info-btn {
  background: none; border: none; padding: 0 0 0 3px;
  font-size: 13px; color: var(--dim); opacity: .5;
  cursor: pointer; line-height: 1; flex-shrink: 0;
  transition: opacity .15s; user-select: none;
  font-family: sans-serif; vertical-align: middle;
}
.info-btn:hover { opacity: 1; }
/* inside need buttons — rendered as span */
.need-info {
  position: absolute; top: 6px; right: 7px;
  font-size: 12px; color: var(--dim); opacity: .45;
  cursor: pointer; line-height: 1; user-select: none;
  z-index: 2; transition: opacity .15s;
}
.need-info:hover { opacity: .9; }
/* tooltip overlay */
.tip-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  padding: 32px 24px;
  background: rgba(4,6,14,.55);
  backdrop-filter: blur(3px);
}
.tip-card {
  background: var(--surface2); border: 1px solid var(--teal);
  border-radius: 18px; padding: 18px 20px;
  max-width: 300px; width: 100%;
  box-shadow: 0 12px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(106,255,212,.08);
  animation: tipIn .18s cubic-bezier(.175,.885,.32,1.275);
}
@keyframes tipIn { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
.tip-text {
  font-size: 13px; font-weight: 600; color: var(--text);
  line-height: 1.7; white-space: pre-line;
}
.tip-dismiss {
  margin-top: 14px; display: block; width: 100%;
  background: rgba(106,255,212,.08); border: 1px solid rgba(106,255,212,.25);
  color: var(--teal); font-family: var(--font); font-size: 12px; font-weight: 800;
  padding: 8px; border-radius: 10px; cursor: pointer; transition: background .15s;
  text-align: center;
}
.tip-dismiss:hover { background: rgba(106,255,212,.15); }
`;
const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);
const STAGES = [
  { threshold: 0,  stage: 1, name: "Newborn",  level: "LV. 1" },
  { threshold: 1,  stage: 2, name: "Hatchling", level: "LV. 2" },
  { threshold: 10, stage: 3, name: "Elder",     level: "LV. 3" },
  { threshold: 50, stage: 4, name: "Legend",    level: "LV. 4" },
];
// ── Tooltip content ───────────────────────────────────────────────────────────
const TIP_EVO    = `Your Yieldling evolves as yield accumulates. Each stage unlocks a new form:\n\n🥚  $0 — Egg (just hatched)\n🐾  $1 — Hatchling\n🐲  $10 — Drake\n🐉  $50 — Legend\n\nKeep earning to evolve!`;
const TIP_XP     = "XP tracks your total yield earned. Hit each threshold to evolve your Yieldling into a more powerful form.";
const TIP_HEALTH = "Health is 100% when your Yieldling has an active deposit earning yield. Make a deposit to bring your Yieldling to life!";
const TIP_FEED   = "Tap to deposit $1 USDC into your ZyFAI yield account. More deposits = more yield = faster evolution.";
const TIP_PLAY   = "Tap to deposit $1 USDC and boost your Yieldling's mood. Happier Yieldlings earn bonus XP.";
const TIP_REST   = "Tap to deposit $1 USDC and restore energy. A rested Yieldling is a productive Yieldling.";

// ── Needs persistence & depletion ────────────────────────────────────────────
const NEEDS_KEY      = "yieldling_needs";
const LAST_VISIT_KEY = "yieldling_last_visit";
const MIN_BAR        = 10;   // bars never auto-deplete below 10%

// % lost per millisecond for each bar (full depletion durations below)
const DEPLETION_MS = {
  hunger: 100 / (24 * 3_600_000),   // full drain over 24 h
  mood:   100 / (48 * 3_600_000),   // full drain over 48 h (1.5× if away >12 h)
  energy: 100 / (36 * 3_600_000),   // full drain over 36 h
};

// Read saved bars and apply offline depletion for the time elapsed since last visit
function loadNeeds() {
  try {
    const saved     = JSON.parse(localStorage.getItem(NEEDS_KEY) ?? "null");
    const lastVisit = parseInt(localStorage.getItem(LAST_VISIT_KEY) ?? "0", 10);
    const clamp     = v => Math.max(MIN_BAR, Math.min(100, v ?? 90));
    const base      = saved
      ? { hunger: clamp(saved.hunger), mood: clamp(saved.mood), energy: clamp(saved.energy) }
      : { hunger: 90, mood: 90, energy: 90 };

    if (lastVisit > 0) {
      const elapsedMs       = Math.max(0, Date.now() - lastVisit);
      const hoursSinceVisit = elapsedMs / 3_600_000;
      const moodMult        = hoursSinceVisit > 12 ? 1.5 : 1; // missed you 🥺

      return {
        hunger: Math.max(MIN_BAR, base.hunger - DEPLETION_MS.hunger * elapsedMs),
        mood:   Math.max(MIN_BAR, base.mood   - DEPLETION_MS.mood   * elapsedMs * moodMult),
        energy: Math.max(MIN_BAR, base.energy - DEPLETION_MS.energy * elapsedMs),
      };
    }
    return base;
  } catch {
    return { hunger: 90, mood: 90, energy: 90 };
  }
}

// Per-character micro-transaction amounts
const TAP_CFG = {
  stabby: { amount: 1,      asset: "USDC", floatLabel: "+$1",         toastLabel: "+$1 deposited"       },
  volty:  { amount: 0.0005, asset: "WETH", floatLabel: "+0.0005 ETH", toastLabel: "+0.0005 ETH deposited" },
};

function getStage(y) {
  let s = STAGES[0];
  for (const st of STAGES) { if (y >= st.threshold) s = st; }
  return s;
}
function getNextStage(y) {
  return STAGES.find(s => s.threshold > y) || STAGES[STAGES.length - 1];
}
function fmt(n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
export default function Nursery({ walletAddress, smartWalletAddress, character = "stabby" }) {
  const { wallets } = useWallets();
  // Returns the EIP-1193 provider for the active wallet (Privy or injected)
  const getProvider = useCallback(async () => {
    const w = wallets?.[0];
    return (await w?.getEthereumProvider?.()) ?? window.ethereum;
  }, [wallets]);

  const defaultName = character.charAt(0).toUpperCase() + character.slice(1);
  const petName     = localStorage.getItem(PET_NAME_KEY)?.trim() || "";
  const charName    = petName || defaultName;
  const [yieldEarned, setYieldEarned] = useState(0);
  const [deposited,      setDeposited]      = useState(0);
  const [depositLoaded,  setDepositLoaded]  = useState(false);
  const [petState, setPetState] = useState("ok");
  const [showEvo, setShowEvo] = useState(false);
  const [prevStageName, setPrevStageName] = useState(null);
  const daysAlive = (() => {
    const ts = parseInt(localStorage.getItem("yieldling_adopted_at") ?? "0", 10);
    if (!ts) return 1;
    return Math.max(1, Math.floor((Date.now() - ts) / 86_400_000));
  })();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [sparkles, setSparkles] = useState([]);
  const [xpFloats, setXpFloats] = useState([]);
  const [needs, setNeeds] = useState(() => loadNeeds());
  const [activeTab, setActiveTab] = useState("nursery");
  const [hoodOpen, setHoodOpen] = useState(false);
  const [currentApy,  setCurrentApy]  = useState(null);
  const [apyLabel,    setApyLabel]    = useState("Current APY");
  const [opportunities,   setOpportunities]   = useState([]);   // fallback: public opps
  const [positions,       setPositions]       = useState([]);   // real wallet positions
  const [positionsLoaded, setPositionsLoaded] = useState(false);
  const [tapping, setTapping] = useState(null);      // "hunger"|"mood"|"energy"|null
  const [reminding, setReminding] = useState({});    // keys currently pulsing
  const [tooltip, setTooltip] = useState(null);      // active tooltip text or null
  const petRef = useRef(null);
  const sparkleId = useRef(0);
  const xpId = useRef(0);
  const sessionKeyReady = useRef(false);
  const stage     = getStage(yieldEarned);
  const nextStage = getNextStage(yieldEarned);
  const xpPct     = nextStage.threshold === stage.threshold ? 100
    : ((yieldEarned - stage.threshold) / (nextStage.threshold - stage.threshold)) * 100;
  const charImg    = CHAR_IMGS[character]?.[stage.stage - 1] ?? CHAR_IMGS.stabby[0];
  const accentRgb      = character === "volty" ? "255,106,176" : "106,255,212";
  const accentHex      = character === "volty" ? "#ff6ab0" : "#6affd4";
  const hasActiveDeposit = depositLoaded && deposited > 0;
  const healthPct = petState === "anxious" ? 44
                  : petState === "danger"  ? 20
                  : hasActiveDeposit       ? 100
                  : depositLoaded          ? 0     // loaded but no deposit
                  : 85;                            // still loading — show neutral
  // Persist needs to localStorage whenever they change; update lastVisit timestamp
  useEffect(() => {
    localStorage.setItem(NEEDS_KEY, JSON.stringify(needs));
    localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
  }, [needs]);

  // Fetch actual wallet positions from getPositionDetails; poll every 60s.
  // Falls back to public opportunities (character-specific) if no positions returned.
  useEffect(() => {
    const fn = character === "volty" ? getAggressiveOpportunities : getConservativeOpportunities;

    const fetchRoutes = async () => {
      // ── Primary: real positions for this wallet ───────────────────────────
      if (walletAddress) {
        try {
          const details = await getPositionDetails(walletAddress, 8453);
          if (details.length > 0) {
            setPositions(details);
            setPositionsLoaded(true);
            return; // have real data — no need for fallback
          }
        } catch (err) {
          console.warn("[Nursery] getPositionDetails failed, falling back:", err);
        }
      }
      // ── Fallback: public top opportunities for this character ─────────────
      try {
        const opps = await fn(8453);
        if (opps.length) setOpportunities(opps);
      } catch (err) {
        console.error("[Nursery] fetchOpps fallback failed:", err);
      }
      setPositionsLoaded(true);
    };

    fetchRoutes();
    const iv = setInterval(fetchRoutes, 60_000);
    return () => clearInterval(iv);
  }, [character, walletAddress]);

  // Fetch current APY — poll every 60s
  // Primary: getDailyApyHistory(smartWalletAddress, "7D") → label "Current APY"
  // Fallback: getStrategyApy(strategy, asset)             → label "Est. APY"
  useEffect(() => {
    const strategy = character === "volty" ? "aggressive" : "conservative";
    const asset    = character === "volty" ? "WETH"       : "USDC";

    const fetchApy = async () => {
      // ── Primary: smart wallet's own 7-day APY history ────────────────────
      if (smartWalletAddress) {
        try {
          const result = await getDailyApyHistory(smartWalletAddress, "7D");
          if (result !== null) {
            const n = parseFloat(result);
            if (isFinite(n) && n > 0) {
              setCurrentApy(n);
              setApyLabel("Current APY");
              return; // success — no need for fallback
            }
          }
        } catch (err) {
          console.warn("[Nursery] getDailyApyHistory failed, falling back:", err);
        }
      }
      // ── Fallback: public strategy APY (no wallet needed) ─────────────────
      try {
        const apy = await getStrategyApy(strategy, asset);
        if (apy !== null) {
          setCurrentApy(apy);
          setApyLabel("Est. APY");
        }
      } catch (err) {
        console.error("[Nursery] getStrategyApy fallback failed:", err);
      }
    };

    fetchApy();
    const iv = setInterval(fetchApy, 60_000);
    return () => clearInterval(iv);
  }, [character, smartWalletAddress]);

  // Fetch deposited principal — drives health bar; poll every 60s
  useEffect(() => {
    if (!walletAddress) return;
    const fetchDeposited = async () => {
      try {
        const val = await getPositions(walletAddress, 8453);
        if (typeof val === "number" && isFinite(val) && val >= 0) setDeposited(val);
      } catch (err) {
        console.error("[Nursery] getPositions failed:", err);
      } finally {
        setDepositLoaded(true); // mark first fetch done regardless of result
      }
    };
    fetchDeposited();
    const iv = setInterval(fetchDeposited, 60_000);
    return () => clearInterval(iv);
  }, [walletAddress]);

  // Fetch earned yield — poll every 30s when smart wallet is available
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
    if (prevStageName && prevStageName !== stage.name) {
      setShowEvo(true);
      toast(`🎉 ${charName} evolved into ${stage.name}!`);
    }
    setPrevStageName(stage.name);
  }, [stage.name]);
  // Deplete needs every 30s using per-bar depletion rates (respects MIN_BAR floor)
  useEffect(() => {
    const TICK_MS = 30_000;
    const iv = setInterval(() => {
      setNeeds(n => ({
        hunger: Math.max(MIN_BAR, n.hunger - DEPLETION_MS.hunger * TICK_MS),
        mood:   Math.max(MIN_BAR, n.mood   - DEPLETION_MS.mood   * TICK_MS),
        energy: Math.max(MIN_BAR, n.energy - DEPLETION_MS.energy * TICK_MS),
      }));
    }, TICK_MS);
    return () => clearInterval(iv);
  }, []);
  // Pulse reminder every 30s on buttons whose need bar is below 40
  useEffect(() => {
    const iv = setInterval(() => {
      setNeeds(current => {
        const low = {};
        ["hunger","mood","energy"].forEach(k => { if (current[k] <= 20) low[k] = true; });
        if (Object.keys(low).length) {
          setReminding(low);
          setTimeout(() => setReminding({}), 3800); // 3 pulses × ~1.2s
        }
        return current; // no change to needs
      });
    }, 30_000);
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
  const handleNeed = async (type) => {
    if (tapping !== null) return; // block double-tap
    const cfg      = TAP_CFG[character] ?? TAP_CFG.stabby;
    const emojis   = { hunger: "🍖", mood: "✨", energy: "⚡" };
    const toastKey = { hunger: "Fed!", mood: "Played!", energy: "Rested!" };
    const needGain = { hunger: 50, mood: 50, energy: 50 };

    setTapping(type);
    try {
      // Ensure session key exists before first tap this session
      if (walletAddress && !sessionKeyReady.current) {
        const provider = await getProvider();
        await ensureSessionKey(walletAddress, provider);
        sessionKeyReady.current = true;
      }

      // On-chain deposit
      if (walletAddress) {
        const provider = await getProvider();
        await depositToZyfai(cfg.amount, walletAddress, cfg.asset, provider);
      }

      // Refresh yield counter from chain
      if (smartWalletAddress) {
        try {
          const earnings = await getYieldEarned(smartWalletAddress);
          const val = earnings[cfg.asset] ?? earnings[cfg.asset.toLowerCase()] ?? 0;
          setYieldEarned(val);
        } catch (e) {
          console.error("[Nursery] yield refresh failed:", e);
        }
      }

      // Success — update needs bar, toast, floating label, sparkles
      setNeeds(n => ({ ...n, [type]: Math.min(100, n[type] + needGain[type]) }));
      toast(`${emojis[type]} ${toastKey[type]} ${cfg.toastLabel}`);
      spawnXpFloat(195, 300, cfg.floatLabel);
      ["🌟","✨","💫"].forEach((e, i) =>
        setTimeout(() => spawnSparkle(195 + (Math.random()-0.5)*80, 280, e), i * 120)
      );
    } catch (err) {
      console.error("[Nursery] tap failed:", err);
      toast("❌ Transaction failed — try again");
    } finally {
      setTapping(null);
    }
  };
  const handlePetTap = () => {
    if (petState !== "ok") return;
    spawnSparkle(195, 280, "💜");
    spawnSparkle(175, 260, "✨");
    spawnSparkle(215, 270, "⭐");
    spawnXpFloat(195, 270, "+5 XP");
    setYieldEarned(y => parseFloat((y + 0.02).toFixed(4)));
    toast(`💜 ${charName} loves you! +5 XP`);
  };
  const handleUnwind = async () => {
    setPetState("anxious");
    toast("⚠️ Unwinding position...");
    if (walletAddress) {
      try {
        const provider = await getProvider();
        await withdrawYield(walletAddress, undefined, provider);
      } catch (err) {
        console.error("[Nursery] withdrawYield failed:", err);
      }
    }
    setTimeout(() => setPetState("danger"), 2200);
    setTimeout(() => { setPetState("ok"); toast("✅ Unwind complete. Principal safe!"); }, 5500);
  };
  const needConfig = [
    { key: "hunger", icon: "🍖", label: "Feed",  color: "#ff6ab0", tip: TIP_FEED },
    { key: "mood",   icon: "✨", label: "Play",  color: "#6affd4", tip: TIP_PLAY },
    { key: "energy", icon: "⚡", label: "Rest",  color: "#7c6aff", tip: TIP_REST },
  ];
  const barColor = petState === "anxious"                  ? "linear-gradient(90deg,#ffd76a,#ffaa6a)"
                 : petState === "danger"                   ? "linear-gradient(90deg,#ff6a6a,#ff9a6a)"
                 : hasActiveDeposit                        ? "linear-gradient(90deg,#6affd4,#4af0b8)"
                 : "rgba(90,96,128,.35)";         // no active deposit → grey
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "90px 0 40px", overflowY: "auto" }}>
      <div className="stars" />
      <div className="phone">
        {/* Tooltip overlay — tap backdrop or Dismiss to close */}
        {tooltip && (
          <div className="tip-overlay" onClick={() => setTooltip(null)}>
            <div className="tip-card" onClick={e => e.stopPropagation()}>
              <div className="tip-text">{tooltip}</div>
              <button className="tip-dismiss" onClick={() => setTooltip(null)}>Got it</button>
            </div>
          </div>
        )}
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
            <div className="avatar" style={{ borderColor: accentHex, boxShadow: `0 0 12px rgba(${accentRgb},.35)` }}>
              <img src={charImg} alt={charName} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
            <div>
              <div className="topbar-name" style={{ color: accentHex }}>{charName}</div>
              <div className="topbar-level">{defaultName.toUpperCase()} · {stage.level}</div>
            </div>
          </div>
          <div className="streak-pill">
            <div className="streak-top">🔥 <span className="streak-count">{daysAlive}</span></div>
            <div className="streak-lbl">Days alive</div>
          </div>
        </div>
        {/* Stat Cards */}
        <div className="stat-cards">
          <div className="stat-card teal">
            <div className="stat-lbl">Total Yield</div>
            <div className="stat-val teal">${fmt(yieldEarned)}</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-lbl">{apyLabel}</div>
            <div className="stat-val purple">
              {currentApy !== null ? `${parseFloat(currentApy).toFixed(1)}%` : "—"}
            </div>
          </div>
          <div className="stat-card dim wide">
            <div className="stat-lbl">Deposited</div>
            <div className="stat-val white">${fmt(deposited)}</div>
          </div>
        </div>
        {/* Pet */}
        <div className="pet-area">
          <div
            className={`pet-glow ${petState !== "ok" ? petState : ""}`}
            style={petState === "ok" ? { background: `radial-gradient(circle, rgba(${accentRgb},.2) 0%, transparent 70%)` } : {}}
          />
          <img
            ref={petRef}
            className={`pet-img ${petState !== "ok" ? petState : ""}`}
            src={charImg}
            alt={charName}
            onClick={handlePetTap}
            style={petState === "ok" ? {
              filter: `drop-shadow(0 0 32px rgba(${accentRgb},.7))`,
              animation: "petFloat 2.5s ease-in-out infinite"
            } : {}}
          />
        </div>
        {/* Status Bars */}
        <div className="bars-area">
          <div className="bar-row">
            <div className="bar-left">
              <span className="bar-icon">❤️</span> Health
              <button className="info-btn" onClick={() => setTooltip(TIP_HEALTH)}>ⓘ</button>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${healthPct}%`, background: barColor }} />
            </div>
            <div className="bar-pct" style={{ color:
                petState === "anxious" ? "var(--gold)"
              : petState === "danger"  ? "#ff6a6a"
              : hasActiveDeposit       ? "var(--teal)"
              : depositLoaded          ? "var(--dim)"
              : "var(--teal)"
            }}>{healthPct}%</div>
          </div>
          <div className="bar-row">
            <div className="bar-left"><span className="bar-icon">😊</span> Mood</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${needs.mood}%`, background: "linear-gradient(90deg,var(--teal),#4af0b8)" }} />
            </div>
            <div className="bar-pct" style={{ color: "var(--teal)" }}>
              {needs.mood <= 20 ? "Low" : needs.mood < 60 ? "OK" : "Happy"}
            </div>
          </div>
        </div>
        {/* Emotion Pill */}
        <div className="emotion-area">
          <div className={`emotion-pill ${
            petState === "anxious"                    ? "ep-warn"
          : petState === "danger"                     ? "ep-bad"
          : hasActiveDeposit                          ? "ep-ok"
          : depositLoaded                             ? "ep-warn"
          : "ep-ok"
          }`}>
            {petState === "anxious"  ? "😰 ZyFAI rebalancing…"
           : petState === "danger"   ? "😵 Withdrawing funds…"
           : hasActiveDeposit        ? "😊 Thriving"
           : depositLoaded           ? "😴 Dormant — make a deposit to wake me up!"
           : "😊 Thriving"}
          </div>
        </div>
        {/* Pet Name + XP */}
        <div className="pet-meta">
          <div className="pet-name-row">
            <div className="pet-name">{charName}</div>
            <div className="pet-xp" style={{ display:"flex", alignItems:"center" }}>
              {fmt(yieldEarned)} / {nextStage.threshold} XP
              <button className="info-btn" onClick={() => setTooltip(TIP_XP)}>ⓘ</button>
            </div>
          </div>
          <div className="xp-track">
            <div className="xp-fill" style={{ width: `${Math.min(xpPct, 100)}%`, background: `linear-gradient(90deg, var(--purple), ${accentHex})` }} />
          </div>
          <div className="next-evo" style={{ color: accentHex, display:"flex", alignItems:"center", justifyContent:"center", gap:"5px" }}>
            Next Evolution: {nextStage.name}
            <button className="info-btn" style={{ color: accentHex, opacity:.45 }} onClick={() => setTooltip(TIP_EVO)}>ⓘ</button>
          </div>
        </div>
        {/* Needs */}
        <div className="needs">
          {needConfig.map(({ key, icon, label, color, tip }) => {
            const isThisTapping = tapping === key;
            const isDisabled    = tapping !== null;
            const isUrgent      = needs[key] <= 20 && !isDisabled;
            const isReminding   = reminding[key] && !isDisabled;
            return (
              <button
                key={key}
                className={[
                  "need-btn",
                  isUrgent      ? "urgent"  : "",
                  isThisTapping ? "tapping" : "",
                  isReminding   ? "remind"  : "",
                ].filter(Boolean).join(" ")}
                disabled={isDisabled}
                onClick={() => handleNeed(key)}
                style={{ position: "relative" }}
              >
                {/* ⓘ — span not button to avoid invalid nesting */}
                <span
                  className="need-info"
                  role="button"
                  tabIndex={0}
                  onClick={e => { e.stopPropagation(); setTooltip(tip); }}
                  onKeyDown={e => e.key === "Enter" && (e.stopPropagation(), setTooltip(tip))}
                >ⓘ</span>
                {isThisTapping && <span className="need-spinner" />}
                <div className="need-icon">{icon}</div>
                <div className="need-label">{label}</div>
                <div className="need-bar">
                  <div className="need-bar-fill" style={{ width: `${needs[key]}%`, background: color }} />
                </div>
              </button>
            );
          })}
        </div>
        {/* Emergency Unwind */}
        <div className="unwind-row">
          <button className="unwind-btn" onClick={handleUnwind}>⚠ Emergency Withdraw</button>
        </div>
        {/* Under the Hood */}
        <div className="hood-row">
          <button className="hood-toggle" onClick={() => setHoodOpen(o => !o)}>
            <span>🔧 Under the Hood</span>
            <span className={`hood-chevron ${hoodOpen ? "open" : ""}`}>▼</span>
          </button>
          {hoodOpen && (() => {
            // Decide which data set and label to show
            const hasRealPositions = positions.length > 0;
            const routeLabel = hasRealPositions ? "Top Active Routes" : "Suggested Routes";
            const routeRows  = hasRealPositions ? positions : opportunities;
            const showEmpty  = positionsLoaded && !hasRealPositions && routeRows.length === 0;
            return (
            <div>
              <div className="hood-section-lbl">{routeLabel}</div>
              {showEmpty ? (
                <div className="hood-protocol-row">
                  <div className="hood-protocol-name" style={{ color: "var(--dim)", fontSize: 12 }}>
                    No active positions yet — make a deposit to get started
                  </div>
                </div>
              ) : routeRows.map((row, i) => (
                <div className="hood-protocol-row" key={i}>
                  <div>
                    <div className="hood-protocol-name">
                      {row.protocol}{row.token ? ` · ${row.token}` : ""}
                    </div>
                  </div>
                  <div className="hood-protocol-apy">{row.apy === "—" ? "—" : `${row.apy}%`}</div>
                </div>
              ))}
              <div className="hood-meta">
                <div className="hood-cell">
                  <div className="hood-cell-lbl">Auto-Compound</div>
                  <div className="hood-cell-val" style={{ color: "var(--teal)" }}>On ✓</div>
                </div>
                <div className="hood-cell">
                  <div className="hood-cell-lbl">Network</div>
                  <div className="hood-cell-val" style={{ color: "var(--purple)" }}>Base</div>
                </div>
              </div>
            </div>
            );
          })()}
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
            <img className="evo-pet" src={charImg} alt={charName}
              style={{ width: 120, height: 120, objectFit: "contain" }} />
            <div className="evo-title">EVOLVED!</div>
            <div className="evo-sub">{charName} became a <strong>{stage.name}</strong>! 🎉<br />Your Yieldling hit the ${stage.threshold} yield milestone.</div>
            <button className="evo-close" onClick={() => setShowEvo(false)}>Keep Growing →</button>
          </div>
        )}
      </div>
    </div>
  );
}
