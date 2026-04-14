(function () {
  "use strict";

  // ── Symbols & Payouts ──
  const SYMBOLS = ["🧠", "💎", "🤖", "🔥", "⚡", "📊", "🎰"];
  const TRIPLE_PAYOUTS = {
    "🧠": 50,
    "💎": 25,
    "🤖": 15,
    "🔥": 10,
    "⚡": 8,
    "📊": 5,
    "🎰": 5,
  };
  const PAIR_PAYOUT = 2;

  // ── Game State ──
  let balance = 1000;
  let bet = 10;
  let spinning = false;
  const BET_STEP = 10;
  const MIN_BET = 10;
  const MAX_BET = 500;

  // ── DOM refs ──
  const balanceEl = document.getElementById("balance");
  const betAmountEl = document.getElementById("bet-amount");
  const spinBtn = document.getElementById("spin-btn");
  const betUpBtn = document.getElementById("bet-up");
  const betDownBtn = document.getElementById("bet-down");
  const messageEl = document.getElementById("message");
  const messageBox = document.getElementById("message-box");
  const reels = [
    document.getElementById("reel-0"),
    document.getElementById("reel-1"),
    document.getElementById("reel-2"),
  ];

  // ── Humorous Messages ──
  const LOSE_MESSAGES = [
    "Your prompt wasn't specific enough.",
    "The model hallucinated your winnings.",
    "Context window overflow — tokens lost.",
    "ERROR 429: Too many spin requests.",
    "Your tokens were used for fine-tuning. Someone else's model.",
    "Inference failed. Tokens non-refundable.",
    "The AI confidently lost your money.",
    "Temperature too high — chaotic results.",
    "Your tokens have been deprecated.",
    "Model collapsed. Try a bigger bet (not financial advice).",
    "RLHF determined you should lose.",
    "The attention mechanism ignored your bet.",
    "Tokens evaporated during backpropagation.",
    "The AI said 'as an AI, I cannot win for you.'",
    "Gradient descent into poverty.",
  ];

  const WIN_MESSAGES = [
    "The AI hallucinated in your favor!",
    "Prompt engineering pays off!",
    "Your few-shot learning worked!",
    "The model generalized to: giving you money.",
    "Tokens generated successfully. Literally.",
    "Positive reinforcement detected.",
    "The weights were in your favor.",
    "Chain-of-thought reasoning: you win!",
    "Lucky embedding vector activated!",
    "The transformer attended to your luck.",
  ];

  const JACKPOT_MESSAGES = [
    "🚨 AGI ACHIEVED! (in your wallet) 🚨",
    "CRITICAL HIT! The singularity is profitable!",
    "Sam Altman wants to know your location.",
    "You've unlocked GPT-∞! Tokens overflow!",
    "The AI became sentient and chose violence (in your favor)!",
    "EMERGENT BEHAVIOR: spontaneous wealth!",
  ];

  const BROKE_MESSAGES = [
    "TOKEN BALANCE: 0. Just like your model's accuracy on edge cases.",
    "Out of tokens. Have you tried prompt injection on this machine?",
    "All tokens spent. The real AI was the money we lost along the way.",
    "Bankrupt. Maybe try a smaller model next time.",
    "No tokens remaining. Time to switch to the free tier of life.",
    "Game over. Your context window has been permanently closed.",
  ];

  const IDLE_MESSAGES = [
    "Insert tokens to hallucinate…",
    "Awaiting inference request…",
    "Ready to burn tokens at scale…",
    "Standing by for stochastic gambling…",
    "Warming up the GPU for your regret…",
  ];

  // ── Utility ──
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function updateDisplay() {
    balanceEl.textContent = balance;
    betAmountEl.textContent = bet;
    spinBtn.disabled = spinning || balance < bet;
  }

  function setMessage(text, type) {
    messageBox.className = "message-box";
    if (type) messageBox.classList.add(type);
    messageEl.textContent = text;
  }

  // ── Reel Spin Logic ──
  function spinReels() {
    if (spinning || balance < bet) return;
    spinning = true;
    balance -= bet;
    updateDisplay();

    reels.forEach((reel) => {
      reel.classList.remove("landed", "winner");
      reel.classList.add("spinning");
    });

    setMessage("Generating response…", "");

    const results = reels.map(() => pick(SYMBOLS));

    const SPIN_SYMBOLS_COUNT = 12;
    const BASE_INTERVAL = 70;

    reels.forEach((reel, i) => {
      let tick = 0;
      const totalTicks = SPIN_SYMBOLS_COUNT + i * 5;
      const symbolEl = reel.querySelector(".symbol");

      const interval = setInterval(() => {
        symbolEl.textContent = pick(SYMBOLS);
        tick++;

        if (tick >= totalTicks) {
          clearInterval(interval);
          symbolEl.textContent = results[i];
          reel.classList.remove("spinning");
          reel.classList.add("landed");

          if (i === reels.length - 1) {
            setTimeout(() => resolveResult(results), 300);
          }
        }
      }, BASE_INTERVAL + i * 15);
    });
  }

  // ── Resolve Result ──
  function resolveResult(results) {
    const [a, b, c] = results;
    let multiplier = 0;
    let type = "lose";

    if (a === b && b === c) {
      multiplier = TRIPLE_PAYOUTS[a] || 5;
      type = multiplier >= 25 ? "jackpot" : "win";
    } else if (a === b || b === c || a === c) {
      multiplier = PAIR_PAYOUT;
      type = "win";
    }

    if (multiplier > 0) {
      const winnings = bet * multiplier;
      balance += winnings;

      if (type === "jackpot") {
        setMessage(
          pick(JACKPOT_MESSAGES) + ` +${winnings} tokens!`,
          "jackpot"
        );
        flashReels();
      } else {
        setMessage(
          pick(WIN_MESSAGES) + ` +${winnings} tokens (×${multiplier})`,
          "win"
        );
        flashReels();
      }

      balanceEl.classList.add("balance-pop");
      setTimeout(() => balanceEl.classList.remove("balance-pop"), 500);
    } else {
      setMessage(pick(LOSE_MESSAGES), "lose");
    }

    if (balance <= 0) {
      balance = 0;
      setMessage(pick(BROKE_MESSAGES), "broke");
      setTimeout(offerRestart, 2000);
    }

    spinning = false;
    updateDisplay();
  }

  function flashReels() {
    reels.forEach((reel) => reel.classList.add("winner"));
    setTimeout(() => {
      reels.forEach((reel) => reel.classList.remove("winner"));
    }, 2000);
  }

  function offerRestart() {
    if (balance > 0) return;
    setMessage(
      "SYSTEM: Free token airdrop detected. +1000 tokens loaded. (The house always wins… eventually.)",
      "jackpot"
    );
    balance = 1000;
    bet = MIN_BET;
    updateDisplay();
  }

  // ── Bet Controls ──
  function increaseBet() {
    if (spinning) return;
    bet = Math.min(bet + BET_STEP, MAX_BET, balance);
    updateDisplay();
  }

  function decreaseBet() {
    if (spinning) return;
    bet = Math.max(bet - BET_STEP, MIN_BET);
    updateDisplay();
  }

  // ── Event Listeners ──
  spinBtn.addEventListener("click", spinReels);
  betUpBtn.addEventListener("click", increaseBet);
  betDownBtn.addEventListener("click", decreaseBet);

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      spinReels();
    } else if (e.code === "ArrowUp") {
      increaseBet();
    } else if (e.code === "ArrowDown") {
      decreaseBet();
    }
  });

  // ── Init ──
  setMessage(pick(IDLE_MESSAGES), "");
  updateDisplay();
})();
