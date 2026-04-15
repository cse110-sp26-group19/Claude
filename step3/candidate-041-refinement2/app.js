'use strict';

// ── Audio Engine (Web Audio API) ──────────────────────────────────────────────
let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function resumeAudio() {
  try { if (_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume(); } catch(_) {}
}

function tone(freq, type, vol, delayS, durS) {
  try {
    const ac   = getAudioCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delayS);
    gain.gain.setValueAtTime(0.001, ac.currentTime + delayS);
    gain.gain.linearRampToValueAtTime(vol, ac.currentTime + delayS + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delayS + durS);
    osc.start(ac.currentTime + delayS);
    osc.stop(ac.currentTime + delayS + durS + 0.02);
  } catch(_) {}
}

function audioTick() {
  tone(530 + Math.random() * 300, 'square',   0.036, 0, 0.022);
  tone(160 + Math.random() * 75,  'sine',     0.026, 0, 0.030);
}

function audioStop(reelIndex) {
  tone(108 + reelIndex * 26, 'sine',     0.30, 0,    0.20);
  tone(840 + reelIndex * 88, 'square',   0.06, 0,    0.03);
  tone(400 + reelIndex * 52, 'triangle', 0.07, 0.02, 0.13);
}

function audioSuspense() {
  try {
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(82, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(148, ac.currentTime + 0.33);
    gain.gain.setValueAtTime(0.001, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.052, ac.currentTime + 0.05);
    gain.gain.setValueAtTime(0.052, ac.currentTime + 0.27);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.40);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.44);
  } catch(_) {}
}

function audioWin(multiplier) {
  const scale = multiplier >= 15
    ? [261, 330, 392, 523, 659, 784, 1047, 1319]
    : multiplier >= 8
      ? [261, 330, 392, 523, 659]
      : [330, 392, 523];
  scale.forEach((f, i) => {
    tone(f,     'sine',     0.15, i * 0.086, 0.36);
    tone(f * 2, 'sine',     0.05, i * 0.086, 0.26);
    tone(f * 3, 'triangle', 0.02, i * 0.086, 0.16);
  });
}

function audioLose() {
  [305, 255, 212].forEach((f, i) => tone(f, 'sawtooth', 0.12 + i * 0.02, i * 0.13, 0.24));
}

// ── Symbols ──────────────────────────────────────────────────────────────────
const SYMBOLS = [
  { emoji: '🪙', name: 'TOKEN',        weight: 5,  payout: 3  },
  { emoji: '🤖', name: 'AI OVERLORD',  weight: 4,  payout: 5  },
  { emoji: '🧠', name: 'NEURAL NET',   weight: 4,  payout: 5  },
  { emoji: '⚡', name: 'GPU CLUSTER',  weight: 3,  payout: 8  },
  { emoji: '🔑', name: 'API KEY',      weight: 3,  payout: 8  },
  { emoji: '📊', name: 'TRAINING DATA',weight: 3,  payout: 10 },
  { emoji: '🌀', name: 'HALLUCINATION',weight: 2,  payout: 15 },
  { emoji: '💀', name: 'MODEL DEATH',  weight: 1,  payout: 50 },
];

const JACKPOT_SYMBOL = { emoji: '🪙', name: 'TOKEN' };

// ── Win messages ──────────────────────────────────────────────────────────────
const WIN_MSGS = [
  "CONTEXT WINDOW OVERFLOWING WITH WEALTH",
  "YOUR PROMPT ENGINEERING PAID OFF",
  "TEMPERATURE = 1.0 GANG WINS AGAIN",
  "ALIGNED TO YOUR WALLET",
  "TOKENS TRANSFERRED VIA ATTENTION MECHANISM",
  "REINFORCEMENT LEARNED… TO PAY OUT",
  "GRADIENT DESCENT INTO PROFIT",
  "FINE-TUNED FOR MAXIMUM GAINS",
];

