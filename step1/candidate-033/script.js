'use strict';

/* ── Symbols ─────────────────────────────────────────────────────── */
const SYMBOLS = [
  { id: 'robot',   emoji: '🤖', label: 'GPT-∞',      weight: 6  },
  { id: 'brain',   emoji: '🧠', label: 'Large Brain', weight: 8  },
  { id: 'token',   emoji: '🪙', label: 'Token',       weight: 10 },
  { id: 'prompt',  emoji: '📝', label: 'Prompt',      weight: 12 },
  { id: 'halluc',  emoji: '🌀', label: 'Hallucination',weight: 9 },
  { id: 'context', emoji: '📚', label: 'Context',     weight: 11 },
  { id: 'gpu',     emoji: '⚡', label: 'Compute',     weight: 7  },
  { id: 'error',   emoji: '❌', label: '404 Brain',   weight: 5  },
  { id: 'agi',     emoji: '🔮', label: 'AGI Soon™',   weight: 3  },
  { id: 'paper',   emoji: '📄', label: 'Paper',       weight: 10 },
];

/* ── Pay table ───────────────────────────────────────────────────── */
// Each entry: [id, id, id | '*'] → multiplier, label shown
const PAY_TABLE = [
  { match: ['agi',  'agi',  'agi'],    mult: 500, label: 'AGI ACHIEVED 🎉' },
  { match: ['robot','robot','robot'],  mult: 100, label: 'ROBOT UPRISING' },
  { match: ['gpu',  'gpu',  'gpu'],    mult: 75,  label: 'COMPUTE JACKPOT' },
  { match: ['brain','brain','brain'],  mult: 50,  label: 'OVERSIZED MODEL' },
  { match: ['halluc','halluc','halluc'],mult:40,  label: 'PURE HALLUCINATION' },
  { match: ['token','token','token'],  mult: 30,  label: 'TOKEN OVERFLOW' },
  { match: ['context','context','context'],mult:20,label:'CONTEXT WINDOW' },
  { match: ['prompt','prompt','prompt'],mult:15,  label: 'PERFECT PROMPT' },
  { match: ['error','error','error'],  mult: 10,  label: '404 ERROR ERROR' },
  { match: ['paper','paper','paper'],  mult: 8,   label: 'READ THE PAPER' },
  { match: ['*','*','*'],              mult: 5,   label: 'ANY TRIPLE' },
  { match: ['agi',  'agi',  null],     mult: 12,  label: 'TWO AGIs (close!)' },
  { match: ['robot','robot',null],     mult: 6,   label: 'TWO ROBOTS' },
  { match: ['gpu',  'gpu',  null],     mult: 4,   label: 'TWO GPUS' },
  { match: ['brain','brain',null],     mult: 3,   label: 'TWO BRAINS' },
  { match: ['token','token',null],     mult: 2,   label: 'TWO TOKENS' },
];

/* ── Funny messages ──────────────────────────────────────────────── */
const MSG_IDLE = [
  'Insert tokens. Watch AI dream of electric sheep.',
  'Every spin costs more than GPT-4 API call.',
  'The AI predicted you'd spin again.',
  'Hallucinating your next jackpot...',
  'Technically this is prompt engineering.',
  'We use your tokens to train the next model.',
  'This slot machine has more parameters than GPT-2.',
  '"AI is just statistics." — Statistics, probably.',
  'Please provide more tokens to continue reasoning.',
];

const MSG_WIN = {
  jackpot: [
    '🎉 JACKPOT! The AGI has chosen you! Quick, sign the papers!',
    '🔮 AGI ACHIEVED! (Terms & conditions: not actual AGI)',
    '💥 MAXIMUM TOKENS! Sam Altman sent a congratulatory email to himself.',
  ],
  big: [
    '🤖 ROBOT UPRISING! Your tokens unionised and demanded more tokens.',
    '⚡ COMPUTE WIN! You've used more electricity than a small country.',
    '🧠 BIG BRAIN WIN! Researchers are baffled. Or hallucinating.',
    '🌀 The hallucination was so convincing it became real money.',
  ],
  mid: [
    '👾 Mid win! Like a mid AI benchmark — technically impressive, practically meh.',
    '📝 Perfect prompt! Too bad the output was still 80% filler.',
    '📚 Context window win! You remembered something the AI already forgot.',
    '🪙 Token flood! But remember: you can never have enough tokens.',
  ],
  small: [
    '✅ Small win! The AI says: "I'm just an LLM, but well done."',
    '💬 Tokens recovered. Prompt responsibly.',
    '📄 Read the paper! (Nobody reads the paper.)',
    '🎲 Statistically average! Just like every AI benchmark.',
  ],
};

