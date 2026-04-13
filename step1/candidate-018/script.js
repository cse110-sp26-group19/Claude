(() => {
  "use strict";

  const SYMBOLS = [
    { emoji: "🤖", name: "Robot", weight: 8 },
    { emoji: "🧠", name: "Brain", weight: 8 },
    { emoji: "🚀", name: "Rocket", weight: 7 },
    { emoji: "💰", name: "VC Money", weight: 6 },
    { emoji: "🦄", name: "Unicorn", weight: 4 },
    { emoji: "📈", name: "Hockey Stick", weight: 5 },
    { emoji: "🔥", name: "Hot Take", weight: 7 },
    { emoji: "⚡", name: "Disruption", weight: 6 },
    { emoji: "🎯", name: "Product-Market Fit", weight: 3 },
    { emoji: "👁️", name: "AGI Eye", weight: 2 },
  ];

  const PAYOUTS = {
    triple: {
      "👁️": { multiplier: 50, label: "AGI Achieved" },
      "🎯": { multiplier: 30, label: "Product-Market Fit Found" },
      "🦄": { multiplier: 20, label: "Unicorn Status" },
      "💰": { multiplier: 15, label: "Series Z Funded" },
      "⚡": { multiplier: 12, label: "Total Disruption" },
      "📈": { multiplier: 10, label: "Hockey Stick Growth" },
      "🚀": { multiplier: 8, label: "To The Moon" },
      "🔥": { multiplier: 6, label: "Viral Tweet" },
      "🧠": { multiplier: 5, label: "Neural Network Aligned" },
      "🤖": { multiplier: 4, label: "Bot Army Deployed" },
    },
    double: 2,
  };

  const WIN_MESSAGES = [
    "Our AI predicted this win! (It predicts every spin is a win, but still.)",
    "Congratulations! Your prompt engineering skills are paying off!",
    'The model has hallucinated some tokens into your account. Somehow they\'re real.',
    "🎉 Your fine-tuning is complete! You've unlocked additional tokens.",
    "The board is thrilled with these Q3 results.",
    "Incredible ROI! We're adding this to the investor deck.",
    "You've achieved token-market fit!",
    "This is what we in the industry call 'emergent gambling behavior.'",
    "Our LLM confidently predicted you'd win. For once, it was right.",
    "Synergy detected! Your tokens are scaling horizontally.",
  ];

  const LOSE_MESSAGES = [
    "The model is still training. Your tokens were used as training data.",
    "Your tokens have been deprecated. No migration path available.",
    "That spin was a hallucination. The tokens were never real.",
    "Our AI analyzed 10 billion data points and still couldn't help you win.",
    "Think of it as a learning rate adjustment for your wallet.",
    "Your tokens pivoted to a better opportunity (someone else's account).",
    "This is just the cost of doing business in the attention economy.",
    "The AI said you'd win. The AI was confabulating again.",
    "Don't worry, we'll make it up in volume.",
    "Your tokens were sacrificed to reduce the loss function.",
    "Looks like your prompt needed more 'please' and 'thank you.'",
    "The transformer attention mechanism was not paying attention to your bet.",
    "We're calling this a 'strategic token reallocation.'",
    "Your inference request timed out (along with your money).",
    "The model is experiencing 'creative differences' with your wallet.",
  ];

  const JACKPOT_MESSAGES = [
    "🚨 CRITICAL: You've broken the model! Tokens are hallucinating themselves!",
    "🦄 UNICORN EVENT: VCs are fighting to give you more tokens!",
    "🏆 You've achieved what no AI startup has: actual profit!",
    "💎 The singularity is here, and it's paying out!",
    "🎰 ERROR 200: Unexpected success. Engineering team has been notified.",
  ];

  const NEAR_MISS_MESSAGES = [
    "So close! Our AI is 97.3% confident the next spin will be different (it's always 97.3% confident).",
    "Almost! Just needs one more epoch of training (spins).",
    "Two out of three! The model is converging, keep iterating!",
    "Near miss detected. Adjusting hyperparameters (your expectations).",
    "That's what we call a partial inference. Try scaling up your bet.",
  ];

  const STARTUP_NAMES = [
    "SlotGPT", "GamblAI", "LuckChain.io", "BetFormer", "SpinDiffusion",
    "ReelNeural", "JackpotLLM", "Y Combinator of Gambling", "Slot-as-a-Service",
    "DeepSpin AI", "TokenBurn Labs", "Prompt & Pray Inc.", "HalluciSlots",
    "Inference Casino", "Overfitted Bets", "GradientDescent Gaming",
  ];

  let tokens = 1000;
  let currentBet = 25;
  let isSpinning = false;
  let spinCount = 0;
  let totalWon = 0;
  let totalLost = 0;
  const historyEntries = [];

  const $tokenCount = document.getElementById("token-count");
  const $burnRate = document.getElementById("burn-rate");
  const $runway = document.getElementById("runway");
  const $spinBtn = document.getElementById("spin-btn");
  const $message = document.getElementById("message");
  const $messageArea = document.getElementById("message-area");
  const $historyList = document.getElementById("history-list");
  const $paytableGrid = document.getElementById("paytable-grid");
  const $bankruptOverlay = document.getElementById("bankrupt-overlay");
  const $pivotBtn = document.getElementById("pivot-btn");
  const $shutdownBtn = document.getElementById("shutdown-btn");
  const $tempSlider = document.getElementById("temperature");
  const $tempValue = document.getElementById("temp-value");
  const betButtons = document.querySelectorAll(".bet-btn");
  const reels = [
    document.getElementById("reel-0"),
    document.getElementById("reel-1"),
    document.getElementById("reel-2"),
  ];

  function init() {
    buildPaytable();
    bindEvents();
    updateDisplay();
  }

  function bindEvents() {
    $spinBtn.addEventListener("click", spin);
    betButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (isSpinning) return;
        currentBet = parseInt(btn.dataset.bet, 10);
        betButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
    $pivotBtn.addEventListener("click", () => restartGame("pivot"));
    $shutdownBtn.addEventListener("click", () => restartGame("blog"));
    $tempSlider.addEventListener("input", () => {
      $tempValue.textContent = ($tempSlider.value / 100).toFixed(2);
    });

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !isSpinning) {
        e.preventDefault();
        spin();
      }
    });
  }

  function weightedRandom() {
    const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let r = Math.random() * totalWeight;
    for (const sym of SYMBOLS) {
      r -= sym.weight;
      if (r <= 0) return sym;
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  function spin() {
    if (isSpinning) return;
    if (tokens < currentBet) {
      showBankrupt();
      return;
    }

    isSpinning = true;
    spinCount++;
    tokens -= currentBet;
    totalLost += currentBet;
    updateDisplay();
    $spinBtn.disabled = true;
    $messageArea.className = "message-area";

    const loadingMessages = [
      "Running inference...",
      "Consulting the neural oracle...",
      "Burning compute cycles...",
      "Asking GPT-7 for permission...",
      "Aligning model weights...",
      "Tokenizing your hopes and dreams...",
      "Performing gradient descent on your wallet...",
    ];
    $message.textContent = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

    const results = [weightedRandom(), weightedRandom(), weightedRandom()];

    reels.forEach((reel) => {
      reel.classList.add("spinning");
      const inner = reel.querySelector(".reel-inner");
      randomizeSpinningSymbols(inner);
    });

    reels.forEach((reel, i) => {
      const delay = 600 + i * 400 + Math.random() * 200;
      setTimeout(() => stopReel(reel, results[i], i === reels.length - 1 ? () => resolveResults(results) : null), delay);
    });
  }

  function randomizeSpinningSymbols(inner) {
    const interval = setInterval(() => {
      if (!inner.closest(".spinning")) {
        clearInterval(interval);
        return;
      }
      inner.querySelector(".symbol").textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].emoji;
    }, 80);
    inner._spinInterval = interval;
  }

  function stopReel(reel, result, onDone) {
    clearInterval(reel.querySelector(".reel-inner")._spinInterval);
    reel.classList.remove("spinning");
    reel.classList.add("landing");
    const symbol = reel.querySelector(".symbol");
    symbol.textContent = result.emoji;

    setTimeout(() => reel.classList.remove("landing"), 300);
    if (onDone) setTimeout(onDone, 350);
  }

  function resolveResults(results) {
    isSpinning = false;
    $spinBtn.disabled = false;

    const emojis = results.map((r) => r.emoji);
    const [a, b, c] = emojis;
    let winAmount = 0;
    let messageText = "";
    let resultClass = "lose";

    if (a === b && b === c) {
      const tripleInfo = PAYOUTS.triple[a];
      if (tripleInfo) {
        winAmount = currentBet * tripleInfo.multiplier;
        if (tripleInfo.multiplier >= 20) {
          messageText = pick(JACKPOT_MESSAGES) + ` ${tripleInfo.label}! +${winAmount} tokens!`;
          resultClass = "jackpot";
          spawnParticles(a, 15);
        } else {
          messageText = pick(WIN_MESSAGES) + ` ${tripleInfo.label}! +${winAmount} tokens!`;
          resultClass = "win";
          spawnParticles(a, 8);
        }
      }
    } else if (a === b || b === c || a === c) {
      const matchedSymbol = a === b ? a : c;
      if (a === b && a === c) {
        // already handled
      } else {
        winAmount = currentBet * PAYOUTS.double;
        messageText = pick(NEAR_MISS_MESSAGES) + ` Partial match: +${winAmount} tokens.`;
        resultClass = "win";
      }
    }

    if (winAmount === 0) {
      messageText = pick(LOSE_MESSAGES);
      resultClass = "lose";
    }

    if (winAmount > 0) {
      tokens += winAmount;
      totalWon += winAmount;
    }

    $messageArea.className = "message-area " + resultClass;
    $message.innerHTML = messageText;
    updateDisplay();
    addHistory(emojis, winAmount);

    if (tokens <= 0) {
      setTimeout(showBankrupt, 800);
    }
  }

  function addHistory(emojis, winAmount) {
    const entry = { emojis, winAmount, bet: currentBet, spin: spinCount };
    historyEntries.unshift(entry);
    if (historyEntries.length > 50) historyEntries.pop();

    const el = document.createElement("div");
    el.className = "history-entry";
    const sign = winAmount > 0 ? "+" : "";
    const net = winAmount - currentBet;
    const resultClass = net >= 0 ? "win" : "lose";
    el.innerHTML = `
      <span class="he-spin">#${entry.spin}</span>
      <span class="he-symbols">${emojis.join("")}</span>
      <span class="he-result ${resultClass}">${sign}${net} 🪙</span>
    `;
    $historyList.prepend(el);

    while ($historyList.children.length > 20) {
      $historyList.removeChild($historyList.lastChild);
    }
  }

  function updateDisplay() {
    $tokenCount.textContent = tokens.toLocaleString();
    $tokenCount.classList.remove("token-pop");
    void $tokenCount.offsetWidth;
    $tokenCount.classList.add("token-pop");

    const avgBurn = spinCount > 0 ? Math.round(totalLost / spinCount) * 12 : 0;
    $burnRate.textContent = avgBurn > 0 ? avgBurn.toLocaleString() : "∞";

    if (tokens > 0 && avgBurn > 0) {
      const mins = Math.max(1, Math.round((tokens / avgBurn) * 60));
      $runway.textContent = `~${mins} min`;
    } else if (tokens > 0) {
      $runway.textContent = "~5 min";
    } else {
      $runway.textContent = "☠️ 0";
    }

    const tokenSub = document.querySelector(".token-balance .stat-sub");
    if (tokenSub) {
      const gptQuestions = Math.max(0, Math.floor(tokens / 300));
      const snarkyComparisons = [
        `≈ ${gptQuestions} ChatGPT questions`,
        `≈ ${Math.floor(tokens / 50)} Midjourney pixels`,
        `≈ ${Math.floor(tokens / 10)} GitHub Copilot suggestions`,
        `≈ ${(tokens / 1000000).toFixed(6)} of OpenAI's daily revenue`,
      ];
      tokenSub.textContent = `( ${pick(snarkyComparisons)} )`;
    }
  }

  function buildPaytable() {
    const items = Object.entries(PAYOUTS.triple)
      .sort((a, b) => b[1].multiplier - a[1].multiplier)
      .map(([emoji, info]) => {
        const el = document.createElement("div");
        el.className = "paytable-item";
        el.innerHTML = `
          <div>
            <span class="pt-symbols">${emoji}${emoji}${emoji}</span>
            <span class="pt-label">${info.label}</span>
          </div>
          <span class="pt-payout">${info.multiplier}x</span>
        `;
        return el;
      });

    const doubleEl = document.createElement("div");
    doubleEl.className = "paytable-item";
    doubleEl.innerHTML = `
      <div>
        <span class="pt-symbols">🔀 Any Pair</span>
        <span class="pt-label">Partial Convergence</span>
      </div>
      <span class="pt-payout">${PAYOUTS.double}x</span>
    `;
    items.push(doubleEl);

    items.forEach((el) => $paytableGrid.appendChild(el));
  }

  function showBankrupt() {
    $bankruptOverlay.classList.add("visible");
  }

  function restartGame(mode) {
    $bankruptOverlay.classList.remove("visible");
    tokens = 1000;
    spinCount = 0;
    totalWon = 0;
    totalLost = 0;
    historyEntries.length = 0;
    $historyList.innerHTML = "";
    $messageArea.className = "message-area";

    if (mode === "pivot") {
      const name = pick(STARTUP_NAMES);
      $message.textContent = `${name} has raised a $1B Series A from "investors" (your parents). Let's disrupt gambling again!`;
    } else {
      $message.textContent = `"What I Learned From Losing ${spinCount || "All My"} Spins at an AI Slot Machine" — posted to Medium. 3 claps. Starting over.`;
    }

    updateDisplay();
  }

  function spawnParticles(emoji, count) {
    const area = document.querySelector(".slot-machine").getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.textContent = emoji;
      p.style.left = area.left + Math.random() * area.width + "px";
      p.style.top = area.top + Math.random() * area.height + "px";
      p.style.animationDelay = Math.random() * 0.4 + "s";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  init();
})();
