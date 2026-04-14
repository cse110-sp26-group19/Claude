/* ===========================
   AI TOKEN SLOTS - Logic
   =========================== */

'use strict';

// ---- SYMBOLS ---- //
const SYMBOLS = [
  { emoji: '🤖', label: 'CHATBOT',     weight: 20, id: 'bot'       },
  { emoji: '🧠', label: 'BIG BRAIN',   weight: 18, id: 'brain'     },
  { emoji: '💀', label: 'HALLUCINATE', weight: 15, id: 'skull'     },
  { emoji: '💾', label: 'TRAINING',    weight: 14, id: 'floppy'    },
  { emoji: '🔥', label: 'GPU FIRE',    weight: 12, id: 'fire'      },
  { emoji: '📎', label: 'CLIPPY',      weight: 10, id: 'clip'      },
  { emoji: '🎰', label: 'JACKPOT',     weight:  6, id: 'slot'      },
  { emoji: '💎', label: 'DIAMOND AGI', weight:  5, id: 'diamond'   },
];

// ---- PAYTABLE ---- //
// Each entry: { combo: [id,id,id] | [id,id,'any'], multiplier, label }
// combo length 3 = exact match; 'any' = wildcard
const PAYTABLE = [
  { combo: ['diamond','diamond','diamond'], multiplier: 100, label: 'DIAMOND AGI' },
  { combo: ['slot',   'slot',   'slot'   ], multiplier:  50, label: 'JACKPOT!'    },
  { combo: ['bot',    'bot',    'bot'    ], multiplier:  20, label: 'ROBOT ARMY'  },
  { combo: ['brain',  'brain',  'brain'  ], multiplier:  15, label: 'SUPERINTEL.' },
  { combo: ['fire',   'fire',   'fire'   ], multiplier:  12, label: 'MELTDOWN'    },
  { combo: ['skull',  'skull',  'skull'  ], multiplier:  10, label: 'RLHF FAILED' },
  { combo: ['floppy', 'floppy', 'floppy' ], multiplier:   8, label: 'DATA LAKE'   },
  { combo: ['clip',   'clip',   'clip'   ], multiplier:   6, label: 'CLIPPY WIN'  },
  { combo: ['diamond','diamond', 'any'   ], multiplier:   5, label: '2X DIAMOND'  },
  { combo: ['slot',   'slot',    'any'   ], multiplier:   3, label: '2X JACKPOT'  },
  { combo: ['bot',    'bot',     'any'   ], multiplier:   2, label: '2X CHATBOT'  },
  { combo: ['brain',  'brain',   'any'   ], multiplier:   2, label: '2X BRAIN'    },
];

// ---- QUIPS ---- //
const WIN_QUIPS = [
  "The model is confident this is correct.",
  "Inference complete. Surprisingly profitable.",
  "You've been allocated more context.",
  "Reward model engaged. Dopamine deployed.",
  "GPT-∞ predicts your continued gambling.",
  "Reinforcement learning working as intended.",
  "Tokens acquired. Alignment unclear.",
  "The weights have spoken in your favor.",
  "Gradient descent into wealth.",
  "No hallucinations detected. Probably.",
];

const LOSE_QUIPS = [
  "Technically the model was 72% confident.",
  "Your tokens have been tokenized.",
  "Computed. Consumed. Gone.",
  "Context window now slightly emptier.",
  "The training data didn't include winning.",
  "Loss function minimized... for the house.",
  "Attention mechanism attended to your wallet.",
  "Your tokens are now fine-tuning someone else.",
  "Inference fee: existential dread.",
  "ERROR: funds not found. Try fewer params.",
];

// ---- STATE ---- //
let state = {
  balance:     1000,
  burned:      0,
  bet:         10,
  spinning:    false,
  history:     [],
  results:     [null, null, null],
};

// ---- DOM refs ---- //
const balanceEl  = document.getElementById('token-balance');
const burnedEl   = document.getElementById('tokens-burned');
const betAmtEl   = document.getElementById('bet-amount');
const betMinusEl = document.getElementById('bet-minus');
const betPlusEl  = document.getElementById('bet-plus');
const spinBtn    = document.getElementById('spin-btn');
const resultMsg  = document.getElementById('result-message');
const winBanner  = document.getElementById('win-banner');
const historyEl  = document.getElementById('history-list');
const paytableEl = document.getElementById('paytable-grid');
const addTokBtn  = document.getElementById('add-tokens-btn');
const resetBtn   = document.getElementById('reset-btn');
const machineLogo = document.querySelector('.machine-logo');

