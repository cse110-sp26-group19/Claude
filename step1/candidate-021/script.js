(() => {
  "use strict";

  /* ── Symbol Definitions ────────────────────────────────────────── */

  const SYMBOLS = [
    { emoji: "🤖", name: "Robot",        weight: 18 },
    { emoji: "🧠", name: "Brain",        weight: 16 },
    { emoji: "💬", name: "Prompt",       weight: 16 },
    { emoji: "🔥", name: "GPU Fire",     weight: 14 },
    { emoji: "👁️", name: "AGI Eye",      weight: 10 },
    { emoji: "💎", name: "Token Gem",    weight: 8  },
    { emoji: "🎰", name: "Jackpot",      weight: 5  },
    { emoji: "🌀", name: "Hallucination", weight: 13 },
  ];

  const PAYOUTS = {
    "🎰🎰🎰": { mult: 50,  label: "THE SINGULARITY" },
    "💎💎💎": { mult: 25,  label: "VENTURE CAPITAL" },
    "👁️👁️👁️": { mult: 20,  label: "AGI ACHIEVED" },
    "🔥🔥🔥": { mult: 15,  label: "GPU MELTDOWN" },
    "🧠🧠🧠": { mult: 10,  label: "NEURAL NETWORK" },
    "💬💬💬": { mult: 8,   label: "PROMPT INJECTION" },
    "🤖🤖🤖": { mult: 6,   label: "BOT ARMY" },
    "🌀🌀🌀": { mult: 4,   label: "FULL HALLUCINATION" },
  };

  const TWO_MATCH_MULT = 2;

  /* ── Humorous Messages ─────────────────────────────────────────── */

  const WIN_MESSAGES = [
    "Your prompt engineering finally paid off!",
    "The model didn't hallucinate this time — you actually won!",
    "Congratulations! This win was NOT a hallucination. Probably.",
    "You've been fine-tuned for success!",
    "Even GPT couldn't have predicted this outcome!",
    "Your context window is overflowing with tokens!",
    "The transformer attention mechanism favors you today!",
    "You've achieved alignment... with the payout table!",
    "Training complete. Reward signal: POSITIVE.",
    "The loss function smiles upon you!",
    "This is what peak prompt performance looks like.",
    "Your tokens have been... UN-burned?!",
  ];

  const LOSE_MESSAGES = [
    "Tokens burned. Just like your API bill at 3 AM.",
    "The model hallucinated your winnings. They don't exist.",
    "Error 402: Insufficient luck. Please add more tokens.",
    "Your prompt was rejected by the payout model.",
    "That spin had the same energy as 'please do my homework' prompts.",
    "Catastrophic forgetting: the machine forgot to pay you.",
    "The attention heads were NOT paying attention to your bet.",
    "RLHF says that was not a helpful spin.",
    "Training data suggests you should try again. And again. And again.",
    "The machine learning model learned... that you lose.",
    "Your tokens vanished faster than ethics in an AI startup.",
    "Context window exceeded. Winnings truncated to zero.",
    "Overfitting to bad luck detected.",
    "The model confidently predicted your loss. It was right.",
    "Inference cost: your dignity + those tokens.",
    "Have you tried adding 'please' to your spin?",
    "Garbage in, garbage out. You put in tokens, you got nothing.",
  ];

  const JACKPOT_MESSAGES = [
    "HOLY PARAMETERS! You broke the reward model!",
    "Sam Altman wants to know your location.",
    "You've exceeded the token limit... in a GOOD way!",
    "The singularity is here, and it's paying out!",
    "OpenAI board emergency meeting called — someone is winning too much.",
    "This payout required more compute than GPT-5's training run.",
  ];

  const BROKE_MESSAGES = [
    "Balance: 0. Just like the accuracy of most AI benchmarks.",
    "You've run out of tokens. Time to write a grant proposal.",
    "Game over. Your token budget has been depleted, much like a free-tier API key.",
    "All tokens burned. Your context window is now empty.",
    "Bankrupt. Even an AI couldn't optimize its way out of this.",
    "Zero tokens remaining. Have you considered prompt engineering as a career change?",
  ];

  /* ── Game State ─────────────────────────────────────────────────── */

  const BET_STEPS = [5, 10, 25, 50, 100, 250, 500];

  const state = {
    balance: 1000,
    betIndex: 1,
    spinning: false,
    totalSpins: 0,
    totalBurned: 0,
    totalWins: 0,
    biggestWin: 0,
  };

  /* ── DOM Refs ───────────────────────────────────────────────────── */

  const $balance   = document.getElementById("balance");
  const $betAmount = document.getElementById("bet-amount");
  const $betUp     = document.getElementById("bet-up");
  const $betDown   = document.getElementById("bet-down");
  const $spinBtn   = document.getElementById("spin-btn");
  const $message   = document.getElementById("message");
  const $msgBoard  = document.getElementById("message-board");
  const $reels     = [0, 1, 2].map(i => document.getElementById(`reel-${i}`));
  const $strips    = $reels.map(r => r.querySelector(".reel-strip"));
  const $frame     = document.querySelector(".machine-frame");
  const $overlay   = document.getElementById("win-overlay");
  const $winTitle  = document.getElementById("win-title");
  const $winAmount = document.getElementById("win-amount");
  const $winJoke   = document.getElementById("win-joke");
  const $winDismiss = document.getElementById("win-dismiss");
  const $payoutGrid = document.getElementById("payout-grid");
  const $statSpins  = document.getElementById("stat-spins");
  const $statBurned = document.getElementById("stat-burned");
  const $statBiggest = document.getElementById("stat-biggest");
  const $statWinrate = document.getElementById("stat-winrate");

  /* ── Utility ────────────────────────────────────────────────────── */

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function weightedPick() {
    const total = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
    let r = Math.random() * total;
    for (const sym of SYMBOLS) {
      r -= sym.weight;
      if (r <= 0) return sym;
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  /* ── Build Payout Table ─────────────────────────────────────────── */

  function buildPayoutTable() {
    const entries = Object.entries(PAYOUTS).sort((a, b) => b[1].mult - a[1].mult);
    for (const [key, val] of entries) {
      const symbols = [...key].filter(c => c.trim() && c !== "\uFE0F");
      const row = document.createElement("div");
      row.className = "payout-row";

      const symSpan = document.createElement("span");
      symSpan.className = "payout-symbols";
      symSpan.textContent = symbols.slice(0, 3).join("");

      const multSpan = document.createElement("span");
      multSpan.className = "payout-mult";
      multSpan.textContent = `×${val.mult}`;

      row.appendChild(symSpan);
      row.appendChild(multSpan);
      $payoutGrid.appendChild(row);
    }

    const anyTwo = document.createElement("div");
    anyTwo.className = "payout-row";
    anyTwo.innerHTML = `<span class="payout-symbols">?? = match</span><span class="payout-mult">×${TWO_MATCH_MULT}</span>`;
    $payoutGrid.appendChild(anyTwo);
  }

  /* ── Reel Building ──────────────────────────────────────────────── */

  function createSymbolEl(emoji) {
    const div = document.createElement("div");
    div.className = "symbol";
    div.textContent = emoji;
    return div;
  }

  function populateReel(strip, count) {
    strip.innerHTML = "";
    const symbols = [];
    for (let i = 0; i < count; i++) {
      const sym = weightedPick();
      symbols.push(sym.emoji);
      strip.appendChild(createSymbolEl(sym.emoji));
    }
    return symbols;
  }

  /* ── Display Updates ────────────────────────────────────────────── */

  function updateDisplay() {
    $balance.textContent = state.balance;
    $betAmount.textContent = BET_STEPS[state.betIndex];
    $statSpins.textContent = state.totalSpins;
    $statBurned.textContent = state.totalBurned;
    $statBiggest.textContent = state.biggestWin;
    $statWinrate.textContent = state.totalSpins
      ? Math.round((state.totalWins / state.totalSpins) * 100) + "%"
      : "0%";
  }

  function bumpBalance() {
    $balance.classList.add("bump");
    setTimeout(() => $balance.classList.remove("bump"), 200);
  }

  function setMessage(text, type) {
    $message.textContent = text;
    $msgBoard.classList.remove("win", "lose");
    if (type) $msgBoard.classList.add(type);
  }

  /* ── Spin Logic ─────────────────────────────────────────────────── */

  const SPIN_SYMBOLS_COUNT = 30;
  const BASE_SPIN_MS       = 1200;
  const REEL_DELAY_MS      = 400;

  function getReelHeight(reelIndex) {
    return $reels[reelIndex].offsetHeight;
  }

  function animateReel(reelIndex, finalEmoji) {
    return new Promise(resolve => {
      const strip = $strips[reelIndex];
      const height = getReelHeight(reelIndex);
      const symbols = populateReel(strip, SPIN_SYMBOLS_COUNT);

      symbols[symbols.length - 1] = finalEmoji;
      strip.lastElementChild.textContent = finalEmoji;

      const totalHeight = height * SPIN_SYMBOLS_COUNT;
      const finalOffset = -(totalHeight - height);

      strip.style.transition = "none";
      strip.style.transform = "translateY(0)";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const duration = BASE_SPIN_MS + reelIndex * REEL_DELAY_MS;
          strip.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.8, 0.3, 1)`;
          strip.style.transform = `translateY(${finalOffset}px)`;

          setTimeout(() => resolve(), duration);
        });
      });
    });
  }

  async function spin() {
    const bet = BET_STEPS[state.betIndex];
    if (state.spinning) return;
    if (state.balance < bet) {
      setMessage(pick(BROKE_MESSAGES), "lose");
      return;
    }

    state.spinning = true;
    state.balance -= bet;
    state.totalBurned += bet;
    state.totalSpins++;
    $spinBtn.disabled = true;
    $frame.classList.remove("winning");
    $reels.forEach(r => r.classList.remove("stopped-win"));
    updateDisplay();

    const results = [weightedPick(), weightedPick(), weightedPick()];
    const emojis = results.map(r => r.emoji);

    await Promise.all(
      emojis.map((emoji, i) => animateReel(i, emoji))
    );

    const key = emojis.join("");
    const payout = PAYOUTS[key];
    let winAmount = 0;

    if (payout) {
      winAmount = bet * payout.mult;
    } else if (emojis[0] === emojis[1] || emojis[1] === emojis[2] || emojis[0] === emojis[2]) {
      winAmount = bet * TWO_MATCH_MULT;
    }

    if (winAmount > 0) {
      state.balance += winAmount;
      state.totalWins++;
      if (winAmount > state.biggestWin) state.biggestWin = winAmount;
      bumpBalance();

      if (payout && payout.mult >= 20) {
        showWinOverlay(payout.label, winAmount);
      } else if (payout) {
        setMessage(`${payout.label}! +${winAmount} tokens! ${pick(WIN_MESSAGES)}`, "win");
      } else {
        setMessage(`Two match! +${winAmount} tokens. ${pick(WIN_MESSAGES)}`, "win");
      }

      $frame.classList.add("winning");
      $reels.forEach(r => r.classList.add("stopped-win"));
    } else {
      setMessage(pick(LOSE_MESSAGES), "lose");
    }

    updateDisplay();
    state.spinning = false;
    $spinBtn.disabled = false;

    if (state.balance <= 0) {
      setTimeout(() => {
        setMessage(pick(BROKE_MESSAGES), "lose");
        $spinBtn.disabled = true;
      }, 1500);
    }
  }

  /* ── Win Overlay ────────────────────────────────────────────────── */

  function showWinOverlay(title, amount) {
    $winTitle.textContent = `🏆 ${title} 🏆`;
    $winAmount.textContent = `+${amount} TOKENS`;
    $winJoke.textContent = pick(JACKPOT_MESSAGES);
    $overlay.hidden = false;
    spawnConfetti();
  }

  function hideWinOverlay() {
    $overlay.hidden = true;
  }

  /* ── Confetti ───────────────────────────────────────────────────── */

  function spawnConfetti() {
    const colors = ["#ffd700", "#e74c3c", "#fff", "#b8960c", "#ff6b6b"];
    const container = document.body;
    for (let i = 0; i < 60; i++) {
      const dot = document.createElement("div");
      Object.assign(dot.style, {
        position: "fixed",
        width: "8px",
        height: "8px",
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        background: pick(colors),
        left: Math.random() * 100 + "vw",
        top: "-10px",
        zIndex: "200",
        pointerEvents: "none",
        opacity: "1",
      });
      container.appendChild(dot);

      const duration = 1500 + Math.random() * 2000;
      const xDrift = (Math.random() - 0.5) * 200;
      const rotation = Math.random() * 720;

      dot.animate(
        [
          { transform: "translateY(0) translateX(0) rotate(0deg)", opacity: 1 },
          { transform: `translateY(100vh) translateX(${xDrift}px) rotate(${rotation}deg)`, opacity: 0 },
        ],
        { duration, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", fill: "forwards" }
      );

      setTimeout(() => dot.remove(), duration + 50);
    }
  }

  /* ── Bet Controls ───────────────────────────────────────────────── */

  function betUp() {
    if (state.spinning) return;
    if (state.betIndex < BET_STEPS.length - 1) {
      state.betIndex++;
      updateDisplay();
    }
  }

  function betDown() {
    if (state.spinning) return;
    if (state.betIndex > 0) {
      state.betIndex--;
      updateDisplay();
    }
  }

  /* ── Init ───────────────────────────────────────────────────────── */

  function initReels() {
    $strips.forEach(strip => {
      strip.innerHTML = "";
      const sym = weightedPick();
      strip.appendChild(createSymbolEl(sym.emoji));
    });
  }

  function init() {
    buildPayoutTable();
    initReels();
    updateDisplay();

    $spinBtn.addEventListener("click", spin);
    $betUp.addEventListener("click", betUp);
    $betDown.addEventListener("click", betDown);
    $winDismiss.addEventListener("click", hideWinOverlay);
    $overlay.addEventListener("click", (e) => {
      if (e.target === $overlay) hideWinOverlay();
    });

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !state.spinning) {
        e.preventDefault();
        spin();
      }
    });
  }

  init();
})();