const LOSE_MSGS = [
  "HALLUCINATION DETECTED — NO PAYOUT",
  "RATE LIMITED. TRY AGAIN LATER.",
  "404: TOKENS NOT FOUND",
  "CONTEXT FORGOTTEN. TOKENS GONE.",
  "MODEL CONFIDENTLY WRONG. YOU LOSE.",
  "INSUFFICIENT TRAINING DATA FOR A WIN",
  "DEPRECATED: YOUR LUCK",
  "OUTPUT FILTERED BY SAFETY GUARDRAILS",
  "TOKENS BURNED TO REDUCE CO₂. JK THEY'RE JUST GONE.",
  "THIS OUTPUT WAS TRUNCATED DUE TO TOKEN LIMIT",
];

const JACKPOT_MSGS = [
  "💎 JACKPOT — YOU ARE NOW A TOKEN BILLIONAIRE",
  "🚀 MARKET CAP EXCEEDED ALL EXPECTATIONS",
  "🏆 AI SAID 'CONGRATULATIONS' (AND MEANT IT FOR ONCE)",
];

const NEAR_MISS_MSGS = [
  "SO CLOSE… THE MODEL ALMOST ALIGNED",
  "TWO OUT OF THREE — TRAINING INCOMPLETE",
  "NEAR MISS — YOUR GRADIENTS ARE NOISY",
  "ALMOST! CONTEXT WINDOW CLIPPED YOUR WIN",
];

const PARTICLE_CHARS = ['🪙', '✨', '⭐', '💫', '🌟', '💎', '🔥'];
const SAD_PARTICLES = ['💨', '🫠', '❌', '📉', '🥀'];

// ── Game state ────────────────────────────────────────────────────────────────
const state = {
  tokens: 1000,
  bet: 10,
  spins: 0,
  biggestWin: 0,
  winStreak: 0,
  lossStreak: 0,
  maxLossStreak: 0,
  totalWon: 0,
  totalLost: 0,
  wins: 0,
  losses: 0,
  spinning: false,
  autoPlay: false,
  autoTimer: null,
  results: [null, null, null],
  history: [],
};

const BET_OPTIONS = [5, 10, 25, 50, 100, 250];
let betIdx = 1;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const strips       = [$('strip1'), $('strip2'), $('strip3')];
const reels        = [$('reel1'), $('reel2'), $('reel3')];
const resultText   = $('resultText');
const tokenCount   = $('tokenCount');
const spinsCount   = $('spinsCount');
const biggestWinEl = $('biggestWin');
const winStreakEl  = $('winStreak');
const lossStreakEl = $('lossStreak');
const winRateEl    = $('winRate');
const totalWonEl   = $('totalWon');
const totalLostEl  = $('totalLost');
const betValueEl   = $('betValue');
const spinBtn      = $('spinBtn');
const betDown      = $('betDown');
const betUp        = $('betUp');
const autoBtn      = $('autoBtn');
const autoCount    = $('autoCount');
const logEntries   = $('logEntries');
const contextFill  = $('contextFill');
const modalOverlay = $('modalOverlay');
const modalIcon    = $('modalIcon');
const modalTitle   = $('modalTitle');
const modalBody    = $('modalBody');
const modalBtn     = $('modalBtn');
const machine      = $('machine');
const screenFlash  = $('screenFlash');
const themeToggle  = $('themeToggle');
const themeIcon    = $('themeIcon');

const netProfitVal = $('netProfitVal');
const netBarNeg    = $('netBarNeg');
const netBarPos    = $('netBarPos');
const roiVal       = $('roiVal');
const roiBar       = $('roiBar');
const wlDistVal    = $('wlDistVal');
const wlBarWin     = $('wlBarWin');
const wlBarLoss    = $('wlBarLoss');
const historyDots  = $('historyDots');

// ── Theme toggle ──────────────────────────────────────────────────────────────
function getTheme() {
  return localStorage.getItem('tokenslot-theme') || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('tokenslot-theme', theme);
}

applyTheme(getTheme());