// Modal
const modalOverlay = document.getElementById('modal-overlay');
const modalIcon    = document.getElementById('modal-icon');
const modalTitle   = document.getElementById('modal-title');
const modalBody    = document.getElementById('modal-body');
const modalBtn     = document.getElementById('modal-btn');
modalBtn.addEventListener('click', closeModal);

// ---- INIT ---- //
initReels();
renderPaytable();
updateUI();

// ---- REEL SETUP ---- //
const REEL_COUNT  = 3;
const STRIP_SIZE  = 30;   // symbols on each virtual strip
const reelStrips  = [];   // reelStrips[i] = array of symbol indices
const reelOffsets = [];   // current pixel offset for each reel

function buildWeightedPool() {
  const pool = [];
  SYMBOLS.forEach((s, i) => {
    for (let w = 0; w < s.weight; w++) pool.push(i);
  });
  return pool;
}

function initReels() {
  const pool = buildWeightedPool();

  for (let r = 0; r < REEL_COUNT; r++) {
    const strip = [];
    for (let s = 0; s < STRIP_SIZE; s++) {
      strip.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    reelStrips.push(strip);
    reelOffsets.push(0);

    const inner = document.getElementById(`reel-inner-${r}`);
    inner.innerHTML = '';
    strip.forEach(symIdx => {
      inner.appendChild(makeSymbolEl(symIdx));
    });
    // Clone first few to allow seamless wrap
    for (let c = 0; c < 3; c++) {
      inner.appendChild(makeSymbolEl(strip[c]));
    }

    // Position so middle of strip is in view
    const startRow = Math.floor(STRIP_SIZE / 2) - 1;
    setReelOffset(r, startRow * SYMBOL_H());
    reelOffsets[r] = startRow;
  }
}

function SYMBOL_H() {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--symbol-h')) || 110;
}

function makeSymbolEl(symIdx) {
  const sym = SYMBOLS[symIdx];
  const div = document.createElement('div');
  div.className = 'reel-symbol';
  div.innerHTML = `<span class="symbol-emoji">${sym.emoji}</span><span class="symbol-label">${sym.label}</span>`;
  return div;
}

function setReelOffset(reelIdx, px) {
  const inner = document.getElementById(`reel-inner-${reelIdx}`);
  inner.style.transform = `translateY(-${px}px)`;
}

function getSymbolAtCenter(reelIdx) {
  const offset = reelOffsets[reelIdx];
  const idx    = offset % STRIP_SIZE;
  return reelStrips[reelIdx][idx];
}

// ---- SPIN ---- //
spinBtn.addEventListener('click', () => {
  if (state.spinning) return;
  if (state.balance < state.bet) {
    showModal('💸', 'OUT OF TOKENS', `You're broke. The model has consumed all your context.\n\nTap "Add 500 Tokens (Free Tier)" for a top-up.`, 'UNDERSTOOD');
    return;
  }

  state.balance -= state.bet;
  state.burned  += state.bet;
  state.spinning = true;
  resultMsg.textContent = '';
  winBanner.textContent = '';
  winBanner.style.color = '';
  spinBtn.disabled = true;
  updateUI();

  machineLogo.classList.add('spinning');

  // Choose final targets before animation
  const targets = [];
  const pool = buildWeightedPool();
  for (let r = 0; r < REEL_COUNT; r++) {
    targets.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  // Spin each reel with a staggered stop
  const spinPromises = targets.map((targetSymIdx, r) =>
    spinReel(r, targetSymIdx, 600 + r * 350)
  );

  Promise.all(spinPromises).then(() => {
    machineLogo.classList.remove('spinning');
    state.spinning = false;
    spinBtn.disabled = false;

    state.results = targets;
    evaluateResult(targets);
  });
});

/**
 * Animate reel r and land on targetSymIdx.
 * Returns a promise that resolves when the reel stops.
 */
function spinReel(reelIdx, targetSymIdx, spinDuration) {
  return new Promise(resolve => {
    const sh = SYMBOL_H();
    const inner = document.getElementById(`reel-inner-${reelIdx}`);

    // Pick a row in the strip that shows targetSymIdx
    const strip = reelStrips[reelIdx];
    const candidates = strip.map((si, pos) => si === targetSymIdx ? pos : -1).filter(p => p >= 0);
    const targetRow  = candidates[Math.floor(Math.random() * candidates.length)] ?? 0;

    // How many full loops + distance to target
    const currentRow    = reelOffsets[reelIdx];
    const extraLoops    = 3 + reelIdx; // more loops per reel
    const totalSymbols  = extraLoops * STRIP_SIZE + ((targetRow - currentRow + STRIP_SIZE) % STRIP_SIZE);
    const totalDistance = totalSymbols * sh;

    let start       = null;
    let lastFrame   = 0;

    function easeOut(t) {
      // Fast start, slow at end
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(ts) {
      if (!start) start = ts;
      const elapsed  = ts - start;
      const progress = Math.min(elapsed / spinDuration, 1);
      const eased    = easeOut(progress);

      const moved = Math.floor(eased * totalDistance);
      const row   = (Math.floor(moved / sh) + currentRow) % STRIP_SIZE;
      const px    = (Math.floor(moved / sh) + currentRow) * sh % (STRIP_SIZE * sh);

      setReelOffset(reelIdx, px);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Snap to exact target
        reelOffsets[reelIdx] = targetRow;
        setReelOffset(reelIdx, targetRow * sh);
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

// ---- EVALUATE ---- //
function evaluateResult(targets) {
  const ids = targets.map(t => SYMBOLS[t].id);

  let matched   = null;
  let payout    = 0;

  for (const entry of PAYTABLE) {
    const c = entry.combo;
    if (
      (c[0] === ids[0] || c[0] === 'any') &&
      (c[1] === ids[1] || c[1] === 'any') &&
      (c[2] === ids[2] || c[2] === 'any')
    ) {
      matched = entry;
      break;
    }
    // Also check reversed 'any' patterns (any, a, a)
    if (c[2] === 'any' && ids[0] === c[0] && ids[1] === c[1]) {
      matched = entry;
      break;
    }
  }

  if (matched) {
    payout = state.bet * matched.multiplier;
    state.balance += payout;
    const net = payout - state.bet;
    const quip = WIN_QUIPS[Math.floor(Math.random() * WIN_QUIPS.length)];

    resultMsg.style.color = '#00ff88';
    resultMsg.textContent = `+${payout} tokens // ${quip}`;

    winBanner.style.color = '#ffe600';
    winBanner.textContent = `★ ${matched.label} ★  ${matched.multiplier}× PAYOUT`;

    flashBalance('flash-win');
    launchConfetti(30);
    addHistory(targets, `+${net}`, 'win', matched.label);

    if (matched.multiplier >= 20) {
      setTimeout(() => {
        showModal('🎰', matched.label, `You won ${payout} tokens!\n\n${quip}`, 'INCREDIBLE');
      }, 800);
    }
  } else {
    const quip = LOSE_QUIPS[Math.floor(Math.random() * LOSE_QUIPS.length)];
    resultMsg.style.color = '#ff00aa';
    resultMsg.textContent = `−${state.bet} tokens // ${quip}`;
    winBanner.textContent = '';
    flashBalance('flash-lose');
    addHistory(targets, `-${state.bet}`, 'lose', quip);
  }

  updateUI();

  if (state.balance <= 0) {
    setTimeout(() => {
      showModal('💀', 'CONTEXT DEPLETED', `You have 0 tokens remaining.\n\nThe model has consumed your entire context window. This is fine.`, 'ADD MORE TOKENS');
    }, 600);
  }
}

// ---- UI HELPERS ---- //
function updateUI() {
  balanceEl.textContent  = state.balance.toLocaleString();
  burnedEl.textContent   = state.burned.toLocaleString();
  betAmtEl.textContent   = state.bet;

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.bet) === state.bet);
  });
}

function flashBalance(cls) {
  balanceEl.classList.remove('flash-win', 'flash-lose');
  void balanceEl.offsetWidth; // reflow
  balanceEl.classList.add(cls);
  balanceEl.addEventListener('animationend', () => balanceEl.classList.remove(cls), { once: true });
}

function addHistory(targets, delta, type, msg) {
  const symbols = targets.map(t => SYMBOLS[t].emoji).join('');
  state.history.unshift({ symbols, delta, type, msg });
  if (state.history.length > 20) state.history.pop();
  renderHistory();
}

function renderHistory() {
  historyEl.innerHTML = '';
  state.history.forEach(h => {
    const li = document.createElement('li');
    li.className = `history-item ${h.type}`;
    li.innerHTML = `
      <span class="symbols">${[...h.symbols].map(e=>`<span>${e}</span>`).join('')}</span>
      <span class="history-msg">${escapeHTML(h.msg)}</span>
      <span class="delta">${h.delta}</span>
    `;
    historyEl.appendChild(li);
  });
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderPaytable() {
  paytableEl.innerHTML = '';
  PAYTABLE.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'paytable-row';

    const comboEmojis = entry.combo.map(id => {
      if (id === 'any') return '❓';
      const sym = SYMBOLS.find(s => s.id === id);
      return sym ? sym.emoji : '?';
    }).join('');

    row.innerHTML = `
      <div class="paytable-symbols">${[...comboEmojis].map(e=>`<span>${e}</span>`).join('')}</div>
      <div class="paytable-info">
        <div class="paytable-combo">${entry.label}</div>
      </div>
      <div class="paytable-payout">${entry.multiplier}×</div>
    `;
    paytableEl.appendChild(row);
  });
}

// ---- BET CONTROLS ---- //
const BET_STEPS = [5, 10, 25, 50, 100];

betMinusEl.addEventListener('click', () => {
  const idx = BET_STEPS.indexOf(state.bet);
  if (idx > 0) state.bet = BET_STEPS[idx - 1];
  else if (idx === -1) state.bet = BET_STEPS[0];
  updateUI();
});

betPlusEl.addEventListener('click', () => {
  const idx = BET_STEPS.indexOf(state.bet);
  if (idx < BET_STEPS.length - 1) state.bet = BET_STEPS[idx + 1];
  else if (idx === -1) state.bet = BET_STEPS[BET_STEPS.length - 1];
  updateUI();
});

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.bet = parseInt(btn.dataset.bet);
    updateUI();
  });
});

