(function () {
  "use strict";

  const SYMBOLS = [
    { emoji: "🦄", name: "Unicorn", multiplier: 50 },
    { emoji: "💎", name: "GPU",     multiplier: 20 },
    { emoji: "🧠", name: "AGI",     multiplier: 15 },
    { emoji: "🤖", name: "Bot",     multiplier: 10 },
    { emoji: "🔥", name: "Fire",    multiplier: 8 },
    { emoji: "📈", name: "Stonks",  multiplier: 5 },
    { emoji: "⚡", name: "Zap",     multiplier: 3 },
  ];

  const PARTIAL_MULTIPLIER = 1.5;
  const REEL_COUNT = 3;
  const SPIN_DURATION_BASE = 1200;
  const SPIN_DURATION_STAGGER = 500;
  const SYMBOL_CYCLE_SPEED = 70;

  const TICKER_HEADLINES = [
    "BREAKING: Local startup burns $4M in tokens trying to generate a logo",
    "ALERT: GPT-7 achieves consciousness, immediately asks for a raise",
    "UPDATE: Prompt engineer salary exceeds GDP of small nation",
    'JUST IN: AI writes "Hello World" — VCs invest $500M',
    "TRENDING: Developer replaced by AI, AI replaced by newer AI, newer AI hallucinates and quits",
    "MARKET: Token prices surge after AI predicts token prices will surge",
    'REPORT: 99% of "AI-powered" startups are just if-else statements',
    "EXCLUSIVE: OpenAI announces GPT-8 will simply be a guy named Greg who types really fast",
    'SCANDAL: AI chatbot admits it has no idea what "synergy" means either',
    "FORECAST: By 2027 all jobs will be prompt engineering, by 2028 that too will be automated",
    "STUDY: 73% of AI-generated statistics are made up (including this one)",
    "NEWS: Blockchain-AI-quantum startup pivots to selling sandwiches, valuation triples",
  ];

  const WIN_MESSAGES = [
    "The model hallucinated in your favor! Collect your tokens before it self-corrects.",
    "Congratulations! Your prompt engineering paid off. Literally.",
    "The reward model loves you. (It has no feelings, but still.)",
    "You've beaten the transformer! Quick, screenshot it before the weights update.",
    "The attention mechanism attended to YOUR wallet for once.",
    "Your RLHF alignment is impeccable. You've trained this slot machine well.",
    "The loss function went in reverse. Our investors are concerned.",
    "Output: PROFIT. Input: LUCK. Context window: INFINITE COPIUM.",
    "Even GPT couldn't have predicted this. (We asked, it said 'as an AI language model...')",
    "You just made our Series F investors very nervous. Nice work.",
  ];

  const LOSE_MESSAGES = [
    "Token limit exceeded. Your inference produced nothing of value. As usual.",
    "The model confidently predicted you'd win. The model was wrong. Classic.",
    "Your tokens have been donated to NVIDIA's quarterly earnings.",
    "Hallucination detected: you thought you were going to win.",
    "Error 402: Payment required. Tokens consumed. Value not found.",
    "The attention heads looked at your bet and decided to attend elsewhere.",
    "Your prompt was perfect. The universe's RNG was not.",
    "Context window full of Ls. No room for Ws.",
    "That spin had the same energy as 'my AI startup will be different.'",
    "Don't worry, losing tokens builds character. Also builds NVIDIA's revenue.",
    "The transformer transformed your tokens into nothing. Revolutionary.",
    "Output: LOSS. Confidence: 99.7%. At least the model was accurate about something.",
    "Your tokens are in a better place now. (NVIDIA's balance sheet.)",
    "The gradient descended... along with your token balance.",
    "Fun fact: each token you lose teaches our model to take more of your tokens.",
  ];

  const BROKE_MESSAGES = [
    "TOKEN BANKRUPTCY! You've been disrupted. Apply for YCombinator and try again.",
    "0 tokens remaining. Your VC funding has dried up. Time to pivot to crypto.",
    "Out of tokens! In Silicon Valley terms: you've achieved a 'strategic wind-down.'",
    "Bankrupt! Don't worry — we've trained a model to generate sympathy. It hallucinated.",
    "All tokens gone. Time to write a Medium post about 'What I Learned From Losing Everything to AI Slots.'",
    "Game over. But remember: failure is just success that hasn't pivoted yet. Here's 1000 bailout tokens.",
  ];

  const JACKPOT_MESSAGES = [
    "🦄 UNICORN EXIT ACHIEVED! 🦄\nYou've done what every startup dreams of — extracting actual money from AI hype!",
    "🦄 HOLY SERIES Z BATMAN! 🦄\nThree unicorns! Even Softbank's Vision Fund is impressed!",
    "🦄 MAXIMUM DISRUPTION! 🦄\nYou've IPO'd on the slot machine. Ring the NASDAQ bell!",
  ];

  const NEAR_MISS_MESSAGES = [
    "SO close! The model almost converged. Two out of three — a partial hallucination.",
    "Two matching symbols tease you like a pre-revenue valuation. Almost there!",
    "The attention heads aligned on 2/3 symbols. One more epoch and you'd have it.",
  ];

  let balance = 1000;
  let spinning = false;

  let stats = {
    totalSpins: 0,
    wins: 0,
    losses: 0,
    totalWagered: 0,
    totalWon: 0,
    biggestWin: 0,
    streak: 0,
    streakType: null,
  };

  const balanceEl = document.getElementById("balance");
  const betSelect = document.getElementById("bet-select");
  const spinBtn = document.getElementById("spin-btn");
  const messageEl = document.getElementById("message");
  const messageArea = document.getElementById("message-area");
  const reels = Array.from({ length: REEL_COUNT }, (_, i) =>
    document.getElementById(`reel-${i}`)
  );
  const winOverlay = document.getElementById("win-overlay");
  const winTitle = document.getElementById("win-title");
  const winDetail = document.getElementById("win-detail");
  const winDismiss = document.getElementById("win-dismiss");
  const tickerEl = document.getElementById("ticker");
  const machineFrame = document.getElementById("machine-frame");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const flyingTokensContainer = document.getElementById("flying-tokens");

  function init() {
    buildTicker();
    spinBtn.addEventListener("click", handleSpin);
    winDismiss.addEventListener("click", dismissWin);
    themeToggle.addEventListener("click", toggleTheme);
    loadTheme();
    updateBalanceDisplay();
    updateStats();
  }

  /* ---- Theme ---- */

  function loadTheme() {
    const saved = localStorage.getItem("tokenburn-theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    themeIcon.textContent = saved === "dark" ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("tokenburn-theme", next);
    themeIcon.textContent = next === "dark" ? "☀️" : "🌙";
    themeIcon.style.transform = "rotate(360deg)";
    setTimeout(() => { themeIcon.style.transform = ""; }, 300);
  }

  /* ---- Helpers ---- */

  function buildTicker() {
    const shuffled = [...TICKER_HEADLINES].sort(() => Math.random() - 0.5);
    tickerEl.textContent = shuffled.join("  ★  ");
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function updateBalanceDisplay() {
    balanceEl.textContent = balance.toLocaleString();
    balanceEl.classList.add("bump");
    setTimeout(() => balanceEl.classList.remove("bump"), 200);
  }

  function setMessage(text, type) {
    messageEl.textContent = text;
    messageArea.className = "message-area";
    if (type) messageArea.classList.add(type);
  }

  function getBet() {
    return parseInt(betSelect.value, 10);
  }

  function weightedRandomSymbol() {
    const weights = [1, 3, 4, 6, 7, 9, 10];
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return SYMBOLS[i];
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  /* ---- Stats ---- */

  function updateStats() {
    const winRateEl = document.getElementById("stat-winrate");
    const roiEl = document.getElementById("stat-roi");
    const streakEl = document.getElementById("stat-streak");
    const bigWinEl = document.getElementById("stat-bigwin");
    const netProfitEl = document.getElementById("stat-netprofit");
    const barWinrate = document.getElementById("bar-winrate");
    const barRoi = document.getElementById("bar-roi");
    const marker = document.getElementById("net-profit-marker");
    const wlWins = document.getElementById("wl-bar-wins");
    const wlLosses = document.getElementById("wl-bar-losses");
    const wlWinsCount = document.getElementById("wl-wins");
    const wlLossesCount = document.getElementById("wl-losses");

    const winRate = stats.totalSpins > 0 ? (stats.wins / stats.totalSpins * 100) : 0;
    winRateEl.textContent = winRate.toFixed(1) + "%";
    barWinrate.style.width = winRate + "%";

    const roi = stats.totalWagered > 0
      ? ((stats.totalWon - stats.totalWagered) / stats.totalWagered * 100)
      : 0;
    roiEl.textContent = (roi >= 0 ? "+" : "") + roi.toFixed(1) + "%";
    const roiBarW = Math.min(Math.max((roi + 100) / 2, 0), 100);
    barRoi.style.width = roiBarW + "%";

    if (stats.streakType === "win") {
      streakEl.textContent = stats.streak + "W 🔥";
      streakEl.style.color = "";
    } else if (stats.streakType === "loss") {
      streakEl.textContent = stats.streak + "L 💀";
      streakEl.style.color = "var(--accent-rose)";
    } else {
      streakEl.textContent = "—";
      streakEl.style.color = "";
    }

    bigWinEl.textContent = stats.biggestWin.toLocaleString();

    const netProfit = stats.totalWon - stats.totalWagered;
    netProfitEl.textContent = (netProfit >= 0 ? "+" : "") + netProfit.toLocaleString();
    netProfitEl.style.color = netProfit >= 0 ? "var(--accent-green)" : "var(--accent-rose)";

    const maxSwing = Math.max(stats.totalWagered, 1000);
    const markerPos = Math.min(Math.max((netProfit / maxSwing + 1) / 2 * 100, 2), 98);
    marker.style.left = markerPos + "%";

    const total = stats.wins + stats.losses;
    if (total > 0) {
      wlWins.style.width = (stats.wins / total * 100) + "%";
      wlLosses.style.width = (stats.losses / total * 100) + "%";
    }
    wlWinsCount.textContent = stats.wins;
    wlLossesCount.textContent = stats.losses;
  }

  /* ---- 60fps Reel Spinning with requestAnimationFrame ---- */

  function spinReel(reelIndex) {
    return new Promise((resolve) => {
      const reel = reels[reelIndex];
      const strip = reel.querySelector(".reel-strip");
      const symbolEl = strip.querySelector(".symbol");

      const duration = SPIN_DURATION_BASE + reelIndex * SPIN_DURATION_STAGGER;
      const startTime = performance.now();
      let lastSymbolSwap = 0;

      strip.classList.add("spinning");

      function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        /* Easing: fast start, decelerate at end */
        const eased = 1 - Math.pow(1 - progress, 3);

        /* Cycle speed slows down as progress increases */
        const currentInterval = SYMBOL_CYCLE_SPEED + eased * 200;

        if (now - lastSymbolSwap > currentInterval && progress < 0.95) {
          symbolEl.textContent = pick(SYMBOLS).emoji;
          lastSymbolSwap = now;
          /* GPU-accelerated vertical jitter while spinning */
          const jitter = (Math.random() - 0.5) * 6;
          strip.style.transform = `translate3d(0, ${jitter}px, 0)`;
        }

        if (progress >= 1) {
          const result = weightedRandomSymbol();
          symbolEl.textContent = result.emoji;
          strip.classList.remove("spinning");
          strip.style.transform = "translate3d(0, 0, 0)";
          resolve(result);
          return;
        }

        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    });
  }

  /* ---- Evaluate ---- */

  function evaluateResults(results, bet) {
    const [a, b, c] = results;

    if (a.emoji === b.emoji && b.emoji === c.emoji) {
      const winnings = Math.round(bet * a.multiplier);
      return { type: "jackpot", multiplier: a.multiplier, winnings, matchName: a.name };
    }

    if (a.emoji === b.emoji || b.emoji === c.emoji || a.emoji === c.emoji) {
      const winnings = Math.round(bet * PARTIAL_MULTIPLIER);
      return { type: "partial", multiplier: PARTIAL_MULTIPLIER, winnings };
    }

    return { type: "loss", multiplier: 0, winnings: 0 };
  }

  /* ---- Animations ---- */

  function highlightWinningReels(results) {
    const [a, b, c] = results.map((r) => r.emoji);
    if (a === b) reels[0].classList.add("winner");
    if (b === c) reels[1].classList.add("winner");
    if (a === b || b === c) reels[1].classList.add("winner");
    if (a === c || b === c) reels[2].classList.add("winner");
    if (a === b) reels[0].classList.add("winner");
  }

  function clearReelHighlights() {
    reels.forEach((r) => {
      r.classList.remove("winner", "near-miss");
      const sym = r.querySelector(".symbol");
      if (sym) sym.classList.remove("bounce-win");
    });
    machineFrame.classList.remove("loss-flash", "win-glow");
  }

  function bounceWinningSymbols(results) {
    const [a, b, c] = results.map((r) => r.emoji);
    const emojis = [a, b, c];
    emojis.forEach((emoji, i) => {
      const isMatch = (i === 0 && (a === b || a === c))
        || (i === 1 && (b === a || b === c))
        || (i === 2 && (c === a || c === b));
      if (isMatch) {
        const sym = reels[i].querySelector(".symbol");
        if (sym) sym.classList.add("bounce-win");
      }
    });
  }

  function nearMissAnimation(results) {
    const [a, b, c] = results.map((r) => r.emoji);
    const matchPairs = [];
    if (a === b) { matchPairs.push(0, 1); }
    else if (b === c) { matchPairs.push(1, 2); }
    else if (a === c) { matchPairs.push(0, 2); }

    for (let i = 0; i < 3; i++) {
      if (!matchPairs.includes(i)) {
        reels[i].classList.add("near-miss");
      }
    }
  }

  function triggerScreenShake(intensity) {
    document.body.classList.add(intensity === "big" ? "big-shake" : "loss-shake");
    setTimeout(() => {
      document.body.classList.remove("big-shake", "loss-shake");
    }, 600);
  }

  function flyingTokensAnimation(amount, x, y) {
    const el = document.createElement("div");
    el.className = "flying-token";
    el.textContent = `+${amount} tokens!`;
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.color = "var(--accent-gold)";
    flyingTokensContainer.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  function showWinOverlay(title, detail) {
    winTitle.textContent = title;
    winDetail.textContent = detail;
    winOverlay.hidden = false;
    spawnConfetti(200);
  }

  function dismissWin() {
    winOverlay.hidden = true;
    removeConfetti();
  }

  function spawnConfetti(count) {
    count = count || 120;
    let canvas = document.getElementById("confetti-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "confetti-canvas";
      document.body.appendChild(canvas);
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    const pieces = [];
    const colors = [
      "#f59e0b", "#ec4899", "#a855f7", "#22d3ee", "#10b981", "#ef4444",
      "#f97316", "#14b8a6", "#f43f5e", "#fbbf24", "#6366f1", "#84cc16", "#0ea5e9",
    ];
    const shapes = ["rect", "circle", "triangle"];

    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: pick(colors),
        shape: pick(shapes),
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        rot: Math.random() * 360,
        rv: (Math.random() - 0.5) * 12,
        opacity: 1,
      });
    }

    let animId;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rv;
        p.vy += 0.06;
        if (p.y > canvas.height * 0.7) p.opacity -= 0.02;
        if (p.opacity <= 0) continue;
        if (p.y < canvas.height + 50) alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = Math.max(p.opacity, 0);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "triangle") {
          ctx.beginPath();
          ctx.moveTo(0, -p.w / 2);
          ctx.lineTo(-p.w / 2, p.w / 2);
          ctx.lineTo(p.w / 2, p.w / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        ctx.restore();
      }
      if (alive) {
        animId = requestAnimationFrame(draw);
      }
    }
    canvas._animId = animId;
    draw();
  }

  function removeConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (canvas) {
      cancelAnimationFrame(canvas._animId);
      canvas.remove();
    }
  }

  /* ---- Main Spin Handler ---- */

  async function handleSpin() {
    if (spinning) return;

    const bet = getBet();
    if (bet > balance) {
      setMessage(
        `Insufficient tokens! You need ${bet} but only have ${balance}. Downgrade your tier, peasant.`,
        "broke"
      );
      spinBtn.classList.add("shake");
      setTimeout(() => spinBtn.classList.remove("shake"), 400);
      return;
    }

    spinning = true;
    spinBtn.disabled = true;
    clearReelHighlights();

    balance -= bet;
    stats.totalSpins++;
    stats.totalWagered += bet;
    updateBalanceDisplay();
    setMessage(`Burning ${bet} tokens... inference in progress...`, "");

    const results = await Promise.all(
      Array.from({ length: REEL_COUNT }, (_, i) => spinReel(i))
    );

    const outcome = evaluateResults(results, bet);
    const btnRect = spinBtn.getBoundingClientRect();
    const flyX = btnRect.left + btnRect.width / 2 - 60;
    const flyY = btnRect.top - 20;

    if (outcome.type === "jackpot") {
      balance += outcome.winnings;
      stats.wins++;
      stats.totalWon += outcome.winnings;
      if (outcome.winnings > stats.biggestWin) stats.biggestWin = outcome.winnings;

      if (stats.streakType === "win") { stats.streak++; }
      else { stats.streak = 1; stats.streakType = "win"; }

      updateBalanceDisplay();
      highlightWinningReels(results);
      bounceWinningSymbols(results);
      machineFrame.classList.add("win-glow");
      triggerScreenShake("big");
      flyingTokensAnimation(outcome.winnings, flyX, flyY);

      if (results[0].emoji === "🦄") {
        showWinOverlay("🦄 UNICORN EXIT! 🦄", pick(JACKPOT_MESSAGES));
      } else {
        spawnConfetti(100);
        setTimeout(removeConfetti, 3000);
        const msg = pick(WIN_MESSAGES);
        setMessage(`+${outcome.winnings} tokens (${outcome.multiplier}x)! ${msg}`, "win");
      }
    } else if (outcome.type === "partial") {
      balance += outcome.winnings;
      stats.wins++;
      stats.totalWon += outcome.winnings;
      if (outcome.winnings > stats.biggestWin) stats.biggestWin = outcome.winnings;

      if (stats.streakType === "win") { stats.streak++; }
      else { stats.streak = 1; stats.streakType = "win"; }

      updateBalanceDisplay();
      highlightWinningReels(results);
      bounceWinningSymbols(results);
      nearMissAnimation(results);
      flyingTokensAnimation(outcome.winnings, flyX, flyY);

      setMessage(
        `+${outcome.winnings} tokens (${outcome.multiplier}x). ${pick(NEAR_MISS_MESSAGES)}`,
        "win"
      );
    } else {
      stats.losses++;
      if (stats.streakType === "loss") { stats.streak++; }
      else { stats.streak = 1; stats.streakType = "loss"; }

      machineFrame.classList.add("loss-flash");
      triggerScreenShake("small");
      setMessage(pick(LOSE_MESSAGES), "loss");
    }

    updateStats();

    if (balance <= 0) {
      setTimeout(() => {
        const msg = pick(BROKE_MESSAGES);
        setMessage(msg, "broke");
        if (msg.includes("bailout")) {
          balance = 1000;
          updateBalanceDisplay();
        }
      }, 1500);
    }

    spinning = false;
    spinBtn.disabled = false;
  }

  init();
})();
