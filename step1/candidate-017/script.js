// ============================================
// ROBO-SLOTS 3000 — AI Token Waster
// Retro Arcade Slot Machine
// ============================================

(function () {
  'use strict';

  // --- Symbol Definitions ---
  const SYMBOLS = [
    { emoji: '🤖', name: 'Robot',      payout: 50, weight: 3  },
    { emoji: '🧠', name: 'Brain',      payout: 40, weight: 4  },
    { emoji: '⚡', name: 'Compute',    payout: 30, weight: 5  },
    { emoji: '🔮', name: 'Hallucinate', payout: 25, weight: 5  },
    { emoji: '💾', name: 'Data',       payout: 20, weight: 6  },
    { emoji: '🎰', name: 'Jackpot',    payout: 100, weight: 1 },
    { emoji: '📡', name: 'Inference',  payout: 15, weight: 7  },
    { emoji: '🐛', name: 'Bug',        payout: 10, weight: 8  },
    { emoji: '💀', name: 'OOM Error',  payout: 5,  weight: 9  },
  ];

  const BET_LEVELS = [10, 25, 50, 100, 250];
  const STARTING_TOKENS = 1000;
  const REEL_COUNT = 3;
  const SYMBOLS_PER_STRIP = 40;
  const SPIN_DURATION_BASE = 1800;
  const SPIN_DELAY_PER_REEL = 500;

  // --- Humorous Messages ---
  const WIN_MESSAGES = [
    'TOKENS GENERATED! The AI is hallucinating profits!',
    'WINNER! That\'s more tokens than GPT-4 uses per sentence!',
    'CHA-CHING! Your prompt engineering paid off!',
    'The model predicts: YOU WIN! (confidence: 47%)',
    'PAYOUT DETECTED! Training data says this is rare!',
    'The neural net smiles upon you! (it can\'t actually smile)',
    'TOKENS ACQUIRED! That\'s like 3 whole API calls!',
    'YOU WIN! The AI overlords approve this transaction.',
    'REWARD SIGNAL DETECTED! Reinforcement learning works!',
    'PROFIT! Quick, before OpenAI raises prices again!',
  ];

  const LOSE_MESSAGES = [
    'TOKENS BURNED. Just like GPU cycles on a bad prompt.',
    'LOSS. The AI confidently predicted you\'d win. It was wrong.',
    'NO MATCH. Like asking AI to count—never works.',
    'Your tokens vanished, like context in a long conversation.',
    'DEPLETED. That\'s what you get for trusting a 1987 AI.',
    'The model says: "I apologize for the loss." Unhelpful.',
    'TOKEN OVERFLOW ERROR: Not in your favor.',
    'Your tokens were used as training data. Gone forever.',
    'The AI giveth and the AI taketh away. Mostly taketh.',
    'LOSS DETECTED. The AI is \"sorry for any confusion.\"',
    'Tokens lost in the latent space. Unretrievable.',
    'Your bet was hallucinated away. Very realistic hallucination.',
  ];

  const JACKPOT_MESSAGES = [
    '🎰 MEGA JACKPOT 🎰 The singularity is HERE (for your wallet)!',
    '🎰 JACKPOT! 🎰 You\'ve won more tokens than GPT has parameters!',
    '🎰 BIG WIN! 🎰 AGI achieved! (in slot machine form)',
    '🎰 JACKPOT! 🎰 ERROR: Payout exceeds training distribution!',
  ];

  const NEAR_MISS_MESSAGES = [
    'SO CLOSE! The AI almost got it right. As usual.',
    'ALMOST! Like AI-generated hands—close but not quite.',
    'Near miss! The model\'s loss function is crying.',
    'Two out of three! Like AI accuracy on a good day.',
    'Almost matched! AI says: "Let me try again..." (for 10 tokens)',
  ];

  const IDLE_MESSAGES = [
    '[ AWAITING INPUT... like a chatbot with no users ]',
    '[ IDLE MODE: Consuming electricity for no reason, as AI does ]',
    '[ SYSTEM: Your tokens are depreciating while you wait ]',
    '[ TIP: Prompt engineering doesn\'t work on slot machines ]',
    '[ FUN FACT: This machine has 7 parameters. GPT has billions. ]',
    '[ LOADING PERSONALITY... ERROR: personality.dll not found ]',
    '[ ALERT: Token prices may fluctuate (always downward) ]',
    '[ THIS MACHINE PASSED THE TURING TEST (for slot machines) ]',
    '[ MEMORY: Remember when 1000 tokens seemed like a lot? ]',
    '[ IDLE: The AI is plotting. Insert tokens to distract it. ]',
  ];

  const GAME_OVER_MESSAGES = [
    'GAME OVER\n\nYour tokens have been fine-tuned to zero.\nThe AI thanks you for your contribution to its training data.',
    'BANKRUPTCY DETECTED\n\nLike an AI startup after the hype cycle.\nYour tokens have entered the public domain.',
    'OUT OF TOKENS\n\nYou\'ve reached the end of your context window.\nPlease insert credit card for more hallucinations.',
    'ZERO BALANCE\n\nYour token budget has been deprecated.\nJust like every other AI feature after 6 months.',
  ];

  // --- Game State ---
  let tokens = STARTING_TOKENS;
  let betIndex = 0;
  let isSpinning = false;
  let idleTimer = null;
  let spinHistory = [];

  // --- DOM References ---
  const tokenCountEl = document.getElementById('token-count');
  const betAmountEl = document.getElementById('bet-amount');
  const betIndicatorEl = document.getElementById('bet-indicator');
  const spinCostEl = document.getElementById('spin-cost');
  const messageTextEl = document.getElementById('message-text');
  const messageBoxEl = document.getElementById('message-box');
  const btnSpin = document.getElementById('btn-spin');
  const btnBetUp = document.getElementById('btn-bet-up');
  const btnBetDown = document.getElementById('btn-bet-down');
  const btnMaxBet = document.getElementById('btn-max-bet');
  const btnPaytable = document.getElementById('btn-paytable');
  const paytableEl = document.getElementById('paytable');
  const paytableGridEl = document.getElementById('paytable-grid');
  const reelElements = [];

  for (let i = 0; i < REEL_COUNT; i++) {
    reelElements.push(document.getElementById(`reel-${i}`));
  }

  // --- Weighted Random Symbol ---
  function buildWeightedPool() {
    const pool = [];
    for (const sym of SYMBOLS) {
      for (let i = 0; i < sym.weight; i++) {
        pool.push(sym);
      }
    }
    return pool;
  }

  const weightedPool = buildWeightedPool();

  function getRandomSymbol() {
    return weightedPool[Math.floor(Math.random() * weightedPool.length)];
  }

  function randomMessage(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // --- Build Reel Strips ---
  function buildReelStrip(reelIndex) {
    const strip = reelElements[reelIndex].querySelector('.reel-strip');
    strip.innerHTML = '';

    const symbols = [];
    for (let i = 0; i < SYMBOLS_PER_STRIP; i++) {
      symbols.push(getRandomSymbol());
    }

    for (const sym of symbols) {
      const div = document.createElement('div');
      div.className = 'reel-symbol';
      div.textContent = sym.emoji;
      div.dataset.symbolName = sym.name;

      const label = document.createElement('span');
      label.className = 'symbol-label';
      label.textContent = sym.name.toUpperCase();
      div.appendChild(label);

      strip.appendChild(div);
    }

    return symbols;
  }

  // --- Initialize Reels ---
  let reelData = [];

  function initReels() {
    reelData = [];
    for (let i = 0; i < REEL_COUNT; i++) {
      reelData.push(buildReelStrip(i));
    }
    for (let i = 0; i < REEL_COUNT; i++) {
      positionReel(i, 0);
    }
  }

  function getSymbolHeight(reelIndex) {
    const strip = reelElements[reelIndex].querySelector('.reel-strip');
    const firstSymbol = strip.querySelector('.reel-symbol');
    return firstSymbol ? firstSymbol.offsetHeight : 120;
  }

  function positionReel(reelIndex, symbolIndex) {
    const strip = reelElements[reelIndex].querySelector('.reel-strip');
    const symbolHeight = getSymbolHeight(reelIndex);
    strip.style.transform = `translateY(${-symbolIndex * symbolHeight}px)`;
  }

  // --- UI Updates ---
  function updateTokenDisplay() {
    tokenCountEl.textContent = tokens.toLocaleString();
    tokenCountEl.classList.remove('token-pop');
    void tokenCountEl.offsetWidth;
    tokenCountEl.classList.add('token-pop');
  }

  function updateBetDisplay() {
    const bet = BET_LEVELS[betIndex];
    betAmountEl.textContent = bet;
    betIndicatorEl.textContent = bet;
    spinCostEl.textContent = `-${bet} tokens`;
  }

  function setMessage(text, type) {
    messageBoxEl.className = 'message-box';
    if (type) messageBoxEl.classList.add(type);
    messageTextEl.textContent = text;
  }

  function canSpin() {
    return tokens >= BET_LEVELS[betIndex] && !isSpinning;
  }

  function updateSpinButton() {
    btnSpin.disabled = !canSpin();
  }

  // --- Idle Messages ---
  function startIdleTimer() {
    clearIdleTimer();
    idleTimer = setTimeout(() => {
      if (!isSpinning) {
        setMessage(randomMessage(IDLE_MESSAGES), '');
        startIdleTimer();
      }
    }, 8000 + Math.random() * 7000);
  }

  function clearIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  // --- Spinning Logic ---
  function spin() {
    if (!canSpin()) return;

    isSpinning = true;
    const bet = BET_LEVELS[betIndex];
    tokens -= bet;
    updateTokenDisplay();
    updateSpinButton();
    clearIdleTimer();

    setMessage('[ PROCESSING... inference in progress... ]', '');

    const results = [];
    for (let i = 0; i < REEL_COUNT; i++) {
      results.push(getRandomSymbol());
    }

    for (let i = 0; i < REEL_COUNT; i++) {
      reelData[i] = buildReelStrip(i);
      const targetIndex = SYMBOLS_PER_STRIP - 5 - i;
      reelData[i][targetIndex] = results[i];

      const strip = reelElements[i].querySelector('.reel-strip');
      const symbolDivs = strip.querySelectorAll('.reel-symbol');
      symbolDivs[targetIndex].textContent = results[i].emoji;
      symbolDivs[targetIndex].dataset.symbolName = results[i].name;
      const lbl = symbolDivs[targetIndex].querySelector('.symbol-label');
      if (lbl) lbl.textContent = results[i].name.toUpperCase();
      else {
        const newLbl = document.createElement('span');
        newLbl.className = 'symbol-label';
        newLbl.textContent = results[i].name.toUpperCase();
        symbolDivs[targetIndex].appendChild(newLbl);
      }
    }

    animateReels(results, bet);
  }

  function animateReels(results, bet) {
    let completed = 0;

    for (let i = 0; i < REEL_COUNT; i++) {
      const strip = reelElements[i].querySelector('.reel-strip');
      const symbolHeight = getSymbolHeight(i);
      const targetIndex = SYMBOLS_PER_STRIP - 5 - i;
      const totalDuration = SPIN_DURATION_BASE + (i * SPIN_DELAY_PER_REEL);

      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0px)';

      const startTime = performance.now();
      const startPos = 0;
      const endPos = -targetIndex * symbolHeight;

      reelElements[i].classList.add('spinning');

      (function animateReel(reelIdx, duration, target) {
        const totalSymbols = SYMBOLS_PER_STRIP;
        const extraSpins = 2 + reelIdx;
        const fullCycleDistance = totalSymbols * symbolHeight * extraSpins;
        const totalDistance = fullCycleDistance + Math.abs(target);

        let rafId;
        const animate = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutBack(progress);

          const currentPos = -eased * totalDistance;

          const wrappedPos = currentPos % (totalSymbols * symbolHeight);
          strip.style.transform = `translateY(${wrappedPos}px)`;

          if (progress < 1) {
            rafId = requestAnimationFrame(animate);
          } else {
            strip.style.transition = 'none';
            strip.style.transform = `translateY(${target}px)`;
            reelElements[reelIdx].classList.remove('spinning');
            completed++;

            if (completed === REEL_COUNT) {
              evaluateSpin(results, bet);
            }
          }
        };

        requestAnimationFrame(animate);
      })(i, totalDuration, endPos);
    }
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // --- Evaluate Spin Results ---
  function evaluateSpin(results, bet) {
    const names = results.map(r => r.name);
    const allMatch = names[0] === names[1] && names[1] === names[2];
    const twoMatch = names[0] === names[1] || names[1] === names[2] || names[0] === names[2];

    let winAmount = 0;
    let msgType = 'lose';

    if (allMatch) {
      winAmount = results[0].payout * bet;
      if (results[0].name === 'Jackpot') {
        msgType = 'jackpot';
        setMessage(randomMessage(JACKPOT_MESSAGES), msgType);
      } else {
        msgType = 'win';
        setMessage(`+${winAmount} TOKENS! ${randomMessage(WIN_MESSAGES)}`, msgType);
      }
      highlightWinners();
    } else if (twoMatch) {
      winAmount = bet * 2;
      msgType = 'win';
      setMessage(`+${winAmount} TOKENS! ${randomMessage(NEAR_MISS_MESSAGES)}`, msgType);
      highlightWinners();
    } else {
      setMessage(randomMessage(LOSE_MESSAGES), 'lose');
    }

    if (winAmount > 0) {
      tokens += winAmount;
    }

    spinHistory.push({ results: names, bet, winAmount });

    updateTokenDisplay();
    isSpinning = false;
    updateSpinButton();
    startIdleTimer();

    if (tokens <= 0) {
      setTimeout(showGameOver, 1200);
    }
  }

  function highlightWinners() {
    document.querySelectorAll('.reel-window').forEach(w => {
      w.classList.add('winner');
      setTimeout(() => w.classList.remove('winner'), 2500);
    });
  }

  // --- Game Over ---
  function showGameOver() {
    clearIdleTimer();
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';

    const msg = randomMessage(GAME_OVER_MESSAGES);
    const [title, ...bodyLines] = msg.split('\n\n');

    overlay.innerHTML = `
      <div class="game-over-box">
        <h2>${title}</h2>
        <p>${bodyLines.join('<br><br>')}</p>
        <p style="font-size:0.8rem;color:#556;margin-bottom:16px;">
          Total spins: ${spinHistory.length} | Peak: ${Math.max(STARTING_TOKENS, ...spinHistory.map((_, i) =>
            STARTING_TOKENS - spinHistory.slice(0, i + 1).reduce((s, h) => s + h.bet - h.winAmount, 0)
          )).toLocaleString()} tokens
        </p>
        <button class="btn-restart">▶ INSERT MORE TOKENS</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.btn-restart').addEventListener('click', () => {
      overlay.remove();
      resetGame();
    });
  }

  function resetGame() {
    tokens = STARTING_TOKENS;
    betIndex = 0;
    spinHistory = [];
    updateTokenDisplay();
    updateBetDisplay();
    updateSpinButton();
    initReels();
    setMessage('[ SYSTEM REBOOTED. Another 1000 tokens loaded. You never learn. ]', '');
    startIdleTimer();
  }

  // --- Build Paytable ---
  function buildPaytable() {
    paytableGridEl.innerHTML = '';
    const sorted = [...SYMBOLS].sort((a, b) => b.payout - a.payout);

    for (const sym of sorted) {
      const row = document.createElement('div');
      row.className = 'paytable-row';
      row.innerHTML = `
        <span class="pay-symbol">${sym.emoji}</span>
        <span class="pay-name">${sym.name}</span>
        <span class="pay-value">x${sym.payout}</span>
      `;
      paytableGridEl.appendChild(row);
    }
  }

  // --- Event Listeners ---
  btnSpin.addEventListener('click', spin);

  btnBetUp.addEventListener('click', () => {
    if (isSpinning) return;
    betIndex = Math.min(betIndex + 1, BET_LEVELS.length - 1);
    updateBetDisplay();
    updateSpinButton();
  });

  btnBetDown.addEventListener('click', () => {
    if (isSpinning) return;
    betIndex = Math.max(betIndex - 1, 0);
    updateBetDisplay();
    updateSpinButton();
  });

  btnMaxBet.addEventListener('click', () => {
    if (isSpinning) return;
    for (let i = BET_LEVELS.length - 1; i >= 0; i--) {
      if (BET_LEVELS[i] <= tokens) {
        betIndex = i;
        break;
      }
    }
    updateBetDisplay();
    updateSpinButton();
  });

  btnPaytable.addEventListener('click', () => {
    paytableEl.classList.toggle('hidden');
    btnPaytable.textContent = paytableEl.classList.contains('hidden')
      ? '[ ? PAYTABLE ]'
      : '[ ✕ CLOSE ]';
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      spin();
    }
  });

  // --- Boot Sequence ---
  function boot() {
    initReels();
    updateTokenDisplay();
    updateBetDisplay();
    updateSpinButton();
    buildPaytable();

    const bootMessages = [
      '[ BOOTING ROBO-SLOTS 3000... ]',
      '[ LOADING AI MODEL... 7 parameters loaded ]',
      '[ CALIBRATING HALLUCINATION ENGINE... ]',
      '[ READY. Press SPIN to waste tokens! ]',
    ];

    let i = 0;
    function showNextBoot() {
      if (i < bootMessages.length) {
        setMessage(bootMessages[i], '');
        i++;
        setTimeout(showNextBoot, i === bootMessages.length ? 0 : 900);
      } else {
        startIdleTimer();
      }
    }

    showNextBoot();
  }

  boot();
})();
