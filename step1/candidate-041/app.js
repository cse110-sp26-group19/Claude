'use strict';

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

// ── Game state ────────────────────────────────────────────────────────────────
const state = {
  tokens: 1000,
  bet: 10,
  spins: 0,
  biggestWin: 0,
  winStreak: 0,
  spinning: false,
  autoPlay: false,
  autoTimer: null,
  results: [null, null, null],
};

const BET_OPTIONS = [5, 10, 25, 50, 100, 250];
let betIdx = 1;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const strips    = [$('strip1'), $('strip2'), $('strip3')];
const reels     = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
const resultText  = $('resultText');
const tokenCount  = $('tokenCount');
const spinsCount  = $('spinsCount');
const biggestWin  = $('biggestWin');
const winStreakEl  = $('winStreak');
const betValueEl  = $('betValue');
const spinBtn    = $('spinBtn');
const betDown    = $('betDown');
const betUp      = $('betUp');
const autoBtn    = $('autoBtn');
const autoCount  = $('autoCount');
const logEntries  = $('logEntries');
const contextFill  = $('contextFill');
const modalOverlay = $('modalOverlay');
const modalIcon  = $('modalIcon');
const modalTitle  = $('modalTitle');
const modalBody  = $('modalBody');
const modalBtn   = $('modalBtn');
const machine    = document.querySelector('.machine');

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
  // Fill with random symbols for the scroll illusion (20 rows)
  for (let i = 0; i < 20; i++) {
    const div = document.createElement('div');
    div.className = 'reel-symbol';
    div.textContent = weightedRandom().emoji;
    stripEl.appendChild(div);
  }
}

// ── Init strips ───────────────────────────────────────────────────────────────
strips.forEach(buildStrip);

// ── Build paytable ────────────────────────────────────────────────────────────
function buildPaytable() {
  const grid = $('paytableGrid');
  grid.innerHTML = '';

  // Three-of-a-kind rows
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

  // Any two alike
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
  biggestWin.textContent = state.biggestWin.toLocaleString();
  winStreakEl.textContent = state.winStreak;
  betValueEl.textContent = BET_OPTIONS[betIdx];

  // Context fill grows with spins (up to 95%)
  const pct = Math.min(12 + state.spins * 0.4, 95);
  contextFill.style.width = pct + '%';
  if (pct > 80) contextFill.style.background = 'linear-gradient(90deg, #ef4444, #fbbf24)';
}

// ── Logging ───────────────────────────────────────────────────────────────────
function log(msg, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span class="log-time">${time}</span><span>${msg}</span>`;
  logEntries.prepend(entry);
  // Keep max 40 entries
  while (logEntries.children.length > 40) logEntries.lastChild.remove();
}

// ── Coin burst effect ─────────────────────────────────────────────────────────
function spawnCoins(count = 10) {
  const spinRect = spinBtn.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.textContent = '🪙';
    const startX = spinRect.left + spinRect.width / 2 + (Math.random() - 0.5) * 60;
    const startY = spinRect.top + (Math.random() - 0.5) * 20;
    const dx = (Math.random() - 0.5) * 200;
    const dy = -(80 + Math.random() * 180);
    coin.style.left = startX + 'px';
    coin.style.top  = startY + 'px';
    coin.style.setProperty('--dx', dx + 'px');
    coin.style.setProperty('--dy', dy + 'px');
    coin.style.setProperty('--dur', (0.8 + Math.random() * 0.6) + 's');
    coin.style.animationDelay = Math.random() * 0.3 + 's';
    document.body.appendChild(coin);
    coin.addEventListener('animationend', () => coin.remove());
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function showModal(icon, title, body, onClose) {
  modalIcon.textContent = icon;
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modalOverlay.classList.add('active');
  const handler = () => {
    modalOverlay.classList.remove('active');
    modalBtn.removeEventListener('click', handler);
    if (onClose) onClose();
  };
  modalBtn.addEventListener('click', handler);
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

function flashMachine(cls) {
  machine.classList.remove('win-flash', 'jackpot-flash');
  void machine.offsetWidth; // reflow
  machine.classList.add(cls);
  machine.addEventListener('animationend', () => machine.classList.remove(cls), { once: true });
}

// Animate a single reel to land on a target symbol
function animateReel(reelEl, stripEl, targetSymbol, duration) {
  return new Promise(resolve => {
    // Rebuild strip with random symbols, ending with target
    stripEl.innerHTML = '';
    const rows = 22;
    for (let i = 0; i < rows - 1; i++) {
      const d = document.createElement('div');
      d.className = 'reel-symbol';
      d.textContent = weightedRandom().emoji;
      stripEl.appendChild(d);
    }
    // Last visible symbol = target
    const last = document.createElement('div');
    last.className = 'reel-symbol highlighted';
    last.textContent = targetSymbol.emoji;
    stripEl.appendChild(last);

    // Reset position
    stripEl.style.transition = 'none';
    stripEl.style.transform = 'translateY(0)';

    const symbolH = 130;
    const totalH = (rows - 1) * symbolH;

    // Small delay so browser paints the reset
    requestAnimationFrame(() => requestAnimationFrame(() => {
      stripEl.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.8, 0.3, 1)`;
      stripEl.style.transform = `translateY(-${totalH}px)`;
      setTimeout(() => {
        resolve();
      }, duration + 50);
    }));
  });
}

async function spin() {
  if (state.spinning) return;
  const bet = BET_OPTIONS[betIdx];
  if (state.tokens < bet) {
    showModal('😵', 'INSUFFICIENT TOKENS',
      `You need ${bet} tokens to spin. You only have ${state.tokens}.\nMaybe try reducing your bet, or just accept that the AI won.`);
    stopAuto();
    return;
  }

  state.spinning = true;
  spinBtn.disabled = true;
  state.tokens -= bet;
  state.spins++;
  updateStats();
  setResult('⚙️  INFERRING…', '');

  const result = pickResult();
  state.results = result;

  const durations = [900, 1100, 1350];
  const promises = reels.map((reel, i) => animateReel(reel, strips[i], result[i], durations[i]));

  await Promise.all(promises);

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

  if (winAmount > 0) {
    state.tokens += winAmount;
    if (winAmount > state.biggestWin) state.biggestWin = winAmount;
    state.winStreak++;
    const net = winAmount - bet;

    if (type === 'jackpot') {
      const msg = JACKPOT_MSGS[Math.floor(Math.random() * JACKPOT_MSGS.length)];
      setResult(msg, 'jackpot');
      flashMachine('jackpot-flash');
      spawnCoins(24);
      log(`JACKPOT! +${winAmount} tokens (${result.map(s=>s.emoji).join('')})`, 'jackpot');
    } else {
      const msg = WIN_MSGS[Math.floor(Math.random() * WIN_MSGS.length)];
      setResult(`+${winAmount} TOKENS — ${msg}`, 'win');
      flashMachine('win-flash');
      spawnCoins(6 + Math.floor(winAmount / bet));
      log(`WIN +${winAmount}t  (net +${net}t)  ${result.map(s=>s.emoji).join('')}`, 'win');
    }
  } else {
    state.winStreak = 0;
    const msg = LOSE_MSGS[Math.floor(Math.random() * LOSE_MSGS.length)];
    setResult(msg, 'lose');
    log(`Loss -${bet}t  ${result.map(s=>s.emoji).join('')}`, 'lose');
  }

  updateStats();
  state.spinning = false;
  spinBtn.disabled = false;

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
  if (state.autoPlay) {
    stopAuto();
  } else {
    startAuto();
  }
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
