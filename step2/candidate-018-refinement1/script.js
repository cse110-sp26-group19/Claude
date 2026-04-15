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
  const SPIN_INTERVAL_MS = 80;
  const MIN_SPINS = 15;
  const EXTRA_PER_REEL = 8;

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

  let balance = 1000;
  let spinning = false;

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

  function init() {
    buildTicker();
    spinBtn.addEventListener("click", handleSpin);
    winDismiss.addEventListener("click", dismissWin);
    updateBalanceDisplay();
  }

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

  function spinReel(reelIndex) {
    return new Promise((resolve) => {
      const reel = reels[reelIndex];
      const inner = reel.querySelector(".reel-inner");
      const symbolEl = inner.querySelector(".symbol");
      inner.classList.add("spinning");

      const totalSpins = MIN_SPINS + reelIndex * EXTRA_PER_REEL;
      let count = 0;

      const interval = setInterval(() => {
        symbolEl.textContent = pick(SYMBOLS).emoji;
        count++;
        if (count >= totalSpins) {
          clearInterval(interval);
          const result = weightedRandomSymbol();
          symbolEl.textContent = result.emoji;
          inner.classList.remove("spinning");
          resolve(result);
        }
      }, SPIN_INTERVAL_MS);
    });
  }

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

  function highlightWinningReels(results) {
    const [a, b, c] = results.map((r) => r.emoji);
    if (a === b) reels[0].classList.add("winner");
    if (b === c) reels[1].classList.add("winner");
    if (a === b || b === c) reels[1].classList.add("winner");
    if (a === c || b === c) reels[2].classList.add("winner");
    if (a === b) reels[0].classList.add("winner");
  }

  function clearReelHighlights() {
    reels.forEach((r) => r.classList.remove("winner"));
  }

  function showWinOverlay(title, detail) {
    winTitle.textContent = title;
    winDetail.textContent = detail;
    winOverlay.hidden = false;
    spawnConfetti();
  }

  function dismissWin() {
    winOverlay.hidden = true;
    removeConfetti();
  }

  function spawnConfetti() {
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
    const colors = ["#f59e0b", "#ec4899", "#a855f7", "#22d3ee", "#10b981", "#ef4444"];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: pick(colors),
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * 360,
        rv: (Math.random() - 0.5) * 10,
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
        p.vy += 0.05;
        if (p.y < canvas.height + 50) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
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
    updateBalanceDisplay();
    setMessage(`Burning ${bet} tokens... inference in progress...`, "");

    const results = await Promise.all(
      Array.from({ length: REEL_COUNT }, (_, i) => spinReel(i))
    );

    const outcome = evaluateResults(results, bet);

    if (outcome.type === "jackpot") {
      balance += outcome.winnings;
      updateBalanceDisplay();
      highlightWinningReels(results);

      if (results[0].emoji === "🦄") {
        showWinOverlay("🦄 UNICORN EXIT! 🦄", pick(JACKPOT_MESSAGES));
      } else {
        const msg = pick(WIN_MESSAGES);
        setMessage(`+${outcome.winnings} tokens (${outcome.multiplier}x)! ${msg}`, "win");
      }
    } else if (outcome.type === "partial") {
      balance += outcome.winnings;
      updateBalanceDisplay();
      highlightWinningReels(results);
      setMessage(
        `+${outcome.winnings} tokens (${outcome.multiplier}x). Partial match — the model almost got it right. Story of AI.`,
        "win"
      );
    } else {
      setMessage(pick(LOSE_MESSAGES), "loss");
    }

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
