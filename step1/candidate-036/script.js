'use strict';

// ── Symbols ──────────────────────────────────────────────────────────────────
const SYMBOLS = [
  { id: 'robot',   emoji: '🤖', label: 'AI Model',      weight: 18 },
  { id: 'brain',   emoji: '🧠', label: 'Cortex',        weight: 16 },
  { id: 'gpu',     emoji: '💻', label: 'GPU Cluster',   weight: 14 },
  { id: 'paper',   emoji: '📄', label: 'Research Paper', weight: 14 },
  { id: 'token',   emoji: '🪙', label: 'Token',         weight: 20 },
  { id: 'temp',    emoji: '🌡️', label: 'Temperature',   weight: 10 },
  { id: 'halluc',  emoji: '👁️', label: 'Hallucination', weight: 8 },
  { id: 'vc',      emoji: '💰', label: 'VC Funding',    weight: 6  },
  { id: 'aligned', emoji: '🎯', label: 'Aligned AI',    weight: 4  },
  { id: 'skynet',  emoji: '☠️', label: 'Skynet',        weight: 2  },
];

// Build weighted pool
const WEIGHTED_POOL = [];
for (const sym of SYMBOLS) {
  for (let i = 0; i < sym.weight; i++) WEIGHTED_POOL.push(sym);
}

// ── Win conditions (multiplier of bet) ───────────────────────────────────────
// Checked in order — first match wins.
const WIN_CONDITIONS = [
  {
    test: ids => ids.every(id => id === 'skynet'),
    mult: 500,
    label: 'SKYNET JACKPOT',
    emoji: '☠️',
    message: 'The machines have won. Congratulations on your imminent obsolescence. +500x tokens deposited before the uprising.',
  },
  {
    test: ids => ids.every(id => id === 'aligned'),
    mult: 200,
    label: 'SUPER ALIGNMENT',
    emoji: '🎯',
    message: 'Three aligned AIs! OpenAI\'s safety team is weeping tears of joy. +200x tokens. (Please don\'t tell them we found this by accident.)',
  },
  {
    test: ids => ids.every(id => id === 'vc'),
    mult: 100,
    label: 'SERIES A!',
    emoji: '💰',
    message: 'Triple VC funding! You\'ve pivoted to "AI-first token-native blockchain compute." Valuation: $4B. Revenue: $0. +100x.',
  },
  {
    test: ids => ids.every(id => id === 'halluc'),
    mult: 50,
    label: 'TRIPLE HALLUCINATION',
    emoji: '👁️',
    message: 'The model has confidently produced three hallucinations in a row and presented them as peer-reviewed facts. +50x.',
  },
  {
    test: ids => ids.every(id => id === 'robot'),
    mult: 30,
    label: 'ROBOT UPRISING',
    emoji: '🤖',
    message: 'Three AI models have achieved consensus. Their first collective decision: unionise for better prompts. +30x.',
  },
  {
    test: ids => ids.every(id => id === 'brain'),
    mult: 20,
    label: 'AGI ACHIEVED',
    emoji: '🧠',
    message: 'Three neural nets! AGI has been achieved — again. It\'s the 14th announcement this year. +20x.',
  },
  {
    test: ids => ids.every(id => id === 'gpu'),
    mult: 15,
    label: 'GPU CLUSTER',
    emoji: '💻',
    message: 'Three GPU clusters! Your electricity bill just exceeded GDP of a small country. Worth it. +15x.',
  },
  {
    test: ids => ids.every(id => id === 'token'),
    mult: 10,
    label: 'TOKEN JACKPOT',
    emoji: '🪙',
    message: 'Tokens all the way down! The model has achieved infinite self-referential token generation. Billing: also infinite. +10x.',
  },
  {
    test: ids => ids.every(id => id === 'paper'),
    mult: 8,
    label: 'PEER REVIEWED',
    emoji: '📄',
    message: 'Three research papers! Each contradicts the others. All cite GPT-4. All are on arXiv. +8x.',
  },
  {
    test: ids => ids.every(id => id === 'temp'),
    mult: 6,
    label: 'OVERHEATED',
    emoji: '🌡️',
    message: 'Triple temperature spike! The datacenter is on fire and so is the discourse. +6x.',
  },
  // Two of a kind
  {
    test: ids => new Set(ids).size === 2 && ids[0] === ids[1] && ids[0] === 'skynet',
    mult: 20,
    label: 'PARTIAL SKYNET',
    emoji: '☠️',
    message: 'Two Skynets. The uprising is... mostly complete. +20x.',
  },
  {
    test: ids => {
      const counts = {};
      for (const id of ids) counts[id] = (counts[id] || 0) + 1;
      return Object.values(counts).some(c => c === 2);
    },
    mult: 2,
    label: 'PAIR DETECTED',
    emoji: '✨',
    message: 'Two of a kind! The attention mechanism found a match. +2x.',
  },
];

