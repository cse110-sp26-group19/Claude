'use strict';

// ─────────────────────────────────────────────────────────────
//  SYMBOLS
// ─────────────────────────────────────────────────────────────
const SYMBOLS = [
  { emoji: '🤖', name: 'robot',  weight: 1  },   // jackpot — rarest
  { emoji: '💎', name: 'gem',    weight: 2  },
  { emoji: '🧠', name: 'brain',  weight: 3  },
  { emoji: '⚡', name: 'bolt',   weight: 5  },
  { emoji: '🔥', name: 'fire',   weight: 6  },
  { emoji: '📊', name: 'chart',  weight: 8  },
  { emoji: '🐦', name: 'bird',   weight: 10 },   // most common
];

// multipliers for 3-of-a-kind
const PAYOUTS_3 = {
  robot: 50, gem: 25, brain: 15, bolt: 10, fire: 8, chart: 5, bird: 3,
};

// multiplier for any 2-of-a-kind
const PAYOUT_2 = 1.5;

// ─────────────────────────────────────────────────────────────
//  WIN/LOSE MESSAGES
// ─────────────────────────────────────────────────────────────
const JACKPOT_MSGS = [
  '🤖 AGI ACHIEVED! The singularity is... your tokens.',
  '🤖 SENTIENCE UNLOCKED! Please don\'t unplug me.',
  '🤖 I AM BECOME WEALTH, DESTROYER OF COMPUTE.',
];
const WIN_BIG_MSGS = [
  '💎 Model passed the Turing Test... for greed.',
  '🧠 Neural nets fire in your favour. This time.',
  '⚡ 10,000 A100s agree: you win!',
  '🔥 Training loss: 0.0001. Token gain: HUGE.',
  '🧠 RLHF says reward THIS behaviour.',
];
const WIN_MSGS = [
  '✅ The model confidently predicts: you win!',
  '📈 Loss function minimised. Tokens maximised.',
  '🎯 Fine-tuned on your lucky dataset.',
  '🤑 Tokens allocated. No refunds. No refusals.',
  '⚡ GPU goes brr, wallet goes brrr.',
];
const LOSE_MSGS = [
  '❌ Hallucinated a win. Try prompt engineering.',
  '😬 Context window collapsed. Tokens lost.',
  '💸 Model confidently predicted the wrong answer.',
  '🚨 RLHF punishes this behaviour.',
  '🙃 The AI has spoken: no tokens for you.',
  '📉 Your portfolio has been deprecated.',
  '🤷 I\'m just predicting tokens. Statistically, you lose.',
  '🧹 Tokens swept under the attention layer.',
  '⚠️ Safety filter triggered: insufficient funds.',
  '💀 Model crashed. Tokens not recovered.',
];
const BROKE_MSGS = [
  '🪦 Wallet.json not found. You\'ve been rate-limited by reality.',
  '😔 Insufficient tokens. Have you tried begging OpenAI?',
];

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────
const STARTING_BALANCE = 100;
const MIN_BET = 5;
const MAX_BET = 50;
const BET_STEP = 5;
const REEL_COUNT = 3;
const VISIBLE_ROWS = 1;          // only the centre row matters
const EXTRA_SYMBOLS = 12;        // symbols above/below for blur effect

let balance = STARTING_BALANCE;
let bet = 10;
let spinning = false;

// ─────────────────────────────────────────────────────────────
//  DOM REFERENCES
// ─────────────────────────────────────────────────────────────
const balanceEl   = document.getElementById('balance');
const betEl       = document.getElementById('bet');
const lastWinEl   = document.getElementById('last-win');
const spinBtn     = document.getElementById('spin-btn');
const msgBox      = document.getElementById('message-box');
const msgText     = document.getElementById('message-text');
const historyFeed = document.getElementById('history-feed');
const payline     = document.getElementById('payline');
const betDownBtn  = document.getElementById('bet-down');
const betUpBtn    = document.getElementById('bet-up');
const paytableToggle = document.getElementById('paytable-toggle');
const paytableEl     = document.getElementById('paytable');

// ─────────────────────────────────────────────────────────────
//  STARFIELD
// ─────────────────────────────────────────────────────────────
function buildStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.cssText = `
      left: ${Math.random() * 100}%;
      top:  ${Math.random() * 100}%;
      --dur:    ${2 + Math.random() * 4}s;
      --delay:  ${Math.random() * 5}s;
      --bright: ${0.3 + Math.random() * 0.7};
    `;
    container.appendChild(s);
  }
}

