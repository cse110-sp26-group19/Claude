/* ═══════════════════════════════════════
   TOKEN CASINO — script.js
   ═══════════════════════════════════════ */

'use strict';

// ── Symbols ────────────────────────────────────────────────────────────────
const SYMBOLS = [
  { emoji: '🤖', name: 'Robot',       weight: 6  },
  { emoji: '🧠', name: 'Hallucination', weight: 6  },
  { emoji: '⚡', name: 'Compute',     weight: 8  },
  { emoji: '💾', name: 'Training Data', weight: 8  },
  { emoji: '🎲', name: 'Randomness',  weight: 10 },
  { emoji: '📉', name: 'AI Winter',   weight: 8  },
  { emoji: '🔥', name: 'On Fire',     weight: 6  },
  { emoji: '💬', name: 'Token',       weight: 5  },
  { emoji: '📝', name: 'Prompt',      weight: 7  },
  { emoji: '🪄', name: 'Magic',       weight: 4  },
];

// Build weighted pool
const POOL = [];
SYMBOLS.forEach(s => { for (let i = 0; i < s.weight; i++) POOL.push(s); });

// ── Payouts ────────────────────────────────────────────────────────────────
// Each entry: [sym0, sym1, sym2, multiplier, label, emoji, quip]
// null = wildcard (any)
const PAYOUTS = [
  { match: ['💬','💬','💬'], mult: 50,  label: 'Token Jackpot!',     emoji: '🏆', quip: 'You mined 50× your bet in tokens. OpenAI is shaking.' },
  { match: ['🤖','🤖','🤖'], mult: 40,  label: 'AGI Achieved!',      emoji: '🤖', quip: 'Congratulations! This is not AGI. But enjoy the tokens.' },
  { match: ['🧠','🧠','🧠'], mult: 35,  label: 'Full Hallucination!', emoji: '🌀', quip: 'Three confident brains, zero correct facts.' },
  { match: ['🔥','🔥','🔥'], mult: 30,  label: 'Model is On Fire!',   emoji: '🔥', quip: 'Your GPU costs just became someone else\'s problem.' },
  { match: ['🪄','🪄','🪄'], mult: 25,  label: 'Pure Stochasticism!', emoji: '✨', quip: 'It\'s not magic — it\'s just matrix multiplication. Very fast.' },
  { match: ['⚡','⚡','⚡'], mult: 20,  label: 'Infinite Compute!',   emoji: '⚡', quip: 'The power bill has entered the chat.' },
  { match: ['💾','💾','💾'], mult: 15,  label: 'Training Complete!',  emoji: '💾', quip: 'Scraped from the internet without consent. Classic.' },
  { match: ['📝','📝','📝'], mult: 12,  label: 'Prompt Aligned!',     emoji: '📝', quip: 'Your prompt was so good, the model actually listened.' },
  { match: ['🎲','🎲','🎲'], mult: 10,  label: 'Stochastic Win!',     emoji: '🎲', quip: 'Temperature=1.0 pays off. Who knew?' },
  { match: ['📉','📉','📉'], mult: 8,   label: 'AI Winter Bonus?!',   emoji: '❄️', quip: 'Somehow you profit from the downturn. Contrarian genius.' },
  // Pairs
  { match: ['🤖','🤖', null], mult: 3,   label: 'Two Robots',         emoji: '🤖', quip: 'They\'re conspiring. Be careful.' },
  { match: ['💬','💬', null], mult: 3,   label: 'Two Tokens',         emoji: '💬', quip: 'Almost rich. Almost.' },
  { match: ['🧠','🧠', null], mult: 2,   label: 'Double Brain',       emoji: '🧠', quip: 'Twice the intelligence, same amount of hallucination.' },
  { match: ['🔥','🔥', null], mult: 2,   label: 'Two Fires',          emoji: '🔥', quip: 'It\'s getting warm in here.' },
  { match: [null,'💬', null], mult: 1.5, label: 'Token Anywhere',     emoji: '💬', quip: 'A token in the middle — just like most LLM outputs.' },
];

// ── Messages ────────────────────────────────────────────────────────────────
const IDLE_MSGS = [
  'Insert tokens to begin hallucinating…',
  'This machine accepts tokens and your dignity.',
  'The house always wins. The house is GPT-4.',
  'Spinning costs compute. Compute costs money. You don\'t have money.',
  'Previous spin: statistically independent. Model disagrees.',
  'Losses are just negative tokens. Tomato, tomato.',
  'Not financial advice. Not medical advice. Not even good advice.',
  'Your context window is filling up. Spin faster.',
];

