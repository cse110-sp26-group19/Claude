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

// Build a weighted pool for random selection
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
const TWO_OF_A_KIND_MULT = 1.5; // returns bet × 1.5 (small profit)

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

let state = {
  tokens: INITIAL_TOKENS,
  betIndex: 1,       // index into BET_OPTIONS
  spinning: false,
  spins: 0,
  wins: 0,
  tokensWon: 0,
  tokensLost: 0,
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const tokenCountEl   = document.getElementById('token-count');
const balanceBarEl   = document.getElementById('balance-bar');
const betAmountEl    = document.getElementById('bet-amount');
const spinCostEl     = document.getElementById('spin-cost');
const spinBtn        = document.getElementById('spin-btn');
const spinIcon       = spinBtn.querySelector('.spin-icon');
const betDownBtn     = document.getElementById('bet-down');
const betUpBtn       = document.getElementById('bet-up');
const messageBox     = document.getElementById('message-box');
const messageText    = document.getElementById('message-text');
const resetBtn       = document.getElementById('reset-btn');
const statSpins      = document.getElementById('stat-spins');
const statWins       = document.getElementById('stat-wins');
const statTokensWon  = document.getElementById('stat-tokens-won');
const statTokensLost = document.getElementById('stat-tokens-lost');
const paytableBody   = document.getElementById('paytable-body');

const reelFrames = [0, 1, 2].map(i => document.getElementById(`frame-${i}`));
const reelEls    = [0, 1, 2].map(i => document.getElementById(`reel-${i}`));
const symbolEls  = reelEls.map(r => r.querySelector('.symbol'));

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
  setTimeout(() => reelFrames.forEach(f => f.classList.remove(cls)), 1600);
}

// ─── Spin Logic ───────────────────────────────────────────────────────────────
function startSpinning() {
  reelFrames.forEach(f => f.classList.add('spinning'));
}

function stopReel(index, symbol) {
  return new Promise(resolve => {
    reelFrames[index].classList.remove('spinning');
    symbolEls[index].textContent = symbol.emoji;
    symbolEls[index].setAttribute('aria-label', symbol.name);

    // Small bounce
    reelEls[index].style.transform = 'translateY(-10px)';
    setTimeout(() => {
      reelEls[index].style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)';
      reelEls[index].style.transform = 'translateY(0)';
      setTimeout(() => {
        reelEls[index].style.transition = '';
        resolve();
      }, 180);
    }, 30);
  });
}

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

  // Pick results before animation
  const results = [weightedPick(), weightedPick(), weightedPick()];

  startSpinning();

  // Stagger stop each reel
  const REEL_DELAYS = [800, 1200, 1600];
  for (let i = 0; i < 3; i++) {
    await new Promise(r => setTimeout(r, i === 0 ? REEL_DELAYS[0] : REEL_DELAYS[i] - REEL_DELAYS[i - 1]));
    await stopReel(i, results[i]);
  }

  // Evaluate result
  evaluateResult(results, bet);
  setSpinning(false);
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
    flashReels('win-flash');

    const msgs = WIN_MESSAGES[key];
    const msg = msgs ? pick(msgs) : `${info.label}! ×${info.mult} — ${payout} tokens earned.`;
    setMessage(`${msg}\n+${payout} tokens`, info.type);
  } else if (a.emoji === b.emoji || b.emoji === c.emoji || a.emoji === c.emoji) {
    // Two of a kind
    const payout = Math.round(bet * TWO_OF_A_KIND_MULT);
    state.tokens += payout;
    state.tokensWon += payout;
    state.wins++;

    const net = payout - bet;
    const netStr = net >= 0 ? `+${net}` : `${net}`;
    setMessage(`${pick(PAIR_MESSAGES)} +${payout} tokens (net: ${netStr})`, 'win');
    flashReels('win-flash');
  } else {
    // Loss
    setMessage(pick(LOSE_MESSAGES), 'lose');
    flashReels('loss-flash');
  }

  updateTokenDisplay();
  updateStats();

  if (state.tokens <= 0) {
    state.tokens = 0;
    updateTokenDisplay();
    setTimeout(() => setMessage(pick(BROKE_MESSAGES), 'broke'), 400);
  }
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
    tokensWon: 0,
    tokensLost: 0,
  };
  symbolEls.forEach(el => { el.textContent = ''; });
  reelFrames.forEach(f => f.className = 'reel-frame');
  updateTokenDisplay();
  updateBetUI();
  updateStats();
  setMessage('Insert tokens to begin inference...', '');
});

// Keyboard: Space or Enter to spin
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'Enter') && document.activeElement === document.body) {
    e.preventDefault();
    if (!state.spinning) spin();
  }
});

// ─── Init ────────────────────────────────────────────────────────────────────
buildPaytable();
updateTokenDisplay();
updateBetUI();
updateStats();
setMessage('Insert tokens to begin inference...', '');