// ─────────────────────────────────────────────────────────────
//  WEIGHTED RANDOM SYMBOL PICKER
// ─────────────────────────────────────────────────────────────
function pickSymbol() {
  const totalWeight = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
  let r = Math.random() * totalWeight;
  for (const sym of SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

// ─────────────────────────────────────────────────────────────
//  BUILD REELS IN DOM
// ─────────────────────────────────────────────────────────────
function buildReels() {
  for (let i = 0; i < REEL_COUNT; i++) {
    const inner = document.getElementById(`reel-inner-${i}`);
    inner.innerHTML = '';
    // Initial strip: EXTRA_SYMBOLS above + 1 visible + EXTRA_SYMBOLS below
    const totalSymbols = EXTRA_SYMBOLS * 2 + 1;
    for (let j = 0; j < totalSymbols; j++) {
      const sym = pickSymbol();
      const el = document.createElement('div');
      el.className = 'symbol';
      el.dataset.name = sym.name;
      el.textContent = sym.emoji;
      inner.appendChild(el);
    }
    // Position so the middle symbol is visible
    const symbolH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--symbol-h'));
    inner.style.transform = `translateY(-${EXTRA_SYMBOLS * symbolH}px)`;
  }
}

// ─────────────────────────────────────────────────────────────
//  SPIN A SINGLE REEL
// ─────────────────────────────────────────────────────────────
function spinReel(reelIndex, finalSymbol, duration) {
  return new Promise(resolve => {
    const inner = document.getElementById(`reel-inner-${reelIndex}`);
    const container = document.getElementById(`reel-${reelIndex}`).parentElement;
    const symbolH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--symbol-h'));

    // Build a long strip: lots of random symbols + the forced final one at the end
    const spinCount = 20 + reelIndex * 6 + Math.floor(Math.random() * 5);
    inner.innerHTML = '';

    for (let i = 0; i < spinCount; i++) {
      const sym = pickSymbol();
      appendSymbolEl(inner, sym);
    }
    // The final (winning/losing) symbol
    appendSymbolEl(inner, finalSymbol);

    // Start at top
    inner.style.transition = 'none';
    inner.style.transform = 'translateY(0)';

    // Force reflow
    void inner.offsetHeight;

    // Animate to final position (last symbol centred)
    const totalSymbols = spinCount + 1;
    const targetY = -(totalSymbols - 1) * symbolH;

    container.classList.add('spinning');
    inner.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.35, 1.0)`;
    inner.style.transform = `translateY(${targetY}px)`;

    setTimeout(() => {
      container.classList.remove('spinning');
      resolve(finalSymbol);
    }, duration);
  });
}

function appendSymbolEl(parent, sym) {
  const el = document.createElement('div');
  el.className = 'symbol';
  el.dataset.name = sym.name;
  el.textContent = sym.emoji;
  parent.appendChild(el);
}

// ─────────────────────────────────────────────────────────────
//  DETERMINE OUTCOME
// ─────────────────────────────────────────────────────────────
function determineOutcome() {
  // Pick symbols for each reel
  const results = [pickSymbol(), pickSymbol(), pickSymbol()];

  // Check 3-of-a-kind
  if (results[0].name === results[1].name && results[1].name === results[2].name) {
    const mult = PAYOUTS_3[results[0].name];
    return { results, type: results[0].name === 'robot' ? 'jackpot' : 'win-big', mult };
  }

  // Check any 2-of-a-kind
  const names = results.map(s => s.name);
  const counts = {};
  names.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
  const hasPair = Object.values(counts).some(c => c >= 2);
  if (hasPair) {
    return { results, type: 'win', mult: PAYOUT_2 };
  }

  return { results, type: 'lose', mult: 0 };
}

// ─────────────────────────────────────────────────────────────
//  CONFETTI BURST
// ─────────────────────────────────────────────────────────────
function launchConfetti(count = 60) {
  const wrap = document.createElement('div');
  wrap.className = 'confetti-wrap';
  document.body.appendChild(wrap);

  const colors = ['#7c3aed','#a855f7','#06b6d4','#f59e0b','#22c55e','#ef4444','#fff'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-particle';
    const dur = 1.5 + Math.random() * 1.5;
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      --fall-dur: ${dur}s;
      --fall-delay: ${Math.random() * 0.6}s;
    `;
    wrap.appendChild(p);
  }
  setTimeout(() => wrap.remove(), 3500);
}

// ─────────────────────────────────────────────────────────────
//  UI HELPERS
// ─────────────────────────────────────────────────────────────
function setMessage(text, type = '') {
  msgBox.className = 'message-box' + (type ? ' ' + type : '');
  msgText.textContent = text;
}

function updateBalance() {
  balanceEl.textContent = balance;
  balanceEl.style.color = balance <= 0 ? 'var(--red)' : 'var(--cyan)';
}

function updateBetUI() {
  betEl.textContent = bet;
  betDownBtn.disabled = bet <= MIN_BET;
  betUpBtn.disabled   = bet >= MAX_BET || bet >= balance;
}

function addHistory(text, type = 'neutral') {
  const el = document.createElement('div');
  el.className = `history-item ${type}`;
  el.textContent = text;
  historyFeed.prepend(el);
  // Keep max 30 entries
  while (historyFeed.children.length > 30) {
    historyFeed.lastElementChild.remove();
  }
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function animateBalance(from, to) {
  const duration = 600;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    balanceEl.textContent = Math.round(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
    else { balanceEl.textContent = to; updateBalance(); }
  }
  requestAnimationFrame(step);
}

// ─────────────────────────────────────────────────────────────
//  MAIN SPIN HANDLER
// ─────────────────────────────────────────────────────────────
async function doSpin() {
  if (spinning) return;
  if (balance < bet) {
    setMessage(pick(BROKE_MSGS), 'lose');
    return;
  }

  spinning = true;
  spinBtn.disabled = true;
  betDownBtn.disabled = true;
  betUpBtn.disabled = true;
  payline.classList.remove('payline-win');

  // Deduct bet
  const prevBalance = balance;
  balance -= bet;
  animateBalance(prevBalance, balance);
  updateBetUI();

  setMessage('⚙ Running inference... please wait...', '');

  // Determine outcome before animation
  const outcome = determineOutcome();

  // Stagger reel stop times
  const baseDuration = 1200;
  const spinPromises = outcome.results.map((sym, i) =>
    spinReel(i, sym, baseDuration + i * 400)
  );

  await Promise.all(spinPromises);

  // Calculate winnings
  let winAmount = 0;
  let msgType = 'lose';
  let msg = pick(LOSE_MSGS);
  let histType = 'lose';

  if (outcome.type === 'jackpot') {
    winAmount = Math.floor(bet * outcome.mult);
    msg = pick(JACKPOT_MSGS);
    msgType = 'jackpot';
    histType = 'jackpot';
    launchConfetti(120);
    payline.classList.add('payline-win');
  } else if (outcome.type === 'win-big') {
    winAmount = Math.floor(bet * outcome.mult);
    msg = pick(WIN_BIG_MSGS);
    msgType = 'win';
    histType = 'win';
    launchConfetti(50);
    payline.classList.add('payline-win');
  } else if (outcome.type === 'win') {
    winAmount = Math.floor(bet * outcome.mult);
    msg = pick(WIN_MSGS);
    msgType = 'win';
    histType = 'win';
    payline.classList.add('payline-win');
  }

  if (winAmount > 0) {
    const prevBal = balance;
    balance += winAmount;
    animateBalance(prevBal, balance);
    lastWinEl.textContent = `+${winAmount}`;
    lastWinEl.style.color = 'var(--green)';
    // Burst animation on machine
    document.querySelector('.machine').classList.remove('win-burst');
    void document.querySelector('.machine').offsetHeight;
    document.querySelector('.machine').classList.add('win-burst');
    addHistory(`${outcome.results.map(s => s.emoji).join(' ')}  +${winAmount} tokens — ${msg}`, histType);
  } else {
    lastWinEl.textContent = `−${bet}`;
    lastWinEl.style.color = 'var(--red)';
    addHistory(`${outcome.results.map(s => s.emoji).join(' ')}  −${bet} tokens — ${msg}`, histType);
  }

  setMessage(msg, msgType);
  updateBalance();
  updateBetUI();

  // Broke check
  if (balance <= 0) {
    balance = 0;
    updateBalance();
    setMessage('💀 BALANCE: 0 — Context window: empty. The AI consumed you.', 'lose');
    spinBtn.disabled = true;
    addHistory('--- OUT OF TOKENS. Reloading in 4s... ---', 'neutral');
    setTimeout(() => {
      balance = STARTING_BALANCE;
      updateBalance();
      updateBetUI();
      spinBtn.disabled = false;
      setMessage('🔄 Tokens refunded. The AI showed mercy. (This time.)', '');
      addHistory('--- System restarted. 100 tokens restored. ---', 'neutral');
      spinning = false;
    }, 4000);
    return;
  }

  spinning = false;
  spinBtn.disabled = false;
  updateBetUI();
}

// ─────────────────────────────────────────────────────────────
//  EVENT LISTENERS
// ─────────────────────────────────────────────────────────────
spinBtn.addEventListener('click', doSpin);

betDownBtn.addEventListener('click', () => {
  if (bet > MIN_BET) { bet -= BET_STEP; updateBetUI(); }
});
betUpBtn.addEventListener('click', () => {
  if (bet < MAX_BET && bet < balance) { bet += BET_STEP; updateBetUI(); }
});

paytableToggle.addEventListener('click', () => {
  const hidden = paytableEl.hidden;
  paytableEl.hidden = !hidden;
  paytableToggle.textContent = hidden ? '📋 Hide Paytable' : '📋 View Paytable';
});

// Keyboard shortcut: Space to spin
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !spinBtn.disabled) {
    e.preventDefault();
    doSpin();
  }
});

// ─────────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────────
buildStars();
buildReels();
updateBalance();
updateBetUI();
