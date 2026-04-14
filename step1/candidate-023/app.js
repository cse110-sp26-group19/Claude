/**
 * Token Farm — satirical AI slot machine
 * Uses: localStorage, Web Audio (optional), Vibration API (optional)
 */

const STORAGE_KEY = "tokenFarmBalanceV1";
const STARTING_TOKENS = 100;
const SPIN_COST = 10;

/** @type {{ id: string, display: string, emoji?: boolean, weight: number }[]} */
const SYMBOLS = [
  { id: "gpu", display: "GPU", emoji: false, weight: 14 },
  { id: "prompt", display: "PROMPT", emoji: false, weight: 14 },
  { id: "slop", display: "SLOP", emoji: false, weight: 12 },
  { id: "epoch", display: "EPOCH", emoji: false, weight: 10 },
  { id: "brain", display: "🧠", emoji: true, weight: 12 },
  { id: "robot", display: "🤖", emoji: true, weight: 12 },
  { id: "money", display: "💸", emoji: true, weight: 10 },
  { id: "fire", display: "🔥", emoji: true, weight: 8 },
  { id: "chart", display: "📉", emoji: true, weight: 8 },
];

const FLAVOR_IDLE = [
  "Insert ambition. Receive probabilities.",
  "Your tokens are safe* in RAM.",
  "Training not included. Inference sold separately.",
  "Alignment is when three GPUs agree.",
];

const FLAVOR_WIN = [
  "The model is confident. The wallet is lighter.",
  "Statistically significant fun detected.",
  "Gradient descent into your pocket.",
];

const FLAVOR_JACKPOT = [
  "AGI called. It wants royalties.",
  "You found the local maximum of luck.",
  "Hallucination? No — this payout is real (in this tab).",
];

const FLAVOR_LOSE = [
  "Thoughts and prayers… and more epochs.",
  "Backpropagate that loss emotionally.",
  "Consider this a negative reward signal.",
];

const reelEls = [
  document.getElementById("strip-0"),
  document.getElementById("strip-1"),
  document.getElementById("strip-2"),
];

const balanceEl = document.getElementById("balance");
const spinBtn = document.getElementById("spin-btn");
const logEl = document.getElementById("log");
const flavorEl = document.getElementById("flavor");
const spinCostEl = document.getElementById("spin-cost");
const brokeLine = document.getElementById("broke-line");
const grantBtn = document.getElementById("grant-btn");

let balance = loadBalance();
let spinning = false;

spinCostEl.textContent = String(SPIN_COST);
updateBalanceUI();

function loadBalance() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return STARTING_TOKENS;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : STARTING_TOKENS;
  } catch {
    return STARTING_TOKENS;
  }
}

function saveBalance() {
  try {
    localStorage.setItem(STORAGE_KEY, String(balance));
  } catch {
    /* private mode / quota */
  }
}

function updateBalanceUI() {
  balanceEl.textContent = String(balance);
  spinBtn.disabled = spinning || balance < SPIN_COST;
  if (brokeLine) {
    brokeLine.hidden = balance >= SPIN_COST;
  }
}

