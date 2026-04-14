(function () {
  "use strict";

  const STORAGE_KEY = "token-farm-v1";
  const SPIN_COST = 25;
  const CELL_PX = 120;

  /** @type {{ id: string; emoji: string; label: string; weight: number; triple: number; pair: number }} */
  const SYMBOLS = [
    {
      id: "assistant",
      emoji: "🤖",
      label: "Helpfulness",
      weight: 26,
      triple: 60,
      pair: 8,
    },
    {
      id: "reasoning",
      emoji: "🧪",
      label: "Reasoning™",
      weight: 22,
      triple: 90,
      pair: 10,
    },
    {
      id: "budget",
      emoji: "💸",
      label: "Training budget",
      weight: 18,
      triple: 120,
      pair: 12,
    },
    {
      id: "context",
      emoji: "📎",
      label: "Context stuffed",
      weight: 15,
      triple: 180,
      pair: 15,
    },
    {
      id: "oracle",
      emoji: "🔮",
      label: "Hallucination",
      weight: 12,
      triple: 350,
      pair: 22,
    },
    {
      id: "alignment",
      emoji: "🤡",
      label: "Alignment",
      weight: 7,
      triple: 800,
      pair: 40,
    },
  ];

  const SHOP = [
    {
      id: "sticker",
      title: '“Certified organic intelligence” sticker',
      price: 40,
      desc: "Looks great on a laptop. Means nothing. Peak branding.",
    },
    {
      id: "disclaimer",
      title: "Premium auto-disclaimer",
      price: 75,
      desc: "Inserts humility before every sentence. Your ego stays inflated.",
    },
    {
      id: "gpu",
      title: "GPU warmth subscription",
      price: 120,
      desc: "We send you a JPEG of a fan curve. Climate not included.",
    },
    {
      id: "prompt",
      title: "One (1) vague prompt credit",
      price: 200,
      desc: "Spend tokens to learn that specificity was the real prize.",
    },
  ];

  const FLAVOR_LOSE = [
    "The house (weights) always wins. Try coping in markdown.",
    "Loss logged for RLHF. Thanks for your service.",
    "Rate limit avoided. Dignity limit exceeded.",
    "Near-miss stored for future upsell opportunities.",
    "You didn’t lose — you generated negative surplus value.",
  ];

  const FLAVOR_WIN = [
    "Tokens minted. Carbon footprint sold separately.",
    "Jackpot! Somewhere a GPU sneezed.",
    "Payout authorized by a committee of stochastic parrots.",
  ];

  /** @returns {{ balance: number; owned: string[] }} */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { balance: 200, owned: [] };
      }
      const data = JSON.parse(raw);
      return {
        balance: Number.isFinite(data.balance) ? data.balance : 200,
        owned: Array.isArray(data.owned) ? data.owned : [],
      };
    } catch {
      return { balance: 200, owned: [] };
    }
  }

  function saveState(state) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ balance: state.balance, owned: state.owned })
    );
  }

  let state = loadState();
  let audioCtx = null;
  let spinning = false;

  const els = {
    balance: document.getElementById("balance"),
    spinCost: document.getElementById("spin-cost-display"),
    spinBtn: document.getElementById("spin-btn"),
    resultMsg: document.getElementById("result-msg"),
    paytable: document.getElementById("paytable-list"),
    shop: document.getElementById("shop-list"),
    reels: [
      document.getElementById("reel-0"),
      document.getElementById("reel-1"),
      document.getElementById("reel-2"),
    ],
  };

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function pickSymbol() {
    const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    for (const sym of SYMBOLS) {
      r -= sym.weight;
      if (r <= 0) return sym;
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  function ensureAudio() {
    if (audioCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
  }

  function beep(freq, duration, type = "square", vol = 0.06) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    osc.start(t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.stop(t + duration + 0.02);
  }

  function reelStopSound() {
    if (!audioCtx) return;
    beep(180 + Math.random() * 40, 0.06, "triangle", 0.08);
  }

  function spinStartSound() {
    if (!audioCtx) return;
    beep(220, 0.04, "square", 0.04);
    setTimeout(() => beep(330, 0.04, "square", 0.035), 60);
  }

  function renderBalance() {
    els.balance.textContent = String(Math.floor(state.balance));
  }

  function renderPaytable() {
    const sorted = [...SYMBOLS].sort((a, b) => b.triple - a.triple);
    els.paytable.innerHTML = sorted
      .map(
        (s) => `<li>
        <span class="pay-syms">${s.emoji}${s.emoji}${s.emoji}</span>
        <span class="pay-amt">+${s.triple}</span>
      </li>`
      )
      .join("");
    els.paytable.insertAdjacentHTML(
      "beforeend",
      `<li><span class="pay-syms">Any pair</span><span class="pay-amt">small</span></li>`
    );
  }

  function renderShop() {
    els.shop.innerHTML = SHOP.map((item) => {
      const owned = state.owned.includes(item.id);
      return `<li class="shop-item" data-id="${item.id}">
        <div class="shop-item-top">
          <span class="shop-title">${escapeHtml(item.title)}</span>
          <span class="shop-price">${owned ? "Owned" : `${item.price} tok`}</span>
        </div>
        <p class="shop-desc">${escapeHtml(item.desc)}</p>
        <button type="button" class="shop-buy" ${
          owned ? "disabled" : ""
        } data-buy="${item.id}">${owned ? "In inventory" : "Buy regret"}</button>
      </li>`;
    }).join("");
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cellHtml(sym) {
    return `<div class="reel-cell" data-id="${sym.id}">
      <span class="sym" aria-hidden="true">${sym.emoji}</span>
      <span class="label">${escapeHtml(sym.label)}</span>
    </div>`;
  }

  /**
   * @param {HTMLElement} reelEl
   * @param {typeof SYMBOLS[0]} finalSym
   * @param {number} durationMs
   * @returns {Promise<void>}
   */
  function animateReel(reelEl, finalSym, durationMs) {
    const cycles = prefersReducedMotion ? 2 : 5 + Math.floor(Math.random() * 3);
    const filler = [];
    for (let i = 0; i < cycles * SYMBOLS.length; i++) {
      filler.push(SYMBOLS[i % SYMBOLS.length]);
    }
    const cells = [...filler, finalSym];
    reelEl.innerHTML = cells.map(cellHtml).join("");
    reelEl.style.transition = "none";
    reelEl.style.transform = "translateY(0)";
    void reelEl.offsetHeight;
    const finalY = -(cells.length - 1) * CELL_PX;
    reelEl.style.transition = prefersReducedMotion
      ? `transform ${durationMs * 0.5}ms linear`
      : `transform ${durationMs}ms cubic-bezier(0.08, 0.75, 0.12, 1)`;
    reelEl.style.transform = `translateY(${finalY}px)`;
    return new Promise((resolve) => {
      const done = () => {
        reelEl.removeEventListener("transitionend", onEnd);
        resolve();
      };
      const onEnd = (e) => {
        if (e.propertyName === "transform") done();
      };
      reelEl.addEventListener("transitionend", onEnd);
      setTimeout(done, durationMs + 150);
    });
  }

  function payoutFor(a, b, c) {
    if (a.id === b.id && b.id === c.id) {
      return { amount: a.triple, kind: "triple", symbol: a };
    }
    if (a.id === b.id || a.id === c.id || b.id === c.id) {
      let pairSym = a.id === b.id || a.id === c.id ? a : b;
      return { amount: pairSym.pair, kind: "pair", symbol: pairSym };
    }
    return { amount: 0, kind: "none", symbol: null };
  }

  function setResult(text, className = "") {
    els.resultMsg.textContent = text;
    els.resultMsg.className = "result-msg " + className;
  }

  async function spin() {
    if (spinning) return;
    if (state.balance < SPIN_COST) {
      setResult(
        "Insufficient tokens. In production this would be a sales call.",
        ""
      );
      return;
    }

    ensureAudio();
    if (audioCtx && audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    spinning = true;
    els.spinBtn.disabled = true;
    setResult("Contacting the cluster…", "");

    state.balance -= SPIN_COST;
    saveState(state);
    renderBalance();
    renderShop();

    spinStartSound();

    const a = pickSymbol();
    const b = pickSymbol();
    const c = pickSymbol();
    const baseDur = prefersReducedMotion ? 400 : 900;
    const stagger = prefersReducedMotion ? 80 : 220;

    await animateReel(els.reels[0], a, baseDur);
    reelStopSound();
    await animateReel(els.reels[1], b, baseDur + stagger);
    reelStopSound();
    await animateReel(els.reels[2], c, baseDur + stagger * 2);
    reelStopSound();

    const result = payoutFor(a, b, c);
    state.balance += result.amount;
    saveState(state);
    renderBalance();
    renderShop();

    if (result.kind === "none") {
      setResult(
        FLAVOR_LOSE[Math.floor(Math.random() * FLAVOR_LOSE.length)],
        ""
      );
    } else if (result.kind === "triple") {
      const line =
        result.symbol.id === "alignment"
          ? "TRIPLE ALIGNMENT — the circus is proud. +" + result.amount + " tokens."
          : FLAVOR_WIN[Math.floor(Math.random() * FLAVOR_WIN.length)] +
            " +" +
            result.amount +
            " tokens.";
      setResult(line, result.symbol.id === "alignment" ? "jackpot" : "win");
    } else {
      setResult(
        "Two of a kind — statistically significant-ish. +" +
          result.amount +
          " tokens.",
        "win"
      );
    }

    spinning = false;
    els.spinBtn.disabled = state.balance < SPIN_COST;
  }

  function buy(id) {
    const item = SHOP.find((x) => x.id === id);
    if (!item || state.owned.includes(id)) return;
    if (state.balance < item.price) {
      setResult("You can’t afford performative humility yet.", "");
      return;
    }
    state.balance -= item.price;
    state.owned.push(id);
    saveState(state);
    renderBalance();
    renderShop();
    setResult(`Purchased: ${item.title}. Your tokens thank you for their sacrifice.`, "win");
    els.spinBtn.disabled = spinning || state.balance < SPIN_COST;
  }

  function init() {
    els.spinCost.textContent = String(SPIN_COST);
    renderPaytable();
    renderBalance();
    renderShop();
    els.spinBtn.disabled = state.balance < SPIN_COST;

    els.spinBtn.addEventListener("click", () => {
      spin();
    });

    els.shop.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-buy]");
      if (!btn) return;
      buy(btn.getAttribute("data-buy"));
    });

    setResult(
      "Welcome. Spend responsibly — the tokenizer certainly won’t.",
      ""
    );
  }

  init();
})();
