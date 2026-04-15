'use strict';

// ─── Symbols ────────────────────────────────────────────────────────────────
const SYMBOLS = [
  { emoji: '🤖', name: 'AGI',         weight: 1  },
  { emoji: '🧠', name: 'Neural Net',  weight: 2  },
  { emoji: '💻', name: 'GPU',         weight: 3  },
  { emoji: '⚡', name: 'Token',       weight: 4  },
  { emoji: '📊', name: 'Training',    weight: 5  },
  { emoji: '🎲', name: 'Hallucination', weight: 6 },
  { emoji: '🔑', name: 'API Key',     weight: 5  },
  { emoji: '💸', name: 'Rate Limit',  weight: 4  },
];

const SYMBOL_POOL = SYMBOLS.flatMap(s => Array(s.weight).fill(s));

// ─── Paytable: three-of-a-kind multipliers ───────────────────────────────────
const THREE_OF_A_KIND = {
  '🤖': { mult: 50,  label: 'JACKPOT',   type: 'jackpot' },
  '🧠': { mult: 20,  label: 'BIG WIN',   type: 'jackpot' },
  '💻': { mult: 10,  label: 'GPU SURGE', type: 'win'     },
  '⚡': { mult: 8,   label: 'TOKEN RUSH',type: 'win'     },
  '📊': { mult: 5,   label: 'DATA LEAK', type: 'win'     },
  '🎲': { mult: 3,   label: 'HALLUCINATED WIN', type: 'win' },
  '🔑': { mult: 4,   label: 'KEY FOUND', type: 'win'     },
  '💸': { mult: 2,   label: 'RATE LIMIT BYPASSED', type: 'win' },
};
const TWO_OF_A_KIND_MULT = 1.5;

// ─── AI-themed messages ──────────────────────────────────────────────────────
const WIN_MESSAGES = {
  '🤖🤖🤖': [
    '🤖 AGI ACHIEVED! (Still just autocomplete though)',
    '🤖 Three robots walked into a bar. Nobody laughed — they predicted the punchline.',
    '🤖 Fully autonomous intelligence detected! Please verify with CAPTCHA.',
  ],
  '🧠🧠🧠': [
    '🧠 Neural alignment complete! Your loss function is negative — in a good way.',
    '🧠 Three neural nets agree: you\'re winning tokens!',
    '🧠 Emergent behavior detected: it\'s called luck.',
  ],
  '💻💻💻': [
    '💻 GPU cluster unlocked! Tokens mined at scale.',
    '💻 Three GPUs humming: CUDA cores converted to cash.',
    '💻 Your inference job finished first in the queue. Big win.',
  ],
  '⚡⚡⚡': [
    '⚡ Token surge! The context window overfloweth.',
    '⚡ Three tokens spawned three more. Tokenception.',
    '⚡ Prompt compression failed — too many winning tokens.',
  ],
  '📊📊📊': [
    '📊 Training data matched! You\'re overfit to winning.',
    '📊 Three datasets converged. Accuracy: 100%.',
    '📊 Your model generalizes well… to winning.',
  ],
  '🎲🎲🎲': [
    '🎲 You hallucinated a win — and it paid off.',
    '🎲 Three confident wrong answers, but the tokens are real.',
    '🎲 Model temperature set to maximum. Chaotically profitable.',
  ],
  '🔑🔑🔑': [
    '🔑 API keys rotated in your favor. Rate limit lifted!',
    '🔑 Three keys unlocked the treasury. Don\'t share them.',
    '🔑 SSH into the vault — tokens transferred.',
  ],
  '💸💸💸': [
    '💸 Rate limit bypassed! The inference is free.',
    '💸 Three rate limits, zero throttling. Chaos wins.',
    '💸 You found a billing exploit. Shhh.',
  ],
};

const PAIR_MESSAGES = [
  'Two of a kind. The model is 66% confident you\'re winning.',
  'Partial alignment detected. Small token reimbursement issued.',
  'Two matching latent vectors. Close enough to profit.',
  'Almost a jackpot — the model rounded down.',
  'A soft win. Like a softmax that almost peaked.',
];