function weightedPick() {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

function payoutForMatch(symbolId) {
  const jackpots = new Set(["brain", "robot", "money"]);
  const mid = new Set(["gpu", "prompt", "fire", "chart"]);
  if (jackpots.has(symbolId)) return 120;
  if (mid.has(symbolId)) return 45;
  return 30;
}

function buildStripCells(symbol, repeats) {
  const cells = [];
  for (let i = 0; i < repeats; i++) {
    const div = document.createElement("div");
    div.className = "cell" + (symbol.emoji ? "" : " text-symbol");
    div.textContent = symbol.display;
    div.dataset.symbolId = symbol.id;
    cells.push(div);
  }
  return cells;
}

function initStrips() {
  const repeats = 24;
  for (let r = 0; r < 3; r++) {
    const strip = reelEls[r];
    strip.innerHTML = "";
    for (let i = 0; i < repeats; i++) {
      const sym = SYMBOLS[i % SYMBOLS.length];
      const cell = buildStripCells(sym, 1)[0];
      strip.appendChild(cell);
    }
  }
}

initStrips();

if (grantBtn) {
  grantBtn.addEventListener("click", () => {
    if (spinning) return;
    balance += STARTING_TOKENS;
    saveBalance();
    updateBalanceUI();
    pushLog("win", `[grant] VC called back. +${STARTING_TOKENS} tok (totally not dilution)`);
    flavorEl.textContent = "Runway extended. Burn rate unchanged.";
  });
}

/**
 * Spin one reel to land on targetIndex (0-based) in the strip's cell list.
 * We rebuild strip with random prefix + target at landing position.
 */
function prepareStrip(reelIndex, targetSymbol) {
  const strip = reelEls[reelIndex];

  const prefixLen = 24 + Math.floor(Math.random() * 14);
  strip.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (let i = 0; i < prefixLen; i++) {
    const sym = weightedPick();
    frag.appendChild(buildStripCells(sym, 1)[0]);
  }
  const landing = buildStripCells(targetSymbol, 1)[0];
  frag.appendChild(landing);
  const tailLen = 8;
  for (let i = 0; i < tailLen; i++) {
    const sym = weightedPick();
    frag.appendChild(buildStripCells(sym, 1)[0]);
  }
  strip.appendChild(frag);

  return { targetIdx: prefixLen };
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function animateReel(strip, durationMs, targetIdx, onDone) {
  const stripEl = strip;
  const fromCss = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--slot-h"));
  const cellH = stripEl.children[0]?.getBoundingClientRect().height || fromCss || 120;
  const endOffset = -(targetIdx * cellH);

  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / durationMs);
    const eased = easeOutCubic(t);
    const y = endOffset * eased;
    stripEl.style.transform = `translateY(${y}px)`;

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      stripEl.style.transform = `translateY(${endOffset}px)`;
      onDone();
    }
  }
  stripEl.style.transform = "translateY(0px)";
  requestAnimationFrame(frame);
}

let audioCtx = null;

function playTone(freq, duration, type = "sine", gain = 0.06) {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    const ctx = audioCtx;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* no audio */
  }
}

function haptic(pattern) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

function randomFlavor(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pushLog(htmlClass, text) {
  const li = document.createElement("li");
  li.className = htmlClass;
  li.textContent = text;
  logEl.insertBefore(li, logEl.firstChild);
  while (logEl.children.length > 12) {
    logEl.removeChild(logEl.lastChild);
  }
}

spinBtn.addEventListener("click", () => {
  if (spinning || balance < SPIN_COST) return;
  spinning = true;
  spinBtn.disabled = true;

  balance -= SPIN_COST;
  saveBalance();
  updateBalanceUI();

  const picks = [weightedPick(), weightedPick(), weightedPick()];
  const results = [prepareStrip(0, picks[0]), prepareStrip(1, picks[1]), prepareStrip(2, picks[2])];

  playTone(180, 0.05, "square", 0.04);

  let done = 0;
  const durations = [1400, 1900, 2400];

  for (let i = 0; i < 3; i++) {
    const strip = reelEls[i];
    const { targetIdx } = results[i];
    animateReel(strip, durations[i], targetIdx, () => {
      done += 1;
      playTone(320 + i * 40, 0.08, "triangle", 0.05);
      haptic(12);
      if (done === 3) {
        finishRound(picks);
      }
    });
  }
});

function finishRound(picks) {
  const [a, b, c] = picks;
  let payout = 0;
  let cls = "loss";

  if (a.id === b.id && b.id === c.id) {
    payout = payoutForMatch(a.id);
    cls = payout >= 100 ? "jackpot" : "win";
    balance += payout;
    saveBalance();

    if (payout >= 100) {
      playTone(520, 0.12, "sine", 0.08);
      playTone(660, 0.12, "sine", 0.08);
      haptic([30, 40, 30]);
      flavorEl.textContent = randomFlavor(FLAVOR_JACKPOT);
      tryNotify("Jackpot on Token Farm", `+${payout} tok — the stack overflowed in your favor.`);
    } else {
      playTone(440, 0.1, "sine", 0.07);
      haptic([20, 20]);
      flavorEl.textContent = randomFlavor(FLAVOR_WIN);
      tryNotify("You won tokens", `+${payout} tok. Still cheaper than an API bill.`);
    }
    pushLog(cls, `[match] ${a.display} ×3 → +${payout} tok (after −${SPIN_COST} spin)`);
  } else {
    flavorEl.textContent = randomFlavor(FLAVOR_LOSE);
    pushLog("loss", `[no match] −${SPIN_COST} tok — the loss landscape says hi`);
  }

  if (cls === "loss" && Math.random() < 0.25) {
    flavorEl.textContent = randomFlavor(FLAVOR_IDLE);
  }

  spinning = false;
  updateBalanceUI();
}

function tryNotify(title, body) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='24' font-size='24'>🎰</text></svg>" });
  } catch {
    /* ignore */
  }
}
