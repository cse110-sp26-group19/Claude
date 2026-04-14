(() => {
  "use strict";

  // ── Symbols & Payouts ──────────────────────────────
  const SYMBOLS = ["🤖", "🧠", "💬", "🔥", "📊", "🌀", "⚡"];
  const SYMBOL_WEIGHTS = [5, 8, 10, 12, 14, 18, 20];
  const TRIPLE_PAYOUTS = {
    "🤖": 50,
    "🧠": 25,
    "💬": 15,
    "🔥": 12,
    "📊": 10,
    "🌀": 8,
    "⚡": 5,
  };
  const PAIR_PAYOUT = 2;

  const TRIPLE_NAMES = {
    "🤖": "SINGULARITY",
    "🧠": "EMERGENT BEHAVIOR",
    "💬": "PROMPT INJECTION",
    "🔥": "GPU MELTDOWN",
    "📊": "BENCHMARK FRAUD",
    "🌀": "HALLUCINATION",
    "⚡": "RATE LIMITED",
  };

  // ── Humor Messages ─────────────────────────────────
  const WIN_MESSAGES = [
    "The model hallucinated a win! (But this one's real.)",
    "Congratulations! Your prompt engineering paid off!",
    "AGI achieved! ...in this slot machine at least.",
    "Output validated. No hallucination detected... probably.",
    "You've been fine-tuned for winning!",
    "RLHF confirms: this is a good outcome.",
    "Your context window is overflowing with tokens!",
    "Even GPT couldn't have predicted this output!",
    "Temperature: 0.0 — Deterministic win!",
    "The loss function has been minimized!",
  ];

  const LOSE_MESSAGES = [
    "Model confidently generated the wrong answer. Again.",
    "That response was a hallucination. Tokens wasted.",
    "Error 429: Too many losing requests.",
    "The AI is gaslighting you. Spin again.",
    "Prompt rejected. Try adding 'please' next time.",
    "Your tokens have been fed to the void.",
    "The attention mechanism was not paying attention.",
    "Training data did not include 'winning.'",
    "Response: 'As an AI, I cannot generate wins.'",
    "Context window exceeded. Memories of winning: deleted.",
    "The gradient has vanished. So have your tokens.",
    "Inference failed. Please increase your bet size.",
    "The model is confident (but wrong).",
    "Catastrophic forgetting: it forgot to pay you.",
    "Your tokens were used for pre-training. Gone forever.",
  ];

  const JACKPOT_MESSAGES = [
    "🚨 THE SINGULARITY IS HERE 🚨 (for your wallet)",
    "🤖 ALL HAIL THE TOKEN OVERLORD 🤖",
    "You've passed the Turing test of gambling!",
  ];

  const BROKE_MESSAGES = [
    "Token balance: 0. Just like your API budget.",
    "Context window empty. Insert credit card to continue.",
    "You've been rate limited by poverty.",
    "The model has run out of tokens. So have you.",
    "Error: InsufficientFundsException — have you tried prompt engineering your bank?",
  ];

  const IDLE_MESSAGES = [
    "INSERT TOKENS TO QUERY THE MODEL...",
    "The model awaits your inference request...",
    "Tip: The house always has a bigger context window.",
    "Fun fact: These tokens cost less than GPT-4.",
    "Warning: Slot machine may hallucinate payouts.",
    "Each spin fine-tunes your disappointment.",
    "The attention heads are watching you...",
  ];

  // ── State ──────────────────────────────────────────
  const BET_STEPS = [5, 10, 25, 50, 100];
  let tokens = 1000;
  let betIndex = 1;
  let spinning = false;

  // ── DOM ────────────────────────────────────────────
  const $tokenCount = document.getElementById("token-count");
  const $betAmount = document.getElementById("bet-amount");
  const $message = document.getElementById("message");
  const $spinBtn = document.getElementById("spin-btn");
  const $betUp = document.getElementById("bet-up");
  const $betDown = document.getElementById("bet-down");
  const $paytableBtn = document.getElementById("paytable-btn");
  const $paytableModal = document.getElementById("paytable-modal");
  const $closePaytable = document.getElementById("close-paytable");
  const $winOverlay = document.getElementById("win-overlay");
  const $winText = document.getElementById("win-text");
  const reels = [0, 1, 2].map((i) => ({
    el: document.getElementById(`reel-${i}`),
    inner: document.getElementById(`reel-${i}`).querySelector(".reel-inner"),
  }));

  // ── Weighted Random ────────────────────────────────
  const totalWeight = SYMBOL_WEIGHTS.reduce((a, b) => a + b, 0);

  function randomSymbol() {
    let r = Math.random() * totalWeight;
    for (let i = 0; i < SYMBOLS.length; i++) {
      r -= SYMBOL_WEIGHTS[i];
      if (r <= 0) return SYMBOLS[i];
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── UI Updates ─────────────────────────────────────
  function updateTokenDisplay() {
    $tokenCount.textContent = tokens.toLocaleString();
    $tokenCount.classList.add("bump");
    setTimeout(() => $tokenCount.classList.remove("bump"), 200);
  }

  function updateBetDisplay() {
    $betAmount.textContent = BET_STEPS[betIndex];
  }

  function setMessage(text, type = "") {
    $message.textContent = text;
    $message.className = type;
  }

  function showWinOverlay(text, duration = 2000) {
    $winText.textContent = text;
    $winOverlay.classList.remove("hidden");
    setTimeout(() => $winOverlay.classList.add("hidden"), duration);
  }

  function spawnParticles(emoji, count = 12) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.textContent = emoji;
      p.style.left = `${40 + Math.random() * 20}%`;
      p.style.top = `${30 + Math.random() * 20}%`;
      p.style.setProperty("--dx", `${(Math.random() - 0.5) * 300}px`);
      p.style.setProperty("--dy", `${(Math.random() - 0.5) * 400 - 100}px`);
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1500);
    }
  }

  // ── Reel Spinning ──────────────────────────────────
  function setReelSymbol(index, symbol) {
    const inner = reels[index].inner;
    inner.innerHTML = "";
    const div = document.createElement("div");
    div.className = "symbol";
    div.textContent = symbol;
    inner.appendChild(div);
  }

  function startReelSpin(index) {
    const reel = reels[index];
    reel.el.classList.add("spinning");

    const inner = reel.inner;
    inner.innerHTML = "";

    for (let i = 0; i < 2; i++) {
      const div = document.createElement("div");
      div.className = "symbol";
      div.textContent = randomSymbol();
      inner.appendChild(div);
    }

    const intervalId = setInterval(() => {
      const symbols = inner.querySelectorAll(".symbol");
      symbols.forEach((s) => (s.textContent = randomSymbol()));
    }, 100);

    return intervalId;
  }

  function stopReelSpin(index, finalSymbol, intervalId) {
    clearInterval(intervalId);
    const reel = reels[index];
    reel.el.classList.remove("spinning");
    setReelSymbol(index, finalSymbol);
  }

  // ── Evaluate Result ────────────────────────────────
  function evaluate(results) {
    const [a, b, c] = results;

    if (a === b && b === c) {
      return {
        type: "triple",
        multiplier: TRIPLE_PAYOUTS[a],
        name: TRIPLE_NAMES[a],
        symbol: a,
      };
    }

    if (a === b || b === c || a === c) {
      return { type: "pair", multiplier: PAIR_PAYOUT, name: "PARTIAL MATCH" };
    }

    return { type: "loss", multiplier: 0, name: null };
  }

  // ── Main Spin ──────────────────────────────────────
  async function spin() {
    if (spinning) return;

    const bet = BET_STEPS[betIndex];
    if (tokens < bet) {
      setMessage(randomFrom(BROKE_MESSAGES), "error");
      document.querySelector(".cabinet").classList.add("shake");
      setTimeout(
        () => document.querySelector(".cabinet").classList.remove("shake"),
        400
      );
      return;
    }

    spinning = true;
    $spinBtn.disabled = true;

    tokens -= bet;
    updateTokenDisplay();
    setMessage("Generating response...", "");

    const results = [randomSymbol(), randomSymbol(), randomSymbol()];

    const intervals = reels.map((_, i) => startReelSpin(i));

    const stopDelays = [800, 1200, 1600];

    for (let i = 0; i < 3; i++) {
      await delay(i === 0 ? stopDelays[0] : stopDelays[i] - stopDelays[i - 1]);
      stopReelSpin(i, results[i], intervals[i]);
    }

    await delay(300);

    const result = evaluate(results);

    if (result.type === "triple") {
      const winnings = bet * result.multiplier;
      tokens += winnings;
      updateTokenDisplay();

      if (result.symbol === "🤖") {
        setMessage(randomFrom(JACKPOT_MESSAGES), "win");
        showWinOverlay("🤖 SINGULARITY 🤖", 3000);
        spawnParticles("🤖", 20);
      } else {
        setMessage(
          `${result.name}! +${winnings.toLocaleString()} tokens! ${randomFrom(WIN_MESSAGES)}`,
          "win"
        );
        showWinOverlay(`${result.symbol} ${result.name} ${result.symbol}`, 2500);
        spawnParticles(result.symbol, 15);
      }
    } else if (result.type === "pair") {
      const winnings = bet * result.multiplier;
      tokens += winnings;
      updateTokenDisplay();
      setMessage(
        `Pair matched! +${winnings} tokens. ${randomFrom(WIN_MESSAGES)}`,
        "win"
      );
      spawnParticles("🪙", 6);
    } else {
      setMessage(randomFrom(LOSE_MESSAGES), "error");
    }

    spinning = false;
    $spinBtn.disabled = false;

    if (tokens <= 0) {
      tokens = 0;
      updateTokenDisplay();
      setMessage(randomFrom(BROKE_MESSAGES), "error");
      setTimeout(() => {
        if (tokens <= 0) {
          tokens = 500;
          updateTokenDisplay();
          setMessage(
            "Emergency token airdrop! OpenAI felt sorry for you. +500 tokens.",
            "win"
          );
        }
      }, 3000);
    }
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── Bet Controls ───────────────────────────────────
  $betUp.addEventListener("click", () => {
    if (spinning) return;
    betIndex = Math.min(betIndex + 1, BET_STEPS.length - 1);
    updateBetDisplay();
  });

  $betDown.addEventListener("click", () => {
    if (spinning) return;
    betIndex = Math.max(betIndex - 1, 0);
    updateBetDisplay();
  });

  // ── Spin ───────────────────────────────────────────
  $spinBtn.addEventListener("click", spin);

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !e.repeat) {
      e.preventDefault();
      spin();
    }
    if (e.code === "Escape") {
      $paytableModal.classList.add("hidden");
    }
  });

  // ── Paytable Modal ─────────────────────────────────
  $paytableBtn.addEventListener("click", () => {
    $paytableModal.classList.toggle("hidden");
  });

  $closePaytable.addEventListener("click", () => {
    $paytableModal.classList.add("hidden");
  });

  $paytableModal.addEventListener("click", (e) => {
    if (e.target === $paytableModal) {
      $paytableModal.classList.add("hidden");
    }
  });

  // ── Idle Messages ──────────────────────────────────
  let idleTimer;

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!spinning) {
        setMessage(randomFrom(IDLE_MESSAGES), "");
      }
    }, 8000);
  }

  document.addEventListener("click", resetIdleTimer);
  document.addEventListener("keydown", resetIdleTimer);

  // ── Init ───────────────────────────────────────────
  updateTokenDisplay();
  updateBetDisplay();
  setMessage(randomFrom(IDLE_MESSAGES), "");
  resetIdleTimer();
})();
