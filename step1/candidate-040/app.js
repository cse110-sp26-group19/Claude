'use strict';

// ── Symbols & paytable ─────────────────────────────────────────────────────
const SYMBOLS = ['🤖', '📜', '🌀', '🖥️', '🧠', '🪙', '💀', '⚡'];

// Weighted pool — rarer symbols appear less
const POOL = [
  '🤖','🤖',           // rare  (jackpot)
  '📜','📜','📜',       // uncommon
  '🌀','🌀','🌀',
  '🖥️','🖥️','🖥️','🖥️',
  '🧠','🧠','🧠','🧠',
  '🪙','🪙','🪙','🪙','🪙',
  '💀','💀','💀','💀','💀','💀',
  '⚡','⚡','⚡','⚡','⚡','⚡','⚡',
];

const PAYOUT = {
  '🤖': 50,
  '📜': 20,
  '🌀': 15,
  '🖥️': 12,
  '🧠': 10,
  '🪙': 8,
  '💀': 5,
  '⚡': 3,
};

const COMBO_NAMES = {
  '🤖': 'SUPERINTELLIGENCE',
  '📜': 'CONTEXT WINDOW',
  '🌀': 'HALLUCINATION',
  '🖥️': 'GPU CLUSTER',
  '🧠': 'BIG BRAIN',
  '🪙': 'TOKEN RAIN',
  '💀': 'DEPRECATED MODEL',
  '⚡': 'INFERENCE SPIKE',
};

const QUIPS = {
  win: [
    "Tokens acquired. GPT-5 is shaking.",
    "You just beat the model. Briefly.",
    "Your context window is huge right now.",
    "The gradient descended… in your favour.",
    "Reinforcement learning? More like reinforcement earning.",
    "The AI overlords are displeased.",
    "You've unlocked the premium tier. For now.",
    "Stochastic parrot? More like stochastic profits.",
  ],
  lose: [
    "Your tokens were deprecated.",
    "Model not found. Tokens not found.",
    "This result is confidently wrong.",
    "Error 404: Winnings not found.",
    "This output has been hallucinated away.",
    "Rate limit reached. Also: you lost.",
    "The model is reasoning… into your wallet.",
    "Fine-tuned for maximum disappointment.",
    "Your prompt was too vague. Also you lost.",
    "Tokens burned for warmth. GPU stays warm, you don't.",
  ],
  pair: [
    "Two out of three! Like a 67% accuracy LLM.",
    "Partial match found. Processing fee applies.",
    "Almost aligned. Story of AI's life.",
  ],
  broke: [
    "Out of tokens. The irony of the token economy.",
    "You've been rate-limited by poverty.",
    "Compute budget exhausted. Model sunset.",
  ],
  jackpot: [
    "🚨 SUPERINTELLIGENCE ACHIEVED 🚨\nPlease remain calm.\nYour tokens have achieved sentience.",
    "The singularity just paid out.\nSafety team is typing…",
    "You won the jackpot!\nBut at what cost to humanity?",
  ],
};

// ── State ──────────────────────────────────────────────────────────────────
let tokens = 100;
let bet = 10;
let spinning = false;
let spinCount = 0;

// ── DOM refs ───────────────────────────────────────────────────────────────
const tokenCountEl = document.getElementById('token-count');
const betAmountEl  = document.getElementById('bet-amount');
const spinCostEl   = document.getElementById('spin-cost');
const spinBtn      = document.getElementById('spin-btn');
const maxBtn       = document.getElementById('max-btn');
const betDownBtn   = document.getElementById('bet-down');
const betUpBtn     = document.getElementById('bet-up');
const resultBanner = document.getElementById('result-banner');
const historyList  = document.getElementById('history-list');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle   = document.getElementById('modal-title');
const modalBody    = document.getElementById('modal-body');
const modalClose   = document.getElementById('modal-close');
const bulbs        = document.querySelectorAll('.bulb');

const reelEls = [
  document.getElementById('reel-0'),
  document.getElementById('reel-1'),
  document.getElementById('reel-2'),
];

// ── Helpers ────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function updateTokenDisplay() {
  tokenCountEl.textContent = tokens;
}

function updateBetDisplay() {
  betAmountEl.textContent = bet;
  spinCostEl.textContent  = `(costs ${bet} tokens)`;
}

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

// ── Marquee lights ─────────────────────────────────────────────────────────
let marqueeTick = 0;
let marqueeInterval = null;

function startMarquee() {
  if (marqueeInterval) return;
  marqueeInterval = setInterval(() => {
    bulbs.forEach((b, i) => {
      b.classList.toggle('on', (i + marqueeTick) % 3 === 0);
    });
    marqueeTick++;
  }, 160);
}