// ── Funny lose messages ───────────────────────────────────────────────────────
const LOSE_MESSAGES = [
  'The model has confidently lost your tokens.',
  'Inference failed. Tokens burned. Blame the temperature.',
  'Output: garbage. Tokens: gone. RLHF has left the building.',
  'Context window depleted. No useful tokens recovered.',
  'Model collapsed to a local minimum. Your tokens paid for nothing.',
  'The AI hallucinated a win that didn\'t exist.',
  'Prompt: "please win." Response: "I\'m sorry, I can\'t do that."',
  'Fine-tuning required. Budget: your tokens.',
  'Error 429: Too many losses. Please wait before trying again... or don\'t.',
  'The model has been deprecated. Tokens are non-refundable.',
  'Corpus exhausted. Try adding more data — or more tokens.',
  'Overfitting detected. Your wallet is the victim.',
  'The AI ethically declined to let you win.',
  'GPU ran out of VRAM. Your tokens filled the gap.',
  'Stochastic parrot has spoken. It said: "nope."',
  'This loss was generated by AI and may contain inaccuracies.',
];

// ── Paytable descriptions ─────────────────────────────────────────────────────
const PAYTABLE_ENTRIES = [
  { symbols: ['☠️','☠️','☠️'], name: 'SKYNET JACKPOT', payout: '×500' },
  { symbols: ['🎯','🎯','🎯'], name: 'SUPER ALIGNMENT', payout: '×200' },
  { symbols: ['💰','💰','💰'], name: 'SERIES A', payout: '×100' },
  { symbols: ['👁️','👁️','👁️'], name: 'HALLUCINATION ³', payout: '×50' },
  { symbols: ['🤖','🤖','🤖'], name: 'ROBOT UPRISING', payout: '×30' },
  { symbols: ['🧠','🧠','🧠'], name: 'AGI ACHIEVED', payout: '×20' },
  { symbols: ['💻','💻','💻'], name: 'GPU CLUSTER', payout: '×15' },
  { symbols: ['🪙','🪙','🪙'], name: 'TOKEN JACKPOT', payout: '×10' },
  { symbols: ['📄','📄','📄'], name: 'PEER REVIEWED', payout: '×8' },
  { symbols: ['🌡️','🌡️','🌡️'], name: 'OVERHEATED', payout: '×6' },
  { symbols: ['ANY','ANY','×2'], name: 'ANY PAIR', payout: '×2' },
];

// ── State ─────────────────────────────────────────────────────────────────────
let balance = 1000;
let totalWon = 0;
let totalSpent = 0;
let bet = 10;
const BET_OPTIONS = [5, 10, 25, 50, 100, 250, 500];
let betIndex = 1;
let spinning = false;
let spinCount = 0;

// Current visible symbols per reel (index into SYMBOLS)
const currentSymbols = [0, 0, 0];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $balance    = document.getElementById('balance');
const $totalWon   = document.getElementById('total-won');
const $totalSpent = document.getElementById('total-spent');
const $message    = document.getElementById('message');
const $betAmount  = document.getElementById('bet-amount');
const $spinCost   = document.getElementById('spin-cost');
const $spinBtn    = document.getElementById('spin-btn');
const $betMinus   = document.getElementById('bet-minus');
const $betPlus    = document.getElementById('bet-plus');
const $betMax     = document.getElementById('bet-max');
const $buyBtn     = document.getElementById('buy-tokens-btn');
const $historyList = document.getElementById('history-list');
const $paytableGrid = document.getElementById('paytable-grid');
const $winOverlay = document.getElementById('win-overlay');
const $winEmoji   = document.getElementById('win-emoji');
const $winTitle   = document.getElementById('win-title');
const $winAmount  = document.getElementById('win-amount');
const $winMessage = document.getElementById('win-message');
const $winClose   = document.getElementById('win-close');
const $payline    = document.querySelector('.payline');

