/**
 * Token Farm — satirical slot machine. Uses localStorage + optional Vibration API.
 */

const STORAGE_KEY = "tokenFarmSaveV1";

const SYMBOLS = [
  { id: "hype", glyph: "📈", label: "Hype" },
  { id: "gpu", glyph: "🖥️", label: "GPU" },
  { id: "hall", glyph: "🌀", label: "Hallucinate" },
  { id: "moat", glyph: "🏰", label: "Moat" },
  { id: "agi", glyph: "🤖", label: "AGI Soon" },
  { id: "slurp", glyph: "🥤", label: "Data Slurp" },
  { id: "align", glyph: "📎", label: "Align" },
  { id: "epoch", glyph: "⏱️", label: "Epoch" },
];

const SPIN_COST = 25;
const REEL_LEN = 24;
const SPIN_MS_MIN = 1400;
const SPIN_MS_MAX = 2600;

/** Weighted index for fair-ish casino feel */
const WEIGHTS = [18, 16, 14, 12, 10, 14, 10, 6];

function weightedRandomIndex() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return WEIGHTS.length - 1;
}

const PAYOUTS = [
  { match: ["agi", "agi", "agi"], payout: 500, msg: "Triplicate general intelligence. VCs nod solemnly." },
  { match: ["moat", "moat", "moat"], payout: 350, msg: "Triple moat. Your deck now has a slide with a castle." },
  { match: ["hype", "hype", "hype"], payout: 280, msg: "Pure hype. You’ve earned the right to say “exponential” twice." },
  { match: ["gpu", "gpu", "gpu"], payout: 220, msg: "GPU jackpot. Thermals are a feature." },
  { match: ["hall", "hall", "hall"], payout: 180, msg: "Full hallucination. Consistency is for compilers." },
  { match: ["slurp", "slurp", "slurp"], payout: 160, msg: "Maximum slurp. Terms of service send their regards." },
  { match: ["align", "align", "align"], payout: 140, msg: "Aligned thrice. Paper reviewers are typing…" },
  { match: ["epoch", "epoch", "epoch"], payout: 120, msg: "Overfitting to the slot machine. Classic." },
  { match: null, pair: true, payout: 40, msg: "Two of a kind. That’s basically peer review." },
  { match: null, payout: 0, msg: "You lost tokens but gained a story for the podcast." },
];

const SHOP = [
  {
    id: "certificate",
    title: "Certificate of Participation (AI)",
    price: 80,
    blurb: "Printed on recycled prompts.",
  },
  {
    id: "thought",
    title: "One (1) Original Thought",
    price: 150,
    blurb: "Ships in 6–8 epochs. May resemble training data.",
  },
  {
    id: "gpuMinute",
    title: "Rent 1 GPU-Minute (imaginary)",
    price: 300,
    blurb: "Smells like warm plastic and ambition.",
  },
  {
    id: "moatConsult",
    title: "Moat Consultation (15 min)",
    price: 500,
    blurb: "We draw a trench around your API wrapper.",
  },
];

const QUOTES = [
  "“We’re not gambling—we’re doing stochastic optimization of vibes.”",
  "“Your tokens went to a good cause: someone’s margin.”",
  "“Remember: the house is a transformer layer with better PR.”",
  "“Spending tokens is just inference with extra branding.”",
  "“If you’re not overfitting, you’re not trying.”",
  "“Alignment is when the slot machine says encouraging things.”",
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const data = JSON.parse(raw);
    return {
      balance: Math.max(0, Number(data.balance) || 0),
      owned: new Set(Array.isArray(data.owned) ? data.owned : []),
    };
  } catch {
    return defaultState();
  }
}

function defaultState() {
  return { balance: 200, owned: new Set() };
}

function saveState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        balance: state.balance,
        owned: [...state.owned],
      })
    );
  } catch {
    /* ignore quota */
  }
}

function buildStripHTML() {
  const cells = [];
  for (let i = 0; i < REEL_LEN; i++) {
    const sym = SYMBOLS[i % SYMBOLS.length];
    cells.push(cellHTML(sym));
  }
  return cells.join("");
}

function cellHTML(sym) {
  return `<div class="reel-cell" data-id="${sym.id}">
    <span class="glyph" aria-hidden="true">${sym.glyph}</span>
    <span class="label">${sym.label}</span>
  </div>`;
}

function payoutFor(ids) {
  const [a, b, c] = ids;
  for (const row of PAYOUTS) {
    if (row.match && row.match[0] === a && row.match[1] === b && row.match[2] === c) {
      return { payout: row.payout, msg: row.msg };
    }
  }
  const pair = a === b || b === c || a === c;
  const pairRule = PAYOUTS.find((r) => r.pair);
  if (pair && pairRule) return { payout: pairRule.payout, msg: pairRule.msg };
  const lose = PAYOUTS.find((r) => r.payout === 0 && !r.match && !r.pair);
  return { payout: 0, msg: lose.msg };
}