const LOSE_MESSAGES = [
  'Tokens burned. This is the cost of intelligence.',
  'Inference failed. Tokens consumed, output: nothing.',
  'Model diverged. Your tokens are in the validation loss.',
  'Context window depleted. Results: inconclusive.',
  'The gradient descended — right into your wallet.',
  'Training step failed. Tokens evaporated.',
  'Attention mechanism paid no attention to winning.',
  'Your prompt was fine-tuned for losing.',
  'Negative reward signal detected. RL agent weeps.',
  'Loss function minimized your balance.',
  'The model hallucinated that you would win.',
  'Error 429: Token quota exceeded. Also you lost.',
  'Low confidence output: "you will lose." Correct.',
  'Predicted token: loss. Actual token: loss. F1 score: 1.0.',
  'Your embeddings were close, but not close enough.',
];

const NEAR_MISS_MESSAGES = [
  'So close! Two matched but the third hallucinated a different output.',
  'Almost aligned — the third neuron misfired.',
  'Two out of three ain\'t bad… except here it is.',
  'Near miss! The model almost converged.',
  'Tantalizingly close. The loss function teased you.',
];

const BROKE_MESSAGES = [
  '💔 Insufficient tokens. Your context window is empty.',
  '💔 Out of compute. Please subscribe to get more tokens.',
  '💔 Balance: 0. This is a deprecated API.',
  '💔 Token budget exhausted. Model going offline.',
];

// ─── State ───────────────────────────────────────────────────────────────────
const INITIAL_TOKENS = 100;
const BET_OPTIONS = [5, 10, 25, 50, 100];
const MAX_TOKENS = 10000;
const MAX_SPARKLINE = 40;

let state = {
  tokens: INITIAL_TOKENS,
  betIndex: 1,
  spinning: false,
  spins: 0,
  wins: 0,
  losses: 0,
  tokensWon: 0,
  tokensLost: 0,
  biggestWin: 0,
  streak: 0,
  resultHistory: [],
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const tokenCountEl     = document.getElementById('token-count');
const balanceBarEl     = document.getElementById('balance-bar');
const betAmountEl      = document.getElementById('bet-amount');
const spinCostEl       = document.getElementById('spin-cost');
const spinBtn          = document.getElementById('spin-btn');
const spinIcon         = spinBtn.querySelector('.spin-icon');
const betDownBtn       = document.getElementById('bet-down');
const betUpBtn         = document.getElementById('bet-up');
const messageBox       = document.getElementById('message-box');
const messageText      = document.getElementById('message-text');
const resetBtn         = document.getElementById('reset-btn');
const statSpins        = document.getElementById('stat-spins');
const statWins         = document.getElementById('stat-wins');
const statTokensWon    = document.getElementById('stat-tokens-won');
const statTokensLost   = document.getElementById('stat-tokens-lost');
const paytableBody     = document.getElementById('paytable-body');
const machineWrapper   = document.getElementById('machine-wrapper');
const machineBody      = document.getElementById('machine-body');
const particleContainer = document.getElementById('particle-container');
const floatContainer   = document.getElementById('float-container');
const themeToggle      = document.getElementById('theme-toggle');
const themeIcon        = document.getElementById('theme-icon');

const statWinrate   = document.getElementById('stat-winrate');
const statRoi       = document.getElementById('stat-roi');
const statStreak    = document.getElementById('stat-streak');
const statBiggest   = document.getElementById('stat-biggest');
const netValue      = document.getElementById('net-value');
const netBarFill    = document.getElementById('net-bar-fill');
const sparklineDots = document.getElementById('sparkline-dots');
const distWin       = document.getElementById('dist-win');
const distLoss      = document.getElementById('dist-loss');
const distWinCount  = document.getElementById('dist-win-count');
const distLossCount = document.getElementById('dist-loss-count');

const reelFrames = [0, 1, 2].map(i => document.getElementById(`frame-${i}`));
const reelEls    = [0, 1, 2].map(i => document.getElementById(`reel-${i}`));
const symbolEls  = [0, 1, 2].map(i => document.getElementById(`sym-${i}`));

// ─── rAF Spin State ──────────────────────────────────────────────────────────
const spinAnimations = [null, null, null];

// ─── Theme ───────────────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('ai-slots-theme');
  const theme = saved || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('ai-slots-theme', next);
}

