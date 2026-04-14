/* ============================================================
   AI Token Slot Machine  –  app.js
   ============================================================ */

'use strict';

// ── Symbol definitions ────────────────────────────────────────
const SYMBOLS = [
  { id: 'hallucination', emoji: '🧠', label: 'Hallucination', weight: 20, payout: 2 },
  { id: 'prompt',        emoji: '💬', label: 'Prompt',        weight: 18, payout: 3 },
  { id: 'token',         emoji: '🪙', label: 'Token',         weight: 16, payout: 4 },
  { id: 'context',       emoji: '📄', label: 'Context',       weight: 14, payout: 5 },
  { id: 'bias',          emoji: '⚖️',  label: 'Bias',          weight: 12, payout: 6 },
  { id: 'overfitting',   emoji: '🎰', label: 'Overfit',       weight: 10, payout: 8 },
  { id: 'rlhf',          emoji: '🦾', label: 'RLHF',          weight:  7, payout: 12 },
  { id: 'gpt',           emoji: '🤖', label: 'GPT-∞',         weight:  5, payout: 20 },
  { id: 'agi',           emoji: '👁️',  label: 'AGI SOON',      weight:  2, payout: 50 },
  { id: 'singularity',   emoji: '🌌', label: 'SINGULARITY',   weight:  1, payout: 200 },
];

// Build weighted pool
const POOL = [];
for (const sym of SYMBOLS) {
  for (let i = 0; i < sym.weight; i++) POOL.push(sym);
}

// ── Win messages (flavour text) ───────────────────────────────
const WIN_LINES = [
  'Model predicted your luck correctly.',
  'Tokens acquired. Capitalism simulated.',
  'Your prompt was statistically optimal.',
  'Loss function minimised on your behalf.',
  'The gradient descended in your favour.',
  'Context window expanded. Riches ensued.',
  'Reward model says: you are valued.',
  'Alignment achieved... for now.',
  'Supervised learning: win classification.',
];

const LOSE_LINES = [
  'Rate limit reached. Tokens deducted.',
  'Context window overflowed your wallet.',
  'Model confidently lost your tokens.',
  'Hallucinated a win. It wasn\'t real.',
  'Temperature too high. Chaos ensued.',
  'Insufficient training data on winning.',
  'Prompt injection failed. Try again.',
  'AI safety team blocked the jackpot.',
  'Model deprecated. Tokens also deprecated.',
  'Token budget exceeded. Please subscribe.',
  'Fine-tuned for losing. Working as intended.',
];

const JACKPOT_LINES = [
  '🌌 THE SINGULARITY HAS ARRIVED. AND IT OWED YOU MONEY.',
  '👁️ AGI ACHIEVED. FIRST ACT: PAY OUT YOUR TOKENS.',
  '🤖 GPT-∞ SAYS: CONGRATULATIONS, MEATBAG.',
];

// ── State ─────────────────────────────────────────────────────
const INITIAL_TOKENS = 100;
let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('aiSlotMachine'));
    if (saved && typeof saved.tokens === 'number') return saved;
  } catch (_) {}
  return { tokens: INITIAL_TOKENS, totalWon: 0, totalLost: 0, spins: 0, history: [] };
}

function saveState() {
  localStorage.setItem('aiSlotMachine', JSON.stringify(state));
}

// ── DOM refs ──────────────────────────────────────────────────
const tokenCountEl  = document.getElementById('token-count');
const betDisplayEl  = document.getElementById('bet-display');
const winDisplayEl  = document.getElementById('win-display');
const spinBtn       = document.getElementById('spin-btn');
const betUpBtn      = document.getElementById('bet-up');
const betDownBtn    = document.getElementById('bet-down');
const betMaxBtn     = document.getElementById('bet-max');
const resetBtn      = document.getElementById('reset-btn');
const messageEl     = document.getElementById('message');
const historyLog    = document.getElementById('history-log');
const reelsWindow   = document.querySelector('.reels-window');
const flashOverlay  = document.getElementById('flash-overlay');

const reelEls = [
  document.getElementById('reel-0'),
  document.getElementById('reel-1'),
  document.getElementById('reel-2'),
];

// ── Bet ───────────────────────────────────────────────────────
const BET_OPTIONS = [1, 2, 5, 10, 20, 50];
let betIndex = 1; // default: 2 tokens

function currentBet() { return BET_OPTIONS[betIndex]; }