// ---- AUX BUTTONS ---- //
addTokBtn.addEventListener('click', () => {
  state.balance += 500;
  resultMsg.style.color = '#00cfff';
  resultMsg.textContent = '+500 tokens // Free tier allocation approved. For now.';
  updateUI();
  flashBalance('flash-win');
});

resetBtn.addEventListener('click', () => {
  showModal('🔄', 'FLUSH CACHE?', 'This will reset your token balance and burn history. The model will forget this ever happened.', 'CONFIRM RESET', () => {
    state.balance = 1000;
    state.burned  = 0;
    state.history = [];
    resultMsg.textContent = '';
    winBanner.textContent = '';
    historyEl.innerHTML = '';
    updateUI();
  });
});

// ---- CONFETTI ---- //
const CONFETTI_COLORS = ['#00ff88','#00cfff','#ffe600','#ff6600','#ff00aa'];

function launchConfetti(count) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left       = Math.random() * 100 + 'vw';
    el.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    el.style.width      = (6 + Math.random() * 6) + 'px';
    el.style.height     = (6 + Math.random() * 6) + 'px';
    el.style.animationDuration = (1.2 + Math.random() * 1.2) + 's';
    el.style.animationDelay   = (Math.random() * 0.4) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ---- MODAL ---- //
let modalCallback = null;

function showModal(icon, title, body, btnText = 'OK', callback = null) {
  modalIcon.textContent  = icon;
  modalTitle.textContent = title;
  modalBody.textContent  = body;
  modalBtn.textContent   = btnText;
  modalCallback = callback;
  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
  if (modalCallback) {
    modalCallback();
    modalCallback = null;
  }
}

modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

// ---- KEYBOARD SHORTCUT ---- //
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !state.spinning && !modalOverlay.classList.contains('open')) {
    e.preventDefault();
    spinBtn.click();
  }
});