themeToggle.addEventListener('click', toggleTheme);

// ─── Paytable Render ─────────────────────────────────────────────────────────
function buildPaytable() {
  const rows = Object.entries(THREE_OF_A_KIND)
    .sort((a, b) => b[1].mult - a[1].mult)
    .map(([emoji, info]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${emoji} ${emoji} ${emoji}</td>
        <td>×${info.mult}</td>
        <td>${info.label}</td>
      `;
      return tr;
    });

  const pairRow = document.createElement('tr');
  pairRow.innerHTML = `
    <td>Any two matching</td>
    <td>×${TWO_OF_A_KIND_MULT}</td>
    <td>Partial alignment</td>
  `;
  rows.push(pairRow);
  paytableBody.replaceChildren(...rows);
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick() {
  return SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
}

function updateTokenDisplay() {
  const clamped = Math.max(0, Math.min(state.tokens, MAX_TOKENS));
  tokenCountEl.textContent = state.tokens.toLocaleString();

  const pct = (clamped / MAX_TOKENS) * 100;
  balanceBarEl.style.width = Math.max(0, Math.min(100, pct)) + '%';

  if (state.tokens <= 10) {
    tokenCountEl.style.color = 'var(--neon-pink)';
    tokenCountEl.style.textShadow = '0 0 10px var(--neon-pink)';
  } else if (state.tokens >= 500) {
    tokenCountEl.style.color = 'var(--neon-green)';
    tokenCountEl.style.textShadow = '0 0 10px var(--neon-green)';
  } else {
    tokenCountEl.style.color = 'var(--neon-yellow)';
    tokenCountEl.style.textShadow = '0 0 10px var(--neon-yellow), 0 0 24px rgba(255,225,0,0.4)';
  }
}

function updateBetUI() {
  const bet = BET_OPTIONS[state.betIndex];
  betAmountEl.textContent = bet;
  spinCostEl.textContent = `-${bet} tokens`;
  betDownBtn.disabled = state.betIndex === 0;
  betUpBtn.disabled = state.betIndex === BET_OPTIONS.length - 1;
}

function setMessage(text, type = '') {
  messageBox.className = 'message-box' + (type ? ` ${type}` : '');
  messageText.textContent = text;
}

function updateStats() {
  statSpins.textContent = state.spins.toLocaleString();
  statWins.textContent = state.wins.toLocaleString();
  statTokensWon.textContent = state.tokensWon.toLocaleString();
  statTokensLost.textContent = state.tokensLost.toLocaleString();

  const winrate = state.spins > 0 ? ((state.wins / state.spins) * 100).toFixed(1) : '0.0';
  statWinrate.textContent = winrate + '%';

  const totalBet = state.tokensLost;
  const roi = totalBet > 0 ? (((state.tokensWon - totalBet) / totalBet) * 100).toFixed(1) : '0.0';
  statRoi.textContent = roi + '%';

  const streakAbs = Math.abs(state.streak);
  const streakPrefix = state.streak > 0 ? 'W' : state.streak < 0 ? 'L' : '';
  statStreak.textContent = streakPrefix + streakAbs;
  if (state.streak > 0) {
    statStreak.className = 'stat-value stat-accent-lime';
  } else if (state.streak < 0) {
    statStreak.className = 'stat-value stat-accent-amber';
    statStreak.style.color = 'var(--neon-rose)';
  } else {
    statStreak.className = 'stat-value stat-accent-lime';
    statStreak.style.color = '';
  }

  statBiggest.textContent = state.biggestWin.toLocaleString();

  updateNetProfit();
  updateSparkline();
  updateDistribution();
}

function updateNetProfit() {
  const net = state.tokensWon - state.tokensLost;
  netValue.textContent = (net >= 0 ? '+' : '') + net.toLocaleString();
  netValue.className = 'net-value ' + (net > 0 ? 'positive' : net < 0 ? 'negative' : 'zero');

  const maxRange = Math.max(state.tokensWon, state.tokensLost, 100);
  const ratio = net / maxRange;
  const barWidth = Math.min(Math.abs(ratio) * 50, 48);

  if (net >= 0) {
    netBarFill.style.left = '50%';
    netBarFill.style.width = barWidth + '%';
    netBarFill.className = 'net-bar-fill positive';
  } else {
    netBarFill.style.left = (50 - barWidth) + '%';
    netBarFill.style.width = barWidth + '%';
    netBarFill.className = 'net-bar-fill negative';
  }
}

function updateSparkline() {
  const recent = state.resultHistory.slice(-MAX_SPARKLINE);
  sparklineDots.innerHTML = '';
  recent.forEach(r => {
    const dot = document.createElement('div');
    dot.className = 'sparkline-dot ' + r;
    sparklineDots.appendChild(dot);
  });
}

function updateDistribution() {
  const total = state.wins + state.losses;
  if (total === 0) {
    distWin.style.width = '0%';
    distLoss.style.width = '0%';
  } else {
    distWin.style.width = ((state.wins / total) * 100) + '%';
    distLoss.style.width = ((state.losses / total) * 100) + '%';
  }
  distWinCount.textContent = state.wins;
  distLossCount.textContent = state.losses;
}

function setSpinning(active) {
  state.spinning = active;
  spinBtn.disabled = active;
  betDownBtn.disabled = active || state.betIndex === 0;
  betUpBtn.disabled = active || state.betIndex === BET_OPTIONS.length - 1;

  if (active) {
    spinIcon.classList.add('spinning');
  } else {
    spinIcon.classList.remove('spinning');
  }
}

function flashReels(cls) {
  reelFrames.forEach(f => f.classList.add(cls));
  setTimeout(() => reelFrames.forEach(f => f.classList.remove(cls)), 1800);
}

// ─── rAF-based Symbol Cycling ───────────────────────────────────────────────
function startReelAnimation(index) {
  const symbolEl = symbolEls[index];
  let lastSwap = 0;
  const interval = 70 + index * 10;

  function tick(timestamp) {
    if (!spinAnimations[index]) return;
    if (timestamp - lastSwap >= interval) {
      symbolEl.textContent = weightedPick().emoji;
      lastSwap = timestamp;
    }
    spinAnimations[index] = requestAnimationFrame(tick);
  }
  spinAnimations[index] = requestAnimationFrame(tick);
}

function stopReelAnimation(index) {
  if (spinAnimations[index]) {
    cancelAnimationFrame(spinAnimations[index]);
    spinAnimations[index] = null;
  }
}

function stopReel(index, symbol) {
  return new Promise(resolve => {
    stopReelAnimation(index);
    symbolEls[index].textContent = symbol.emoji;
    symbolEls[index].setAttribute('aria-label', symbol.name);

    reelEls[index].style.transition = 'none';
    reelEls[index].style.transform = 'translateY(-12px)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        reelEls[index].style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        reelEls[index].style.transform = 'translateY(0)';
        setTimeout(() => {
          reelEls[index].style.transition = '';
          resolve();
        }, 220);
      });
    });
  });
}

// ─── Particle System ─────────────────────────────────────────────────────────
const NEON_COLORS = [
  '#00d4ff', '#bf00ff', '#00ff88', '#ff00aa', '#ffe100',
  '#ff8c00', '#00e5c8', '#ff3366', '#a8ff00', '#6366f1',
];

function spawnParticles(count, origin, colors, spread, sizeRange, duration) {
  const rect = origin ? origin.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.background = color;
    p.style.boxShadow = `0 0 ${size * 2}px ${color}`;
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';

    particleContainer.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = spread[0] + Math.random() * (spread[1] - spread[0]);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 40;
    const dur = duration[0] + Math.random() * (duration[1] - duration[0]);

    p.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 },
    ], {
      duration: dur,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards',
    }).onfinish = () => p.remove();
  }
}

function spawnConfetti(count) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    const w = 4 + Math.random() * 6;
    const h = w * (1.5 + Math.random());
    p.style.width = w + 'px';
    p.style.height = h + 'px';
    p.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
    p.style.background = color;
    p.style.boxShadow = `0 0 6px ${color}`;
    p.style.left = (Math.random() * window.innerWidth) + 'px';
    p.style.top = '-20px';

    particleContainer.appendChild(p);

    const drift = (Math.random() - 0.5) * 200;
    const fall = window.innerHeight + 100;
    const dur = 2000 + Math.random() * 2000;
    const delay = Math.random() * 800;

    p.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${drift}px, ${fall}px) rotate(${360 + Math.random() * 720}deg)`, opacity: 0.3 },
    ], {
      duration: dur,
      delay: delay,
      easing: 'ease-in',
      fill: 'forwards',
    }).onfinish = () => p.remove();
  }
}