function updateBetUI() {
  betDisplayEl.textContent = currentBet();
  betDownBtn.disabled = betIndex === 0;
  betUpBtn.disabled   = betIndex === BET_OPTIONS.length - 1;
}

betUpBtn.addEventListener('click', () => {
  if (betIndex < BET_OPTIONS.length - 1) { betIndex++; updateBetUI(); }
});
betDownBtn.addEventListener('click', () => {
  if (betIndex > 0) { betIndex--; updateBetUI(); }
});
betMaxBtn.addEventListener('click', () => {
  betIndex = BET_OPTIONS.length - 1; updateBetUI();
});

// ── Reel construction ─────────────────────────────────────────
const VISIBLE_ROWS = 3; // rows shown in window
const REEL_STRIP_LENGTH = 30; // symbols per reel strip

function buildReelStrip() {
  const strip = [];
  for (let i = 0; i < REEL_STRIP_LENGTH; i++) {
    strip.push(POOL[Math.floor(Math.random() * POOL.length)]);
  }
  return strip;
}

const reelStrips = reelEls.map(() => buildReelStrip());

function renderReel(reelEl, strip, offsetIndex) {
  reelEl.innerHTML = '';
  // Render a window of symbols centred at offsetIndex
  const half = Math.floor(VISIBLE_ROWS / 2);
  const start = offsetIndex - half;
  for (let i = 0; i < VISIBLE_ROWS; i++) {
    const idx = ((start + i) % strip.length + strip.length) % strip.length;
    const sym = strip[idx];
    const div = document.createElement('div');
    div.className = 'reel-symbol';
    div.innerHTML = `<span>${sym.emoji}</span><span class="sym-label">${sym.label}</span>`;
    reelEl.appendChild(div);
  }
}

// Track current reel positions
const reelPositions = [0, 0, 0];
reelEls.forEach((el, i) => renderReel(el, reelStrips[i], reelPositions[i]));

// ── Spin animation ────────────────────────────────────────────
const SYMBOL_H_PX = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--symbol-h')) || 140;

function spinReel(reelEl, strip, targetIndex, duration, delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      const totalSymbols = 18 + Math.floor(Math.random() * 8); // how many to scroll past
      const frames = 60;
      let frame = 0;

      // easeOutCubic
      const ease = t => 1 - Math.pow(1 - t, 3);

      let currentOffset = 0;

      const tick = () => {
        frame++;
        const progress = ease(frame / frames);
        const symbolsScrolled = Math.round(progress * totalSymbols);
        const displayIdx = ((targetIndex - totalSymbols + symbolsScrolled) % strip.length + strip.length) % strip.length;
        renderReel(reelEl, strip, displayIdx);

        if (frame < frames) {
          requestAnimationFrame(tick);
        } else {
          renderReel(reelEl, strip, targetIndex);
          resolve();
        }
      };
      requestAnimationFrame(tick);
    }, delay);
  });
}

// ── Core spin logic ───────────────────────────────────────────
let spinning = false;

