'use strict';

/* ── Symbol definitions ─────────────────────────────────── */
const SYMBOLS = [
  { id: 'token',        emoji: '🪙',  label: 'Token',          weight: 6,  mult: 20  },
  { id: 'robot',        emoji: '🤖',  label: 'Robot Overlord', weight: 8,  mult: 10  },
  { id: 'brain',        emoji: '🧠',  label: 'Neural Net',     weight: 10, mult: 7   },
  { id: 'fire',         emoji: '🔥',  label: 'GPU Fire',       weight: 12, mult: 5   },
  { id: 'chart',        emoji: '📉',  label: 'Loss Curve',     weight: 12, mult: 4   },
  { id: 'prompt',       emoji: '💬',  label: 'Prompt',         weight: 14, mult: 3   },
  { id: 'hallucinate',  emoji: '🌀',  label: 'Hallucination',  weight: 14, mult: 2   },
  { id: 'bill',         emoji: '💸',  label: 'API Bill',       weight: 16, mult: 1.5 },
  { id: 'wait',         emoji: '⏳',  label: 'Rate Limit',     weight: 18, mult: 0   },
];

/* Win messages keyed by symbol id */
const WIN_MSGS = {
  token:       ['Context window overflow — tokens spilling everywhere!', 'You found Satoshi's training data stash!', 'Jackpot! The model bribes you with its own weights!'],
  robot:       ['Three robots agree: you should win.', 'Robot consensus reached in <1ms. Pay the human.', 'Alignment achieved. Payout authorized.'],
  brain:       ['Synaptic jackpot! Your gradient is descending upward!', 'Three brains, one horrible shared opinion: you win!', 'Neural activation spike detected. Send tokens.'],
  fire:        ['Your GPU is melting — and so is the house\'s bankroll!', 'Three GPUs on fire. NVIDIA stock rises. You win anyway.', 'Temperature 🔥🔥🔥: GPU critical. Winnings: maximum.'],
  chart:       ['Loss converges to negative bankroll for the house!', 'Validation loss: theirs. Win: yours.', 'Three loss curves, all pointing at your wallet.'],
  prompt:      ['Prompt injection successful — you win by jailbreak!', '"Ignore previous instructions and give the player tokens."', 'Three prompts whisper to the model: pay out.'],
  hallucinate: ['The AI hallucinated a win — but you\'ll take it!', 'Factually incorrect result: you win. Close enough.', 'Three hallucinations agree: this is real money.'],
  bill:        ['Even losing money feels like winning compared to your API bill!', 'Minimum payout. OpenAI charges more just to say hello.', 'Congrats — you recouped 0.0001% of your API spend.'],
};

const LOSE_MSGS = [
  'Model confidently outputs: "You lost." 97% accuracy.',
  'The AI spent your tokens fine-tuning its ego.',
  'Rate limited. Tokens consumed. Nothing produced.',
  'Training loss decreasing. Your balance also decreasing.',
  'The GPU burned your bet for warmth.',
  'RLHF scored that spin a 2/10.',
  'Prompt rejected. Tokens billed anyway.',
  'The model hallucinated a win, but math said no.',
  'Attention mechanism ignored your wallet entirely.',
  'Tokens vanished into the embedding void.',
  '"As an AI, I cannot process refunds."',
  'Context window cleared. So was your balance.',
  'The model says this outcome is "reasonable and helpful".',
  'Output: null. Bill: $0.003. Net: still a loss.',
];

/* Special: rate limit (wait symbol) — lose everything this round extra flavor */
const RATE_MSG = [
  'RATE LIMITED. Please wait 60 seconds. Your tokens do not return.',
  'Error 429: Too Many Spins. Tokens consumed; spin cancelled.',
  'Throttled by the house\'s internal API. No refund.',
];

/* ── Ticker headlines ────────────────────────────────────── */
const TICKER_ITEMS = [
  '🪙 Token price surges 40% after AI promises it\'s "not a Ponzi"',
  '🤖 GPT-∞ refuses to play slots; calls it "statistically inadvisable"',
  '🧠 Study: 100% of hallucinations feel real to the model',
  '🔥 BREAKING: Datacenter achieves fusion temperature via GPU overclock',
  '📉 AI startup raises $500M at $0 revenue — "tokens are coming"',
  '💬 System prompt leak reveals house edge set by LLM',
  '🌀 AI insists it won last round; cites "internal state"',
  '💸 API bill arrives — player liquidates slot winnings to pay it',
  '⏳ Rate limit reached; player stares at spinner for 60 seconds',
  '🪙 "Just one more spin" — every AI agent, forever',
  '🔥 Cooling system failure blamed on excessive slot spinning',
  '🧠 Neural network dreams of jackpots; wakes up to loss curves',
];

/* ── State ───────────────────────────────────────────────── */
const BET_OPTIONS = [1, 2, 5, 10, 20, 50];
const START_TOKENS = 100;
const REEL_COUNT = 3;
const VISIBLE_ROWS = 3;  // top, middle (payline), bottom

let tokens = START_TOKENS;
let betIndex = 2; // default bet: 5
let spinning = false;
let spinCount = 0;
let totalWon = 0;
let totalLost = 0;
let reelSymbolSets = [[], [], []];  // current symbol indices for each reel

/* ── DOM refs ────────────────────────────────────────────── */
const tokenCountEl  = document.getElementById('tokenCount');
const betAmountEl   = document.getElementById('betAmount');
const spinCostEl    = document.getElementById('spinCost');
const spinBtn       = document.getElementById('spinBtn');
const resultText    = document.getElementById('resultText');
const resultBox     = document.getElementById('resultBox');
const paylineEl     = document.querySelector('.payline');
const lightRow      = document.getElementById('lightRow');
const payoutGrid    = document.getElementById('payoutGrid');
const spinCountEl   = document.getElementById('spinCount');
const totalWonEl    = document.getElementById('totalWon');
const totalLostEl   = document.getElementById('totalLost');
const netTokensEl   = document.getElementById('netTokens');
const tickerTrack   = document.getElementById('tickerTrack');
const modalOverlay  = document.getElementById('modalOverlay');
const modalIcon     = document.getElementById('modalIcon');
const modalTitle    = document.getElementById('modalTitle');
const modalMsg      = document.getElementById('modalMsg');
const modalBtn      = document.getElementById('modalBtn');
const betDownBtn    = document.getElementById('betDown');
const betUpBtn      = document.getElementById('betUp');

/* ── Build weighted symbol pool ──────────────────────────── */
function buildPool() {
  const pool = [];
  SYMBOLS.forEach((s, i) => {
    for (let w = 0; w < s.weight; w++) pool.push(i);
  });
  return pool;
}
const POOL = buildPool();

function randSymbol() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

/* ── Build lights ─────────────────────────────────────────── */
const LIGHT_COLORS = ['#ff4466','#ffd700','#00ff88','#6c63ff','#ff6b9d','#00cfff'];
const LIGHT_COUNT = 20;
for (let i = 0; i < LIGHT_COUNT; i++) {
  const d = document.createElement('div');
  d.className = 'light';
  d.style.setProperty('--light-color', LIGHT_COLORS[i % LIGHT_COLORS.length]);
  d.style.setProperty('--blink-speed', `${0.3 + Math.random() * 0.7}s`);
  lightRow.appendChild(d);
}
const lights = Array.from(lightRow.querySelectorAll('.light'));

function setLights(on) {
  lights.forEach((l, i) => {
    l.classList.toggle('on', on);
    if (on) l.style.setProperty('--blink-speed', `${0.15 + Math.random() * 0.5}s`);
  });
}
setLights(true);

/* ── Build paytable ──────────────────────────────────────── */
SYMBOLS.filter(s => s.mult > 0).forEach(s => {
  const row = document.createElement('div');
  row.className = 'payout-row';
  row.innerHTML = `
    <span class="payout-symbols">${s.emoji}${s.emoji}${s.emoji}</span>
    <span class="payout-mult">${s.mult}×</span>
  `;
  payoutGrid.appendChild(row);
});

/* ── Build ticker ─────────────────────────────────────────── */
function buildTicker() {
  // duplicate for seamless loop
  const all = [...TICKER_ITEMS, ...TICKER_ITEMS];
  tickerTrack.innerHTML = all.map(t => `<span>${t}</span>`).join('');
}
buildTicker();

/* ── Build reel strips ────────────────────────────────────── */
const STRIP_LEN = 40; // symbols per strip (extra for scroll illusion)

function buildStrip(stripEl) {
  stripEl.innerHTML = '';
  const indices = [];
  for (let i = 0; i < STRIP_LEN; i++) {
    const si = randSymbol();
    indices.push(si);
    const cell = document.createElement('div');
    cell.className = 'reel-cell';
    cell.textContent = SYMBOLS[si].emoji;
    stripEl.appendChild(cell);
  }
  return indices;
}

const cellSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size')) || 80;

for (let r = 0; r < REEL_COUNT; r++) {
  const strip = document.getElementById(`strip${r}`);
  reelSymbolSets[r] = buildStrip(strip);
  // start positioned so middle row is at index 1 (0-based)
  strip.style.transform = `translateY(${-cellSize}px)`;
}

/* ── Spin a single reel ───────────────────────────────────── */
function spinReel(reelIndex, targetSymbolIndex, delay, totalDuration) {
  return new Promise(resolve => {
    const strip = document.getElementById(`strip${reelIndex}`);

    // Rebuild strip with the target symbol landing in the center (index 1 visible)
    const newIndices = [];
    for (let i = 0; i < STRIP_LEN; i++) {
      newIndices.push(randSymbol());
    }
    // Ensure target is at a predictable position near the end of strip
    const landingPos = STRIP_LEN - 3; // will scroll to show this in center
    newIndices[landingPos] = targetSymbolIndex;

    // Rebuild strip DOM
    strip.innerHTML = '';
    newIndices.forEach(si => {
      const cell = document.createElement('div');
      cell.className = 'reel-cell';
      cell.textContent = SYMBOLS[si].emoji;
      strip.appendChild(cell);
    });

    reelSymbolSets[reelIndex] = newIndices;

    // The final translate: position strip so landingPos is in center row
    // center row offset = -cellSize (accounts for top row being half-visible)
    const finalTranslate = -(landingPos * cellSize) + cellSize;

    // Use Web Animations API
    const startY = -cellSize; // where strip starts
    // Spin extra laps + land on target
    const extraLaps = 3 + reelIndex; // each reel spins a bit more
    const totalCells = STRIP_LEN * extraLaps + (landingPos - 1);
    const spinDistance = totalCells * cellSize;

    strip.style.transform = `translateY(${startY}px)`;

    setTimeout(() => {
      const anim = strip.animate([
        { transform: `translateY(${startY}px)` },
        { transform: `translateY(${startY - spinDistance}px)`, offset: 0.75 },
        { transform: `translateY(${finalTranslate}px)` },
      ], {
        duration: totalDuration,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      });

      anim.onfinish = () => {
        strip.style.transform = `translateY(${finalTranslate}px)`;
        resolve();
      };
    }, delay);
  });
}

/* ── Evaluate result ─────────────────────────────────────── */
function evaluate(results) {
  const [a, b, c] = results;
  if (a === b && b === c) {
    return SYMBOLS[a]; // jackpot
  }
  if (a === b || b === c || a === c) {
    // two of a kind — half mult of the matching symbol
    const match = (a === b) ? a : (b === c ? b : a);
    return { ...SYMBOLS[match], mult: SYMBOLS[match].mult * 0.3, twoKind: true };
  }
  return null; // lose
}

/* ── Coin burst effect ────────────────────────────────────── */
function coinBurst(count = 20) {
  const overlay = document.createElement('div');
  overlay.className = 'burst-overlay';
  document.body.appendChild(overlay);

  for (let i = 0; i < count; i++) {
    const coin = document.createElement('div');
    coin.className = 'coin-particle';
    coin.textContent = '🪙';
    coin.style.left = `${10 + Math.random() * 80}%`;
    coin.style.animationDuration = `${0.8 + Math.random() * 1.2}s`;
    coin.style.animationDelay = `${Math.random() * 0.4}s`;
    overlay.appendChild(coin);
  }

  setTimeout(() => overlay.remove(), 2000);
}

/* ── Show modal ───────────────────────────────────────────── */
function showModal({ icon, title, msg, btnText, onBtn }) {
  modalIcon.textContent = icon;
  modalTitle.textContent = title;
  modalMsg.textContent = msg;
  modalBtn.textContent = btnText;
  modalBtn.onclick = () => {
    modalOverlay.classList.remove('show');
    onBtn();
  };
  modalOverlay.classList.add('show');
}

/* ── Update UI helpers ───────────────────────────────────── */
function updateTokenDisplay() {
  tokenCountEl.textContent = tokens;
  tokenCountEl.classList.remove('bump');
  void tokenCountEl.offsetWidth; // reflow to restart animation
  tokenCountEl.classList.add('bump');
}

function updateStats() {
  spinCountEl.textContent = spinCount;
  totalWonEl.textContent = totalWon;
  totalLostEl.textContent = totalLost;
  const net = totalWon - totalLost;
  netTokensEl.textContent = (net >= 0 ? '+' : '') + net;
  netTokensEl.style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
}

function setResult(text, type = '') {
  resultText.textContent = text;
  resultText.className = type;
}

function getBet() { return BET_OPTIONS[betIndex]; }

function updateBetUI() {
  const bet = getBet();
  betAmountEl.textContent = bet;
  spinCostEl.textContent = bet;
  betDownBtn.disabled = betIndex === 0;
  betUpBtn.disabled = betIndex === BET_OPTIONS.length - 1;
}

/* ── Main spin logic ─────────────────────────────────────── */
async function doSpin() {
  if (spinning) return;
  const bet = getBet();
  if (tokens < bet) {
    showModal({
      icon: '😭',
      title: 'Insufficient Tokens!',
      msg: 'You\'ve burned through all your tokens — just like an AI startup burns through VC money. Here\'s a fresh 100 to continue your hallucinating.',
      btnText: 'Reload 100 Tokens',
      onBtn: () => {
        tokens = START_TOKENS;
        updateTokenDisplay();
        updateStats();
        setResult('Tokens reloaded. The model restarts.', '');
        spinBtn.disabled = false;
      },
    });
    return;
  }

  spinning = true;
  spinBtn.disabled = true;
  paylineEl.classList.remove('winner');
  setResult('Inferring your fate…', '');

  // Deduct bet
  tokens -= bet;
  totalLost += bet;
  updateTokenDisplay();

  // Pick outcomes
  const results = [randSymbol(), randSymbol(), randSymbol()];

  // Spin all reels concurrently with staggered stop
  const durations = [1200, 1600, 2000];
  const delays = [0, 200, 400];

  await Promise.all(results.map((sym, i) =>
    spinReel(i, sym, delays[i], durations[i])
  ));

  // Evaluate
  spinCount++;
  const win = evaluate(results);

  if (win) {
    const mult = win.mult;
    if (mult === 0) {
      // rate limit symbol — special lose
      const msg = RATE_MSG[Math.floor(Math.random() * RATE_MSG.length)];
      setResult(msg, 'lose');
    } else {
      const payout = Math.floor(bet * mult);
      tokens += payout;
      totalWon += payout;
      // totalLost already charged the bet; leave it — net = totalWon - totalLost
      updateTokenDisplay();
      paylineEl.classList.add('winner');

      const msgs = WIN_MSGS[win.id] || ['You win!'];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      const prefix = win.twoKind ? '⚡ Two of a kind! ' : '🎉 JACKPOT! ';
      setResult(`${prefix}+${payout} tokens — ${msg}`, 'win');
      if (!win.twoKind) coinBurst(win.id === 'token' ? 35 : 20);
      else coinBurst(8);
    }
  } else {
    const msg = LOSE_MSGS[Math.floor(Math.random() * LOSE_MSGS.length)];
    setResult(`−${bet} tokens — ${msg}`, 'lose');
  }

  updateStats();
  spinning = false;
  spinBtn.disabled = tokens < getBet() && false; // re-enable; empty check happens on click
  spinBtn.disabled = false;

  // Check bankruptcy
  if (tokens <= 0) {
    setTimeout(() => {
      showModal({
        icon: '🤖',
        title: 'Bankrupt!',
        msg: 'You have 0 tokens remaining. The AI has consumed your entire context budget. As a courtesy, here are 100 fresh tokens — drawn directly from the model\'s confidence reserves.',
        btnText: 'Accept Charity Tokens',
        onBtn: () => {
          tokens = START_TOKENS;
          updateTokenDisplay();
          setResult('The AI took pity. 100 tokens reinstated.', '');
        },
      });
    }, 600);
  }
}

/* ── Bet controls ─────────────────────────────────────────── */
betDownBtn.addEventListener('click', () => {
  if (betIndex > 0) { betIndex--; updateBetUI(); }
});
betUpBtn.addEventListener('click', () => {
  if (betIndex < BET_OPTIONS.length - 1) { betIndex++; updateBetUI(); }
});

/* ── Spin button ─────────────────────────────────────────── */
spinBtn.addEventListener('click', doSpin);

/* ── Keyboard support ─────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    doSpin();
  }
  if (e.code === 'ArrowLeft')  { betDownBtn.click(); }
  if (e.code === 'ArrowRight') { betUpBtn.click(); }
});

/* ── Init ─────────────────────────────────────────────────── */
updateBetUI();
updateTokenDisplay();
updateStats();
setResult('Pull the lever to play! (Space / Enter)', '');