// ─── Floating Text ───────────────────────────────────────────────────────────
function spawnFloatText(text, color) {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.color = color;

  const rect = machineBody.getBoundingClientRect();
  el.style.left = (rect.left + rect.width / 2 - 60) + 'px';
  el.style.top = (rect.top + 20) + 'px';

  floatContainer.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

// ─── Screen Shake ────────────────────────────────────────────────────────────
function triggerShake(type) {
  machineWrapper.classList.remove('shake', 'shake-subtle');
  void machineWrapper.offsetWidth;
  machineWrapper.classList.add(type);
  setTimeout(() => machineWrapper.classList.remove(type), 500);
}

// ─── Neon Flash Overlay ──────────────────────────────────────────────────────
function triggerNeonFlash() {
  const overlay = document.createElement('div');
  overlay.className = 'neon-flash-overlay';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 300);
}

// ─── Machine Body Glow ──────────────────────────────────────────────────────
function triggerBodyGlow(type) {
  machineBody.classList.remove('glow-pulse', 'jackpot-glow');
  void machineBody.offsetWidth;
  machineBody.classList.add(type);
  setTimeout(() => machineBody.classList.remove(type), 3000);
}

// ─── Win Symbol Bounce ──────────────────────────────────────────────────────
function bounceSymbols(type) {
  symbolEls.forEach(el => {
    el.classList.remove('bounce-win', 'bounce-jackpot');
    void el.offsetWidth;
    el.classList.add(type);
  });
  setTimeout(() => symbolEls.forEach(el => el.classList.remove(type)), 2500);
}

