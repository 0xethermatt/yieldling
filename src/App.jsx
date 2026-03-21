import { useState, useEffect } from "react";
import NurseryScreen from "./Nursery.jsx";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { depositToZyfai, checkWalletBalance, getTvl, getAvgApy, getStrategyApy } from "./zyfai.js";
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
const EVO_LABELS = ["$0", "$1", "$10", "$50"];
// ── Fonts injected globally ──────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&family=Anybody:ital,wght@0,900;1,900&display=swap";
document.head.appendChild(fontLink);
// ── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html {
    overflow-x: hidden; max-width: 100vw; width: 100%;
  }
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
  body { background: var(--bg); color: var(--text); font-family: var(--font); overflow-x: hidden; max-width: 100vw; width: 100%; }
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
    transition: all .2s;
  }
  .nav-wallet:hover { opacity: .88; transform: translateY(-1px); }
  .nav-wallet.addr {
    background: rgba(124,106,255,.15); border: 1px solid rgba(124,106,255,.35);
    color: var(--accent);
  }
  /* hamburger */
  .nav-hamburger {
    display: none; background: none; border: none; color: var(--text);
    font-size: 22px; cursor: pointer; padding: 4px 6px; line-height: 1;
  }
  .nav-dropdown {
    position: absolute; top: 100%; left: 0; right: 0;
    background: rgba(8,8,16,0.97); backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    display: flex; flex-direction: column; padding: 8px 0;
  }
  .nav-dropdown-item {
    background: none; border: none; color: var(--text);
    font-family: var(--font); font-size: 15px; font-weight: 700;
    padding: 14px 24px; text-align: left; cursor: pointer;
    transition: background .15s;
  }
  .nav-dropdown-item:hover { background: rgba(124,106,255,.1); }
  .nav-dropdown-item.active { color: var(--accent); }
  /* connect gate */
  .gate-wrap {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; padding: 100px 24px 60px; text-align: center;
    position: relative; z-index: 1;
  }
  .gate-icon { font-size: 72px; margin-bottom: 24px; animation: float 3s ease-in-out infinite; }
  .gate-h2 {
    font-size: 28px; font-weight: 900; margin-bottom: 10px;
    font-family: 'Anybody', var(--font); font-style: italic;
  }
  .gate-sub { color: var(--dim); font-size: 15px; font-weight: 600; max-width: 320px; line-height: 1.6; margin-bottom: 32px; }
  .gate-btn {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none; color: #fff; font-family: var(--font);
    font-size: 16px; font-weight: 900; padding: 16px 40px;
    border-radius: 50px; cursor: pointer;
    box-shadow: 0 8px 32px rgba(124,106,255,.4); transition: all .3s;
  }
  .gate-btn:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(124,106,255,.5); }
  /* ── SCREENS ── */
  .screen { min-height: 100vh; padding-top: 70px; position: relative; overflow-x: hidden; max-width: 100vw; }
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
    overflow-x: hidden; max-width: 100%;
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
    display: flex; gap: clamp(32px, 8vw, 96px); margin-top: 64px;
    flex-wrap: wrap; justify-content: center; position: relative; z-index: 1;
  }
  .hero-stat .val {
    font-size: 28px; font-weight: 900;
    background: linear-gradient(135deg, var(--accent3), var(--accent));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    transition: opacity .3s;
  }
  .hero-stat .val.loading {
    opacity: .35;
  }
  .hero-stat .lbl {
    font-size: 11px; color: var(--dim); font-weight: 700;
    text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;
  }
  /* ── MOBILE ── */
  @media (max-width: 430px) {
    .nav { padding: 12px 16px; }
    .nav-tabs { display: none; }
    .nav-hamburger { display: block; }
    .nav-wallet { padding: 8px 14px; font-size: 12px; }
    .hero-tag { font-size: 10px; letter-spacing: 1.5px; padding: 5px 12px; margin-bottom: 28px; }
    .hero-egg { margin-bottom: 32px; }
    .hero-h1 { font-size: clamp(36px,9vw,70px); margin-bottom: 24px; }
    .hero-sub { font-size: 15px; margin-bottom: 40px; }
    .hero-cta { min-height: 56px; font-size: 16px; padding: 0 36px; }
    .hero-stats { gap: 36px; margin-top: 52px; }
    .hero-stat .val { font-size: 30px; }
    .hero-stat .lbl { font-size: 12px; margin-top: 6px; }
  }
  /* ── ADOPT ── */
  .adopt-wrap {
    display: flex; align-items: center; justify-content: center;
    padding: 100px 24px 60px; min-height: 100vh;
    overflow-x: hidden; max-width: 100%;
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
  .amount-input::placeholder { color: var(--dim); font-weight: 600; }
  .amount-hint {
    font-size: 12px; font-weight: 700; margin-top: 7px;
    min-height: 18px; transition: opacity .2s;
  }
  .amount-hint.err  { color: var(--danger); }
  .amount-hint.info { color: var(--dim); }
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
  /* ── DETAILS PANEL ── */
  .details-panel {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 16px; margin-bottom: 22px; overflow: hidden;
    animation: detailsIn .2s ease-out;
  }
  @keyframes detailsIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .details-title {
    font-size: 10px; font-weight: 800; color: var(--dim);
    text-transform: uppercase; letter-spacing: 2px;
    padding: 13px 16px 11px;
  }
  .details-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 16px; border-top: 1px solid var(--border);
    gap: 12px;
  }
  .details-lbl {
    font-size: 13px; font-weight: 600; color: var(--dim);
    flex-shrink: 0;
  }
  .details-val {
    display: flex; align-items: center; gap: 5px;
    font-size: 13px; font-weight: 800; color: var(--text);
    font-family: var(--mono); text-align: right;
  }
  .details-info {
    font-size: 12px; color: var(--dim); opacity: .45;
    cursor: default; user-select: none; flex-shrink: 0;
  }
  .c-green { color: var(--safe); }
  .c-purple { color: var(--accent); }
  .c-yellow { color: var(--warn); }
  .c-pink { color: var(--accent2); }
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
  /* ── APY BADGE & SKELETON ── */
  .char-apy-badge {
    display: inline-block; font-size: 13px; font-weight: 900;
    padding: 5px 14px; border-radius: 20px; margin-bottom: 10px;
    font-family: var(--mono); letter-spacing: 0.3px;
  }
  .char-apy-badge.teal {
    background: rgba(106,255,212,.12); border: 1px solid rgba(106,255,212,.35);
    color: var(--accent3);
  }
  .char-apy-badge.pink {
    background: rgba(255,106,176,.12); border: 1px solid rgba(255,106,176,.35);
    color: var(--accent2);
  }
  .apy-skeleton {
    display: inline-block; width: 62px; height: 13px; border-radius: 6px;
    background: linear-gradient(90deg, var(--border) 25%, var(--surface2) 50%, var(--border) 75%);
    background-size: 200% 100%; vertical-align: middle;
    animation: shimmer 1.4s ease-in-out infinite;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  /* ── CHARACTER SELECT ── */
  .char-select-wrap {
    display: flex; align-items: center; justify-content: center;
    padding: 100px 16px 60px; min-height: 100vh;
    overflow-x: hidden; max-width: 100%;
  }
  .char-select-inner {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 24px; padding: 32px 24px; width: 100%; max-width: min(540px, 100%);
    position: relative; z-index: 1; overflow: hidden;
  }
  .char-select-inner h2 { font-size: 26px; font-weight: 900; margin-bottom: 6px; }
  .char-select-inner > p { color: var(--dim); font-size: 14px; font-weight: 600; margin-bottom: 28px; }
  .char-grid {
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px; margin-bottom: 26px; align-items: stretch; overflow: hidden;
  }
  .char-card {
    background: var(--bg); border: 2px solid var(--border);
    border-radius: 20px; padding: 20px 10px 18px; text-align: center;
    cursor: pointer; transition: all .25s; position: relative;
    display: flex; flex-direction: column; align-items: center;
    width: 100%; height: 100%; overflow: hidden; box-sizing: border-box;
  }
  .char-card:hover { transform: translateY(-3px); }
  .char-card.sel-teal {
    border-color: var(--accent3);
    box-shadow: 0 0 30px rgba(106,255,212,.22), inset 0 0 30px rgba(106,255,212,.06);
    background: rgba(106,255,212,.04);
  }
  .char-card.sel-pink {
    border-color: var(--accent2);
    box-shadow: 0 0 30px rgba(255,106,176,.22), inset 0 0 30px rgba(255,106,176,.06);
    background: rgba(255,106,176,.04);
  }
  .char-card.adopted { cursor: default; }
  .char-card.adopted:hover { transform: none; }
  .char-adopted-overlay {
    position: absolute; inset: 0;
    background: rgba(8,8,16,.8);
    border-radius: 18px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; z-index: 10; padding: 16px;
  }
  .char-adopted-tag {
    font-size: 11px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 1.5px; padding: 5px 14px; border-radius: 20px;
    background: rgba(106,255,212,.15); border: 1px solid rgba(106,255,212,.35);
    color: var(--accent3);
  }
  .char-view-nursery-btn {
    font-size: 12px; font-weight: 800; padding: 8px 18px;
    border-radius: 20px; border: none; cursor: pointer;
    background: linear-gradient(135deg, var(--accent3), var(--accent));
    color: #fff; transition: opacity .2s; white-space: nowrap;
  }
  .char-view-nursery-btn:hover { opacity: .85; }
  .char-preview {
    width: 120px; height: 120px; object-fit: contain;
    margin: 0 auto 14px; display: block;
    filter: drop-shadow(0 4px 18px rgba(0,0,0,.45));
    animation: charFloat 2.5s ease-in-out infinite;
  }
  @keyframes charFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  .char-name {
    font-size: 20px; font-weight: 900; margin-bottom: 8px;
    font-family: 'Anybody', var(--font); font-style: italic;
  }
  .char-name.teal { color: var(--accent3); }
  .char-name.pink { color: var(--accent2); }
  .char-badge {
    display: inline-block; font-size: 10px; font-weight: 900;
    padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .char-badge.teal { background: rgba(106,255,212,.12); border: 1px solid rgba(106,255,212,.3); color: var(--accent3); }
  .char-badge.pink { background: rgba(255,106,176,.12); border: 1px solid rgba(255,106,176,.3); color: var(--accent2); }
  .char-desc { font-size: 11px; color: var(--dim); font-weight: 600; line-height: 1.5; margin-bottom: 0; }
  /* evolution strip inside char card */
  .char-evo-strip {
    border-top: 1px solid var(--border);
    padding-top: 14px; padding-bottom: 2px;
    margin-top: auto; /* flex: push strip to bottom so both cards are equal height */
    width: 100%;
  }
  .char-evo-row {
    display: flex; align-items: center; justify-content: center; gap: 1px;
    margin-bottom: 5px;
  }
  .char-evo-img {
    width: 36px; height: 36px; object-fit: contain;
    border-radius: 7px;
    background: rgba(255,255,255,.04);
    border: 1px solid var(--border);
    padding: 2px; flex-shrink: 0;
  }
  .char-evo-arrow {
    font-size: 8px; color: var(--dim); flex-shrink: 0; padding: 0;
  }
  .char-evo-labels {
    display: flex; align-items: center; justify-content: center; gap: 1px;
  }
  .char-evo-label {
    width: 36px; text-align: center;
    font-family: var(--mono); font-size: 8px; font-weight: 700; color: var(--dim);
    flex-shrink: 0;
  }
  .char-evo-label-sep {
    width: 8px; text-align: center;
    font-size: 8px; color: transparent;
    user-select: none; flex-shrink: 0;
  }
  .char-amount { margin-bottom: 22px; }
  /* ── PET NAME INPUT ── */
  .name-wrap { margin-bottom: 22px; }
  .name-input {
    width: 100%; background: var(--bg); border: 1px solid var(--border);
    border-radius: 14px; padding: 13px 18px;
    font-family: var(--font); font-size: 18px; font-weight: 700;
    color: var(--text); outline: none; transition: border-color .2s;
  }
  .name-input:focus { border-color: var(--accent); }
  .name-input::placeholder { color: var(--dim); font-weight: 600; }
  .name-hint { font-size: 11px; color: var(--dim); font-weight: 600; margin-top: 6px; }
  .name-hint span { color: var(--accent); font-weight: 800; }
  .char-adopt-btn {
    width: 100%; border: none; color: #fff; font-family: var(--font);
    font-size: 17px; font-weight: 900; padding: 17px;
    border-radius: 14px; cursor: pointer; transition: all .3s;
  }
  .char-adopt-btn.teal {
    background: linear-gradient(135deg, var(--accent3), var(--accent));
    box-shadow: 0 4px 24px rgba(106,255,212,.25);
  }
  .char-adopt-btn.teal:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(106,255,212,.4); }
  .char-adopt-btn.pink {
    background: linear-gradient(135deg, var(--accent2), var(--accent));
    box-shadow: 0 4px 24px rgba(255,106,176,.25);
  }
  .char-adopt-btn.pink:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(255,106,176,.4); }
  /* ── ASSET SELECTOR ── */
  .asset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 22px; }
  .asset-card {
    background: var(--bg); border: 2px solid var(--border);
    border-radius: 14px; padding: 13px 12px; cursor: pointer;
    transition: all .2s; display: flex; align-items: center; gap: 11px;
  }
  .asset-card:hover { border-color: var(--accent); }
  .asset-card.sel { border-color: var(--accent); background: rgba(124,106,255,.08); }
  .asset-logo {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 900; font-family: var(--mono);
  }
  .asset-logo.usdc { background: rgba(39,117,202,.18); color: #4c9ff0; border: 1.5px solid rgba(39,117,202,.35); }
  .asset-logo.weth { background: rgba(124,106,255,.18); color: var(--accent); border: 1.5px solid rgba(124,106,255,.35); }
  .asset-info { min-width: 0; }
  .asset-name { font-size: 13px; font-weight: 900; margin-bottom: 3px; }
  .asset-desc { font-size: 10px; color: var(--dim); font-weight: 600; line-height: 1.4; }
  /* yield tick */
  @keyframes ytick { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .ytick { animation: ytick .25s ease-out; }
  /* app-level toast */
  @keyframes appToastIn { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  .app-toast {
    position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
    background: var(--surface2); border: 1px solid var(--accent3);
    border-radius: 14px; padding: 10px 22px;
    font-size: 13px; font-weight: 800; color: var(--accent3);
    white-space: nowrap; z-index: 9999; pointer-events: none;
    animation: appToastIn .3s ease-out;
  }
  /* ── FUND WALLET ── */
  .fund-wrap {
    display: flex; align-items: center; justify-content: center;
    padding: 100px 24px 60px; min-height: 100vh;
    overflow-x: hidden; max-width: 100%;
  }
  .fund-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 24px; padding: 36px 32px; width: 100%; max-width: 420px;
    position: relative; z-index: 1; text-align: center;
  }
  .fund-icon { font-size: 52px; margin-bottom: 18px; }
  .fund-card h2 { font-size: 24px; font-weight: 900; margin-bottom: 8px; }
  .fund-card > p {
    color: var(--dim); font-size: 14px; font-weight: 600;
    line-height: 1.6; margin-bottom: 28px;
  }
  .fund-qr {
    width: 180px; height: 180px; border-radius: 16px;
    margin: 0 auto 22px; display: block;
    border: 1px solid var(--border);
    image-rendering: pixelated;
  }
  .fund-addr-box {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 12px; padding: 12px 14px;
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 24px; text-align: left;
  }
  .fund-addr-text {
    font-family: var(--mono); font-size: 11px; color: var(--text);
    word-break: break-all; flex: 1; line-height: 1.6;
  }
  .fund-copy-btn {
    flex-shrink: 0; background: rgba(124,106,255,.12);
    border: 1px solid rgba(124,106,255,.3); color: var(--accent);
    font-family: var(--font); font-size: 11px; font-weight: 800;
    padding: 6px 12px; border-radius: 8px; cursor: pointer;
    transition: all .2s; white-space: nowrap;
  }
  .fund-copy-btn:hover { background: rgba(124,106,255,.22); }
  .fund-copy-btn.copied { color: var(--teal); border-color: rgba(106,255,212,.4); background: rgba(106,255,212,.08); }
  .fund-check-btn {
    width: 100%; background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none; color: #fff; font-family: var(--font);
    font-size: 16px; font-weight: 900; padding: 15px;
    border-radius: 14px; cursor: pointer; transition: all .3s;
    box-shadow: 0 4px 24px rgba(124,106,255,.3);
  }
  .fund-check-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(124,106,255,.5); }
  .fund-check-btn:disabled { opacity: .65; cursor: not-allowed; transform: none !important; }
  .fund-status {
    font-size: 13px; font-weight: 700; margin-top: 16px;
    min-height: 20px; transition: all .3s;
  }
  .fund-status.ok   { color: var(--teal); }
  .fund-status.err  { color: #ff6a6a; }
  .fund-status.info { color: var(--dim); }
  .fund-funded-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(106,255,212,.1); border: 1px solid rgba(106,255,212,.35);
    color: var(--teal); font-size: 14px; font-weight: 800;
    padding: 10px 20px; border-radius: 20px; margin-top: 16px;
    animation: ytick .4s ease-out;
  }
`;
const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);
// ── Data ─────────────────────────────────────────────────────────────────────
function fmt(n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtTvl(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}
// ── Yieldlings localStorage counter ──────────────────────────────────────────
const YIELDLINGS_BASE = 73;
const YIELDLINGS_KEY  = "yieldling_count";
function getYieldlingsTotal() {
  const extra = parseInt(localStorage.getItem(YIELDLINGS_KEY) ?? "0", 10);
  return YIELDLINGS_BASE + (isNaN(extra) ? 0 : extra);
}
function bumpYieldlings() {
  const extra = parseInt(localStorage.getItem(YIELDLINGS_KEY) ?? "0", 10);
  localStorage.setItem(YIELDLINGS_KEY, String((isNaN(extra) ? 0 : extra) + 1));
}
// ── Components ───────────────────────────────────────────────────────────────
function Stars() { return <div className="stars" />; }
function Nav({ screen, setScreen }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const addr = wallets?.[0]?.address;
  const shortAddr = addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : null;
  const tabs = ["landing", "adopt", "nursery"];
  const labels = ["Home", "Adopt", "Nursery"];
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="nav" style={{ position: "fixed", flexWrap: "wrap" }}>
      <div className="nav-logo">🥚 Yieldling</div>
      <div className="nav-tabs">
        {tabs.map((t, i) => (
          <button key={t} className={`nav-tab ${screen === t ? "active" : ""}`} onClick={() => setScreen(t)}>
            {labels[i]}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {!ready ? null : authenticated && shortAddr ? (
          <button className="nav-wallet addr" onClick={logout}>{shortAddr}</button>
        ) : (
          <button className="nav-wallet" onClick={login}>Connect</button>
        )}
        <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>
      {menuOpen && (
        <div className="nav-dropdown">
          {tabs.map((t, i) => (
            <button key={t} className={`nav-dropdown-item ${screen === t ? "active" : ""}`}
              onClick={() => { setScreen(t); setMenuOpen(false); }}>
              {labels[i]}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
// ── Landing ──────────────────────────────────────────────────────────────────
function Landing({ setScreen }) {
  const [cracking, setCracking] = useState(false);

  // ── Live stat state ───────────────────────────────────────────────────────
  const [tvlDisplay,        setTvlDisplay]        = useState("—");
  const [apyDisplay,        setApyDisplay]        = useState("—");
  const [yieldlingsDisplay, setYieldlingsDisplay] = useState(0);
  const [tvlLoading,        setTvlLoading]        = useState(true);
  const [apyLoading,        setApyLoading]        = useState(true);

  const TVL_FALLBACK = "$8.8M";
  const APY_FALLBACK = "11.8%";

  const crack = () => { setCracking(true); setTimeout(() => setCracking(false), 500); };

  useEffect(() => {
    // ── Animate Yieldlings counter from 0 → current value (1.5s ease-out) ──
    const target    = getYieldlingsTotal();
    const duration  = 1500;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setYieldlingsDisplay(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // ── Fetch ZyFAI Total TVL (no wallet needed — public read) ────────────
    getTvl()
      .then(n => {
        const display = (typeof n === "number" && n > 0) ? fmtTvl(n) : TVL_FALLBACK;
        setTvlDisplay(display);
        setTvlLoading(false);
      })
      .catch(err => {
        console.warn("[Landing] getTvl failed:", err);
        setTvlDisplay(TVL_FALLBACK);
        setTvlLoading(false);
      });

    // ── Fetch Avg APY (no wallet needed — public read) ────────────────────
    getAvgApy()
      .then(avg => {
        const display = (typeof avg === "number" && isFinite(avg) && avg > 0)
          ? `${avg.toFixed(1)}%`
          : APY_FALLBACK;
        setApyDisplay(display);
        setApyLoading(false);
      })
      .catch(err => {
        console.warn("[Landing] getAvgApy failed:", err);
        setApyDisplay(APY_FALLBACK);
        setApyLoading(false);
      });
  }, []);

  const stats = [
    { val: tvlDisplay,             lbl: "ZyFAI Total TVL", loading: tvlLoading },
    { val: `${yieldlingsDisplay}`, lbl: "Yieldlings",      loading: false      },
    { val: apyDisplay,             lbl: "Avg APY",         loading: apyLoading },
  ];

  return (
    <div className="screen landing">
      <div className="landing-glow" />
      <div className="hero-tag">🥚 Yieldling — Powered by ZyFAI · AI-Optimised DeFi Yield</div>
      <div className={`hero-egg ${cracking ? "crack" : ""}`} onClick={crack}>🥚</div>
      <h1 className="hero-h1">The pet that<br /><span>pays you back.</span></h1>
      <p className="hero-sub">
        Adopt a Yieldling. Deposit once. ZyFAI automatically finds the best yield across DeFi protocols —
        no jargon, no dashboards, just a creature that thrives when your money works.
      </p>
      <button className="hero-cta" onClick={() => setScreen("adopt")}>Adopt your Yieldling →</button>
      <div className="hero-stats">
        {stats.map(({ val, lbl, loading }) => (
          <div className="hero-stat" key={lbl}>
            <div className={`val${loading ? " loading" : ""}`}>{loading ? "—" : val}</div>
            <div className="lbl">{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
// ── FundWallet ────────────────────────────────────────────────────────────────
function FundWallet({ walletAddress, onFunded }) {
  const [copied,   setCopied]   = useState(false);
  const [checking, setChecking] = useState(false);
  const [status,   setStatus]   = useState(null);   // { type, msg }
  const [funded,   setFunded]   = useState(false);
  const pollRef = useState(null);

  const short = walletAddress
    ? `${walletAddress.slice(0, 10)}…${walletAddress.slice(-8)}`
    : "—";

  const qrSrc = walletAddress
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${walletAddress}&bgcolor=0e1420&color=6affd4&margin=12&format=png`
    : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const doCheck = async (auto = false) => {
    if (!walletAddress) return false;
    if (!auto) setChecking(true);
    try {
      const { eth, usdc } = await checkWalletBalance(walletAddress);
      const hasFunds = eth > 0n || usdc > 0n;
      if (hasFunds) {
        const ethAmt  = (Number(eth)  / 1e18).toFixed(6);
        const usdcAmt = (Number(usdc) / 1e6).toFixed(2);
        setStatus({ type: "ok", msg: `✓ Balance detected: ${usdcAmt} USDC · ${ethAmt} ETH` });
        setFunded(true);
        setTimeout(() => onFunded(), 1400);
        return true;
      } else {
        if (!auto) setStatus({ type: "info", msg: "No funds yet — waiting…" });
        return false;
      }
    } catch (e) {
      if (!auto) setStatus({ type: "err", msg: "Could not check balance — try again" });
      return false;
    } finally {
      if (!auto) setChecking(false);
    }
  };

  // Auto-poll every 5 s
  useEffect(() => {
    if (funded) return;
    const iv = setInterval(() => doCheck(true), 5000);
    return () => clearInterval(iv);
  }, [walletAddress, funded]);

  return (
    <div className="screen fund-wrap">
      <Stars />
      <div className="fund-card">
        <div className="fund-icon">💰</div>
        <h2>Fund your wallet</h2>
        <p>
          You signed in with a Privy embedded wallet. Send <strong>USDC or ETH</strong> to
          this address on <strong>Base</strong> to get started — we'll detect it automatically.
        </p>

        {qrSrc && (
          <img className="fund-qr" src={qrSrc} alt="Wallet QR code" />
        )}

        <div className="fund-addr-box">
          <div className="fund-addr-text">{walletAddress}</div>
          <button
            className={`fund-copy-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        {funded ? (
          <div className="fund-funded-badge">✓ Funded — entering Nursery…</div>
        ) : (
          <button
            className="fund-check-btn"
            onClick={() => doCheck(false)}
            disabled={checking}
          >
            {checking ? "⏳ Checking…" : "Check Balance"}
          </button>
        )}

        {status && !funded && (
          <div className={`fund-status ${status.type}`}>{status.msg}</div>
        )}
      </div>
    </div>
  );
}
// ── Adopt ────────────────────────────────────────────────────────────────────
function Adopt({ setScreen, setSmartWalletAddress, setCharacter }) {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  // Always read from the first active wallet — works for both embedded and injected
  const activeWallet      = wallets?.[0] ?? null;
  const walletAddress     = activeWallet?.address ?? null;
  const isEmbedded        = activeWallet?.walletClientType === "privy";

  // Which characters has this wallet already adopted?
  const adoptedChars = walletAddress
    ? ["stabby", "volty"].filter(c => {
        const perChar = localStorage.getItem(`yieldling_${c}_adopted`) === "true"
                     && localStorage.getItem(`yieldling_${c}_wallet`)  === walletAddress;
        const legacy  = c === (localStorage.getItem("yieldling_character") ?? "stabby")
                     && localStorage.getItem("yieldling_adopted")  === "true"
                     && localStorage.getItem("yieldling_wallet")   === walletAddress;
        return perChar || legacy;
      })
    : [];

  const [funded,        setFunded]        = useState(!isEmbedded);
  const [selectedChar,  setSelectedChar]  = useState("stabby");
  const [petName,       setPetName]       = useState(() => localStorage.getItem("yieldling_pet_name") ?? "");
  const [amount,        setAmount]        = useState(""); // raw string input, intentionally empty
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);

  // Per-character deposit config
  const DEPOSIT_CFG = {
    stabby: { min: 10,    placeholder: "100",  minLabel: "Minimum deposit is $10 USDC"   },
    volty:  { min: 0.001, placeholder: "0.01", minLabel: "Minimum deposit is 0.001 WETH" },
  };
  const cfg        = DEPOSIT_CFG[selectedChar];
  const amountNum  = parseFloat(amount);
  const amountEmpty   = amount === "" || isNaN(amountNum) || amountNum <= 0;
  const amountTooLow  = !amountEmpty && amountNum < cfg.min;
  const amountValid   = !amountEmpty && !amountTooLow;

  // Clear amount when character switches — units are incompatible
  useEffect(() => { setAmount(""); }, [selectedChar]);

  // Auto-select the non-adopted char; redirect to Nursery if both are already adopted
  useEffect(() => {
    if (!walletAddress) return;
    if (adoptedChars.length >= 2) { setScreen("nursery"); return; }
    if (adoptedChars.includes(selectedChar)) {
      const next = ["stabby", "volty"].find(c => !adoptedChars.includes(c));
      if (next) setSelectedChar(next);
    }
  }, [walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live APY per character ───────────────────────────────────────────────
  const [apys,       setApys]       = useState({ stabby: null, volty: null });
  const [apyLoading, setApyLoading] = useState(true);

  useEffect(() => {
    // No wallet connection needed — public SDK read
    Promise.allSettled([
      getStrategyApy("conservative", "USDC"),
      getStrategyApy("aggressive",   "WETH"),
    ]).then(([stabbyRes, voltyRes]) => {
      setApys({
        stabby: stabbyRes.status === "fulfilled" ? stabbyRes.value : null,
        volty:  voltyRes.status  === "fulfilled" ? voltyRes.value  : null,
      });
      setApyLoading(false);
    });
  }, []);

  // Re-evaluate when wallet changes (e.g. embedded wallet detected after login)
  useEffect(() => {
    setFunded(!isEmbedded);
  }, [isEmbedded]);

  const asset      = selectedChar === "stabby" ? "USDC" : "WETH";
  const accentCls  = selectedChar === "stabby" ? "teal" : "pink";
  const selectedApy = apys[selectedChar]; // null while loading or on failure

  // Not logged in → show gate
  if (!authenticated) {
    return (
      <div className="screen gate-wrap">
        <div className="stars" />
        <div className="gate-icon">🥚</div>
        <h2 className="gate-h2">Connect to adopt your Yieldling</h2>
        <p className="gate-sub">Sign in with your wallet, email, or Google to get started.</p>
        <button className="gate-btn" onClick={login}>Connect →</button>
      </div>
    );
  }

  // Embedded wallet with no confirmed funds → show funding screen
  if (isEmbedded && !funded) {
    return (
      <FundWallet
        walletAddress={walletAddress}
        onFunded={() => setFunded(true)}
      />
    );
  }

  const handleAdopt = async () => {
    setLoading(true); setError(null);
    try {
      // Get the EIP-1193 provider from the Privy wallet — embedded wallets
      // have their own provider separate from window.ethereum
      console.log("[Adopt] active wallet:", activeWallet?.walletClientType, activeWallet?.address);
      const provider = await activeWallet?.getEthereumProvider?.() ?? window.ethereum;
      console.log("[Adopt] provider obtained:", provider?.constructor?.name ?? typeof provider);

      const strategy = "aggressive";
      const result = await depositToZyfai(amountNum, walletAddress, asset, provider, strategy);
      setSmartWalletAddress(result.smartWallet);
      setCharacter(selectedChar);
      // Persist all adoption state
      localStorage.setItem("yieldling_pet_name",    petName.trim());
      localStorage.setItem("yieldling_adopted_at",  String(Date.now()));
      localStorage.setItem("yieldling_adopted",     "true");
      localStorage.setItem("yieldling_wallet",      walletAddress);
      localStorage.setItem("yieldling_character",   selectedChar);
      localStorage.setItem("yieldling_smart_wallet", result.smartWallet);
      // Per-character keys (allow owning one Stabby + one Volty)
      localStorage.setItem(`yieldling_${selectedChar}_adopted`,      "true");
      localStorage.setItem(`yieldling_${selectedChar}_wallet`,       walletAddress);
      localStorage.setItem(`yieldling_${selectedChar}_smart_wallet`, result.smartWallet);
      localStorage.setItem(`yieldling_${selectedChar}_adopted_at`,   String(Date.now()));
      bumpYieldlings();
      setScreen("nursery");
    } catch (err) {
      console.error("[Adopt] ✗ deposit failed");
      console.error("[Adopt] message:", err?.message);
      console.error("[Adopt] code:",    err?.code);
      console.error("[Adopt] stack:",   err?.stack);
      console.error("[Adopt] full err obj:", err);
      setError(err?.message?.length > 0 ? err.message : "Deposit failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const chars = [
    { id: "stabby", accentCls: "teal", asset: "USDC",
      personality: "Calm & stable yields", apyFallback: "7.2%" },
    { id: "volty",  accentCls: "pink",  asset: "WETH",
      personality: "ETH-native yield, steady growth", apyFallback: "12.4%" },
  ];

  // Projection figures — computed whenever amount is valid (APY may still be loading)
  const isUSDC = selectedChar === "stabby";
  const monthlyYield = (selectedApy !== null && amountValid)
    ? amountNum * (selectedApy / 100) / 12
    : null;
  const yearlyYield  = (selectedApy !== null && amountValid)
    ? amountNum * (selectedApy / 100)
    : null;
  // Format yield in the correct unit for the selected character
  const fmtYield = (n) => isUSDC
    ? `$${fmt(n)}`
    : `${n.toFixed(4)} ETH`;

  return (
    <div className="screen char-select-wrap">
      <div className="char-select-inner">
        <h2>Choose your Yieldling 🥚</h2>
        <p>Pick your creature — it sets your asset and strategy automatically.</p>
        <div className="char-grid">
          {chars.map(c => {
            const imgs      = CHAR_IMGS[c.id];
            const label     = c.id.charAt(0).toUpperCase() + c.id.slice(1);
            const apy       = apys[c.id];
            const isAdopted = adoptedChars.includes(c.id);
            return (
              <div key={c.id}
                className={`char-card ${selectedChar === c.id && !isAdopted ? `sel-${c.accentCls}` : ""} ${isAdopted ? "adopted" : ""}`}
                onClick={isAdopted ? undefined : () => setSelectedChar(c.id)}>
                {isAdopted && (
                  <div className="char-adopted-overlay">
                    <div className="char-adopted-tag">✓ Already Adopted</div>
                    <button
                      className="char-view-nursery-btn"
                      onClick={e => { e.stopPropagation(); setScreen("nursery"); }}
                    >→ View in Nursery</button>
                  </div>
                )}
                {/* Main hero image */}
                <img className="char-preview" src={imgs[1]} alt={c.id}
                  style={{ width: 140, height: 140 }} />
                <div className={`char-name ${c.accentCls}`}>{label}</div>
                <div className={`char-badge ${c.accentCls}`}>{c.asset}</div>

                <div className="char-desc">{c.personality}</div>
                {/* Evolution preview strip */}
                <div className="char-evo-strip">
                  <div className="char-evo-row">
                    {imgs.map((img, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center" }}>
                        <img className="char-evo-img" src={img} alt={`stage ${i+1}`} />
                        {i < imgs.length - 1 && (
                          <span className="char-evo-arrow">›</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="char-evo-labels">
                    {EVO_LABELS.map((lbl, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center" }}>
                        <div className="char-evo-label">{lbl}</div>
                        {i < EVO_LABELS.length - 1 && (
                          <div className="char-evo-label-sep">›</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Custom name */}
        <div className="name-wrap">
          <label className="field-label">Name your Yieldling</label>
          <input
            className="name-input"
            type="text"
            value={petName}
            onChange={e => setPetName(e.target.value.slice(0, 12))}
            placeholder={selectedChar === "stabby" ? "Ziggy" : "Sparky"}
            maxLength={12}
          />
          <div className="name-hint">
            {petName.trim()
              ? <>Your Yieldling will be called <span>{petName.trim()}</span></>
              : <>Optional — leave blank to use <span>{selectedChar === "stabby" ? "Stabby" : "Volty"}</span></>}
          </div>
        </div>
        <div className="char-amount">
          <label className="field-label">Deposit Amount ({asset})</label>
          <input
            className="amount-input"
            type="number"
            value={amount}
            placeholder={cfg.placeholder}
            min={cfg.min}
            step="any"
            onChange={e => setAmount(e.target.value)}
          />
          {amountTooLow && (
            <div className="amount-hint err">{cfg.minLabel}</div>
          )}
        </div>
        {/* Details panel — shown as soon as amount is valid; APY rows shimmer while loading */}
        {amountValid && (
          <div className="details-panel">
            <div className="details-title">Details</div>

            <div className="details-row">
              <span className="details-lbl">Average APY</span>
              <span className="details-val">
                {apyLoading
                  ? <span className="apy-skeleton" />
                  : selectedApy !== null
                    ? `${selectedApy.toFixed(1)}%`
                    : "—"
                }
                <span className="details-info">ⓘ</span>
              </span>
            </div>

            <div className="details-row">
              <span className="details-lbl">Projected monthly earnings</span>
              <span className="details-val">
                {apyLoading
                  ? <span className="apy-skeleton" />
                  : monthlyYield !== null
                    ? `${fmtYield(monthlyYield)} / mo`
                    : "—"
                }
                <span className="details-info">ⓘ</span>
              </span>
            </div>

            <div className="details-row">
              <span className="details-lbl">Projected yearly earnings</span>
              <span className="details-val">
                {apyLoading
                  ? <span className="apy-skeleton" />
                  : yearlyYield !== null
                    ? `${fmtYield(yearlyYield)} / yr`
                    : "—"
                }
                <span className="details-info">ⓘ</span>
              </span>
            </div>
          </div>
        )}
        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
            {error}
          </p>
        )}
        <button
          className={`char-adopt-btn ${accentCls}`}
          onClick={handleAdopt}
          disabled={loading || !amountValid}
          style={{
            opacity: (loading || !amountValid) ? 0.45 : 1,
            cursor:  (loading || !amountValid) ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "⏳ Depositing…" : `Adopt ${selectedChar === "stabby" ? "Stabby" : "Volty"} →`}
        </button>
      </div>
    </div>
  );
}
// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { wallets } = useWallets();
  const walletAddress = wallets?.[0]?.address ?? null;

  const [screen,             setScreenRaw]          = useState("landing");
  const [smartWalletAddress, setSmartWalletAddress] = useState(
    () => localStorage.getItem("yieldling_smart_wallet") ?? null
  );
  const [character, setCharacter] = useState(
    () => localStorage.getItem("yieldling_character") ?? "stabby"
  );
  const [appToast, setAppToast] = useState(null);

  // Helper — show a teal toast for ~3 s
  const showAppToast = (msg) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 3200);
  };

  // Guarded navigation — blocks Nursery access for non-adopted wallets
  const setScreen = (target) => {
    if (target === "nursery") {
      const hasAny = walletAddress && (
        (localStorage.getItem("yieldling_adopted") === "true" && localStorage.getItem("yieldling_wallet") === walletAddress) ||
        ["stabby", "volty"].some(c =>
          localStorage.getItem(`yieldling_${c}_adopted`) === "true" &&
          localStorage.getItem(`yieldling_${c}_wallet`) === walletAddress
        )
      );
      if (!hasAny) {
        showAppToast("🥚 Adopt a Yieldling first to access the Nursery");
        setScreenRaw("adopt");
        return;
      }
    }
    setScreenRaw(target);
  };

  // Auto-route a returning adopted wallet straight to the Nursery
  useEffect(() => {
    if (!walletAddress) return;
    const legacyOk = localStorage.getItem("yieldling_adopted") === "true"
                  && localStorage.getItem("yieldling_wallet") === walletAddress;
    const perCharOk = ["stabby", "volty"].some(c =>
      localStorage.getItem(`yieldling_${c}_adopted`) === "true" &&
      localStorage.getItem(`yieldling_${c}_wallet`) === walletAddress
    );
    if (legacyOk || perCharOk) {
      const savedChar        = localStorage.getItem("yieldling_character");
      const savedSmartWallet = localStorage.getItem("yieldling_smart_wallet");
      if (savedChar)        setCharacter(savedChar);
      if (savedSmartWallet) setSmartWalletAddress(savedSmartWallet);
      setScreenRaw("nursery");
    }
  }, [walletAddress]);

  // Characters this wallet currently owns (drives the in-Nursery switcher)
  const ownedCharacters = walletAddress
    ? (() => {
        const owned = [];
        for (const c of ["stabby", "volty"]) {
          const hasChar =
            (localStorage.getItem(`yieldling_${c}_adopted`) === "true" && localStorage.getItem(`yieldling_${c}_wallet`) === walletAddress) ||
            (localStorage.getItem("yieldling_character") === c && localStorage.getItem("yieldling_adopted") === "true" && localStorage.getItem("yieldling_wallet") === walletAddress);
          if (hasChar) owned.push(c);
        }
        return owned;
      })()
    : [];

  const handleSwitchCharacter = (charId) => {
    setCharacter(charId);
    // Restore the smart wallet for the selected character
    const sw = localStorage.getItem(`yieldling_${charId}_smart_wallet`)
            ?? (charId === (localStorage.getItem("yieldling_character") ?? "stabby")
                ? localStorage.getItem("yieldling_smart_wallet")
                : null);
    if (sw) setSmartWalletAddress(sw);
  };

  return (
    <>
      <Stars />
      {appToast && <div className="app-toast">{appToast}</div>}
      <Nav screen={screen} setScreen={setScreen} />
      {screen === "landing"  && <Landing setScreen={setScreen} />}
      {screen === "adopt"    && (
        <Adopt
          setScreen={setScreen}
          setSmartWalletAddress={setSmartWalletAddress}
          setCharacter={setCharacter}
        />
      )}
      {screen === "nursery"  && (
        <NurseryScreen
          walletAddress={walletAddress}
          smartWalletAddress={smartWalletAddress}
          character={character}
          ownedCharacters={ownedCharacters}
          onSwitchCharacter={handleSwitchCharacter}
        />
      )}
    </>
  );
}
