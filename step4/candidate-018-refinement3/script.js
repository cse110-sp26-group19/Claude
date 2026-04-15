(function () {
  "use strict";

  /* ================================================================
     Audio Engine (Web Audio API)
  ================================================================ */

  let _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function tone(freq, type, vol, delayS, durS) {
    try {
      const ac   = getAudioCtx();
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime + delayS);
      gain.gain.setValueAtTime(0.001, ac.currentTime + delayS);
      gain.gain.linearRampToValueAtTime(vol, ac.currentTime + delayS + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delayS + durS);
      osc.start(ac.currentTime + delayS);
      osc.stop(ac.currentTime + delayS + durS + 0.02);
    } catch (_) {}
  }

  function resumeAudio() {
    try {
      if (_audioCtx && _audioCtx.state === "suspended") _audioCtx.resume();
    } catch (_) {}
  }

  function audioTick() {
    tone(520 + Math.random() * 320, "square", 0.036, 0, 0.022);
    tone(170 + Math.random() * 70,  "sine",   0.026, 0, 0.030);
  }

  function audioStop(reelIndex) {
    tone(105 + reelIndex * 28,  "sine",     0.30, 0,    0.20);
    tone(820 + reelIndex * 95,  "square",   0.06, 0,    0.03);
    tone(410 + reelIndex * 50,  "triangle", 0.07, 0.02, 0.13);
  }

  function audioSuspense() {
    try {
      const ac   = getAudioCtx();
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(80, ac.currentTime);
      osc.frequency.linearRampToValueAtTime(145, ac.currentTime + 0.32);
      gain.gain.setValueAtTime(0.001, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ac.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ac.currentTime + 0.26);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.40);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 0.44);
    } catch (_) {}
  }

  function audioWin(multiplier) {
    const scale = multiplier >= 50
      ? [261, 330, 392, 523, 659, 784, 1047, 1319]
      : multiplier >= 15
        ? [261, 330, 392, 523, 659, 784]
        : multiplier >= 5
          ? [261, 330, 392, 523, 659]
          : [330, 392, 523];
    scale.forEach(function (f, i) {
      tone(f,     "sine",     0.15, i * 0.088, 0.36);
      tone(f * 2, "sine",     0.05, i * 0.088, 0.26);
      tone(f * 3, "triangle", 0.02, i * 0.088, 0.16);
    });
  }

  function audioLose() {
    [300, 252, 210].forEach(function (f, i) {
      tone(f, "sawtooth", 0.12 + i * 0.02, i * 0.13, 0.24);
    });
  }

  /* Dramatic "danger" sting for special events / debt */
  function audioDanger() {
    [180, 160, 140, 120].forEach(function (f, i) {
      tone(f, "sawtooth", 0.18 - i * 0.02, i * 0.09, 0.35);
    });
    tone(80, "sine", 0.25, 0, 0.5);
  }

  /* Ascending jingle when page loads (welcome back) */
  function audioWelcome() {
    const notes = [261, 330, 392, 523];
    notes.forEach(function (f, i) {
      tone(f, "sine", 0.12, i * 0.08, 0.28);
    });
  }

  /* Special-event fanfare */
  function audioSpecialEvent() {
    [392, 494, 587, 698, 784].forEach(function (f, i) {
      tone(f, "triangle", 0.14, i * 0.07, 0.30);
      tone(f * 1.5, "sine", 0.04, i * 0.07 + 0.03, 0.18);
    });
  }

  /* ================================================================
     Symbols & Constants
  ================================================================ */

  const SYMBOLS = [
    { emoji: "🦄", name: "Unicorn", multiplier: 50 },
    { emoji: "💎", name: "GPU",     multiplier: 20 },
    { emoji: "🧠", name: "AGI",     multiplier: 15 },
    { emoji: "🤖", name: "Bot",     multiplier: 10 },
    { emoji: "🔥", name: "Fire",    multiplier: 8  },
    { emoji: "📈", name: "Stonks",  multiplier: 5  },
    { emoji: "⚡", name: "Zap",     multiplier: 3  },
  ];

  const PARTIAL_MULTIPLIER      = 1.5;
  const REEL_COUNT              = 3;
  const SPIN_DURATION_BASE      = 1200;
  const SPIN_DURATION_STAGGER   = 500;
  const SYMBOL_CYCLE_SPEED      = 70;

  const LOAN_AMOUNT             = 1000;
  const MAX_DEBT                = 2500; /* forced game-over threshold */

  /* ================================================================
     Message Banks
  ================================================================ */

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

  const DEBT_LOSE_MESSAGES = [
    "You're in DEBT and losing MORE. The VCs are not happy.",
    "Debt spiral confirmed. Our lawyers are cc'd on this loss.",
    "You owe us tokens AND you just lost more. Incredible efficiency.",
    "Negative net worth. The algorithm sends thoughts and prayers (mostly thoughts).",
    "Fun fact: you're losing money you don't have. Bold strategy.",
    "Your debt-to-token ratio has gone parabolic. Analysts are impressed.",
    "Every loss deepens the hole. The hole is getting cozy with you.",
  ];

  const BROKE_MESSAGES = [
    "TOKEN BANKRUPTCY! You've been disrupted. A VC loan is standing by.",
    "0 tokens remaining. Your runway is 0 days. Fundraising time?",
    "Out of tokens! The Series F has dried up. Take a bridge loan?",
    "Bankrupt! The market is undefeated. A loan shark (VC) awaits.",
    "All tokens gone. Pivot or take the loan — both are equally painful.",
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

  /* ================================================================
     State
  ================================================================ */

  let balance     = 1000;
  let debtAmount  = 0;
  let spinning    = false;

  /* Track special-event spin state */
  let activeSpecialEvent  = null;   /* {type, label, eventBet, winMult} or null */
  let modalPrimaryAction  = null;   /* callback for modal primary button */
  let modalSecondaryAction = null;  /* callback for modal secondary button */
  let specialEventCount   = 0;      /* session count for high score */
  let sessionMaxDebt      = 0;      /* peak debt this session */

  let stats = {
    totalSpins:  0,
    wins:        0,
    losses:      0,
    totalWagered: 0,
    totalWon:    0,
    biggestWin:  0,
    streak:      0,
    streakType:  null,
  };

  /* ================================================================
     DOM References
  ================================================================ */

  const balanceEl            = document.getElementById("balance");
  const betSelect            = document.getElementById("bet-select");
  const spinBtn              = document.getElementById("spin-btn");
  const messageEl            = document.getElementById("message");
  const messageArea          = document.getElementById("message-area");
  const reels                = Array.from({ length: REEL_COUNT }, function (_, i) {
    return document.getElementById("reel-" + i);
  });
  const winOverlay           = document.getElementById("win-overlay");
  const winTitle             = document.getElementById("win-title");
  const winDetail            = document.getElementById("win-detail");
  const winDismiss           = document.getElementById("win-dismiss");
  const tickerEl             = document.getElementById("ticker");
  const machineFrame         = document.getElementById("machine-frame");
  const themeToggle          = document.getElementById("theme-toggle");
  const themeIcon            = document.getElementById("theme-icon");
  const flyingTokensContainer = document.getElementById("flying-tokens");
  const debtIndicator        = document.getElementById("debt-indicator");
  const debtAmountEl         = document.getElementById("debt-amount");
  const modalOverlay         = document.getElementById("modal-overlay");
  const modalBadge           = document.getElementById("modal-badge");
  const modalTitle           = document.getElementById("modal-title");
  const modalBody            = document.getElementById("modal-body");
  const modalStakes          = document.getElementById("modal-stakes");
  const modalPrimaryBtn      = document.getElementById("modal-primary-btn");
  const modalSecondaryBtn    = document.getElementById("modal-secondary-btn");
  const toastContainer       = document.getElementById("toast-container");

  /* ================================================================
     Init
  ================================================================ */

  function init() {
    loadPersistedState();
    buildTicker();
    spinBtn.addEventListener("click", handleSpin);
    winDismiss.addEventListener("click", dismissWin);
    themeToggle.addEventListener("click", toggleTheme);
    modalPrimaryBtn.addEventListener("click", function () {
      if (modalPrimaryAction) modalPrimaryAction();
    });
    modalSecondaryBtn.addEventListener("click", function () {
      if (modalSecondaryAction) modalSecondaryAction();
    });
    loadTheme();
    updateBalanceDisplay();
    updateDebtDisplay();
    updateStats();
    /* Welcome-back jingle on first click */
    document.addEventListener("click", function playWelcome() {
      resumeAudio();
      audioWelcome();
      document.removeEventListener("click", playWelcome);
    }, { once: true });
  }

  /* ================================================================
     Persistence
  ================================================================ */

  function loadPersistedState() {
    const savedBal  = localStorage.getItem("tokenburn-balance");
    const savedDebt = localStorage.getItem("tokenburn-debt");
    if (savedBal  !== null) balance    = parseInt(savedBal)  || 1000;
    if (savedDebt !== null) debtAmount = parseInt(savedDebt) || 0;
    if (debtAmount > sessionMaxDebt) sessionMaxDebt = debtAmount;
  }

  function saveState() {
    localStorage.setItem("tokenburn-balance", balance);
    localStorage.setItem("tokenburn-debt",    debtAmount);
  }

  /* ================================================================
     High Scores
  ================================================================ */

  function saveHighScore() {
    const scores = JSON.parse(localStorage.getItem("tokenburn-highscores") || "[]");
    const entry  = {
      date:          new Date().toISOString(),
      finalBalance:  balance,
      biggestWin:    stats.biggestWin,
      totalSpins:    stats.totalSpins,
      wins:          stats.wins,
      losses:        stats.losses,
      netProfit:     stats.totalWon - stats.totalWagered,
      specialEvents: specialEventCount,
      maxDebt:       sessionMaxDebt,
    };
    scores.push(entry);
    scores.sort(function (a, b) {
      /* Primary: final balance desc; secondary: biggest win desc */
      if (b.finalBalance !== a.finalBalance) return b.finalBalance - a.finalBalance;
      return b.biggestWin - a.biggestWin;
    });
    scores.splice(10);
    localStorage.setItem("tokenburn-highscores", JSON.stringify(scores));
  }

  /* ================================================================
     Theme
  ================================================================ */

  function loadTheme() {
    const saved = localStorage.getItem("tokenburn-theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    themeIcon.textContent = saved === "dark" ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next    = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("tokenburn-theme", next);
    themeIcon.textContent = next === "dark" ? "☀️" : "🌙";
    themeIcon.style.transform = "rotate(360deg)";
    setTimeout(function () { themeIcon.style.transform = ""; }, 300);
  }

  /* ================================================================
     Helpers
  ================================================================ */

  function buildTicker() {
    const shuffled = [...TICKER_HEADLINES].sort(function () { return Math.random() - 0.5; });
    tickerEl.textContent = shuffled.join("  ★  ");
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function updateBalanceDisplay() {
    balanceEl.textContent = balance.toLocaleString();
    balanceEl.classList.add("bump");
    setTimeout(function () { balanceEl.classList.remove("bump"); }, 200);
    /* Tint red when in debt */
    if (balance < 0) {
      balanceEl.style.background = "var(--gradient-sunset)";
      balanceEl.style.webkitBackgroundClip = "text";
    } else {
      balanceEl.style.background = "";
    }
  }

  function updateDebtDisplay() {
    if (debtAmount > 0) {
      debtIndicator.hidden     = false;
      debtAmountEl.textContent = debtAmount.toLocaleString();
      if (debtAmount > sessionMaxDebt) sessionMaxDebt = debtAmount;
    } else {
      debtIndicator.hidden = true;
    }
  }

  function setMessage(text, type) {
    messageEl.textContent  = text;
    messageArea.className  = "message-area";
    if (type) messageArea.classList.add(type);
  }

  function getBet() {
    return parseInt(betSelect.value, 10);
  }

  function weightedRandomSymbol() {
    const weights = [1, 3, 4, 6, 7, 9, 10];
    const total   = weights.reduce(function (a, b) { return a + b; }, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return SYMBOLS[i];
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  /* ================================================================
     Stats
  ================================================================ */

  function updateStats() {
    const winRateEl   = document.getElementById("stat-winrate");
    const roiEl       = document.getElementById("stat-roi");
    const streakEl    = document.getElementById("stat-streak");
    const bigWinEl    = document.getElementById("stat-bigwin");
    const netProfitEl = document.getElementById("stat-netprofit");
    const barWinrate  = document.getElementById("bar-winrate");
    const barRoi      = document.getElementById("bar-roi");
    const marker      = document.getElementById("net-profit-marker");
    const wlWins      = document.getElementById("wl-bar-wins");
    const wlLosses    = document.getElementById("wl-bar-losses");
    const wlWinsCount = document.getElementById("wl-wins");
    const wlLossesCount = document.getElementById("wl-losses");

    const winRate = stats.totalSpins > 0 ? (stats.wins / stats.totalSpins * 100) : 0;
    winRateEl.textContent = winRate.toFixed(1) + "%";
    barWinrate.style.width = winRate + "%";

    const roi = stats.totalWagered > 0
      ? ((stats.totalWon - stats.totalWagered) / stats.totalWagered * 100)
      : 0;
    roiEl.textContent = (roi >= 0 ? "+" : "") + roi.toFixed(1) + "%";
    barRoi.style.width = Math.min(Math.max((roi + 100) / 2, 0), 100) + "%";

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

    const maxSwing  = Math.max(stats.totalWagered, 1000);
    const markerPos = Math.min(Math.max((netProfit / maxSwing + 1) / 2 * 100, 2), 98);
    marker.style.left = markerPos + "%";

    const total = stats.wins + stats.losses;
    if (total > 0) {
      wlWins.style.width   = (stats.wins   / total * 100) + "%";
      wlLosses.style.width = (stats.losses / total * 100) + "%";
    }
    wlWinsCount.textContent   = stats.wins;
    wlLossesCount.textContent = stats.losses;
  }

  /* ================================================================
     Toast Notifications
  ================================================================ */

  function showToast(message, type, onClick) {
    /* type: "loss" | "debt" | "gameover" */
    const toast = document.createElement("div");
    toast.className = "loss-toast" + (type ? " toast-" + type : "");

    const icon = type === "debt"     ? "💸"
                : type === "gameover" ? "☠️"
                :                      "💀";

    toast.innerHTML =
      '<div class="toast-icon">' + icon + '</div>' +
      '<div class="toast-body">' +
        '<div class="toast-title">' + (type === "debt" ? "DEBT ALERT" : type === "gameover" ? "GAME OVER" : "Token Burned") + '</div>' +
        '<div class="toast-msg">' + message + '</div>' +
        '<div class="toast-cta">Click to return home →</div>' +
      '</div>' +
      '<button class="toast-close" aria-label="Dismiss">✕</button>';

    /* Close button */
    toast.querySelector(".toast-close").addEventListener("click", function (e) {
      e.stopPropagation();
      dismissToast(toast);
    });

    /* Click whole toast → go home */
    toast.addEventListener("click", function () {
      if (onClick) onClick();
      else {
        saveHighScore();
        saveState();
        window.location.href = "home.html";
      }
    });

    toastContainer.appendChild(toast);
    /* Animate in */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add("show"); });
    });

    const linger = type === "debt" ? 9000 : type === "gameover" ? 0 : 5500;
    if (linger > 0) {
      setTimeout(function () { dismissToast(toast); }, linger);
    }
    return toast;
  }

  function dismissToast(toast) {
    toast.classList.remove("show");
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 500);
  }

  /* ================================================================
     Modal (generic — special events, loan offer, game-over)
  ================================================================ */

  function showModal(config) {
    /* config: {badge, title, body, primaryLabel, secondaryLabel, onPrimary, onSecondary, type} */
    modalBadge.textContent       = config.badge      || "⚡ SPECIAL EVENT";
    modalTitle.textContent       = config.title      || "";
    modalBody.innerHTML          = config.body       || "";
    modalStakes.innerHTML        = config.stakes     || "";
    modalPrimaryBtn.textContent  = config.primaryLabel   || "Accept";
    modalSecondaryBtn.textContent = config.secondaryLabel || "Skip";

    modalPrimaryAction   = config.onPrimary   || null;
    modalSecondaryAction = config.onSecondary || null;

    modalOverlay.dataset.type = config.type || "";
    modalOverlay.hidden = false;

    /* Apply type-specific style to badge */
    modalBadge.className = "modal-badge" + (config.type ? " modal-badge-" + config.type : "");

    /* Bump animation */
    const content = document.getElementById("modal-content");
    content.classList.remove("modal-pop");
    void content.offsetWidth;
    content.classList.add("modal-pop");
  }

  function hideModal() {
    modalOverlay.hidden      = true;
    modalPrimaryAction       = null;
    modalSecondaryAction     = null;
  }

  /* ================================================================
     Special Events
  ================================================================ */

  function checkSpecialEvent(outcome, bet) {
    /* Returns an event config object or null */

    if (outcome.type === "loss") {
      /* 3+ loss streak → Triple or Nothing (guaranteed) */
      if (stats.streakType === "loss" && stats.streak >= 3 && Math.random() < 0.70) {
        return {
          type:     "triple_or_nothing",
          label:    "💀 TRIPLE OR NOTHING",
          eventBet: bet,
          winMult:  3,
        };
      }
      /* Any loss → Double or Nothing (25%) */
      if (Math.random() < 0.25) {
        return {
          type:     "double_or_nothing",
          label:    "⚡ DOUBLE OR NOTHING",
          eventBet: bet,
          winMult:  2.5,
        };
      }
    }

    if (outcome.type !== "loss") {
      /* 2+ win streak → Mega Bet (35%) */
      if (stats.streakType === "win" && stats.streak >= 2 && Math.random() < 0.35) {
        const megaBet = bet * 5;
        return {
          type:     "mega_bet",
          label:    "🚀 MEGA BET SURGE",
          eventBet: megaBet,
          winMult:  10,
        };
      }
    }

    return null;
  }

  function presentSpecialEvent(event, bet) {
    activeSpecialEvent = event;
    specialEventCount++;
    audioSpecialEvent();

    const winReturn  = Math.round(event.eventBet * event.winMult);
    const typeLabels = {
      triple_or_nothing: "💀 TRIPLE OR NOTHING",
      double_or_nothing: "⚡ DOUBLE OR NOTHING",
      mega_bet:          "🚀 MEGA BET SURGE",
    };

    const bodyTexts = {
      triple_or_nothing:
        "You've lost <strong>3 spins in a row</strong>. The algorithm smells blood.<br><br>" +
        "Stake <strong>" + event.eventBet.toLocaleString() + " tokens</strong> for one redemption spin.<br>" +
        "WIN → <strong>+" + winReturn.toLocaleString() + " tokens</strong> returned (3×) &nbsp;|&nbsp; LOSE → <strong>−" + event.eventBet.toLocaleString() + "</strong> more.",
      double_or_nothing:
        "The market is volatile. One more spin could change everything.<br><br>" +
        "Stake <strong>" + event.eventBet.toLocaleString() + " tokens</strong>.<br>" +
        "WIN → <strong>+" + winReturn.toLocaleString() + " tokens</strong> returned (2.5×) &nbsp;|&nbsp; LOSE → <strong>−" + event.eventBet.toLocaleString() + "</strong> more.",
      mega_bet:
        "You're on a <strong>" + stats.streak + "-win streak</strong>! The model is aligned with your soul!<br><br>" +
        "Stake <strong>" + event.eventBet.toLocaleString() + " tokens</strong> (5× normal) for MASSIVE returns.<br>" +
        "WIN → <strong>+" + winReturn.toLocaleString() + " tokens</strong> (10×) &nbsp;|&nbsp; LOSE → <strong>−" + event.eventBet.toLocaleString() + "</strong> burned (debt possible).",
    };

    const typeBadges = {
      triple_or_nothing: "💀 SPECIAL EVENT · 3-LOSS STREAK",
      double_or_nothing: "⚡ SPECIAL EVENT · VOLATILE MARKET",
      mega_bet:          "🚀 SPECIAL EVENT · WIN STREAK BONUS",
    };

    showModal({
      badge:         typeBadges[event.type]  || "⚡ SPECIAL EVENT",
      title:         typeLabels[event.type]  || event.label,
      body:          bodyTexts[event.type]   || "",
      stakes:        "",
      primaryLabel:  "🎰 Accept Challenge (" + event.eventBet.toLocaleString() + " tokens)",
      secondaryLabel: "Skip (coward mode)",
      type:          event.type === "mega_bet" ? "mega" : event.type === "triple_or_nothing" ? "danger" : "warning",
      onPrimary:     function () {
        hideModal();
        runSpecialSpin(event);
      },
      onSecondary:   function () {
        hideModal();
        activeSpecialEvent = null;
        spinBtn.disabled   = false;
      },
    });
  }

  async function runSpecialSpin(event) {
    /* Deduct the special bet (can push into debt) */
    balance -= event.eventBet;
    if (balance < 0) {
      const newDebt   = Math.abs(balance);
      debtAmount     += newDebt;
      balance         = 0;
    }
    updateBalanceDisplay();
    updateDebtDisplay();
    saveState();

    spinBtn.disabled = true;
    spinBtn.classList.add("spinning");
    clearReelHighlights();

    setMessage("⚡ SPECIAL SPIN: " + event.label + " — burning " + event.eventBet.toLocaleString() + " tokens…", "");

    const results = await Promise.all(
      Array.from({ length: REEL_COUNT }, function (_, i) { return spinReel(i); })
    );

    spinBtn.classList.remove("spinning");
    reels.forEach(function (r) { r.classList.add("suspense-pulse"); });
    audioSuspense();
    await new Promise(function (res) { setTimeout(res, 380); });
    reels.forEach(function (r) { r.classList.remove("suspense-pulse"); });

    const outcome    = evaluateResults(results, event.eventBet);
    const btnRect    = spinBtn.getBoundingClientRect();
    const flyX       = btnRect.left + btnRect.width / 2 - 60;
    const flyY       = btnRect.top  - 20;

    if (outcome.type !== "loss") {
      const specialWin = Math.round(event.eventBet * event.winMult);
      balance         += specialWin;

      /* Reduce debt proportionally */
      if (debtAmount > 0) {
        const paid  = Math.min(debtAmount, specialWin);
        debtAmount -= paid;
      }

      stats.wins++;
      stats.totalWon += specialWin;
      if (specialWin > stats.biggestWin) stats.biggestWin = specialWin;
      if (stats.streakType === "win") { stats.streak++; }
      else { stats.streak = 1; stats.streakType = "win"; }

      updateBalanceDisplay();
      updateDebtDisplay();
      highlightWinningReels(results);
      bounceWinningSymbols(results);
      machineFrame.classList.add("win-glow");
      triggerScreenShake("big");
      flyingTokensAnimation(specialWin, flyX, flyY);
      audioWin(event.winMult);
      spawnConfetti(130);
      setTimeout(removeConfetti, 3800);

      const label = event.type === "mega_bet"         ? "MEGA WIN"
                  : event.type === "triple_or_nothing" ? "TRIPLE WIN"
                  :                                      "DOUBLE WIN";
      setMessage(
        "⚡ " + label + "! +" + specialWin.toLocaleString() + " tokens (" + event.winMult + "×)! " + pick(WIN_MESSAGES),
        "win"
      );
    } else {
      /* Special event loss */
      stats.losses++;
      if (stats.streakType === "loss") { stats.streak++; }
      else { stats.streak = 1; stats.streakType = "loss"; }

      machineFrame.classList.add("loss-flash");
      triggerScreenShake("small");
      audioLose();

      const lossLabels = {
        triple_or_nothing: "TRIPLE NOTHING. The algorithm is merciless.",
        double_or_nothing: "DOUBLE NOTHING. You doubled down and got double the emptiness.",
        mega_bet:          "MEGA LOSS. " + event.eventBet.toLocaleString() + " tokens vaporized in one shot.",
      };
      setMessage(lossLabels[event.type] || "Special event failed. Tokens gone.", "loss");

      if (debtAmount > 0) {
        setTimeout(function () {
          audioDanger();
          showToast(
            "Special event FAILED. You're " + debtAmount.toLocaleString() + " tokens in debt. The VCs are circling.",
            "debt"
          );
        }, 1200);
      }
    }

    stats.totalSpins++;
    stats.totalWagered += event.eventBet;
    updateStats();
    saveState();
    saveHighScore();

    /* Check game-over conditions */
    if (debtAmount >= MAX_DEBT) {
      setTimeout(handleTotalBankruptcy, 2000);
    } else if (balance <= 0 && debtAmount > 0) {
      setTimeout(handleTotalBankruptcy, 2000);
    } else if (balance <= 0) {
      setTimeout(showLoanOffer, 1500);
    }

    activeSpecialEvent = null;
    spinBtn.disabled   = false;
    spinBtn.classList.remove("spinning");
  }

  /* ================================================================
     Loan Offer (first bankruptcy)
  ================================================================ */

  function showLoanOffer() {
    audioDanger();
    showModal({
      badge:  "💸 DEBT SPIRAL",
      title:  "TOKEN BANKRUPTCY",
      body:   pick(BROKE_MESSAGES) +
              "<br><br>Accept a <strong>VC bridge loan of " + LOAN_AMOUNT.toLocaleString() + " tokens</strong>? " +
              "You'll be in debt — every loss will send you an alert — and if you can't pay it back, it's game over.",
      primaryLabel:  "💸 Take the Loan (" + LOAN_AMOUNT.toLocaleString() + " tokens)",
      secondaryLabel: "🏠 Go Home",
      type:   "danger",
      onPrimary: function () {
        hideModal();
        debtAmount  = LOAN_AMOUNT;
        balance     = LOAN_AMOUNT;
        updateBalanceDisplay();
        updateDebtDisplay();
        saveState();
        audioWin(1);
        setMessage(
          "VC loan accepted. You now owe " + LOAN_AMOUNT.toLocaleString() + " tokens. Every loss will be reported to your creditors.",
          "broke"
        );
      },
      onSecondary: function () {
        hideModal();
        saveHighScore();
        saveState();
        window.location.href = "home.html";
      },
    });
  }

  /* ================================================================
     Total Bankruptcy (game-over when already in debt)
  ================================================================ */

  function handleTotalBankruptcy() {
    audioDanger();
    setMessage("☠️ TOTAL BANKRUPTCY. You cannot continue. Redirecting you home...", "broke");
    showToast(
      "GAME OVER. Debt: " + debtAmount.toLocaleString() + " tokens. The algorithm has consumed you completely. Click to go home.",
      "gameover",
      function () {
        /* Reset for next session */
        debtAmount = 0;
        balance    = 1000;
        saveState();
        saveHighScore();
        window.location.href = "home.html";
      }
    );
    spinBtn.disabled = true;
  }

  /* ================================================================
     Reel Spin (60fps RAF)
  ================================================================ */

  function spinReel(reelIndex) {
    return new Promise(function (resolve) {
      const reel    = reels[reelIndex];
      const strip   = reel.querySelector(".reel-strip");
      const symbolEl = strip.querySelector(".symbol");

      const duration    = SPIN_DURATION_BASE + reelIndex * SPIN_DURATION_STAGGER;
      const startTime   = performance.now();
      let lastSymbolSwap = 0;
      let lastTick       = startTime;

      strip.classList.add("spinning");

      function animate(now) {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);

        const currentInterval = SYMBOL_CYCLE_SPEED + eased * 200;
        const tickInterval    = 65 * (1 + eased * 3.0);

        if (now - lastTick > tickInterval && progress < 0.90) {
          audioTick();
          lastTick = now;
        }

        if (now - lastSymbolSwap > currentInterval && progress < 0.95) {
          symbolEl.textContent = pick(SYMBOLS).emoji;
          lastSymbolSwap       = now;
          strip.style.transform = "translate3d(0, " + ((Math.random() - 0.5) * 6) + "px, 0)";
        }

        if (progress >= 1) {
          const result = weightedRandomSymbol();
          symbolEl.textContent = result.emoji;
          strip.classList.remove("spinning");
          strip.style.transform = "translate3d(0, 0, 0)";
          audioStop(reelIndex);
          resolve(result);
          return;
        }

        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    });
  }

  /* ================================================================
     Evaluate
  ================================================================ */

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

  /* ================================================================
     Animations
  ================================================================ */

  function highlightWinningReels(results) {
    const [a, b, c] = results.map(function (r) { return r.emoji; });
    if (a === b) { reels[0].classList.add("winner"); reels[1].classList.add("winner"); }
    if (b === c) { reels[1].classList.add("winner"); reels[2].classList.add("winner"); }
    if (a === c) { reels[0].classList.add("winner"); reels[2].classList.add("winner"); }
  }

  function clearReelHighlights() {
    reels.forEach(function (r) {
      r.classList.remove("winner", "near-miss");
      const sym = r.querySelector(".symbol");
      if (sym) sym.classList.remove("bounce-win");
    });
    machineFrame.classList.remove("loss-flash", "win-glow");
  }

  function bounceWinningSymbols(results) {
    const [a, b, c] = results.map(function (r) { return r.emoji; });
    [a, b, c].forEach(function (emoji, i) {
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
    const [a, b, c] = results.map(function (r) { return r.emoji; });
    const matchPairs = [];
    if (a === b)       { matchPairs.push(0, 1); }
    else if (b === c)  { matchPairs.push(1, 2); }
    else if (a === c)  { matchPairs.push(0, 2); }
    for (let i = 0; i < 3; i++) {
      if (!matchPairs.includes(i)) reels[i].classList.add("near-miss");
    }
  }

  function triggerScreenShake(intensity) {
    document.body.classList.add(intensity === "big" ? "big-shake" : "loss-shake");
    setTimeout(function () {
      document.body.classList.remove("big-shake", "loss-shake");
    }, 600);
  }

  function flyingTokensAnimation(amount, x, y) {
    const el          = document.createElement("div");
    el.className      = "flying-token";
    el.textContent    = "+" + amount.toLocaleString() + " tokens!";
    el.style.left     = x + "px";
    el.style.top      = y + "px";
    el.style.color    = "var(--accent-gold)";
    flyingTokensContainer.appendChild(el);
    setTimeout(function () { el.remove(); }, 1600);
  }

  function showWinOverlay(title, detail) {
    winTitle.textContent  = title;
    winDetail.textContent = detail;
    winOverlay.hidden     = false;
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
      canvas    = document.createElement("canvas");
      canvas.id = "confetti-canvas";
      document.body.appendChild(canvas);
    }
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx     = canvas.getContext("2d");
    const pieces  = [];
    const colors  = [
      "#f59e0b", "#ec4899", "#a855f7", "#22d3ee", "#10b981", "#ef4444",
      "#f97316", "#14b8a6", "#f43f5e", "#fbbf24", "#6366f1", "#84cc16", "#0ea5e9",
    ];
    const shapes  = ["rect", "circle", "triangle"];

    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color:   pick(colors),
        shape:   pick(shapes),
        vx:      (Math.random() - 0.5) * 6,
        vy:      Math.random() * 4 + 2,
        rot:     Math.random() * 360,
        rv:      (Math.random() - 0.5) * 12,
        opacity: 1,
      });
    }

    let animId;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.rot += p.rv;
        p.vy += 0.06;
        if (p.y > canvas.height * 0.7) p.opacity -= 0.02;
        if (p.opacity <= 0) continue;
        if (p.y < canvas.height + 50) alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = Math.max(p.opacity, 0);
        ctx.fillStyle   = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "triangle") {
          ctx.beginPath();
          ctx.moveTo(0, -p.w / 2);
          ctx.lineTo(-p.w / 2,  p.w / 2);
          ctx.lineTo( p.w / 2,  p.w / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (alive) animId = requestAnimationFrame(draw);
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

  /* ================================================================
     Main Spin Handler
  ================================================================ */

  async function handleSpin() {
    if (spinning) return;
    resumeAudio();

    const bet = getBet();

    /* Insufficient tokens check */
    if (bet > balance) {
      if (debtAmount > 0) {
        /* Already in debt — game over */
        handleTotalBankruptcy();
      } else {
        setMessage(
          "Insufficient tokens! Need " + bet + " but only have " + balance.toLocaleString() + ". Take a VC loan?",
          "broke"
        );
        spinBtn.classList.add("shake");
        setTimeout(function () { spinBtn.classList.remove("shake"); }, 400);
        showLoanOffer();
      }
      return;
    }

    spinning = true;
    spinBtn.disabled = true;
    spinBtn.classList.add("spinning");
    clearReelHighlights();

    balance -= bet;
    stats.totalSpins++;
    stats.totalWagered += bet;
    updateBalanceDisplay();
    setMessage("Burning " + bet + " tokens… inference in progress…", "");
    saveState();

    const results = await Promise.all(
      Array.from({ length: REEL_COUNT }, function (_, i) { return spinReel(i); })
    );

    spinBtn.classList.remove("spinning");
    reels.forEach(function (r) { r.classList.add("suspense-pulse"); });
    audioSuspense();
    await new Promise(function (res) { setTimeout(res, 380); });
    reels.forEach(function (r) { r.classList.remove("suspense-pulse"); });

    const outcome = evaluateResults(results, bet);
    const btnRect = spinBtn.getBoundingClientRect();
    const flyX    = btnRect.left + btnRect.width / 2 - 60;
    const flyY    = btnRect.top  - 20;

    if (outcome.type === "jackpot") {
      balance        += outcome.winnings;
      stats.wins++;
      stats.totalWon += outcome.winnings;
      if (outcome.winnings > stats.biggestWin) stats.biggestWin = outcome.winnings;

      if (stats.streakType === "win") { stats.streak++; }
      else { stats.streak = 1; stats.streakType = "win"; }

      /* Reduce debt on big wins */
      if (debtAmount > 0) {
        const paid = Math.min(debtAmount, outcome.winnings);
        debtAmount -= paid;
      }

      updateBalanceDisplay();
      updateDebtDisplay();
      highlightWinningReels(results);
      bounceWinningSymbols(results);
      machineFrame.classList.add("win-glow");
      triggerScreenShake("big");
      flyingTokensAnimation(outcome.winnings, flyX, flyY);
      audioWin(outcome.multiplier);

      if (results[0].emoji === "🦄") {
        showWinOverlay("🦄 UNICORN EXIT! 🦄", pick(JACKPOT_MESSAGES));
      } else {
        spawnConfetti(100);
        setTimeout(removeConfetti, 3000);
        setMessage(
          "+" + outcome.winnings.toLocaleString() + " tokens (" + outcome.multiplier + "×)! " + pick(WIN_MESSAGES),
          "win"
        );
      }

    } else if (outcome.type === "partial") {
      balance        += outcome.winnings;
      stats.wins++;
      stats.totalWon += outcome.winnings;
      if (outcome.winnings > stats.biggestWin) stats.biggestWin = outcome.winnings;

      if (stats.streakType === "win") { stats.streak++; }
      else { stats.streak = 1; stats.streakType = "win"; }

      if (debtAmount > 0) {
        const paid = Math.min(debtAmount, outcome.winnings);
        debtAmount -= paid;
      }

      updateBalanceDisplay();
      updateDebtDisplay();
      highlightWinningReels(results);
      bounceWinningSymbols(results);
      nearMissAnimation(results);
      flyingTokensAnimation(outcome.winnings, flyX, flyY);
      audioWin(outcome.multiplier);

      setMessage(
        "+" + outcome.winnings.toLocaleString() + " tokens (" + outcome.multiplier + "×). " + pick(NEAR_MISS_MESSAGES),
        "win"
      );

    } else {
      /* LOSS */
      stats.losses++;
      if (stats.streakType === "loss") { stats.streak++; }
      else { stats.streak = 1; stats.streakType = "loss"; }

      machineFrame.classList.add("loss-flash");
      triggerScreenShake("small");
      audioLose();

      if (debtAmount > 0) {
        /* In-debt loss: special message + toast notification */
        setMessage(pick(DEBT_LOSE_MESSAGES), "loss");
        setTimeout(function () {
          showToast(
            pick(DEBT_LOSE_MESSAGES) + " Debt: " + debtAmount.toLocaleString() + " tokens.",
            "debt"
          );
        }, 800);
      } else {
        setMessage(pick(LOSE_MESSAGES), "loss");
        /* Always show a loss toast (dismissible, clickable to go home) */
        setTimeout(function () {
          showToast(pick(LOSE_MESSAGES), "loss");
        }, 600);
      }
    }

    updateStats();
    saveState();
    saveHighScore();

    /* Check game-over / bankrupcy conditions */
    if (debtAmount >= MAX_DEBT) {
      setTimeout(handleTotalBankruptcy, 2000);
    } else if (balance <= 0 && debtAmount > 0) {
      setTimeout(handleTotalBankruptcy, 2000);
    } else if (balance <= 0) {
      setTimeout(showLoanOffer, 1500);
    } else if (outcome.type !== "jackpot") {
      /* Check if a special event should be offered */
      const event = checkSpecialEvent(outcome, bet);
      if (event) {
        setTimeout(function () { presentSpecialEvent(event, bet); }, 1200);
        /* Don't re-enable spin btn until event is dismissed */
        return;
      }
    }

    spinning         = false;
    spinBtn.disabled = false;
    spinBtn.classList.remove("spinning");
  }

  init();
})();