function stopMarquee() {
  clearInterval(marqueeInterval);
  marqueeInterval = null;
  bulbs.forEach(b => b.classList.remove('on'));
}

// ── Reel animation ─────────────────────────────────────────────────────────
/**
 * Animates a single reel by cycling through random symbols rapidly,
 * then snaps to finalSymbol after `duration` ms.
 */
function spinReel(reelEl, finalSymbol, duration) {
  return new Promise(resolve => {
    const symbolEl = reelEl.querySelector('.symbol');
    const fps = 80; // ms per frame
    let elapsed = 0;

    const ticker = setInterval(() => {
      elapsed += fps;
      symbolEl.textContent = pick(SYMBOLS);

      if (elapsed >= duration) {
        clearInterval(ticker);
        symbolEl.textContent = finalSymbol;

        // Bounce animation via Web Animations API
        reelEl.animate(
          [
            { transform: 'translateY(-10px)' },
            { transform: 'translateY(4px)' },
            { transform: 'translateY(0px)' },
          ],
          { duration: 220, easing: 'ease-out', fill: 'forwards' }
        ).onfinish = resolve;
      }
    }, fps);
  });
}

// ── Confetti (canvas) ──────────────────────────────────────────────────────
function launchConfetti(big = false) {
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
  }

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const count = big ? 200 : 80;
  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 200,
    r: 4 + Math.random() * 6,
    color: pick(['#f5c518','#a855f7','#22c55e','#38bdf8','#fb7185','#fff']),
    vx: (Math.random() - .5) * 6,
    vy: 2 + Math.random() * 5,
    rot: Math.random() * 360,
    rotV: (Math.random() - .5) * 10,
    shape: Math.random() > .5 ? 'rect' : 'circle',
  }));

  let frame;
  const max = big ? 240 : 120;
  let tick = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - tick / max);
      if (p.shape === 'rect') {
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      p.x  += p.vx;
      p.y  += p.vy;
      p.rot += p.rotV;
      p.vy += 0.12; // gravity
    });

    tick++;
    if (tick < max) {
      frame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  cancelAnimationFrame(frame);
  draw();
}

// ── Token flash ────────────────────────────────────────────────────────────
function flashTokens(type) {
  tokenCountEl.classList.remove('flash-win', 'flash-lose');
  void tokenCountEl.offsetWidth; // reflow to restart animation
  tokenCountEl.classList.add(type === 'win' ? 'flash-win' : 'flash-lose');
}

// ── Log history ────────────────────────────────────────────────────────────
function logEntry(symbols, delta, comboName) {
  const li = document.createElement('li');
  const isWin = delta > 0;

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const combo = document.createElement('span');
  combo.className = isWin ? 'log-win' : 'log-lose';
  combo.textContent = `${symbols.join(' ')}  ${comboName}  ${isWin ? '+' : ''}${delta}`;

  const ts = document.createElement('span');
  ts.className = 'log-time';
  ts.textContent = time;

  li.append(combo, ts);
  historyList.prepend(li);

  // Keep at most 30 entries
  while (historyList.children.length > 30) {
    historyList.removeChild(historyList.lastChild);
  }
}

// ── Modal ──────────────────────────────────────────────────────────────────
function showModal(title, body) {
  modalTitle.textContent = title;
  modalBody.textContent  = body;
  modalOverlay.hidden = false;
}

modalClose.addEventListener('click', () => {
  modalOverlay.hidden = true;
  // If completely broke, reset
  if (tokens <= 0) resetGame();
});

// ── Game reset ─────────────────────────────────────────────────────────────
function resetGame() {
  tokens = 100;
  bet    = 10;
  updateTokenDisplay();
  updateBetDisplay();
  resultBanner.textContent = '';
  resultBanner.className   = 'result-banner';
}

