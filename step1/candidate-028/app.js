(function () {
  "use strict";

  const STORAGE_KEY = "tokenFarmBalance_v1";
  const SPIN_COST = 10;
  const SHOP_COST = 25;
  const REPEAT_SEGMENTS = 12;

  const SYMBOLS = [
    { id: "HALL", label: "HALL", quip: "Cites papers that never existed." },
    { id: "HYPE", label: "HYPE", quip: "Your valuation just went up (down)." },
    { id: "GPU", label: "GPU", quip: "Smells like burning money." },
    { id: "API", label: "API", quip: "Rate limit is a personality trait." },
    { id: "CTX", label: "CTX", quip: "Forgot everything after paragraph two." },
    { id: "WIN", label: "AGI", quip: "Scheduled for next quarter forever." },
  ];

  const PAYOUT_THREE = {
    WIN: 120,
    GPU: 55,
    HYPE: 32,
    API: 28,
    CTX: 22,
    HALL: 18,
  };

  const PAIR_PAYOUT = 6;

  const IDLE_MESSAGES = [
    "The house has read your terms of service. You have not.",
    "Tokens are like confidence: easy to mint, hard to redeem.",
    "Spin responsibly. Hallucinations are not financial advice.",
    "Saving to localStorage — the blockchain of your bedroom.",
    "If you lose, blame the dataset. If you win, you're a prompt engineer.",
  ];

  const WIN_MESSAGES = [
    "Board deck updated: “synergistic token velocity.”",
    "Your LLM is proud. Your electricity bill isn’t.",
    "VCs would call this “early traction.”",
    "You’ve earned the right to say “it’s just like reasoning.”",
  ];

  const LOSE_MESSAGES = [
    "Technically not wrong — also technically not funded.",
    "The model would apologize if it could afford liability insurance.",
    "Consider this a fine-tuning step on your ego.",
    "You didn’t lose; you provided negative training signal.",
    "Stakeholders remain cautiously optimistic (they are not).",
  ];

  const elBalance = document.getElementById("balance");
  const elStatus = document.getElementById("status");
  const elSpinBtn = document.getElementById("spinBtn");
  const elSpinCost = document.getElementById("spinCost");
  const elReels = document.getElementById("reels");
  const elPaytable = document.getElementById("paytable");
  const elShopBtn = document.getElementById("shopBtn");
  const elShopModal = document.getElementById("shopModal");
  const elShopBlurb = document.getElementById("shopBlurb");
  const elShopClose = document.getElementById("shopClose");
  const elShopConfirm = document.getElementById("shopConfirm");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let balance = loadBalance();
  let spinning = false;

  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    return audioCtx;
  }

  function beep(freq, duration, type = "square", gain = 0.06) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function playSpinSounds() {
    if (!getAudioContext()) return;
    [330, 440, 520].forEach((f, i) => {
      setTimeout(() => beep(f, 0.05, "triangle", 0.04), i * 45);
    });
  }

  function playWinSound() {
    if (!getAudioContext()) return;
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => beep(f, 0.12, "sine", 0.07), i * 90);
    });
  }

  function playLoseSound() {
    if (!getAudioContext()) return;
    beep(180, 0.2, "sawtooth", 0.05);
    setTimeout(() => beep(140, 0.25, "sawtooth", 0.045), 120);
  }

  function vibrateWin() {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate([30, 40, 55]);
    }
  }

  function loadBalance() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw !== null ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n >= 0) return n;
    return 100;
  }

  function saveBalance() {
    localStorage.setItem(STORAGE_KEY, String(balance));
  }

  function setBalanceDisplay() {
    elBalance.textContent = String(balance);
    elSpinBtn.disabled = spinning || balance < SPIN_COST;
    elShopBtn.disabled = spinning || balance < SHOP_COST;
  }

  function randomIdle() {
    return IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
  }

  function randomWin() {
    return WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)];
  }

  function randomLose() {
    return LOSE_MESSAGES[Math.floor(Math.random() * LOSE_MESSAGES.length)];
  }

  function buildPaytable() {
    const rows = Object.entries(PAYOUT_THREE)
      .map(([id, amt]) => {
        const sym = SYMBOLS.find((s) => s.id === id);
        const label = sym ? sym.label : id;
        return `<div class="pay-row"><span>Three <strong>${label}</strong></span><span>+${amt} tok</span></div>`;
      })
      .join("");
    elPaytable.innerHTML =
      rows +
      `<div class="pay-row"><span>Any two matching</span><span>+${PAIR_PAYOUT} tok</span></div>`;
  }

  function buildStripElement() {
    const segment = [];
    for (let r = 0; r < REPEAT_SEGMENTS; r++) {
      for (let i = 0; i < SYMBOLS.length; i++) {
        segment.push(SYMBOLS[i]);
      }
    }
    return segment;
  }

  function mountReels() {
    const stripData = buildStripElement();
    const wraps = elReels.querySelectorAll(".reel-wrap");

    wraps.forEach((wrap) => {
      const ul = wrap.querySelector(".reel-strip");
      ul.innerHTML = "";
      stripData.forEach((sym) => {
        const li = document.createElement("li");
        li.className = "cell";
        li.dataset.id = sym.id;
        li.innerHTML = `<span>${sym.label}</span>`;
        ul.appendChild(li);
      });
      const start = Math.floor(Math.random() * SYMBOLS.length);
      ul.dataset.scrollIndex = String(start);
      const h = cellHeightPx(ul);
      const y = -start * h;
      ul.dataset.translateY = String(y);
      ul.style.transition = "none";
      ul.style.transform = `translateY(${y}px)`;
    });
  }

  function cellHeightPx(ul) {
    const first = ul.querySelector(".cell");
    return first ? first.getBoundingClientRect().height : 88;
  }

  function spinReel(ul, targetSymbolIndex, durationMs, delayMs) {
    return new Promise((resolve) => {
      const h = cellHeightPx(ul);
      const totalCells = ul.querySelectorAll(".cell").length;
      const symCount = SYMBOLS.length;
      const currentScroll = Number.parseInt(ul.dataset.scrollIndex || "0", 10);
      let loops = reducedMotion ? 1 : 3 + Math.floor(Math.random() * 2);
      const align =
        (targetSymbolIndex - (currentScroll % symCount) + symCount) % symCount;
      let finalScroll = currentScroll + loops * symCount + align;
      while (finalScroll >= totalCells && loops > 1) {
        loops -= 1;
        finalScroll = currentScroll + loops * symCount + align;
      }
      const nextY = -finalScroll * h;

      ul.classList.add("spinning");
      ul.style.transition = reducedMotion
        ? "none"
        : `transform ${durationMs}ms cubic-bezier(0.12, 0.85, 0.15, 1)`;
      ul.style.transform = `translateY(${nextY}px)`;

      ul.dataset.scrollIndex = String(finalScroll);
      ul.dataset.translateY = String(nextY);

      const done = () => {
        ul.classList.remove("spinning");
        resolve();
      };

      setTimeout(done, delayMs + (reducedMotion ? 0 : durationMs));
    });
  }

  function snapReelToSymbol(ul, symbolIndex) {
    const h = cellHeightPx(ul);
    ul.style.transition = "none";
    ul.dataset.scrollIndex = String(symbolIndex);
    const y = -symbolIndex * h;
    ul.style.transform = `translateY(${y}px)`;
    ul.dataset.translateY = String(y);
    void ul.offsetHeight;
  }

  function randomSymbolIndex() {
    return Math.floor(Math.random() * SYMBOLS.length);
  }

  function payoutFor(ids) {
    const [a, b, c] = ids;
    if (a === b && b === c) {
      return PAYOUT_THREE[a] ?? 0;
    }
    if (a === b || b === c || a === c) {
      return PAIR_PAYOUT;
    }
    return 0;
  }

  function statusClass(amount) {
    if (amount > 0) return "win";
    if (amount < 0) return "lose";
    return "";
  }

  async function doSpin() {
    if (spinning || balance < SPIN_COST) return;
    spinning = true;
    setBalanceDisplay();

    balance -= SPIN_COST;
    saveBalance();
    setBalanceDisplay();

    elStatus.className = "status";
    elStatus.textContent = "Allocating GPUs that definitely exist…";

    const indices = [randomSymbolIndex(), randomSymbolIndex(), randomSymbolIndex()];
    const ids = indices.map((i) => SYMBOLS[i].id);

    const uls = elReels.querySelectorAll(".reel-strip");
    const baseDur = reducedMotion ? 0 : 1400;
    playSpinSounds();

    await Promise.all(
      [0, 1, 2].map((i) =>
        spinReel(uls[i], indices[i], baseDur + i * 220, i * (reducedMotion ? 0 : 80))
      )
    );

    uls.forEach((ul, i) => snapReelToSymbol(ul, indices[i]));

    const prize = payoutFor(ids);
    const net = prize - SPIN_COST;

    balance += prize;
    saveBalance();
    setBalanceDisplay();

    elStatus.className = "status " + statusClass(net);

    if (prize > 0) {
      playWinSound();
      vibrateWin();
      const sym = SYMBOLS.find((s) => s.id === ids[0]);
      if (ids[0] === ids[1] && ids[1] === ids[2] && sym) {
        elStatus.textContent = `Jackpot energy: three ${sym.label}. +${prize} tok. ${sym.quip} ${randomWin()}`;
      } else {
        elStatus.textContent = `Two peas in an embedding: +${prize} tok. ${randomWin()}`;
      }
    } else {
      playLoseSound();
      elStatus.textContent = `${randomLose()} (${randomIdle()})`;
    }

    spinning = false;
    setBalanceDisplay();
  }

  function openShop() {
    elShopBlurb.textContent =
      `Pay ${SHOP_COST} tok to reserve a “GPU cluster” that is definitely not a single MacBook with a sticker. ` +
      "Includes a PDF certificate suitable for framing or litigation.";
    elShopModal.showModal();
  }

  function confirmShop() {
    if (balance < SHOP_COST) {
      elShopModal.close();
      return;
    }
    balance -= SHOP_COST;
    saveBalance();
    setBalanceDisplay();
    elShopModal.close();
    elStatus.className = "status lose";
    elStatus.textContent =
      "Purchase complete. Your workload is now someone else’s moral hazard. " + randomLose();
  }

  elSpinBtn.addEventListener("click", () => {
    void getAudioContext()?.resume?.();
    void doSpin();
  });

  elShopBtn.addEventListener("click", () => {
    void getAudioContext()?.resume?.();
    openShop();
  });

  elShopClose.addEventListener("click", () => elShopModal.close());
  elShopConfirm.addEventListener("click", confirmShop);

  elShopModal.addEventListener("cancel", (e) => {
    e.preventDefault();
    elShopModal.close();
  });

  elSpinCost.textContent = `−${SPIN_COST} tok`;

  buildPaytable();
  mountReels();
  setBalanceDisplay();
  elStatus.textContent = randomIdle();

  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue !== null) {
      const n = Number.parseInt(e.newValue, 10);
      if (Number.isFinite(n) && n >= 0) {
        balance = n;
        setBalanceDisplay();
      }
    }
  });
})();
