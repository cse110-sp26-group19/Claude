/**
 * Token Farm — slot logic + tokens + platform APIs (storage, audio, vibrate)
 */

const STORAGE_KEY = "tokenFarm_v1";

const SYMBOLS = [
  { id: "gpu", emoji: "🖥️", name: "GPU Hours", weight: 14 },
  { id: "prompt", emoji: "💬", name: "Prompt", weight: 16 },
  { id: "halluc", emoji: "🫥", name: "Hallucination", weight: 12 },
  { id: "paperclip", emoji: "📎", name: "Alignment", weight: 10 },
  { id: "slop", emoji: "✨", name: "AI Slop", weight: 14 },
  { id: "epoch", emoji: "📉", name: "Loss Curve", weight: 12 },
  { id: "robot", emoji: "🤖", name: "Assistant", weight: 14 },
  { id: "vc", emoji: "🦄", name: "VC Hype", weight: 8 },
];

const SPIN_COST = 10;
const WEIGHT_TOTAL = SYMBOLS.reduce((s, x) => s + x.weight, 0);

const WIN_MESSAGES = {
  three: [
    "Jackpot: Your startup just pivoted to “AI-native.”",
    "Triple match! Board deck writes itself tonight.",
    "Three of a kind — statistically significant (p < 0.05 if you squint).",
    "Winner! Deploy straight to prod; what could go wrong?",
  ],
  two: [
    "Two match — that’s basically AGI in stealth mode.",
    "Pair detected. Add “RLHF” to the slide and raise.",
    "Close enough for a blog post.",
  ],
};

const LOSE_MESSAGES = [
  "Cold streak. Have you tried a larger model?",
  "No match. Your tokens died for someone’s margin.",
  "Inference failed. The dataset was curated, you weren’t.",
  "Loss: Consider more parameters and fewer ethics slides.",
  "Training resumed. Your wallet didn’t.",
];

const IDLE_MESSAGES = [
  "Insert optimism and pull the lever of destiny.",
  "Every spin funds someone’s GPU invoice somewhere.",
  "Tokens are fake. The electricity bill is real.",
  "You’re not gambling — you’re doing stochastic gradient descent.",
];

const SHOP = [
  {
    id: "certificate",
    title: "Certificate of Intelligence",
    cost: 50,
    blurb: "PDF that says you understand transformers.",
  },
  {
    id: "thought",
    title: "One Original Thought",
    cost: 120,
    blurb: "Sold out everywhere except this shop.",
  },
  {
    id: "eval",
    title: "Human Eval (n=1)",
    cost: 200,
    blurb: "You are the benchmark now.",
  },
];

const state = {
  balance: 100,
  spinning: false,
  audioCtx: null,
};

function $(sel, root = document) {
  return root.querySelector(sel);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.balance === "number" && data.balance >= 0) {
      state.balance = Math.floor(data.balance);
    }
  } catch {
    /* ignore */
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance: state.balance }));
  } catch {
    /* ignore */
  }
}

function pickSymbol() {
  let r = Math.random() * WEIGHT_TOTAL;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function ensureAudio() {
  if (state.audioCtx) return state.audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  state.audioCtx = new Ctx();
  return state.audioCtx;
}

function beep(freq, duration = 0.06, type = "square", gain = 0.06) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playSpinSounds() {
  beep(180, 0.04, "square", 0.04);
  setTimeout(() => beep(220, 0.04, "square", 0.04), 60);
  setTimeout(() => beep(260, 0.05, "square", 0.05), 120);
}

function playWin() {
  [330, 440, 554, 659].forEach((f, i) => {
    setTimeout(() => beep(f, 0.12, "triangle", 0.07), i * 90);
  });
}

function playLose() {
  beep(120, 0.15, "sawtooth", 0.05);
  setTimeout(() => beep(90, 0.2, "sawtooth", 0.04), 140);
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

function cellEl(symbol) {
  const wrap = document.createElement("div");
  wrap.className = "cell";
  wrap.innerHTML = `<span class="emoji" aria-hidden="true">${symbol.emoji}</span><span class="name">${symbol.name}</span>`;
  return wrap;
}

const STRIP_LEN = 25;
const RESULT_INDEX = STRIP_LEN - 1;

function buildStrip(stripEl, length = STRIP_LEN, forceEnd = null) {
  stripEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (let i = 0; i < length; i++) {
    const isLast = i === length - 1;
    frag.appendChild(cellEl(forceEnd && isLast ? forceEnd : pickSymbol()));
  }
  stripEl.appendChild(frag);
}

function getStripTranslate(stripEl, targetIndex) {
  const cell = stripEl.children[targetIndex];
  if (!cell) return 0;
  const col = stripEl.closest(".reel-col");
  const h = col ? col.offsetHeight : cell.offsetHeight;
  return -targetIndex * h;
}

function animateStrip(stripEl, finalIndex, durationMs, delayMs) {
  return new Promise((resolve) => {
    const col = stripEl.closest(".reel-col");
    const h = col.offsetHeight;
    const n = stripEl.children.length;
    const loops = 2;
    const startIndex = Math.max(0, n - 3);
    const startY = -startIndex * h;
    const endY = -finalIndex * h;
    const extra = loops * n * h;
    const from = startY - extra;
    const to = endY;

    stripEl.style.transition = "none";
    stripEl.style.transform = `translateY(${from}px)`;
    stripEl.getBoundingClientRect();

    setTimeout(() => {
      stripEl.style.transition = `transform ${durationMs}ms cubic-bezier(0.12, 0.85, 0.22, 1)`;
      stripEl.style.transform = `translateY(${to}px)`;
      const done = () => {
        stripEl.removeEventListener("transitionend", done);
        resolve();
      };
      stripEl.addEventListener("transitionend", done);
      setTimeout(done, durationMs + 80);
    }, delayMs);
  });
}

function setMarquee(text, kind = "") {
  const el = $("#marquee");
  el.textContent = text;
  el.classList.remove("win", "lose");
  if (kind) el.classList.add(kind);
}

function logEvent(html) {
  const log = $("#event-log");
  const li = document.createElement("li");
  li.innerHTML = html;
  log.prepend(li);
  while (log.children.length > 12) log.removeChild(log.lastChild);
}

function renderBalance() {
  $("#balance").textContent = String(state.balance);
  $("#spin-cost").textContent = String(SPIN_COST);
  $("#spin-btn").disabled = state.spinning || state.balance < SPIN_COST;
}

function renderShop() {
  const list = $("#shop-list");
  list.innerHTML = "";
  SHOP.forEach((item) => {
    const li = document.createElement("li");
    li.className = "shop-item";
    li.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <div class="shop-meta">${item.blurb} — <strong>${item.cost}</strong> tokens</div>
      </div>
      <button type="button" data-shop="${item.id}">Buy</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll("[data-shop]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-shop");
      const def = SHOP.find((s) => s.id === id);
      if (!def || state.balance < def.cost) return;
      state.balance -= def.cost;
      saveState();
      renderBalance();
      updateShopButtons();
      logEvent(`Spent <strong>${def.cost}</strong> tokens on <strong>${def.title}</strong>. ROI pending.`);
      beep(400, 0.05, "square", 0.05);
      vibrate(15);
    });
  });
  updateShopButtons();
}