const LOSE_MSGS = [
  'Output: null. Confidence: 97%.',
  'The model tried its best. It wasn\'t enough.',
  'Tokens burned. No refunds. RLHF cannot fix this.',
  'Loss function minimized — in your wallet.',
  'That spin was rate-limited by fate.',
  'Training error: your luck diverged from expectation.',
  'The reward signal was negative. Try again.',
  'Model collapsed. Try lowering your expectations.',
  'Insufficient training data on "winning".',
  'This is fine. 🔥 (It is not fine.)',
  'Your tokens have been deprecated.',
  'Gradient descent toward bankruptcy.',
  'Inference complete. Results: unfortunate.',
];

// ── Light colors ────────────────────────────────────────────────────────────
const LIGHT_COLORS = ['#ffd700','#ff4757','#2ed573','#4cc9f0','#9d4edd','#ff6b6b','#ffffff'];

// ── State ───────────────────────────────────────────────────────────────────
let balance   = 1000;
let bet       = 10;
let totalWon  = 0;
let totalLost = 0;
let spinning  = false;
let lightInterval;

// ── DOM refs ────────────────────────────────────────────────────────────────
const balanceEl   = document.getElementById('balance');
const betEl       = document.getElementById('bet');
const spinCostEl  = document.getElementById('spin-cost');
const totalWonEl  = document.getElementById('total-won');
const totalLostEl = document.getElementById('total-lost');
const spinBtn     = document.getElementById('spin-btn');
const betUpBtn    = document.getElementById('bet-up');
const betDownBtn  = document.getElementById('bet-down');
const maxBetBtn   = document.getElementById('max-bet-btn');
const resetBtn    = document.getElementById('reset-btn');
const msgText     = document.getElementById('message-text');
const machine     = document.querySelector('.machine');
const winOverlay  = document.getElementById('win-overlay');
const winEmoji    = document.getElementById('win-emoji');
const winTitle    = document.getElementById('win-title');
const winAmount   = document.getElementById('win-amount');
const winQuip     = document.getElementById('win-quip');