// ── Core spin logic ────────────────────────────────────────────────────────
async function doSpin() {
  if (spinning) return;
  if (tokens < bet) {
    if (tokens <= 0) {
      showModal('💸 Out of Tokens', pick(QUIPS.broke));
    } else {
      showModal('🚫 Insufficient Tokens', `You only have ${tokens} token${tokens === 1 ? '' : 's'} left. Lower your bet.`);
    }
    return;
  }

  spinning = true;
  spinBtn.disabled = true;
  resultBanner.textContent = '';
  resultBanner.className   = 'result-banner';

  // Deduct bet
  tokens -= bet;
  updateTokenDisplay();
  flashTokens('lose');

  // Clear win highlights
  reelEls.forEach(r => r.parentElement.classList.remove('win'));

  // Draw results
  const results = [pick(POOL), pick(POOL), pick(POOL)];
  spinCount++;

  // Stagger spin durations for drama
  startMarquee();
  await Promise.all([
    spinReel(reelEls[0], results[0], 600),
    spinReel(reelEls[1], results[1], 900),
    spinReel(reelEls[2], results[2], 1250),
  ]);
  stopMarquee();

  // Evaluate result
  const allMatch   = results[0] === results[1] && results[1] === results[2];
  const pairMatch  = results[0] === results[1] || results[1] === results[2] || results[0] === results[2];

  let delta = 0;
  let comboName = 'DEPRECATED';
  let bannerClass = 'lose';
  let message = '';

  if (allMatch) {
    const multiplier = PAYOUT[results[0]];
    delta = bet * multiplier;
    comboName = COMBO_NAMES[results[0]] ?? 'FULL MATCH';

    if (results[0] === '🤖') {
      // Jackpot!
      message = `🎉 ${comboName}! +${delta} tokens\n${pick(QUIPS.jackpot)}`;
      launchConfetti(true);
      setTimeout(() => showModal('🤖🤖🤖 JACKPOT!', pick(QUIPS.jackpot)), 400);
    } else {
      message = `✨ ${comboName}! +${delta} tokens — ${pick(QUIPS.win)}`;
      launchConfetti(false);
    }
    bannerClass = 'win';
    reelEls.forEach(r => r.parentElement.classList.add('win'));

  } else if (pairMatch) {
    delta = bet * 2;
    comboName = 'PROMPT PAIR';
    message = `🔗 PROMPT PAIR! +${delta} tokens — ${pick(QUIPS.pair)}`;
    bannerClass = 'win';

    // Highlight matching reels
    if (results[0] === results[1]) {
      reelEls[0].parentElement.classList.add('win');
      reelEls[1].parentElement.classList.add('win');
    } else if (results[1] === results[2]) {
      reelEls[1].parentElement.classList.add('win');
      reelEls[2].parentElement.classList.add('win');
    } else {
      reelEls[0].parentElement.classList.add('win');
      reelEls[2].parentElement.classList.add('win');
    }
  } else {
    delta = -bet; // already deducted; just report loss
    comboName = 'DEPRECATED';
    message = `❌ DEPRECATED — ${pick(QUIPS.lose)}`;
    delta = 0; // no additional change
  }

  // Apply winnings
  if (delta > 0) {
    tokens += delta;
    updateTokenDisplay();
    flashTokens('win');
  }

  resultBanner.textContent = message;
  resultBanner.className   = `result-banner ${bannerClass}`;

  logEntry(results, delta > 0 ? delta - bet : -bet, comboName);

  // Broke?
  if (tokens <= 0) {
    setTimeout(() => showModal('💸 Out of Tokens', pick(QUIPS.broke)), 600);
  }

  // Auto-adjust bet if it exceeds current tokens
  if (bet > tokens) {
    bet = Math.max(5, Math.floor(tokens / 5) * 5 || tokens);
    updateBetDisplay();
  }

  spinning = false;
  spinBtn.disabled = false;
}

// ── Bet controls ───────────────────────────────────────────────────────────
const BET_STEPS = [5, 10, 25, 50, 100];

function nextBetStep(dir) {
  const idx = BET_STEPS.indexOf(bet);
  if (idx === -1) {
    // snap to nearest
    bet = dir > 0 ? BET_STEPS.find(s => s > bet) ?? BET_STEPS.at(-1)
                  : [...BET_STEPS].reverse().find(s => s < bet) ?? BET_STEPS[0];
  } else {
    bet = BET_STEPS[clamp(idx + dir, 0, BET_STEPS.length - 1)];
  }
  bet = clamp(bet, 5, tokens);
  updateBetDisplay();
}

betDownBtn.addEventListener('click', () => nextBetStep(-1));
betUpBtn.addEventListener('click',   () => nextBetStep(+1));

maxBtn.addEventListener('click', () => {
  bet = clamp(BET_STEPS.reduce((prev, cur) => (cur <= tokens ? cur : prev)), 5, tokens);
  // just set to max affordable step
  const affordable = [...BET_STEPS].reverse().find(s => s <= tokens);
  if (affordable) bet = affordable;
  else bet = tokens;
  updateBetDisplay();
});

spinBtn.addEventListener('click', doSpin);

// Keyboard shortcut: Space or Enter to spin
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'Enter') && !modalOverlay.hidden === false) {
    e.preventDefault();
    doSpin();
  }
  if (e.code === 'ArrowLeft')  nextBetStep(-1);
  if (e.code === 'ArrowRight') nextBetStep(+1);
});

// ── Init ───────────────────────────────────────────────────────────────────
updateTokenDisplay();
updateBetDisplay();

// Set initial reel symbols
reelEls[0].querySelector('.symbol').textContent = '🤖';
reelEls[1].querySelector('.symbol').textContent = '🧠';
reelEls[2].querySelector('.symbol').textContent = '🪙';