themeToggle.addEventListener('click', () => {
  const current = getTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ── Weighted random symbol picker ─────────────────────────────────────────────
function weightedRandom() {
  const total = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
  let r = Math.random() * total;
  for (const sym of SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

// ── Build reel strips ─────────────────────────────────────────────────────────
function buildStrip(stripEl) {
  stripEl.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const div = document.createElement('div');
    div.className = 'reel-symbol';
    div.textContent = weightedRandom().emoji;
    stripEl.appendChild(div);
  }
}

strips.forEach(buildStrip);

// ── Build paytable ────────────────────────────────────────────────────────────
function buildPaytable() {
  const grid = $('paytableGrid');
  grid.innerHTML = '';
  const sorted = [...SYMBOLS].sort((a, b) => b.payout - a.payout);
  for (const sym of sorted) {
    const row = document.createElement('div');
    row.className = 'pt-row';
    row.innerHTML = `
      <div class="pt-symbols">${sym.emoji}${sym.emoji}${sym.emoji}</div>
      <div class="pt-info">
        <div class="pt-name">${sym.name}</div>
        <div class="pt-payout">×${sym.payout} BET</div>
      </div>`;
    grid.appendChild(row);
  }
  const row2 = document.createElement('div');
  row2.className = 'pt-row';
  row2.innerHTML = `
    <div class="pt-symbols">🃏🃏❓</div>
    <div class="pt-info">
      <div class="pt-name">ANY PAIR</div>
      <div class="pt-payout">×1.5 BET</div>
    </div>`;
  grid.appendChild(row2);
}

buildPaytable();

// ── Update UI ─────────────────────────────────────────────────────────────────
function updateStats() {
  tokenCount.textContent = state.tokens.toLocaleString();
  spinsCount.textContent = state.spins.toLocaleString();
  biggestWinEl.textContent = state.biggestWin.toLocaleString();
  winStreakEl.textContent = state.winStreak;
  lossStreakEl.textContent = state.lossStreak;
  betValueEl.textContent = BET_OPTIONS[betIdx];
  totalWonEl.textContent = state.totalWon.toLocaleString();
  totalLostEl.textContent = state.totalLost.toLocaleString();

  const rate = state.spins > 0 ? ((state.wins / state.spins) * 100).toFixed(1) : '0.0';
  winRateEl.textContent = rate + '%';

  const pct = Math.min(12 + state.spins * 0.4, 95);
  contextFill.style.width = pct + '%';
  if (pct > 80) contextFill.style.background = 'linear-gradient(90deg, #ef4444, #fbbf24)';

  updateMetrics();
}

function updateMetrics() {
  const net = state.totalWon - state.totalLost;
  netProfitVal.textContent = (net >= 0 ? '+' : '') + net.toLocaleString();
  netProfitVal.style.color = net >= 0 ? 'var(--green)' : 'var(--red)';

  const maxNet = Math.max(state.totalWon, state.totalLost, 1);
  if (net >= 0) {
    netBarPos.style.width = Math.min((net / maxNet) * 50, 50) + '%';
    netBarNeg.style.width = '0';
  } else {
    netBarNeg.style.width = Math.min((Math.abs(net) / maxNet) * 50, 50) + '%';
    netBarPos.style.width = '0';
  }

  const totalInvested = state.totalLost;
  const roi = totalInvested > 0 ? (((state.totalWon - totalInvested) / totalInvested) * 100).toFixed(1) : '0.0';
  roiVal.textContent = roi + '%';
  roiVal.style.color = parseFloat(roi) >= 0 ? 'var(--green)' : 'var(--red)';
  const roiPct = Math.max(0, Math.min(100, 50 + parseFloat(roi) * 0.5));
  roiBar.style.width = roiPct + '%';

  const total = state.wins + state.losses;
  wlDistVal.textContent = `${state.wins}W — ${state.losses}L`;
  if (total > 0) {
    wlBarWin.style.width = ((state.wins / total) * 100) + '%';
    wlBarLoss.style.width = ((state.losses / total) * 100) + '%';
  }
}

function addHistoryDot(type) {
  state.history.push(type);
  if (state.history.length > 50) {
    state.history.shift();
    if (historyDots.firstChild) historyDots.removeChild(historyDots.firstChild);
  }
  const dot = document.createElement('div');
  dot.className = 'history-dot ' + type;
  dot.title = type.toUpperCase();
  historyDots.appendChild(dot);
}

// ── Logging ───────────────────────────────────────────────────────────────────
function log(msg, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span class="log-time">${time}</span><span>${msg}</span>`;
  logEntries.prepend(entry);
  while (logEntries.children.length > 40) logEntries.lastChild.remove();
}

// ── RAF-based particle animation ──────────────────────────────────────────────
function animateParticle(el, startX, startY, dx, dy, duration, rotateEnd) {
  const start = performance.now();
  el.style.left = startX + 'px';
  el.style.top = startY + 'px';

  function frame(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const x = startX + dx * ease;
    const y = startY + dy * t;
    const rot = rotateEnd * t;
    const scale = 1 - t * 0.6;
    const opacity = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;

    el.style.transform = `translate(${x - startX}px, ${y - startY}px) rotate(${rot}deg) scale(${scale})`;
    el.style.opacity = opacity;

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      el.remove();
    }
  }
  requestAnimationFrame(frame);
}

// ── Coin burst effect (60fps with rAF) ───────────────────────────────────────
function spawnCoins(count = 10) {
  const spinRect = spinBtn.getBoundingClientRect();
  const cx = spinRect.left + spinRect.width / 2;
  const cy = spinRect.top;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const isSpecial = Math.random() > 0.5;
    el.className = isSpecial ? 'sparkle' : 'coin';
    el.textContent = isSpecial
      ? PARTICLE_CHARS[1 + Math.floor(Math.random() * (PARTICLE_CHARS.length - 1))]
      : '🪙';
    document.body.appendChild(el);

    const startX = cx + (Math.random() - 0.5) * 80;
    const startY = cy + (Math.random() - 0.5) * 30;
    const dx = (Math.random() - 0.5) * 300;
    const dy = -(100 + Math.random() * 200);
    const dur = 800 + Math.random() * 600;
    const rot = (Math.random() - 0.5) * 720;

    setTimeout(() => animateParticle(el, startX, startY, dx, dy, dur, rot), Math.random() * 300);
  }
}

// ── Sad particle effect (losses) ──────────────────────────────────────────────
function spawnSadParticles(count = 5) {
  const machineRect = machine.getBoundingClientRect();
  const cx = machineRect.left + machineRect.width / 2;
  const cy = machineRect.top + machineRect.height / 2;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'sad-particle';
    el.textContent = SAD_PARTICLES[Math.floor(Math.random() * SAD_PARTICLES.length)];
    document.body.appendChild(el);

    const startX = cx + (Math.random() - 0.5) * 200;
    const startY = cy + (Math.random() - 0.5) * 60;
    const dx = (Math.random() - 0.5) * 80;
    const dy = 60 + Math.random() * 100;
    const dur = 800 + Math.random() * 400;

    animateParticle(el, startX, startY, dx, dy, dur, (Math.random() - 0.5) * 180);
  }
}

// ── Floating "+X tokens!" text ───────────────────────────────────────────────
function spawnFloatingText(amount, isWin) {
  const machineRect = machine.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'floating-token-text';
  el.textContent = isWin ? `+${amount} tokens!` : `-${amount}`;
  el.style.color = isWin ? 'var(--green)' : 'var(--red)';
  if (amount >= 100) el.style.fontSize = '28px';

  const startX = machineRect.left + machineRect.width / 2 - 60;
  const startY = machineRect.top + 40;
  el.style.left = startX + 'px';
  el.style.top = startY + 'px';

  document.body.appendChild(el);

  const start = performance.now();
  const duration = 1400;

  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const y = startY - 80 * t;
    const opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    const scale = t < 0.15 ? 0.5 + t * 3.3 : 1;
    el.style.transform = `translateY(${y - startY}px) scale(${scale})`;
    el.style.opacity = opacity;
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      el.remove();
    }
  }
  requestAnimationFrame(frame);
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function showModal(icon, title, body, onClose, isJackpot) {
  modalIcon.textContent = icon;
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modalOverlay.classList.add('active');
  if (isJackpot) modalOverlay.classList.add('jackpot-modal');
  const handler = () => {
    modalOverlay.classList.remove('active', 'jackpot-modal');
    modalBtn.removeEventListener('click', handler);
    if (onClose) onClose();
  };
  modalBtn.addEventListener('click', handler);
}

// ── Machine animation helpers ─────────────────────────────────────────────────
function flashMachine(cls) {
  machine.classList.remove('win-flash', 'jackpot-flash', 'loss-flash', 'near-miss-glow', 'screen-shake', 'loss-shake', 'pulsing-glow');
  void machine.offsetWidth;
  machine.classList.add(cls);
  machine.addEventListener('animationend', () => machine.classList.remove(cls), { once: true });
}

function triggerScreenFlash() {
  screenFlash.classList.remove('active');
  void screenFlash.offsetWidth;
  screenFlash.classList.add('active');
  screenFlash.addEventListener('animationend', () => screenFlash.classList.remove('active'), { once: true });
}

function bounceWinningSymbols() {
  strips.forEach(strip => {
    const symbols = strip.querySelectorAll('.reel-symbol');
    const last = symbols[symbols.length - 1];
    if (last) {
      last.classList.add('bounce');
      last.addEventListener('animationend', () => last.classList.remove('bounce'), { once: true });
    }
  });
}

function highlightNearMiss(result) {
  const emojis = result.map(r => r.emoji);
  const counts = {};
  emojis.forEach(e => { counts[e] = (counts[e] || 0) + 1; });
  const pairEmoji = Object.keys(counts).find(e => counts[e] === 2);
  if (!pairEmoji) return;

  strips.forEach((strip, i) => {
    if (emojis[i] === pairEmoji) {
      const symbols = strip.querySelectorAll('.reel-symbol');
      const last = symbols[symbols.length - 1];
      if (last) last.classList.add('near-miss-highlight');
    }
  });
}

// ── Spin logic ────────────────────────────────────────────────────────────────
function pickResult() {
  return [weightedRandom(), weightedRandom(), weightedRandom()];
}

function evaluateResult(res) {
  const [a, b, c] = res;
  if (a.emoji === b.emoji && b.emoji === c.emoji) {
    return { type: 'three', symbol: a };
  }
  if (a.emoji === b.emoji || b.emoji === c.emoji || a.emoji === c.emoji) {
    return { type: 'pair', symbol: null };
  }
  return { type: 'none' };
}

function setResult(text, className) {
  resultText.className = 'result-text ' + className;
  resultText.textContent = text;
}

function animateReel(reelEl, stripEl, targetSymbol, duration, reelIndex) {
  return new Promise(resolve => {
    stripEl.innerHTML = '';
    const rows = 22;
    for (let i = 0; i < rows - 1; i++) {
      const d = document.createElement('div');
      d.className = 'reel-symbol';
      d.textContent = weightedRandom().emoji;
      stripEl.appendChild(d);
    }
    const last = document.createElement('div');
    last.className = 'reel-symbol highlighted';
    last.textContent = targetSymbol.emoji;
    stripEl.appendChild(last);

    stripEl.style.transition = 'none';
    stripEl.style.transform = 'translateY(0)';

    const symbolH = 130;
    const totalH = (rows - 1) * symbolH;

    // Tick sounds via rAF alongside the CSS transition
    const startTime = performance.now();
    let lastTick = startTime;

    function tickLoop(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const tickInterval = 64 * (1 + eased * 3.0);

      if (now - lastTick > tickInterval && t < 0.92) {
        audioTick();
        lastTick = now;
      }
      if (t < 1) requestAnimationFrame(tickLoop);
    }

    requestAnimationFrame(() => requestAnimationFrame(() => {
      stripEl.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.8, 0.3, 1)`;
      stripEl.style.transform = `translateY(-${totalH}px)`;
      requestAnimationFrame(tickLoop);
      setTimeout(() => {
        audioStop(reelIndex || 0);
        resolve();
      }, duration + 50);
    }));
  });
}