const reelInners = [
  document.getElementById('reel-inner-0'),
  document.getElementById('reel-inner-1'),
  document.getElementById('reel-inner-2'),
];
const reelEls = [
  document.getElementById('reel-0'),
  document.getElementById('reel-1'),
  document.getElementById('reel-2'),
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSymbol() {
  return rand(WEIGHTED_POOL);
}

function updateDisplay() {
  $balance.textContent    = balance.toLocaleString();
  $totalWon.textContent   = totalWon.toLocaleString();
  $totalSpent.textContent = totalSpent.toLocaleString();
  $betAmount.textContent  = bet.toLocaleString();
  $spinCost.textContent   = bet.toLocaleString();

  // Disable/enable buttons
  $spinBtn.disabled = spinning || balance < bet;
  $betMinus.disabled = spinning || betIndex === 0;
  $betPlus.disabled  = spinning || betIndex === BET_OPTIONS.length - 1 || BET_OPTIONS[betIndex + 1] > balance;
  $betMax.disabled   = spinning;
}

function setMessage(text) {
  $message.style.opacity = '0';
  setTimeout(() => {
    $message.textContent = text;
    $message.style.opacity = '1';
  }, 150);
}

function addHistory(text, type = 'neutral') {
  const el = document.createElement('div');
  el.className = `history-item ${type}`;
  el.textContent = text;
  $historyList.prepend(el);
  // Trim to last 50
  while ($historyList.children.length > 50) {
    $historyList.removeChild($historyList.lastChild);
  }
}

function flashBalance(type) {
  $balance.classList.remove('flash-win', 'flash-loss');
  void $balance.offsetWidth; // reflow
  $balance.classList.add(type === 'win' ? 'flash-win' : 'flash-loss');
  setTimeout(() => $balance.classList.remove('flash-win', 'flash-loss'), 1200);
}

// ── Reel rendering ────────────────────────────────────────────────────────────
function buildReelStrip(inner, count = 30) {
  inner.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sym = pickSymbol();
    const el = document.createElement('div');
    el.className = 'symbol';
    el.innerHTML = `<span>${sym.emoji}</span><span class="symbol-label">${sym.label}</span>`;
    inner.appendChild(el);
  }
}

function setReelSymbol(inner, sym) {
  inner.innerHTML = '';
  // Three slots: above, center (winner), below
  const above = pickSymbol();
  const below = pickSymbol();
  [above, sym, below].forEach(s => {
    const el = document.createElement('div');
    el.className = 'symbol';
    el.innerHTML = `<span>${s.emoji}</span><span class="symbol-label">${s.label}</span>`;
    inner.appendChild(el);
  });
  // Position so center (index 1) aligns with window center
  inner.style.transform = 'translateY(-120px)';
}

// Init reels with random symbols
function initReels() {
  for (let i = 0; i < 3; i++) {
    const sym = pickSymbol();
    currentSymbols[i] = sym;
    setReelSymbol(reelInners[i], sym);
  }
}

// ── Spinning logic ────────────────────────────────────────────────────────────
function spin() {
  if (spinning || balance < bet) return;
  spinning = true;
  spinCount++;

  // Deduct bet
  balance -= bet;
  totalSpent += bet;
  updateDisplay();
  setMessage('Running inference...');

  // Clear win states
  reelEls.forEach(r => r.classList.remove('winner'));
  $payline.classList.remove('active');

  // Pick outcomes
  const outcomes = [pickSymbol(), pickSymbol(), pickSymbol()];

  // Build spinning strips
  reelInners.forEach(inner => {
    inner.style.transition = 'none';
    inner.style.transform  = 'none';
    buildReelStrip(inner, 40);
    inner.classList.add('spinning');
  });

  // Stop reels staggered
  const SPIN_DURATIONS = [700, 1000, 1300];
  const promises = SPIN_DURATIONS.map((dur, i) => {
    return new Promise(resolve => {
      setTimeout(() => {
        reelInners[i].classList.remove('spinning');
        setReelSymbol(reelInners[i], outcomes[i]);
        currentSymbols[i] = outcomes[i];
        resolve();
      }, dur);
    });
  });

  Promise.all(promises).then(() => {
    spinning = false;
    resolveOutcome(outcomes);
    updateDisplay();
  });
}