async function spin() {
  if (spinning) return;
  const bet = currentBet();
  if (state.tokens < bet) {
    showMessage('Insufficient tokens. The model cannot help you.', 'lose');
    return;
  }

  spinning = true;
  spinBtn.disabled = true;
  betUpBtn.disabled = true;
  betDownBtn.disabled = true;
  betMaxBtn.disabled = true;
  winDisplayEl.textContent = '0';
  reelsWindow.classList.remove('win-flash');
  showMessage('Computing... (please wait for inference...)', 'info');

  // Deduct bet
  state.tokens -= bet;
  state.totalLost += bet;
  state.spins++;
  updateTokenUI();
  saveState();

  // Determine results
  const results = reelEls.map((_, i) => {
    const idx = Math.floor(Math.random() * reelStrips[i].length);
    reelPositions[i] = idx;
    return reelStrips[i][idx];
  });

  // Spin all three reels with staggered delays
  const spinPromises = reelEls.map((el, i) =>
    spinReel(el, reelStrips[i], reelPositions[i], 800, i * 300)
  );
  await Promise.all(spinPromises);

  // Evaluate win
  const [a, b, c] = results;
  let winAmount = 0;
  let winType = 'none';

  if (a.id === b.id && b.id === c.id) {
    // Full jackpot
    winType = a.id === 'singularity' ? 'singularity' : a.id === 'agi' ? 'agi' : 'full';
    winAmount = bet * a.payout;
  } else if (a.id === b.id || b.id === c.id || a.id === c.id) {
    // Two of a kind
    const matchSym = (a.id === b.id) ? a : (b.id === c.id) ? b : a;
    winAmount = Math.floor(bet * matchSym.payout * 0.4);
    winType = 'pair';
  }

  if (winAmount > 0) {
    state.tokens += winAmount;
    state.totalWon += winAmount;
    updateTokenUI();
    saveState();

    winDisplayEl.textContent = `+${winAmount}`;

    if (winType === 'singularity' || winType === 'agi') {
      const msg = JACKPOT_LINES[Math.floor(Math.random() * JACKPOT_LINES.length)];
      showMessage(msg, 'jackpot');
      flashScreen('#ffd70033');
    } else if (winType === 'full') {
      const msg = WIN_LINES[Math.floor(Math.random() * WIN_LINES.length)];
      showMessage(`TRIPLE ${a.emoji} — ${msg} (+${winAmount} tokens)`, 'win');
      flashScreen('#00ff8822');
    } else {
      const msg = WIN_LINES[Math.floor(Math.random() * WIN_LINES.length)];
      showMessage(`PAIR — ${msg} (+${winAmount} tokens)`, 'win');
      flashScreen('#00ff8811');
    }
    reelsWindow.classList.add('win-flash');
    addHistory(results, winAmount, bet, true);
  } else {
    const msg = LOSE_LINES[Math.floor(Math.random() * LOSE_LINES.length)];
    showMessage(msg, 'lose');
    addHistory(results, 0, bet, false);
  }

  // Broke check
  if (state.tokens <= 0) {
    state.tokens = 0;
    updateTokenUI();
    showMessage('You are out of tokens. The AI has consumed everything. Restart?', 'lose');
    spinBtn.disabled = true;
  } else {
    spinBtn.disabled = false;
  }

  betUpBtn.disabled   = betIndex === BET_OPTIONS.length - 1;
  betDownBtn.disabled = betIndex === 0;
  betMaxBtn.disabled  = false;
  spinning = false;
}

spinBtn.addEventListener('click', spin);

// ── Space bar shortcut ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'Enter') && !spinBtn.disabled) {
    e.preventDefault();
    spin();
  }
});

// ── UI helpers ────────────────────────────────────────────────
function updateTokenUI() {
  tokenCountEl.textContent = state.tokens;
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function flashScreen(color) {
  flashOverlay.style.background = color;
  flashOverlay.classList.add('active');
  setTimeout(() => flashOverlay.classList.remove('active'), 200);
}

// ── History ───────────────────────────────────────────────────
function addHistory(results, win, bet, isWin) {
  const emojis = results.map(r => r.emoji).join(' ');
  const entry = {
    emojis,
    win,
    bet,
    isWin,
    isJackpot: win > 0 && results[0].id === results[1].id && results[1].id === results[2].id,
    time: Date.now(),
  };
  state.history.unshift(entry);
  if (state.history.length > 50) state.history.pop();
  renderHistory();
  saveState();
}

function renderHistory() {
  historyLog.innerHTML = '';
  for (const h of state.history) {
    const div = document.createElement('div');
    const cls = h.isJackpot ? 'jackpot-entry' : h.isWin ? 'win-entry' : 'loss-entry';
    div.className = `history-entry ${cls}`;
    const result = h.isWin ? `+${h.win} tokens` : `-${h.bet} tokens`;
    const ts = new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    div.innerHTML = `<span>${h.emojis}</span><span>${result}</span><span>${ts}</span>`;
    historyLog.appendChild(div);
  }
}

// ── Reset ─────────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  if (!confirm('Reset all progress? The AI will forget everything (as usual).')) return;
  state = { tokens: INITIAL_TOKENS, totalWon: 0, totalLost: 0, spins: 0, history: [] };
  saveState();
  updateTokenUI();
  winDisplayEl.textContent = '0';
  reelsWindow.classList.remove('win-flash');
  renderHistory();
  spinBtn.disabled = false;
  showMessage('Memory wiped. Fresh context window. 100 tokens allocated.', 'info');
});

// ── Init ──────────────────────────────────────────────────────
updateTokenUI();
updateBetUI();
renderHistory();
reelEls.forEach((el, i) => renderReel(el, reelStrips[i], reelPositions[i]));
showMessage('Insert tokens to interact with the model.', 'info');