async function spin() {
  if (state.spinning) return;
  resumeAudio();
  const bet = BET_OPTIONS[betIdx];
  if (state.tokens < bet) {
    showModal('😵', 'INSUFFICIENT TOKENS',
      `You need ${bet} tokens to spin. You only have ${state.tokens}.\nMaybe try reducing your bet, or just accept that the AI won.`);
    stopAuto();
    return;
  }

  state.spinning = true;
  spinBtn.disabled = true;
  spinBtn.classList.add('spinning-state');
  state.tokens -= bet;
  state.spins++;
  updateStats();
  setResult('⚙️  INFERRING…', '');

  const result = pickResult();
  state.results = result;

  const durations = [900, 1100, 1350];
  const promises = reels.map((reel, i) => animateReel(reel, strips[i], result[i], durations[i], i));

  await Promise.all(promises);

  // Suspense pause with tension audio before reveal
  reels.forEach(r => r.classList.add('suspense-reel'));
  audioSuspense();
  await new Promise(r => setTimeout(r, 380));
  reels.forEach(r => r.classList.remove('suspense-reel'));

  const eval_ = evaluateResult(result);
  let winAmount = 0;
  let type = 'none';

  if (eval_.type === 'three') {
    winAmount = bet * eval_.symbol.payout;
    const isJackpot = eval_.symbol.payout >= 15;
    type = isJackpot ? 'jackpot' : 'win';
  } else if (eval_.type === 'pair') {
    winAmount = Math.floor(bet * 1.5);
    type = 'win';
  }

  const isNearMiss = eval_.type === 'pair' && type === 'win' && winAmount === Math.floor(bet * 1.5);
  const isPureNearMiss = eval_.type === 'pair';

  if (winAmount > 0) {
    state.tokens += winAmount;
    state.totalWon += winAmount;
    state.wins++;
    if (winAmount > state.biggestWin) state.biggestWin = winAmount;
    state.winStreak++;
    state.lossStreak = 0;
    const net = winAmount - bet;

    if (type === 'jackpot') {
      const msg = JACKPOT_MSGS[Math.floor(Math.random() * JACKPOT_MSGS.length)];
      setResult(msg, 'jackpot');
      flashMachine('jackpot-flash');
      triggerScreenFlash();
      setTimeout(() => flashMachine('screen-shake'), 100);
      setTimeout(() => flashMachine('pulsing-glow'), 500);
      spawnCoins(40);
      setTimeout(() => spawnCoins(20), 300);
      setTimeout(() => spawnCoins(15), 600);
      bounceWinningSymbols();
      spawnFloatingText(winAmount, true);
      audioWin(eval_.symbol ? eval_.symbol.payout : 15);
      log(`JACKPOT! +${winAmount} tokens (${result.map(s=>s.emoji).join('')})`, 'jackpot');
      addHistoryDot('jackpot');

      setTimeout(() => {
        showModal('💎', 'JACKPOT ACHIEVED',
          `The model has aligned itself to your wallet.\n\nYou won ${winAmount} tokens on a ${bet} token bet.\n\nThat's a ${eval_.symbol.payout}x multiplier. The training paid off.`,
          null, true);
      }, 800);

    } else if (isPureNearMiss) {
      const msg = NEAR_MISS_MSGS[Math.floor(Math.random() * NEAR_MISS_MSGS.length)];
      setResult(`+${winAmount} — ${msg}`, 'win');
      flashMachine('near-miss-glow');
      highlightNearMiss(result);
      spawnCoins(4);
      spawnFloatingText(winAmount, true);
      audioWin(1.5);
      log(`Pair +${winAmount}t (net +${net}t) ${result.map(s=>s.emoji).join('')}`, 'win');
      addHistoryDot('near-miss');

    } else {
      const msg = WIN_MSGS[Math.floor(Math.random() * WIN_MSGS.length)];
      setResult(`+${winAmount} TOKENS — ${msg}`, 'win');
      flashMachine('win-flash');
      if (winAmount >= bet * 8) {
        setTimeout(() => flashMachine('screen-shake'), 100);
        setTimeout(() => flashMachine('pulsing-glow'), 500);
      }
      const coinCount = Math.min(6 + Math.floor(winAmount / bet), 30);
      spawnCoins(coinCount);
      bounceWinningSymbols();
      spawnFloatingText(winAmount, true);
      audioWin(eval_.symbol ? eval_.symbol.payout : 3);
      log(`WIN +${winAmount}t  (net +${net}t)  ${result.map(s=>s.emoji).join('')}`, 'win');
      addHistoryDot('win');
    }
  } else {
    state.winStreak = 0;
    state.lossStreak++;
    state.losses++;
    state.totalLost += bet;
    if (state.lossStreak > state.maxLossStreak) state.maxLossStreak = state.lossStreak;

    const msg = LOSE_MSGS[Math.floor(Math.random() * LOSE_MSGS.length)];
    setResult(msg, 'lose');
    flashMachine('loss-flash');
    flashMachine('loss-shake');
    audioLose();
    spawnSadParticles(3);
    spawnFloatingText(bet, false);
    log(`Loss -${bet}t  ${result.map(s=>s.emoji).join('')}`, 'lose');
    addHistoryDot('loss');
  }

  updateStats();
  state.spinning = false;
  spinBtn.disabled = false;
  spinBtn.classList.remove('spinning-state');

  if (state.tokens <= 0) {
    stopAuto();
    setTimeout(() => {
      showModal('💸', 'OUT OF TOKENS',
        'Your token wallet has been drained. The model has been trained on your losses.\n\nHere, have 500 tokens. Consider it a stimulus package.',
        () => {
          state.tokens = 500;
          updateStats();
          log('💸 Token bailout received: +500t', 'info');
        });
    }, 600);
  }
}