function vibrateWin(amount) {
  if (!navigator.vibrate) return;
  if (amount >= 200) navigator.vibrate([30, 40, 30, 40, 60]);
  else if (amount > 0) navigator.vibrate([20, 30, 20]);
}

const state = loadState();

const balanceEl = document.getElementById("balance");
const spinBtn = document.getElementById("spinBtn");
const resultEl = document.getElementById("result");
const shopEl = document.getElementById("shop");
const payoutTableEl = document.getElementById("payoutTable");
const quoteEl = document.getElementById("quote");
const spinCostEl = document.getElementById("spinCost");

const strips = [...document.querySelectorAll("[data-strip]")];

function renderBalance() {
  balanceEl.textContent = String(Math.floor(state.balance));
  spinBtn.disabled = state.balance < SPIN_COST;
}

function renderPayoutTable() {
  const rows = PAYOUTS.filter((p) => p.match);
  payoutTableEl.innerHTML = rows
    .map((p) => {
      const labels = p.match.map((id) => SYMBOLS.find((s) => s.id === id).label);
      return `<div><dt>${labels.join(" + ")}</dt><dd>+${p.payout} tok</dd></div>`;
    })
    .join("");
  const pair = PAYOUTS.find((p) => p.pair);
  payoutTableEl.innerHTML += `<div><dt>Any pair</dt><dd>+${pair.payout} tok</dd></div>`;
}

function randomQuote() {
  quoteEl.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

function renderShop() {
  shopEl.innerHTML = SHOP.map((item) => {
    const owned = state.owned.has(item.id);
    const canBuy = !owned && state.balance >= item.price;
    const disabled = owned || !canBuy;
    const cls = owned ? "owned" : "";
    return `<li>
      <div class="item-title">${item.title}<div class="item-meta">${item.blurb}</div></div>
      <button type="button" data-shop="${item.id}" ${disabled ? "disabled" : ""} class="${cls}">
        ${owned ? "Owned" : `${item.price} tok`}
      </button>
    </li>`;
  }).join("");

  shopEl.querySelectorAll("button[data-shop]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-shop");
      const item = SHOP.find((i) => i.id === id);
      if (!item || state.owned.has(id) || state.balance < item.price) return;
      state.balance -= item.price;
      state.owned.add(id);
      saveState(state);
      renderBalance();
      renderShop();
      resultEl.className = "result";
      resultEl.textContent = `Purchased: ${item.title}. Inventory updated (emotionally).`;
    });
  });
}

function initReels() {
  strips.forEach((strip) => {
    strip.style.transform = "translateY(0)";
    strip.innerHTML = buildStripHTML() + buildStripHTML();
  });
}

function spinReel(strip, finalIndex, durationMs, delayMs) {
  const cellHeight = 120;
  const singleLoop = REEL_LEN * cellHeight;
  return new Promise((resolve) => {
    const start = performance.now() + delayMs;
    const extraLoops = 2 + Math.floor(Math.random() * 2);
    const targetOffset = extraLoops * singleLoop + finalIndex * cellHeight;

    function frame(now) {
      if (now < start) {
        requestAnimationFrame(frame);
        return;
      }
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      const y = eased * targetOffset;
      strip.style.transform = `translate3d(0,-${y}px,0)`;
      if (t < 1) requestAnimationFrame(frame);
      else {
        strip.style.transform = `translate3d(0,-${finalIndex * cellHeight}px,0)`;
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

let spinning = false;

async function spin() {
  if (spinning || state.balance < SPIN_COST) return;
  spinning = true;
  state.balance -= SPIN_COST;
  saveState(state);
  renderBalance();
  resultEl.className = "result";
  resultEl.textContent = "Spinning… weights updating…";

  const finalIndices = [weightedRandomIndex(), weightedRandomIndex(), weightedRandomIndex()];
  const ids = finalIndices.map((i) => SYMBOLS[i].id);
  const { payout, msg } = payoutFor(ids);

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const durations = prefersReduced
    ? [400, 500, 600]
    : [SPIN_MS_MIN + Math.random() * 400, SPIN_MS_MIN + Math.random() * 500, SPIN_MS_MIN + Math.random() * 600];

  initReels();

  await Promise.all(
    strips.map((strip, i) =>
      spinReel(strip, finalIndices[i], durations[i], i * (prefersReduced ? 0 : 80))
    )
  );

  state.balance += payout;
  saveState(state);
  renderBalance();
  renderShop();

  if (payout > 0) {
    resultEl.className = "result win";
    resultEl.textContent = `+${payout} tok — ${msg}`;
    vibrateWin(payout);
  } else {
    resultEl.className = "result lose";
    resultEl.textContent = msg;
  }

  randomQuote();
  spinning = false;
}

spinBtn.addEventListener("click", spin);
spinCostEl.textContent = String(SPIN_COST);

initReels();
renderBalance();
renderPayoutTable();
renderShop();
randomQuote();