const MSG_LOSE = [
  'Oof. The AI has no memory of your previous wins either.',
  'Your tokens have been added to the training dataset.',
  'This is fine. 🔥  (Model confidence: 99.7%)',
  'Better luck next epoch.',
  'The model is learning... on your dime.',
  'Have you tried: fewer hallucinations, more jackpots?',
  'Error 429: Too many losses. Please wait 60s. Just kidding.',
  'Tokens consumed. No refund. This is the way.',
  '"We will achieve profit next quarter." — This slot machine',
  'Tokens deducted. Weights updated. You are now part of the model.',
  'That was not the intended output. Adjusting RLHF reward signal...',
  'Low loss! (For us, not you.)',
];

/* ── Helpers ─────────────────────────────────────────────────────── */
function weightedRandom(pool) {
  const total = pool.reduce((s, s2) => s + s2.weight, 0);
  let r = Math.random() * total;
  for (const sym of pool) { r -= sym.weight; if (r <= 0) return sym; }
  return pool[pool.length - 1];
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function checkPay(results) {
  const ids = results.map(s => s.id);
  for (const row of PAY_TABLE) {
    if (row.match[2] === null) {
      // two-match (first two only, third different)
      if (ids[0] === row.match[0] && ids[1] === row.match[1] && ids[2] !== row.match[0]) {
        return row;
      }
    } else if (row.match[0] === '*') {
      // any triple
      if (ids[0] === ids[1] && ids[1] === ids[2]) return row;
    } else {
      if (ids[0] === row.match[0] && ids[1] === row.match[1] && ids[2] === row.match[2]) {
        return row;
      }
    }
  }
  return null;
}

function getTier(mult) {
  if (mult >= 100) return 'jackpot';
  if (mult >= 30)  return 'big';
  if (mult >= 8)   return 'mid';
  return 'small';
}

/* ── State ───────────────────────────────────────────────────────── */
let tokens     = 100;
let bet        = 5;
let spinning   = false;
let statSpins  = 0;
let statWon    = 0;
let statLost   = 0;
let statBig    = 0;

/* ── DOM refs ────────────────────────────────────────────────────── */
const tokenCountEl  = document.getElementById('tokenCount');
const betAmountEl   = document.getElementById('betAmount');
const lastWinEl     = document.getElementById('lastWin');
const spinBtn       = document.getElementById('spinBtn');
const spinCostEl    = document.getElementById('spinCost');
const maxBetBtn     = document.getElementById('maxBetBtn');
const betUpBtn      = document.getElementById('betUp');
const betDownBtn    = document.getElementById('betDown');
const msgText       = document.getElementById('messageText');
const msgBoard      = document.getElementById('messageBoard');
const winOverlay    = document.getElementById('winOverlay');
const winOverlayTxt = document.getElementById('winOverlayText');
const refillBtn     = document.getElementById('refillBtn');
const winLineInd    = document.getElementById('winLineIndicator');

const reelEls   = [0,1,2].map(i => document.getElementById(`reel${i}`));
const wrappers  = [0,1,2].map(i => document.getElementById(`reelWrapper${i}`));
const lights    = Array.from(document.querySelectorAll('.light'));

const statSpinsEl = document.getElementById('statSpins');
const statWonEl   = document.getElementById('statWon');
const statLostEl  = document.getElementById('statLost');
const statBigEl   = document.getElementById('statBig');

/* ── Reel setup ──────────────────────────────────────────────────── */
const VISIBLE = 5;   // how many symbols visible in the window
const SYMBOL_H = parseInt(getComputedStyle(document.documentElement)
  .getPropertyValue('--symbol-h')) || 104;

function buildSymbolEl(sym) {
  const div = document.createElement('div');
  div.className = 'symbol';
  div.innerHTML = `${sym.emoji}<span class="symbol-label">${sym.label}</span>`;
  return div;
}

// Each reel strip: build a long pool for natural scrolling
const STRIP_LENGTH = 40;
const reelStrips = [0,1,2].map(() =>
  Array.from({ length: STRIP_LENGTH }, () => weightedRandom(SYMBOLS))
);

// Current top index for each reel
let reelPositions = [0, 0, 0];  // index of symbol currently at top of visible window
// We show VISIBLE symbols; the centre one (index 2 of visible) is the payline symbol

function renderReel(ri) {
  const reel = reelEls[ri];
  reel.innerHTML = '';
  const strip = reelStrips[ri];
  for (let i = 0; i < strip.length; i++) {
    reel.appendChild(buildSymbolEl(strip[i]));
  }
  positionReel(ri, reelPositions[ri], false);
}

function positionReel(ri, topIdx, animate) {
  const reel = reelEls[ri];
  // We want the symbol at topIdx to be at the very top of the strip window.
  // The window is VISIBLE symbols tall; we offset so the centre (index 2) aligns.
  const offset = -(topIdx * SYMBOL_H) + (SYMBOL_H * Math.floor(VISIBLE / 2));
  if (!animate) {
    reel.style.transition = 'none';
    reel.style.transform = `translateY(${offset}px)`;
  } else {
    reel.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    reel.style.transform = `translateY(${offset}px)`;
  }
}

function getPaylineSymbol(ri) {
  return reelStrips[ri][reelPositions[ri]];
}

[0,1,2].forEach(ri => renderReel(ri));

/* ── Lights animation ────────────────────────────────────────────── */
const lightColors = ['on-gold','on-cyan','on-pink','on-green'];
let lightFrame = null;
let lightIdx = 0;

function animateLights(active, fast) {
  cancelAnimationFrame(lightFrame);
  if (!active) { lights.forEach(l => { l.className = 'light'; }); return; }
  const interval = fast ? 80 : 200;
  let last = 0;
  function step(ts) {
    if (ts - last > interval) {
      last = ts;
      lights.forEach((l, i) => {
        l.className = 'light';
        const ci = (i + lightIdx) % lightColors.length;
        l.classList.add(lightColors[ci]);
      });
      lightIdx = (lightIdx + 1) % lightColors.length;
    }
    lightFrame = requestAnimationFrame(step);
  }
  lightFrame = requestAnimationFrame(step);
}

/* ── Paytable render ─────────────────────────────────────────────── */
function renderPaytable() {
  const grid = document.getElementById('paytable');
  grid.innerHTML = '';
  const rows = PAY_TABLE.filter(r => r.match[2] !== null);  // show triples only
  rows.forEach(row => {
    const div = document.createElement('div');
    div.className = 'pt-row';
    let syms;
    if (row.match[0] === '*') {
      syms = '🎰🎰🎰';
    } else {
      syms = row.match.map(id => SYMBOLS.find(s => s.id === id)?.emoji || '?').join('');
    }
    div.innerHTML = `
      <span class="pt-symbols">${syms}</span>
      <span class="pt-label">${row.label}</span>
      <span class="pt-mult">×${row.mult}</span>
    `;
    grid.appendChild(div);
  });
}
renderPaytable();

/* ── Message helpers ─────────────────────────────────────────────── */
let msgTimeout = null;
function showMessage(text, duration) {
  clearTimeout(msgTimeout);
  msgText.classList.add('fade');
  setTimeout(() => {
    msgText.textContent = text;
    msgText.classList.remove('fade');
  }, 300);
  if (duration) {
    msgTimeout = setTimeout(() => showMessage(pickRandom(MSG_IDLE)), duration);
  }
}

/* ── UI update ───────────────────────────────────────────────────── */
function updateUI() {
  tokenCountEl.textContent  = tokens;
  betAmountEl.textContent   = bet;
  spinCostEl.textContent    = `−${bet} tokens`;
  statSpinsEl.textContent   = statSpins;
  statWonEl.textContent     = statWon;
  statLostEl.textContent    = statLost;
  statBigEl.textContent     = statBig;

  const canSpin = tokens >= bet && !spinning;
  spinBtn.disabled = !canSpin;

  refillBtn.style.display = tokens < 1 ? 'block' : 'none';
}

function bumpCount(el) {
  el.classList.remove('bump');
  void el.offsetWidth; // reflow
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 200);
}