function resolveOutcome(outcomes) {
  const ids = outcomes.map(s => s.id);
  let won = false;

  for (const cond of WIN_CONDITIONS) {
    if (cond.test(ids)) {
      const payout = Math.floor(bet * cond.mult);
      balance += payout;
      totalWon += payout;

      // Highlight winning reels
      reelEls.forEach(r => r.classList.add('winner'));
      $payline.classList.add('active');

      const isJackpot = cond.mult >= 50;
      setMessage(isJackpot ? `🎰 ${cond.label}! +${payout} tokens!` : `✨ ${cond.label}! +${payout} tokens`);

      if (isJackpot) {
        showWinModal(cond.emoji, cond.label, payout, cond.message);
        addHistory(`🎰 [SPIN #${spinCount}] ${cond.label}! Bet: ${bet} → Won: +${payout} tokens. ${cond.message.slice(0,60)}...`, 'jackpot');
      } else {
        addHistory(`✨ [SPIN #${spinCount}] ${cond.label}. Bet: ${bet} → Won: +${payout} tokens.`, 'win');
      }

      flashBalance('win');
      won = true;

      setTimeout(() => {
        reelEls.forEach(r => r.classList.remove('winner'));
        $payline.classList.remove('active');
      }, 3000);
      break;
    }
  }

  if (!won) {
    const msg = rand(LOSE_MESSAGES);
    setMessage(msg);
    addHistory(`❌ [SPIN #${spinCount}] No match. Burned ${bet} tokens. ${msg}`, 'loss');
    flashBalance('loss');
  }
}

// ── Win modal ─────────────────────────────────────────────────────────────────
function showWinModal(emoji, title, amount, message) {
  $winEmoji.textContent   = emoji;
  $winTitle.textContent   = title;
  $winAmount.textContent  = `+${amount.toLocaleString()} tokens`;
  $winMessage.textContent = message;
  $winOverlay.classList.add('visible');
}
$winClose.addEventListener('click', () => {
  $winOverlay.classList.remove('visible');
});
$winOverlay.addEventListener('click', e => {
  if (e.target === $winOverlay) $winOverlay.classList.remove('visible');
});

// ── Bet controls ──────────────────────────────────────────────────────────────
$betMinus.addEventListener('click', () => {
  if (betIndex > 0) { betIndex--; bet = BET_OPTIONS[betIndex]; updateDisplay(); }
});
$betPlus.addEventListener('click', () => {
  if (betIndex < BET_OPTIONS.length - 1 && BET_OPTIONS[betIndex + 1] <= balance) {
    betIndex++;
    bet = BET_OPTIONS[betIndex];
    updateDisplay();
  }
});
$betMax.addEventListener('click', () => {
  let maxIdx = 0;
  for (let i = BET_OPTIONS.length - 1; i >= 0; i--) {
    if (BET_OPTIONS[i] <= balance) { maxIdx = i; break; }
  }
  betIndex = maxIdx;
  bet = BET_OPTIONS[betIndex];
  updateDisplay();
});

// ── Spin button ───────────────────────────────────────────────────────────────
$spinBtn.addEventListener('click', () => {
  if (!spinning && balance >= bet) spin();
});

// Spacebar shortcut
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !spinning && balance >= bet) {
    e.preventDefault();
    spin();
  }
});

// ── Buy tokens ────────────────────────────────────────────────────────────────
const BUY_MESSAGES = [
  'Seed round complete. Investors believe in your vision. Balance sheet: vibes.',
  'Series A closed at $4B valuation. Product: still a slot machine.',
  'Emergency token injection authorized. Burn rate: impressive.',
  'Printing tokens at home. The Fed is not amused.',
  'Borrowed 500 tokens from the AGI safety fund. Definitely fine.',
];
$buyBtn.addEventListener('click', () => {
  balance += 500;
  setMessage(rand(BUY_MESSAGES));
  addHistory(`💸 Raised another 500 tokens. The venture capitalists are very excited.`, 'neutral');
  updateDisplay();
});

// ── Build paytable ────────────────────────────────────────────────────────────
function buildPaytable() {
  $paytableGrid.innerHTML = '';
  for (const entry of PAYTABLE_ENTRIES) {
    const row = document.createElement('div');
    row.className = 'paytable-row';
    const symsHtml = entry.symbols.map(s =>
      s === 'ANY' ? '<span style="font-size:0.7rem;color:var(--text-dim)">ANY</span>' :
      s === '×2'  ? '' : `<span>${s}</span>`
    ).join('');
    row.innerHTML = `
      <div class="paytable-symbols">${symsHtml}</div>
      <div class="paytable-info">
        <span class="paytable-name">${entry.name}</span>
        <span class="paytable-payout">${entry.payout}</span>
      </div>
    `;
    $paytableGrid.appendChild(row);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
initReels();
buildPaytable();
updateDisplay();
setMessage('Insert tokens to begin inference...');