// ── Audio ────────────────────────────────────────────────────────────────────
const ctx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type = 'sine', duration = 0.1, vol = 0.15, delay = 0) {
  const t  = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

function playSpinSound() {
  for (let i = 0; i < 8; i++) {
    playTone(200 + Math.random() * 400, 'sawtooth', 0.08, 0.05, i * 0.06);
  }
}

function playWinSound(big = false) {
  if (big) {
    [523, 659, 784, 1047].forEach((f, i) => playTone(f, 'square', 0.25, 0.15, i * 0.12));
    setTimeout(() => [1047, 1319, 1568].forEach((f, i) => playTone(f, 'sine', 0.35, 0.2, i * 0.1)), 600);
  } else {
    [440, 554, 659].forEach((f, i) => playTone(f, 'sine', 0.2, 0.12, i * 0.08));
  }
}

function playLoseSound() {
  playTone(220, 'sawtooth', 0.3, 0.1);
  playTone(180, 'sawtooth', 0.3, 0.1, 0.15);
  playTone(150, 'triangle', 0.4, 0.08, 0.32);
}

function playCoinSound() {
  for (let i = 0; i < 4; i++) {
    playTone(880 + i * 110, 'sine', 0.06, 0.1, i * 0.04);
  }
}

// ── Stars ───────────────────────────────────────────────────────────────────
function initStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      --dur:${2+Math.random()*4}s;
      --delay:${Math.random()*5}s;
    `;
    container.appendChild(s);
  }
}

// ── Lights ──────────────────────────────────────────────────────────────────
function initLights() {
  ['lights-top','lights-bottom'].forEach(id => {
    const row = document.getElementById(id);
    for (let i = 0; i < 12; i++) {
      const l = document.createElement('div');
      l.className = 'casino-light';
      l.dataset.idx = i;
      row.appendChild(l);
    }
  });
}

function startLights() {
  let step = 0;
  lightInterval = setInterval(() => {
    document.querySelectorAll('.casino-light').forEach((l, i) => {
      const on = (i + step) % 3 === 0;
      const color = on ? LIGHT_COLORS[(i + step) % LIGHT_COLORS.length] : '#1a1a30';
      l.style.setProperty('--c', color);
    });
    step++;
  }, 180);
}

function flashAllLights() {
  document.querySelectorAll('.casino-light').forEach(l => {
    l.style.setProperty('--c', '#fff');
  });
  setTimeout(() => {}, 300);
}

// ── Reels ───────────────────────────────────────────────────────────────────
const REEL_COUNT  = 3;
const STRIP_LEN   = 30; // cells in each reel strip
let reelStates = []; // current top-symbol index for each reel

function buildReelStrip(reelIdx) {
  const strip = document.getElementById(`reel-strip-${reelIdx}`);
  strip.innerHTML = '';
  // Populate with random symbols
  const symbols = [];
  for (let i = 0; i < STRIP_LEN; i++) {
    symbols.push(POOL[Math.floor(Math.random() * POOL.length)]);
  }
  reelStates[reelIdx] = { symbols, topIdx: 0 };

  symbols.forEach((s, i) => {
    const cell = document.createElement('div');
    cell.className = 'reel-cell';
    cell.textContent = s.emoji;
    cell.dataset.idx = i;
    strip.appendChild(cell);
  });

  // Show cells 0,1,2 initially (center = 1 = payline)
  positionReel(reelIdx, 0);
}

function positionReel(reelIdx, topIdx) {
  const strip = document.getElementById(`reel-strip-${reelIdx}`);
  const cellH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-h')) || 100;
  strip.style.transform = `translateY(-${topIdx * cellH}px)`;
  reelStates[reelIdx].topIdx = topIdx;
}

function getVisibleSymbols(reelIdx) {
  const { symbols, topIdx } = reelStates[reelIdx];
  const len = symbols.length;
  return [
    symbols[(topIdx)     % len],
    symbols[(topIdx + 1) % len],
    symbols[(topIdx + 2) % len],
  ];
}

// Returns the middle (payline) symbol
function getPaylineSymbol(reelIdx) {
  return getVisibleSymbols(reelIdx)[1];
}

// ── Reel Spin ────────────────────────────────────────────────────────────────
function spinReel(reelIdx, finalTopIdx) {
  return new Promise(resolve => {
    const { symbols } = reelStates[reelIdx];
    const cellH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-h')) || 100;
    const strip = document.getElementById(`reel-strip-${reelIdx}`);
    const delay = reelIdx * 220; // stagger

    const extraSpins = (5 + reelIdx * 3) * symbols.length; // full rotations
    let current = reelStates[reelIdx].topIdx;
    let target  = current + extraSpins + ((finalTopIdx - current % symbols.length + symbols.length) % symbols.length);

    // CSS transition-based approach — we manually tick with requestAnimationFrame
    const startTime = performance.now() + delay;
    const duration  = 1200 + reelIdx * 350;

    function easeOutBack(t) {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    function tick(now) {
      if (now < startTime) { requestAnimationFrame(tick); return; }
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutBack(t);
      const pos = (current + (target - current) * eased) % symbols.length;
      const clampedPos = ((Math.round(pos) % symbols.length) + symbols.length) % symbols.length;

      strip.style.transition = 'none';
      strip.style.transform = `translateY(-${pos * cellH}px)`;

      if (t >= 1) {
        reelStates[reelIdx].topIdx = clampedPos;
        positionReel(reelIdx, finalTopIdx);
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  });
}

// ── Payout Check ─────────────────────────────────────────────────────────────
function checkPayout(results) {
  // results = [sym0, sym1, sym2] (payline symbols)
  for (const payout of PAYOUTS) {
    let match = true;
    for (let i = 0; i < 3; i++) {
      if (payout.match[i] !== null && payout.match[i] !== results[i].emoji) {
        match = false;
        break;
      }
    }
    if (match) return payout;
  }
  return null;
}

// ── Particles ────────────────────────────────────────────────────────────────
function spawnParticles(count = 15, fromEl) {
  const rect   = fromEl ? fromEl.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width: 0, height: 0 };
  const emojis = ['💰','⭐','✨','🪙','💎','🎉'];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const x = rect.left + rect.width/2 + (Math.random() - .5) * 200;
    const y = rect.top  + rect.height/2 + (Math.random() - .5) * 100;
    p.style.cssText = `left:${x}px; top:${y}px; --dur:${.8 + Math.random() * .8}s;`;
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

// ── Message ──────────────────────────────────────────────────────────────────
function setMessage(text) {
  msgText.style.opacity = 0;
  setTimeout(() => {
    msgText.textContent = text;
    msgText.style.opacity = 1;
  }, 200);
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Win Overlay ───────────────────────────────────────────────────────────────
function showWin(payout, amount) {
  winEmoji.textContent  = payout.emoji;
  winTitle.textContent  = payout.label;
  winAmount.textContent = `+${amount} tokens`;
  winQuip.textContent   = payout.quip;
  winOverlay.classList.add('show');
  setTimeout(() => winOverlay.classList.remove('show'), 2800);
}

// ── Highlight winning cells ───────────────────────────────────────────────────
function highlightWinners(reelIndices = [0,1,2]) {
  // Remove old
  document.querySelectorAll('.reel-cell.winner').forEach(c => c.classList.remove('winner'));
  const cellH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-h')) || 100;

  reelIndices.forEach(ri => {
    const strip = document.getElementById(`reel-strip-${ri}`);
    const topIdx = reelStates[ri].topIdx;
    const paylineLocal = (topIdx + 1) % reelStates[ri].symbols.length; // middle cell
    const cells = strip.querySelectorAll('.reel-cell');
    if (cells[paylineLocal]) cells[paylineLocal].classList.add('winner');
  });
}

// ── Update HUD ────────────────────────────────────────────────────────────────
function updateHUD() {
  balanceEl.textContent  = balance.toLocaleString();
  betEl.textContent      = bet.toLocaleString();
  spinCostEl.textContent = `(-${bet} tokens)`;
  totalWonEl.textContent  = totalWon.toLocaleString();
  totalLostEl.textContent = totalLost.toLocaleString();
  spinBtn.disabled = spinning || balance < bet;
}

// ── Determine final reel positions ───────────────────────────────────────────
function pickFinalPositions() {
  // Randomly pick a destination top-index for each reel
  // The payline symbol = symbols[(topIdx+1) % len]
  const positions = [];
  const results   = [];

  for (let r = 0; r < REEL_COUNT; r++) {
    const { symbols } = reelStates[r];
    const finalTop = Math.floor(Math.random() * symbols.length);
    positions.push(finalTop);
    // payline = index finalTop+1
    results.push(symbols[(finalTop + 1) % symbols.length]);
  }
  return { positions, results };
}

// ── Main Spin ─────────────────────────────────────────────────────────────────
async function spin() {
  if (spinning || balance < bet) return;
  ctx.resume(); // resume audio context after user gesture

  spinning = true;
  spinBtn.disabled = true;
  balance -= bet;
  totalLost += bet;
  updateHUD();
  setMessage('Burning your tokens…');
  playSpinSound();

  // Remove previous winners
  document.querySelectorAll('.reel-cell.winner').forEach(c => c.classList.remove('winner'));

  const { positions, results } = pickFinalPositions();

  // Spin all reels concurrently (each with internal stagger)
  await Promise.all([0,1,2].map(r => spinReel(r, positions[r])));

  // Check result
  const payout = checkPayout(results);

  if (payout) {
    const won = Math.round(bet * payout.mult);
    balance  += won;
    totalWon += won;
    totalLost -= bet; // doesn't count as a net loss if we won
    // (totalLost was already incremented; let's track raw bets separately for simplicity — revert that logic)
    // Actually keep it simple: totalLost always counts the bet cost, totalWon adds wins.
    updateHUD();

    const big = payout.mult >= 20;
    if (big) {
      machine.classList.add('jackpot');
      setTimeout(() => machine.classList.remove('jackpot'), 2500);
      spawnParticles(30, machine);
      flashAllLights();
    } else {
      spawnParticles(12, machine);
    }

    highlightWinners([0,1,2]);
    playWinSound(big);
    showWin(payout, won);
    setMessage(`${payout.emoji} ${payout.label} — ${payout.quip}`);
    playCoinSound();
  } else {
    updateHUD();
    playLoseSound();
    setMessage(randomFrom(LOSE_MSGS));
  }

  spinning = false;
  updateHUD();

  // Refresh idle message after a while if no spin
  if (balance < bet) {
    setMessage('Insufficient tokens. Click REFILL CONTEXT to continue your suffering.');
  }
}

// ── Paytable ──────────────────────────────────────────────────────────────────
function buildPaytable() {
  const grid = document.getElementById('paytable');
  PAYOUTS.forEach(p => {
    const row = document.createElement('div');
    row.className = 'pay-row';
    const combo = p.match.map(m => m ?? '?').join('');
    row.innerHTML = `
      <span class="pay-combo">${combo}</span>
      <span style="font-size:.7rem;color:#666">${p.label.split('!')[0]}</span>
      <span class="pay-multiplier">${p.mult}×</span>
    `;
    grid.appendChild(row);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  initStars();
  initLights();
  startLights();

  for (let r = 0; r < REEL_COUNT; r++) buildReelStrip(r);

  buildPaytable();
  updateHUD();

  // Controls
  spinBtn.addEventListener('click', spin);

  betUpBtn.addEventListener('click', () => {
    bet = Math.min(bet + 10, Math.min(balance, 500));
    updateHUD();
  });

  betDownBtn.addEventListener('click', () => {
    bet = Math.max(bet - 10, 10);
    updateHUD();
  });

  maxBetBtn.addEventListener('click', () => {
    bet = Math.min(balance, 500);
    updateHUD();
  });

  resetBtn.addEventListener('click', () => {
    if (spinning) return;
    balance = 1000;
    bet     = 10;
    totalWon  = 0;
    totalLost = 0;
    updateHUD();
    setMessage('Context window refilled. You have been given 1000 fresh tokens. Spend them wisely. (You won\'t.)');
  });

  // Click overlay to dismiss
  winOverlay.addEventListener('click', () => winOverlay.classList.remove('show'));

  // Idle messages
  setInterval(() => {
    if (!spinning) setMessage(randomFrom(IDLE_MSGS));
  }, 6000);

  // Keyboard shortcut: Space to spin
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !e.repeat) { e.preventDefault(); spin(); }
  });
}

document.addEventListener('DOMContentLoaded', init);