// ─── Spin Logic ───────────────────────────────────────────────────────────────
async function spin() {
  const bet = BET_OPTIONS[state.betIndex];

  if (state.tokens < bet) {
    setMessage(pick(BROKE_MESSAGES), 'broke');
    return;
  }

  setSpinning(true);
  state.tokens -= bet;
  state.tokensLost += bet;
  state.spins++;
  updateTokenDisplay();
  setMessage('Running inference...', '');

  const results = [weightedPick(), weightedPick(), weightedPick()];

  reelFrames.forEach(f => {
    f.classList.remove('win-flash', 'loss-flash', 'near-miss-flash');
  });

  for (let i = 0; i < 3; i++) {
    startReelAnimation(i);
  }

  const REEL_DELAYS = [800, 1200, 1600];
  for (let i = 0; i < 3; i++) {
    await new Promise(r => setTimeout(r, i === 0 ? REEL_DELAYS[0] : REEL_DELAYS[i] - REEL_DELAYS[i - 1]));
    await stopReel(i, results[i]);
  }

  evaluateResult(results, bet);
  setSpinning(false);
}

function isNearMiss(a, b, c) {
  if (a === b && b === c) return false;
  return a === b || b === c || a === c;
}

function evaluateResult(results, bet) {
  const [a, b, c] = results;
  const key = `${a.emoji}${b.emoji}${c.emoji}`;

  if (a.emoji === b.emoji && b.emoji === c.emoji) {
    // Three of a kind
    const info = THREE_OF_A_KIND[a.emoji];
    const payout = Math.round(bet * info.mult);
    state.tokens += payout;
    state.tokensWon += payout;
    state.wins++;
    state.streak = state.streak > 0 ? state.streak + 1 : 1;
    if (payout > state.biggestWin) state.biggestWin = payout;
    state.resultHistory.push('win');

    flashReels('win-flash');

    const msgs = WIN_MESSAGES[key];
    const msg = msgs ? pick(msgs) : `${info.label}! ×${info.mult} — ${payout} tokens earned.`;
    setMessage(`${msg}\n+${payout} tokens`, info.type);

    spawnFloatText(`+${payout} tokens!`, info.type === 'jackpot' ? '#ffe100' : '#00ff88');

    if (info.type === 'jackpot') {
      triggerShake('shake');
      triggerNeonFlash();
      triggerBodyGlow('jackpot-glow');
      bounceSymbols('bounce-jackpot');
      spawnParticles(50, machineBody, NEON_COLORS, [80, 250], [3, 8], [800, 1600]);
      spawnConfetti(60);
    } else {
      triggerShake('shake');
      triggerBodyGlow('glow-pulse');
      bounceSymbols('bounce-win');
      spawnParticles(25, machineBody, ['#00ff88', '#00d4ff', '#00e5c8', '#a8ff00'], [50, 150], [2, 6], [600, 1200]);
    }

  } else if (a.emoji === b.emoji || b.emoji === c.emoji || a.emoji === c.emoji) {
    // Two of a kind
    const payout = Math.round(bet * TWO_OF_A_KIND_MULT);
    state.tokens += payout;
    state.tokensWon += payout;
    state.wins++;
    state.streak = state.streak > 0 ? state.streak + 1 : 1;
    if (payout > state.biggestWin) state.biggestWin = payout;
    state.resultHistory.push('win');

    const net = payout - bet;
    const netStr = net >= 0 ? `+${net}` : `${net}`;
    setMessage(`${pick(PAIR_MESSAGES)} +${payout} tokens (net: ${netStr})`, 'win');
    flashReels('win-flash');
    spawnFloatText(`+${payout}`, '#00ff88');
    bounceSymbols('bounce-win');

  } else {
    // Loss
    state.losses++;
    state.streak = state.streak < 0 ? state.streak - 1 : -1;

    const nearMiss = isNearMissCheck(a.emoji, b.emoji, c.emoji);
    if (nearMiss) {
      state.resultHistory.push('near-miss');
      setMessage(pick(NEAR_MISS_MESSAGES), 'near-miss');
      flashReels('near-miss-flash');
      triggerShake('shake-subtle');
    } else {
      state.resultHistory.push('loss');
      setMessage(pick(LOSE_MESSAGES), 'lose');
      flashReels('loss-flash');
      triggerShake('shake-subtle');
    }
  }

  updateTokenDisplay();
  updateStats();

  if (state.tokens <= 0) {
    state.tokens = 0;
    updateTokenDisplay();
    setTimeout(() => setMessage(pick(BROKE_MESSAGES), 'broke'), 400);
  }
}

