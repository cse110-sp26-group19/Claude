(function () {
  "use strict";

  const SYMBOLS = [
    { id: "TOK", label: "TOK", className: "symbol--tok" },
    { id: "GPT", label: "GPT", className: "symbol--gpt" },
    { id: "???", label: "???", className: "symbol--q" },
    { id: "CPU", label: "CPU", className: "symbol--cpu" },
    { id: "CTX", label: "CTX", className: "symbol--ctx" },
  ];

  const SPIN_COST = 25;
  const STORAGE_KEY = "tokenBanditBalanceV1";

  const SNARK = {
    broke: [
      "Out of tokens. Even your fallback model is disappointed.",
      "Insufficient context. Try minting more — it’s ethically dubious but free.",
      "Balance: zero. Like your patience during a 200-token disclaimer.",
    ],
    spin: [
      "Spinning… aligning gradients emotionally.",
      "Consulting a stochastic parrot. Please hold.",
      "Shuffling weights. Totally reproducible (no).",
    ],
    win3: {
      TOK: [
        "TOK · TOK · TOK — Full alignment. Your calendar is still wrong.",
        "Three TOKs. You’ve earned the right to say ‘as an AI language model.’",
      ],
      GPT: [
        "GPT triple. Vendor lock-in never felt this rewarding.",
        "Three GPTs. Somewhere a benchmark just got gamed.",
      ],
      "???": [
        "??? jackpot. Citations incoming any second now. Any second.",
        "Three question marks. Confidence: 99%. Accuracy: TBD.",
      ],
      CPU: [
        "CPU triple. Fans spinning louder than your PM’s expectations.",
        "All CPU. Thermals are a social construct.",
      ],
      CTX: [
        "CTX triple. Your window is huge. Your answers, debatable.",
        "Context overload. Compress that thought.",
      ],
    },
    win2: [
      "Two of a kind. Like a partial fine-tune — close enough for a demo.",
      "Pair matched. That’s basically RLHF if you squint.",
    ],
    lose: [
      "No match. Pure training loss. Refreshing honesty.",
      "Miss. The model would still sound confident though.",
      "Nothing. Add ‘step by step’ and try again (doesn’t help here).",
    ],
    mint: [
      "Airdropped +200 tok. Inflation is a feature if you rename it ‘scaling law.’",
      "Fresh tokens. Not from your data. Probably.",
      "Minted. If anyone asks, this was ‘synthetic data augmentation.’",
    ],
  };

  const balanceEl = document.getElementById("balance");
  const messageEl = document.getElementById("message");
  const spinBtn = document.getElementById("spinBtn");
  const buyBtn = document.getElementById("buyBtn");
  const costEls = [document.getElementById("cost"), document.getElementById("spinCostBtn")];

  let balance = loadBalance();
  let spinning = false;

  function loadBalance() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw != null ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n >= 0) return n;
    return 500;
  }

  function saveBalance() {
    localStorage.setItem(STORAGE_KEY, String(balance));
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function renderHud() {
    balanceEl.textContent = String(balance);
    costEls.forEach((el) => {
      if (el) el.textContent = String(SPIN_COST);
    });
    spinBtn.disabled = spinning || balance < SPIN_COST;
  }

  function setMessage(text) {
    messageEl.textContent = text;
  }

  function symbolById(id) {
    return SYMBOLS.find((s) => s.id === id) || SYMBOLS[0];
  }

  function makeSymbolEl(sym) {
    const div = document.createElement("div");
    div.className = `symbol ${sym.className}`;
    div.textContent = sym.label;
    div.setAttribute("data-id", sym.id);
    return div;
  }

  function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  function weightedOutcome() {
    const r = Math.random();
    if (r < 0.06) return "triple";
    if (r < 0.26) return "pair";
    return "junk";
  }

  function pickTripleId() {
    const weights = [
      ["???", 0.12],
      ["TOK", 0.28],
      ["GPT", 0.28],
      ["CPU", 0.16],
      ["CTX", 0.16],
    ];
    const x = Math.random();
    let acc = 0;
    for (const [id, w] of weights) {
      acc += w;
      if (x <= acc) return id;
    }
    return "TOK";
  }

  function resolveSpinResults() {
    const mode = weightedOutcome();
    if (mode === "triple") {
      const id = pickTripleId();
      return [id, id, id];
    }
    if (mode === "pair") {
      const pairId = randomSymbol().id;
      const others = SYMBOLS.filter((s) => s.id !== pairId).map((s) => s.id);
      const third = others[Math.floor(Math.random() * others.length)];
      const positions = [0, 1, 2].sort(() => Math.random() - 0.5);
      const out = [null, null, null];
      out[positions[0]] = pairId;
      out[positions[1]] = pairId;
      out[positions[2]] = third;
      return out;
    }
    const pool = SYMBOLS.map((s) => s.id).sort(() => Math.random() - 0.5);
    return [pool[0], pool[1], pool[2]];
  }

  function payout(ids) {
    const [x, y, z] = ids;
    if (x === y && y === z) {
      if (x === "???") return 400;
      if (x === "TOK") return 120;
      if (x === "GPT") return 90;
      return 75;
    }
    const set = new Set(ids);
    if (set.size < 3) return 18;
    return 0;
  }

  function outcomeMessage(ids) {
    const [x, y, z] = ids;
    if (x === y && y === z) {
      const lines = SNARK.win3[x] || SNARK.win3.TOK;
      return pick(lines);
    }
    if (new Set(ids).size < 3) {
      return pick(SNARK.win2);
    }
    return pick(SNARK.lose);
  }

  function buildStrip(finalId, reelIndex) {
    const strip = document.createElement("div");
    strip.className = "reel-strip is-idle";
    const rounds = 18 + reelIndex * 4;
    for (let i = 0; i < rounds; i++) {
      strip.appendChild(makeSymbolEl(randomSymbol()));
    }
    strip.appendChild(makeSymbolEl(symbolById(finalId)));
    return strip;
  }

  function showStripStatic(windowEl, finalId, reelIndex) {
    const strip = buildStrip(finalId, reelIndex);
    windowEl.replaceChildren(strip);
    strip.classList.add("is-idle");
    strip.style.transform = "translateY(0)";
    const target = strip.scrollHeight - windowEl.clientHeight;
    strip.style.transform = `translateY(-${target}px)`;
  }

  function spinReels(finalIds) {
    const windowEls = [0, 1, 2].map((i) => document.getElementById(`reel-window-${i}`));
    const bundles = finalIds.map((id, i) => ({
      windowEl: windowEls[i],
      strip: buildStrip(id, i),
      i,
    }));

    bundles.forEach(({ windowEl, strip }) => {
      windowEl.replaceChildren(strip);
      strip.classList.add("is-idle");
      strip.style.removeProperty("transition-duration");
      strip.style.transform = "translateY(0)";
    });

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          let maxMs = 0;
          bundles.forEach(({ windowEl, strip, i }) => {
            const target = strip.scrollHeight - windowEl.clientHeight;
            const durationSec = 1.85 + i * 0.38;
            strip.classList.remove("is-idle");
            strip.style.transitionDuration = `${durationSec}s`;
            void strip.offsetHeight;
            strip.style.transform = `translateY(-${target}px)`;
            maxMs = Math.max(maxMs, durationSec * 1000);
          });
          window.setTimeout(resolve, maxMs + 120);
        });
      });
    });
  }

  async function onSpin() {
    if (spinning || balance < SPIN_COST) {
      if (balance < SPIN_COST) setMessage(pick(SNARK.broke));
      return;
    }
    spinning = true;
    balance -= SPIN_COST;
    saveBalance();
    renderHud();
    setMessage(pick(SNARK.spin));

    const finalIds = resolveSpinResults();
    await spinReels(finalIds);

    const won = payout(finalIds);
    balance += won;
    saveBalance();
    renderHud();

    const msg = outcomeMessage(finalIds);
    setMessage(won > 0 ? `${msg} (+${won} tok, −${SPIN_COST} spin)` : `${msg} (−${SPIN_COST} tok)`);
    spinning = false;
    renderHud();
  }

  function onMint() {
    balance += 200;
    saveBalance();
    renderHud();
    setMessage(pick(SNARK.mint));
  }

  spinBtn.addEventListener("click", onSpin);
  buyBtn.addEventListener("click", onMint);

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      onSpin();
    }
  });

  (function initStrips() {
    for (let i = 0; i < 3; i++) {
      const windowEl = document.getElementById(`reel-window-${i}`);
      showStripStatic(windowEl, randomSymbol().id, i);
    }
  })();

  renderHud();
  setMessage("Insert ambition and click Spin.");
})();
