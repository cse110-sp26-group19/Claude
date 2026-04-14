(function () {
  "use strict";

  const STORAGE_KEY = "context-casino-v1";
  const SPIN_COST = 10;
  const STARTING_TOKENS = 100;
  const REEL_COUNT = 3;
  /** Measured from `--reel-h` (4.5rem) so JS scroll math matches layout. */
  let cellH = 72;

  function measureCellHeight() {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;height:4.5rem;width:0;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    cellH = probe.offsetHeight || 72;
    probe.remove();
  }

  /** @type {{ id: string; emoji: string; label: string }} */
  const SYMBOLS = [
    { id: "gpu", emoji: "⚡", label: "GPU bill" },
    { id: "hype", emoji: "🔥", label: "AI hype" },
    { id: "hall", emoji: "🎭", label: "Hallucination" },
    { id: "paper", emoji: "📄", label: "ArXiv drop" },
    { id: "money", emoji: "💸", label: "Inference tax" },
    { id: "brain", emoji: "🧠", label: "Training data" },
    { id: "chart", emoji: "📉", label: "Your stock" },
    { id: "clip", emoji: "📎", label: "Paperclip" },
  ];

  const WIN_MESSAGES = {
    3: [
      "Jackpot: three matching vibes. VC money incoming (narrator: it is not).",
      "Triple threat — you have achieved statistical significance in your imagination.",
      "Full alignment. The board slides now say you are 'AI-first'.",
    ],
    2: [
      "Pair: partial credit, like every AI demo ever.",
      "Two of a kind — almost as good as 'works on my machine'.",
      "Near-miss engineered for engagement. You are the product.",
    ],
  };

  const LOSE_MESSAGES = [
    "Loss: your tokens crossed the API boundary and never returned.",
    "No match. Try a longer system prompt and more denial.",
    "Cold streak. Have you tried turning the model off and on again?",
    "Empty reels, full copium.",
    "The house (Open weights, closed pricing) always wins.",
  ];

  const INSUFFICIENT_MSG =
    "Insufficient context. Earn tokens or admit you are out of budget.";

  /** Multiplier of spin cost for payouts */
  const PAYOUT_TABLE = [
    { match: 3, mult: 25, note: "3 identical" },
    { match: 2, mult: 3, note: "2 identical" },
    { match: 0, mult: 0, note: "no match" },
  ];

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (typeof data.balance !== "number") return null;
      return {
        balance: data.balance,
        spins: typeof data.spins === "number" ? data.spins : 0,
        net: typeof data.net === "number" ? data.net : 0,
      };
    } catch {
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }

  let state = loadState() || {
    balance: STARTING_TOKENS,
    spins: 0,
    net: 0,
  };

  const els = {
    reels: document.getElementById("reels"),
    tokenBalance: document.getElementById("tokenBalance"),
    spinCost: document.getElementById("spinCost"),
    spinBtn: document.getElementById("spinBtn"),
    statusMsg: document.getElementById("statusMsg"),
    resultLine: document.getElementById("resultLine"),
    payoutList: document.getElementById("payoutList"),
    statSpins: document.getElementById("statSpins"),
    statNet: document.getElementById("statNet"),
    resetBtn: document.getElementById("resetBtn"),
  };

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function renderPayoutList() {
    els.payoutList.innerHTML = PAYOUT_TABLE.map(
      (row) =>
        `<li><span class="payout-sym">${row.note}</span><span class="payout-val">${
          row.mult > 0 ? `+${row.mult}× cost` : "0"
        }</span></li>`
    ).join("");
  }

  function symbolIndex(id) {
    return SYMBOLS.findIndex((s) => s.id === id);
  }

  function buildStripHTML() {
    return SYMBOLS.map(
      (s) =>
        `<div class="cell" data-id="${s.id}"><div><span class="emoji" aria-hidden="true">${s.emoji}</span><span class="label">${s.label}</span></div></div>`
    ).join("");
  }

  /** @type {{ col: HTMLElement; strip: HTMLElement }[]} */
  const reelRefs = [];

  function initReels() {
    els.reels.innerHTML = "";
    reelRefs.length = 0;
    for (let r = 0; r < REEL_COUNT; r++) {
      const col = document.createElement("div");
      col.className = "reel-col";
      col.setAttribute("role", "img");
      col.setAttribute("aria-label", `Reel ${r + 1}`);
      const strip = document.createElement("div");
      strip.className = "reel-strip";
      strip.innerHTML = buildStripHTML() + buildStripHTML() + buildStripHTML();
      col.appendChild(strip);
      els.reels.appendChild(col);
      reelRefs.push({ col, strip });
      const startIdx = Math.floor(Math.random() * SYMBOLS.length);
      setStripPosition(strip, startIdx);
    }
  }

  function loopHeight() {
    return SYMBOLS.length * cellH;
  }

  function setStripPosition(strip, symbolIndex) {
    const lh = loopHeight();
    const y = -(lh + symbolIndex * cellH);
    strip.style.transition = "none";
    strip.style.transform = `translateY(${y}px)`;
  }

  function spinStrip(strip, endSymbolIndex, durationMs, delayMs) {
    return new Promise((resolve) => {
      const lh = loopHeight();
      const extraLoops = 2 + Math.floor(Math.random() * 2);
      const startY = getCurrentTranslateY(strip);
      const mod = ((-startY % lh) + lh) % lh;
      const currentIndex = Math.min(
        SYMBOLS.length - 1,
        Math.round(mod / cellH) % SYMBOLS.length
      );
      const deltaIndex =
        (endSymbolIndex - currentIndex + SYMBOLS.length) % SYMBOLS.length;
      const totalTravel = extraLoops * lh + deltaIndex * cellH;
      const targetY = startY - totalTravel;

      strip.classList.add("spinning");

      const finish = () => {
        strip.classList.remove("spinning");
        normalizeStrip(strip, endSymbolIndex);
        resolve();
      };

      const go = () => {
        strip.style.transition = prefersReducedMotion
          ? "none"
          : `transform ${durationMs}ms cubic-bezier(0.12, 0.85, 0.22, 1)`;
        strip.style.transform = `translateY(${targetY}px)`;
      };

      const onEnd = (e) => {
        if (e.propertyName !== "transform") return;
        strip.removeEventListener("transitionend", onEnd);
        finish();
      };

      strip.addEventListener("transitionend", onEnd);

      if (delayMs > 0) {
        window.setTimeout(go, delayMs);
      } else {
        requestAnimationFrame(go);
      }

      if (prefersReducedMotion) {
        window.setTimeout(() => {
          strip.removeEventListener("transitionend", onEnd);
          finish();
        }, 0);
      }
    });
  }

  function getCurrentTranslateY(strip) {
    const t = strip.style.transform;
    const m = t.match(/translateY\((-?[0-9.]+)px\)/);
    return m ? parseFloat(m[1], 10) : 0;
  }

  function normalizeStrip(strip, endSymbolIndex) {
    const lh = loopHeight();
    const y = -(lh + endSymbolIndex * cellH);
    strip.style.transition = "none";
    strip.style.transform = `translateY(${y}px)`;
  }

  function pickOutcome() {
    const weights = [
      { w: 38, type: "lose" },
      { w: 42, type: "pair" },
      { w: 20, type: "triple" },
    ];
    const total = weights.reduce((a, b) => a + b.w, 0);
    let r = Math.random() * total;
    let type = "lose";
    for (const row of weights) {
      r -= row.w;
      if (r <= 0) {
        type = row.type;
        break;
      }
    }

    const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    /** @type {string[]} */
    const ids = [];

    if (type === "triple") {
      ids.push(sym.id, sym.id, sym.id);
    } else if (type === "pair") {
      const others = SYMBOLS.filter((s) => s.id !== sym.id);
      const other = others[Math.floor(Math.random() * others.length)];
      const trio = [sym.id, sym.id, other.id];
      for (let i = trio.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trio[i], trio[j]] = [trio[j], trio[i]];
      }
      ids.push(...trio);
    } else {
      let a;
      let b;
      let c;
      do {
        a = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id;
        b = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id;
        c = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id;
      } while (a === b || b === c || a === c);
      ids.push(a, b, c);
    }

    return { ids, type };
  }

  function score(ids) {
    const [x, y, z] = ids;
    if (x === y && y === z) return { match: 3, mult: 25 };
    if (x === y || y === z || x === z) return { match: 2, mult: 3 };
    return { match: 0, mult: 0 };
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function updateUI() {
    els.tokenBalance.textContent = String(state.balance);
    els.spinCost.textContent = String(SPIN_COST);
    els.statSpins.textContent = String(state.spins);
    els.statNet.textContent =
      (state.net >= 0 ? "+" : "") + String(state.net);
    const can = state.balance >= SPIN_COST;
    els.spinBtn.disabled = !can;
    if (!can) {
      els.statusMsg.textContent = INSUFFICIENT_MSG;
    }
  }

  function pulseWallet() {
    els.tokenBalance.classList.remove("pulse");
    void els.tokenBalance.offsetWidth;
    els.tokenBalance.classList.add("pulse");
  }

  let spinning = false;

  async function spin() {
    if (spinning || state.balance < SPIN_COST) return;
    spinning = true;
    els.spinBtn.disabled = true;
    els.resultLine.textContent = "—";
    els.resultLine.className = "result-line";

    state.balance -= SPIN_COST;
    state.spins += 1;
    state.net -= SPIN_COST;
    saveState(state);
    updateUI();
    els.statusMsg.textContent = "Burning compute…";

    const outcome = pickOutcome();
    const { match, mult } = score(outcome.ids);
    const winTokens = mult * SPIN_COST;

    const durations = [1800, 2400, 3000];
    const tasks = reelRefs.map((ref, i) => {
      const idx = symbolIndex(outcome.ids[i]);
      return spinStrip(ref.strip, idx, durations[i], i * 160);
    });

    await Promise.all(tasks);

    state.balance += winTokens;
    state.net += winTokens;
    saveState(state);
    updateUI();

    const msg =
      match === 3
        ? randomFrom(WIN_MESSAGES[3])
        : match === 2
          ? randomFrom(WIN_MESSAGES[2])
          : randomFrom(LOSE_MESSAGES);

    if (winTokens > 0) {
      els.resultLine.classList.add("win");
      els.resultLine.textContent = `+${winTokens} tokens. ${msg}`;
      els.statusMsg.textContent =
        match === 3
          ? "Board deck updated: 'Responsible AI™'."
          : "Payout: your CFO will still ask about GPU spend.";
      pulseWallet();
      if (typeof navigator.vibrate === "function" && !prefersReducedMotion) {
        navigator.vibrate(match === 3 ? [30, 40, 30] : [20, 15, 20]);
      }
    } else {
      els.resultLine.classList.add("lose");
      els.resultLine.textContent = msg;
      els.statusMsg.textContent = "Tokens well spent. Probably.";
    }

    spinning = false;
    updateUI();
  }

  els.spinBtn.addEventListener("click", spin);

  els.resetBtn.addEventListener("click", () => {
    if (!confirm("Reset your local token bank to the starting amount?")) return;
    state = {
      balance: STARTING_TOKENS,
      spins: 0,
      net: 0,
    };
    saveState(state);
    initReels();
    updateUI();
    els.resultLine.textContent = "—";
    els.resultLine.className = "result-line";
    els.statusMsg.textContent = "Fresh context window. Try not to leak PII.";
  });

  measureCellHeight();
  renderPayoutList();
  initReels();
  updateUI();
})();