function updateShopButtons() {
  $("#shop-list").querySelectorAll("[data-shop]").forEach((btn) => {
    const id = btn.getAttribute("data-shop");
    const def = SHOP.find((s) => s.id === id);
    btn.disabled = !def || state.balance < def.cost;
  });
}

function initReels() {
  document.querySelectorAll("[data-strip]").forEach((strip) => {
    buildStrip(strip);
    strip.style.transform = `translateY(${getStripTranslate(strip, RESULT_INDEX)}px)`;
  });
}

async function spin() {
  if (state.spinning || state.balance < SPIN_COST) return;
  state.spinning = true;
  renderBalance();

  state.balance -= SPIN_COST;
  saveState();
  renderBalance();
  logEvent(`Paid <strong>${SPIN_COST}</strong> tokens to “train.”`);

  const results = [pickSymbol(), pickSymbol(), pickSymbol()];
  const strips = [...document.querySelectorAll("[data-strip]")];

  strips.forEach((strip, i) => {
    buildStrip(strip, STRIP_LEN, results[i]);
  });

  playSpinSounds();
  $(".machine").classList.remove("celebrate");
  setMarquee("Backpropagating vibes…", "");

  const timings = [0, 120, 240];
  await Promise.all(
    strips.map((strip, i) =>
      animateStrip(strip, RESULT_INDEX, 2200 + i * 180, timings[i])
    )
  );

  const ids = results.map((r) => r.id);
  const allSame = ids[0] === ids[1] && ids[1] === ids[2];
  const pair =
    !allSame &&
    (ids[0] === ids[1] || ids[1] === ids[2] || ids[0] === ids[2]);

  let payout = 0;
  if (allSame) {
    payout = 80;
    setMarquee(randomFrom(WIN_MESSAGES.three), "win");
    playWin();
    vibrate([30, 40, 30, 60]);
    $(".machine").classList.add("celebrate");
    logEvent(`Triple <strong>${results[0].name}</strong>! +<strong>${payout}</strong> tokens.`);
  } else if (pair) {
    payout = 25;
    setMarquee(randomFrom(WIN_MESSAGES.two), "win");
    playWin();
    vibrate([25, 30, 25]);
    logEvent(`Pair win. +<strong>${payout}</strong> tokens. Still not AGI.`);
  } else {
    setMarquee(randomFrom(LOSE_MESSAGES), "lose");
    playLose();
    vibrate([40, 30, 60]);
    logEvent(`No match. The model remains humble (your wallet doesn’t).`);
  }

  state.balance += payout;
  saveState();
  renderBalance();
  updateShopButtons();

  state.spinning = false;
  renderBalance();
}

function idleRotate() {
  setInterval(() => {
    if (state.spinning) return;
    setMarquee(randomFrom(IDLE_MESSAGES), "");
  }, 14000);
}

function main() {
  loadState();
  $("#spin-cost").textContent = String(SPIN_COST);
  initReels();
  renderBalance();
  renderShop();
  logEvent(`Welcome. You start with <strong>${state.balance}</strong> tokens — same as most “AI” demos.`);

  $("#spin-btn").addEventListener("click", () => {
    spin();
  });

  idleRotate();
}

main();