function isNearMissCheck(a, b, c) {
  const counts = {};
  [a, b, c].forEach(x => { counts[x] = (counts[x] || 0) + 1; });
  return Object.values(counts).includes(2);
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
spinBtn.addEventListener('click', () => {
  if (!state.spinning) spin();
});

betDownBtn.addEventListener('click', () => {
  if (state.betIndex > 0) {
    state.betIndex--;
    updateBetUI();
  }
});

betUpBtn.addEventListener('click', () => {
  if (state.betIndex < BET_OPTIONS.length - 1) {
    state.betIndex++;
    updateBetUI();
  }
});

resetBtn.addEventListener('click', () => {
  state = {
    tokens: INITIAL_TOKENS,
    betIndex: 1,
    spinning: false,
    spins: 0,
    wins: 0,
    losses: 0,
    tokensWon: 0,
    tokensLost: 0,
    biggestWin: 0,
    streak: 0,
    resultHistory: [],
  };
  symbolEls.forEach(el => { el.textContent = ''; });
  reelFrames.forEach(f => f.className = 'reel-frame');
  updateTokenDisplay();
  updateBetUI();
  updateStats();
  setMessage('Insert tokens to begin inference...', '');
});

document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'Enter') && document.activeElement === document.body) {
    e.preventDefault();
    if (!state.spinning) spin();
  }
});

// ─── Init ────────────────────────────────────────────────────────────────────
initTheme();
buildPaytable();
updateTokenDisplay();
updateBetUI();
updateStats();
setMessage('Insert tokens to begin inference...', '');