// ── Auto-play ─────────────────────────────────────────────────────────────────
let autoSpinsLeft = 0;

function stopAuto() {
  state.autoPlay = false;
  clearTimeout(state.autoTimer);
  autoBtn.textContent = 'AUTO-TRAIN';
  autoBtn.classList.remove('active');
  autoCount.textContent = '';
}

function startAuto() {
  state.autoPlay = true;
  autoSpinsLeft = 20;
  autoBtn.textContent = 'STOP';
  autoBtn.classList.add('active');

  function tick() {
    if (!state.autoPlay || autoSpinsLeft <= 0) {
      stopAuto();
      return;
    }
    autoCount.textContent = `${autoSpinsLeft} spins left`;
    autoSpinsLeft--;
    spin().then(() => {
      if (state.autoPlay) {
        state.autoTimer = setTimeout(tick, 400);
      }
    });
  }
  tick();
}

autoBtn.addEventListener('click', () => {
  if (state.autoPlay) stopAuto();
  else startAuto();
});

// ── Bet controls ──────────────────────────────────────────────────────────────
betDown.addEventListener('click', () => {
  if (betIdx > 0) { betIdx--; updateStats(); }
});

betUp.addEventListener('click', () => {
  if (betIdx < BET_OPTIONS.length - 1) { betIdx++; updateStats(); }
});

// ── Spin button ───────────────────────────────────────────────────────────────
spinBtn.addEventListener('click', () => {
  if (!state.autoPlay) spin();
});

// ── Keyboard shortcut ─────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !state.autoPlay) {
    e.preventDefault();
    spin();
  }
});

// ── Welcome modal ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  updateStats();
  log('TokenSlot™ initialised. Model is warm and ready.', 'info');
  log('Starting balance: 1000 tokens. Good luck — you\'ll need it.', 'info');

  showModal(
    '🤖',
    'WELCOME TO TOKENSLOT™',
    'You\'ve been allocated 1,000 complimentary tokens.\n\nEach spin costs tokens. Win tokens. Lose tokens. Just like a real LLM API bill.\n\nPress SPACE or click SPIN to infer. Results are legally binding.',
  );
});