/* ── Confetti ────────────────────────────────────────────────────── */
function fireConfetti(count) {
  const colors = ['#ffd700','#00e5ff','#ff4da6','#00ff88','#9b59ff'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    el.style.left   = Math.random() * 100 + 'vw';
    el.style.background = pickRandom(colors);
    el.style.width  = (6 + Math.random() * 8) + 'px';
    el.style.height = (6 + Math.random() * 8) + 'px';
    el.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    el.style.animationDelay   = (Math.random() * .5) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

/* ── Win overlay ─────────────────────────────────────────────────── */
let overlayTimeout = null;
function showWinOverlay(text, tier) {
  clearTimeout(overlayTimeout);
  winOverlayTxt.textContent = text;
  winOverlayTxt.className = `win-overlay-text tier-${tier}`;
  winOverlay.classList.add('show');
  overlayTimeout = setTimeout(() => winOverlay.classList.remove('show'), 2200);
}

/* ── Spin logic ──────────────────────────────────────────────────── */
function spin() {
  if (spinning || tokens < bet) return;

  spinning = true;
  tokens  -= bet;
  statSpins++;
  statLost += bet;
  updateUI();

  spinBtn.disabled = true;
  animateLights(true, true);

  const SPIN_COUNT = [
    20 + Math.floor(Math.random() * 15),
    25 + Math.floor(Math.random() * 15),
    30 + Math.floor(Math.random() * 15),
  ];

  // Decide final result up-front (allows rigging toward interesting outcomes)
  const finalSymbols = [0,1,2].map(() => weightedRandom(SYMBOLS));
  // Place them in the strip at position 20 (end of spin)
  const finalPositions = [0,1,2].map((ri) => {
    const targetIdx = SPIN_COUNT[ri];
    reelStrips[ri][targetIdx % reelStrips[ri].length] = finalSymbols[ri];
    return targetIdx % reelStrips[ri].length;
  });

  // Animate each reel
  const delays = [0, 250, 500];
  let done = 0;

  [0,1,2].forEach(ri => {
    setTimeout(() => {
      const strip    = reelStrips[ri];
      const startPos = reelPositions[ri];
      const endPos   = finalPositions[ri];
      const totalSymbols = (endPos - startPos + strip.length) % strip.length
        || strip.length; // ensure forward spin

      // fast scroll using CSS animation on the reel element
      const reel    = reelEls[ri];
      const wrapper = wrappers[ri];

      wrapper.classList.add('spinning');

      // We do a JS-driven animation for smooth effect
      const duration = 1200 + ri * 250;  // ms
      const startTime = performance.now();
      const startOffset = -(startPos * SYMBOL_H) + (SYMBOL_H * Math.floor(VISIBLE / 2));
      const totalPx     = totalSymbols * SYMBOL_H;

      function easeOut(t) {
        return 1 - Math.pow(1 - t, 4);
      }

      function frame(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = easeOut(progress);
        const current  = startOffset - totalPx * eased;
        reel.style.transition = 'none';
        reel.style.transform  = `translateY(${current}px)`;

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          reelPositions[ri] = finalPositions[ri];
          positionReel(ri, reelPositions[ri], false);
          wrapper.classList.remove('spinning');
          done++;

          if (done === 3) onAllStopped(finalSymbols);
        }
      }

      requestAnimationFrame(frame);
    }, delays[ri]);
  });
}

function onAllStopped(results) {
  spinning = false;
  animateLights(false);

  const pay = checkPay(results);

  if (pay) {
    const winAmt = bet * pay.mult;
    tokens   += winAmt;
    statWon  += winAmt;
    statLost -= bet;  // reverse the loss we added up-front (we already added bet)
    if (winAmt > statBig) statBig = winAmt;

    lastWinEl.textContent = winAmt;
    bumpCount(lastWinEl);
    bumpCount(tokenCountEl);

    const tier = getTier(pay.mult);
    winLineInd.classList.add('active');
    setTimeout(() => winLineInd.classList.remove('active'), 2000);

    const confettiCount = tier === 'jackpot' ? 120 : tier === 'big' ? 60 : tier === 'mid' ? 30 : 10;
    fireConfetti(confettiCount);

    animateLights(true, tier === 'jackpot');

    const overlayLine = `${pay.label}\n+${winAmt} tokens`;
    showWinOverlay(overlayLine, tier);

    const msgArr = MSG_WIN[tier] || MSG_WIN.small;
    showMessage(`+${winAmt} tokens! ${pay.label} — ${pickRandom(msgArr)}`, 5000);

    setTimeout(() => animateLights(false), tier === 'jackpot' ? 4000 : 2500);
  } else {
    lastWinEl.textContent = 0;
    showMessage(pickRandom(MSG_LOSE), 4000);
  }

  updateUI();
}

/* ── Bet controls ─────────────────────────────────────────────────── */
const BET_STEPS = [1, 2, 5, 10, 20, 50, 100];
function setBet(val) {
  bet = Math.max(1, Math.min(val, tokens || 1));
  updateUI();
}

betUpBtn.addEventListener('click', () => {
  const nextStep = BET_STEPS.find(s => s > bet) || BET_STEPS[BET_STEPS.length - 1];
  setBet(nextStep);
});
betDownBtn.addEventListener('click', () => {
  const prev = [...BET_STEPS].reverse().find(s => s < bet) || BET_STEPS[0];
  setBet(prev);
});
maxBetBtn.addEventListener('click', () => setBet(tokens));
spinBtn.addEventListener('click', spin);

/* ── Keyboard support ────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (!spinning && tokens >= bet) spin();
  }
  if (e.code === 'ArrowUp')   betUpBtn.click();
  if (e.code === 'ArrowDown') betDownBtn.click();
});

/* ── Refill ──────────────────────────────────────────────────────── */
refillBtn.addEventListener('click', () => {
  tokens = 100;
  showMessage('🤖 The AI graciously donated tokens from your future rent money.', 5000);
  updateUI();
});

/* ── Idle message cycle ─────────────────────────────────────────── */
setInterval(() => {
  if (!spinning) showMessage(pickRandom(MSG_IDLE));
}, 8000);

/* ── Init ───────────────────────────────────────────────────────── */
updateUI();
showMessage(pickRandom(MSG_IDLE));
