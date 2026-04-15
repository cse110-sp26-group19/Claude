(function () {
  'use strict';

  // --- CONFIGURATION ---

  const SYMBOLS = ['🤖', '🧠', '💰', '🔥', '📝', '🎰', '👻', '⚡'];
  const STARTING_BALANCE = 1000;
  const BET_STEP = 10;
  const MIN_BET = 10;
  const MAX_BET = 500;
  const REEL_COUNT = 3;
  const SPIN_DURATION_BASE = 1200;
  const SPIN_STAGGER = 400;

  const PAYOUTS = {
    '🤖🤖🤖': { multiplier: 50, name: 'GPT JACKPOT' },
    '🧠🧠🧠': { multiplier: 25, name: 'NEURAL OVERLOAD' },
    '💰💰💰': { multiplier: 20, name: 'VC FUNDING ROUND' },
    '🔥🔥🔥': { multiplier: 15, name: 'MIXTRAL FIRE' },
    '📝📝📝': { multiplier: 10, name: 'PROMPT PERFECTION' },
    '🎰🎰🎰': { multiplier: 10, name: 'LUCKY INFERENCE' },
    '👻👻👻': { multiplier: 8,  name: 'TRIPLE HALLUCINATION' },
    '⚡⚡⚡': { multiplier: 5,  name: 'GPU MELTDOWN' },
  };

  const PAIR_MULTIPLIER = 2;

  // --- HUMOROUS MESSAGES ---

  const WIN_MESSAGES = [
    'The model predicted your win with 0.02% confidence. Lucky you!',
    'Congratulations! Your prompt engineering paid off!',
    'The AI didn\'t hallucinate this time — you actually won!',
    'RLHF successfully aligned this payout to your wallet.',
    'Your fine-tuning of the slot machine has converged!',
    'The attention mechanism focused on your bank account!',
    'Training complete: your reward model says MORE TOKENS.',
    'Context window expanded to fit all these winnings!',
    'The transformer architecture approves this transaction.',
    'You\'ve reached AGI: Actually Getting Income.',
  ];

  const LOSE_MESSAGES = [
    'Your tokens have been sacrificed to the training run gods.',
    'ERROR 402: Insufficient luck in your prompt.',
    'The model hallucinated a win, but reality disagreed.',
    'Your tokens went into the void, like an abandoned fine-tune.',
    'Overfitting detected: you expected a win based on past spins.',
    'The loss function is working as intended... for the house.',
    'Temperature too high. Incoherent results. Tokens burned.',
    'Your context window doesn\'t include a winning strategy.',
    'Tokens deallocated. Consider prompt-engineering a complaint.',
    'DALL-E could imagine you winning. Reality could not.',
    'The gradient descended straight into your wallet.',
    'Attention head #7 was distracted. No payout.',
    'These tokens have been added to the pre-training corpus.',
    'Sam Altman thanks you for your generous token donation.',
    'Your tokens are now part of an undisclosed training dataset.',
  ];

  const JACKPOT_MESSAGES = [
    'EMERGENCY: Model has achieved AGI and is printing money!',
    '🚨 ALIGNMENT FAILURE: The AI is giving away tokens! 🚨',
    'The singularity is here and it\'s PAYING OUT!',
    'WARNING: This payout exceeds the context window limit!',
  ];

  const NEAR_MISS_MESSAGES = [
    'SO CLOSE! The model almost converged on a payout!',
    'Two out of three — your gradient was heading the right direction!',
    'Near miss! The attention weights were *almost* aligned.',
    'Partial match detected. The loss function teases you.',
    'Almost a jackpot! The RNG seed was 1 off from glory.',
  ];

  const BROKE_MESSAGES = [
    'FATAL: TokenBalanceError — Cannot afford inference.',
    'Your API key has been revoked due to insufficient funds.',
    'The model refuses to generate: balance below threshold.',
    'Error 429: Too many requests with zero tokens.',
    'You\'ve hit the rate limit of poverty.',
  ];

  // --- STATE ---

  let balance = STARTING_BALANCE;
  let bet = MIN_BET;
  let spinning = false;

  const stats = {
    totalSpins: 0,
    wins: 0,
    losses: 0,
    tokensWon: 0,
    tokensLost: 0,
    currentStreak: 0,
    streakType: null,
    biggestWin: 0,
  };

  // --- DOM REFS ---

  const balanceEl = document.getElementById('balance');
  const betEl = document.getElementById('bet-amount');
  const spinBtn = document.getElementById('spin-btn');
  const spinText = spinBtn.querySelector('.spin-text');
  const messageEl = document.getElementById('message');
  const messageBox = document.getElementById('message-box');
  const betUpBtn = document.getElementById('bet-up');
  const betDownBtn = document.getElementById('bet-down');
  const reels = Array.from({ length: REEL_COUNT }, (_, i) =>
    document.getElementById('reel-' + i)
  );
  const payline = document.querySelector('.payline');
  const machineFrame = document.getElementById('machine-frame');
  const themeToggle = document.getElementById('theme-toggle');
  const flashOverlay = document.getElementById('fullscreen-flash');
  const particleContainer = document.getElementById('particle-container');

  const statEls = {
    spins: document.getElementById('stat-spins'),
    winrate: document.getElementById('stat-winrate'),
    won: document.getElementById('stat-won'),
    lost: document.getElementById('stat-lost'),
    roi: document.getElementById('stat-roi'),
    streak: document.getElementById('stat-streak'),
    biggest: document.getElementById('stat-biggest'),
    net: document.getElementById('stat-net'),
    netArrow: document.getElementById('stat-net-arrow'),
    winsFill: document.getElementById('wins-fill'),
    winsLabel: document.getElementById('wins-label'),
    lossesLabel: document.getElementById('losses-label'),
  };

  // --- THEME MANAGEMENT ---

  function initTheme() {
    const saved = localStorage.getItem('tb9000-theme');
    if (saved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.textContent = '🌙';
    }
  }

  function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.textContent = '☀';
      localStorage.setItem('tb9000-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.textContent = '🌙';
      localStorage.setItem('tb9000-theme', 'light');
    }
  }

  themeToggle.addEventListener('click', toggleTheme);
  initTheme();

  // --- MATRIX RAIN BACKGROUND (60fps optimized) ---

  function initMatrixRain() {
    const canvas = document.getElementById('matrix-bg');
    const ctx = canvas.getContext('2d');
    let columns, drops, dropSpeeds;

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01AIGPT';
    const fontSize = 14;

    const multiColors = ['#00ff41', '#00e5ff', '#bb86fc', '#1de9b6', '#ffab00'];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = new Array(columns);
      dropSpeeds = new Array(columns);
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * (canvas.height / fontSize);
        dropSpeeds[i] = 0.5 + Math.random() * 1.5;
      }
    }
    resize();
    window.addEventListener('resize', resize);

    let lastTime = 0;
    const targetInterval = 1000 / 30; // Matrix rain visual at 30fps for the trail fade effect

    function draw(now) {
      requestAnimationFrame(draw);

      const delta = now - lastTime;
      if (delta < targetInterval) return;
      lastTime = now - (delta % targetInterval);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];

        if (Math.random() < 0.92) {
          ctx.fillStyle = '#00ff41';
        } else {
          ctx.fillStyle = multiColors[Math.floor(Math.random() * multiColors.length)];
        }

        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
          dropSpeeds[i] = 0.5 + Math.random() * 1.5;
        }
        drops[i] += dropSpeeds[i];
      }
    }

    requestAnimationFrame(draw);
  }

  // --- HELPERS ---

  function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function updateDisplay() {
    balanceEl.textContent = balance;
    betEl.textContent = bet;
    spinBtn.disabled = spinning || balance < bet;
  }

  function setMessage(text, type) {
    messageBox.classList.remove('win', 'lose', 'jackpot', 'near-miss');
    if (type) messageBox.classList.add(type);
    messageEl.textContent = text;
  }

  function animateBalance(from, to) {
    const duration = 600;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      balanceEl.textContent = Math.round(from + (to - from) * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        balanceEl.textContent = to;
        balanceEl.classList.add('balance-pop');
        setTimeout(() => balanceEl.classList.remove('balance-pop'), 400);
      }
    }

    requestAnimationFrame(step);
  }

  // --- STATS ---

  function updateStats(winAmount, betAmount) {
    stats.totalSpins++;

    if (winAmount > 0) {
      stats.wins++;
      stats.tokensWon += winAmount;
      if (winAmount > stats.biggestWin) stats.biggestWin = winAmount;

      if (stats.streakType === 'win') {
        stats.currentStreak++;
      } else {
        stats.currentStreak = 1;
        stats.streakType = 'win';
      }
    } else {
      stats.losses++;
      stats.tokensLost += betAmount;

      if (stats.streakType === 'loss') {
        stats.currentStreak++;
      } else {
        stats.currentStreak = 1;
        stats.streakType = 'loss';
      }
    }

    renderStats();
  }

  function renderStats() {
    statEls.spins.textContent = stats.totalSpins;

    const winRate = stats.totalSpins > 0
      ? ((stats.wins / stats.totalSpins) * 100).toFixed(1)
      : 0;
    statEls.winrate.textContent = winRate + '%';

    statEls.won.textContent = stats.tokensWon;
    statEls.lost.textContent = stats.tokensLost;

    const totalWagered = stats.tokensWon + stats.tokensLost;
    const roi = totalWagered > 0
      ? (((stats.tokensWon - stats.tokensLost) / stats.tokensLost) * 100).toFixed(1)
      : '0';
    statEls.roi.textContent = roi + '%';

    if (stats.currentStreak > 0 && stats.streakType) {
      const icon = stats.streakType === 'win' ? '🔥' : '💀';
      statEls.streak.textContent = icon + ' ' + stats.currentStreak + (stats.streakType === 'win' ? 'W' : 'L');
      statEls.streak.className = 'stat-value ' + (stats.streakType === 'win' ? 'positive' : 'negative');
    } else {
      statEls.streak.textContent = '—';
      statEls.streak.className = 'stat-value';
    }

    statEls.biggest.textContent = stats.biggestWin;

    const netProfit = stats.tokensWon - stats.tokensLost;
    statEls.net.textContent = (netProfit >= 0 ? '+' : '') + netProfit;
    if (netProfit > 0) {
      statEls.net.className = 'stat-value positive';
      statEls.netArrow.textContent = '▲';
      statEls.netArrow.className = 'net-arrow up';
    } else if (netProfit < 0) {
      statEls.net.className = 'stat-value negative';
      statEls.netArrow.textContent = '▼';
      statEls.netArrow.className = 'net-arrow down';
    } else {
      statEls.net.className = 'stat-value';
      statEls.netArrow.textContent = '●';
      statEls.netArrow.className = 'net-arrow neutral';
    }

    const total = stats.wins + stats.losses;
    const winPct = total > 0 ? (stats.wins / total) * 100 : 50;
    statEls.winsFill.style.width = winPct + '%';
    statEls.winsLabel.textContent = 'W: ' + stats.wins;
    statEls.lossesLabel.textContent = 'L: ' + stats.losses;
  }

  // --- CELEBRATION EFFECTS ---

  function triggerShake(intensity) {
    machineFrame.classList.remove('shake-big', 'shake-small');
    void machineFrame.offsetWidth; // force reflow
    machineFrame.classList.add(intensity === 'big' ? 'shake-big' : 'shake-small');
    setTimeout(() => machineFrame.classList.remove('shake-big', 'shake-small'), 700);
  }

  function triggerFullscreenFlash() {
    flashOverlay.classList.remove('active');
    void flashOverlay.offsetWidth;
    flashOverlay.classList.add('active');
    setTimeout(() => flashOverlay.classList.remove('active'), 700);
  }

  function triggerGlitchIntensify() {
    const title = document.querySelector('.glitch');
    title.classList.add('glitch-intense');
    setTimeout(() => title.classList.remove('glitch-intense'), 1600);
  }

  function triggerMachineGlow() {
    machineFrame.classList.add('jackpot-glow');
    setTimeout(() => machineFrame.classList.remove('jackpot-glow'), 3000);
  }

  function triggerLossFlash() {
    machineFrame.classList.remove('loss-flash');
    void machineFrame.offsetWidth;
    machineFrame.classList.add('loss-flash');
    setTimeout(() => machineFrame.classList.remove('loss-flash'), 700);
  }

  function highlightNearMiss(results) {
    const counts = {};
    results.forEach((s, i) => {
      if (!counts[s]) counts[s] = [];
      counts[s].push(i);
    });
    for (const sym in counts) {
      if (counts[sym].length === 2) {
        counts[sym].forEach(idx => reels[idx].classList.add('near-miss'));
        setTimeout(() => {
          counts[sym].forEach(idx => reels[idx].classList.remove('near-miss'));
        }, 2000);
        return;
      }
    }
  }

  function spawnFloatingText(text, color) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.color = color;

    const rect = machineFrame.getBoundingClientRect();
    el.style.left = (rect.left + rect.width / 2 - 60) + 'px';
    el.style.top = (rect.top + rect.height / 2) + 'px';

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  function spawnParticleBurst(count, chars, colors) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      el.textContent = chars[Math.floor(Math.random() * chars.length)];
      el.style.color = colors[Math.floor(Math.random() * colors.length)];
      el.style.fontSize = (10 + Math.random() * 18) + 'px';

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      el.style.left = centerX + 'px';
      el.style.top = centerY + 'px';

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = 100 + Math.random() * 250;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 100;

      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      el.style.animation = `particle-burst ${0.8 + Math.random() * 0.8}s ease-out forwards`;
      el.style.animationDelay = (Math.random() * 0.15) + 's';

      particleContainer.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
  }

  function spawnConfettiFall(count) {
    const termChars = 'アイウエオカキクケコ01{}[]<>/*#$%@!&?';
    const colors = ['#ffd700', '#00ff41', '#00e5ff', '#bb86fc', '#ff00ff', '#1de9b6', '#ffab00'];

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      el.textContent = termChars[Math.floor(Math.random() * termChars.length)];
      el.style.color = colors[Math.floor(Math.random() * colors.length)];
      el.style.fontSize = (10 + Math.random() * 14) + 'px';
      el.style.left = (Math.random() * 100) + 'vw';
      el.style.top = (-20 - Math.random() * 60) + 'px';
      el.style.opacity = '0.8';
      el.style.animation = `particle-fall ${2 + Math.random() * 2}s linear forwards`;
      el.style.animationDelay = (Math.random() * 1.5) + 's';

      particleContainer.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }
  }

  // --- SPIN LOGIC (rAF-based) ---

  function spin() {
    if (spinning || balance < bet) return;
    spinning = true;

    const previousBalance = balance;
    balance -= bet;
    animateBalance(previousBalance, balance);

    spinBtn.disabled = true;
    spinBtn.classList.add('processing');
    spinText.textContent = 'INFERENCING';
    payline.classList.remove('visible');
    messageBox.classList.remove('win', 'lose', 'jackpot', 'near-miss');
    reels.forEach(r => {
      r.classList.remove('winner', 'stopped', 'near-miss');
    });

    setMessage('Running inference... please wait...', null);

    const results = Array.from({ length: REEL_COUNT }, () => randomSymbol());

    reels.forEach((reel, i) => {
      const symbolEl = reel.querySelector('.symbol');
      const stopTime = SPIN_DURATION_BASE + i * SPIN_STAGGER;
      const startTime = performance.now();
      let lastSwap = 0;

      function flickerLoop(now) {
        const elapsed = now - startTime;

        if (elapsed >= stopTime) {
          reel.classList.add('stopped');
          symbolEl.textContent = results[i];

          if (i === REEL_COUNT - 1) {
            setTimeout(() => resolveOutcome(results, previousBalance - bet), 300);
          }
          return;
        }

        const progress = elapsed / stopTime;
        const interval = 60 + progress * 160;

        if (now - lastSwap > interval) {
          symbolEl.textContent = randomSymbol();
          symbolEl.style.transform = `translateY(${(Math.random() - 0.5) * 8}px) scale(${0.9 + Math.random() * 0.15})`;
          symbolEl.style.opacity = 0.5 + Math.random() * 0.5;
          lastSwap = now;
        }

        requestAnimationFrame(flickerLoop);
      }

      requestAnimationFrame(flickerLoop);
    });
  }

  function resolveOutcome(results, balanceAfterBet) {
    spinning = false;
    spinBtn.classList.remove('processing');
    spinText.textContent = 'GENERATE RESPONSE';

    reels.forEach(r => {
      const sym = r.querySelector('.symbol');
      sym.style.transform = '';
      sym.style.opacity = '';
    });

    const key = results.join('');
    const tripleMatch = PAYOUTS[key];

    let winAmount = 0;
    let isNearMiss = false;

    if (tripleMatch) {
      winAmount = bet * tripleMatch.multiplier;
    } else if (hasPair(results)) {
      winAmount = bet * PAIR_MULTIPLIER;
      isNearMiss = true;
    }

    updateStats(winAmount, bet);

    if (winAmount > 0) {
      const from = balance;
      balance += winAmount;
      animateBalance(from, balance);
      payline.classList.add('visible');

      if (tripleMatch) {
        reels.forEach(r => r.classList.add('winner'));

        if (tripleMatch.multiplier >= 20) {
          setMessage(
            tripleMatch.name + '! +' + winAmount + ' tokens! ' + pick(JACKPOT_MESSAGES),
            'jackpot'
          );
          triggerShake('big');
          triggerFullscreenFlash();
          triggerGlitchIntensify();
          triggerMachineGlow();
          spawnParticleBurst(40, SYMBOLS, ['#ffd700', '#00ff41', '#ff00ff', '#00e5ff']);
          spawnConfettiFall(50);
          spawnFloatingText('+' + winAmount + ' TOKENS!', '#ffd700');
        } else {
          setMessage(
            tripleMatch.name + '! +' + winAmount + ' tokens! ' + pick(WIN_MESSAGES),
            'win'
          );
          triggerShake('big');
          spawnParticleBurst(20, SYMBOLS, ['#ffd700', '#00ff41', '#1de9b6']);
          spawnFloatingText('+' + winAmount + ' tokens!', '#1de9b6');
        }
      } else {
        if (isNearMiss) {
          highlightNearMiss(results);
          setMessage('Pair matched! +' + winAmount + ' tokens. ' + pick(NEAR_MISS_MESSAGES), 'near-miss');
        } else {
          setMessage('Pair matched! +' + winAmount + ' tokens. ' + pick(WIN_MESSAGES), 'win');
        }
        spawnFloatingText('+' + winAmount, '#00ff41');
      }
    } else {
      setMessage(pick(LOSE_MESSAGES), 'lose');
      triggerLossFlash();
      triggerShake('small');
    }

    if (balance <= 0) {
      balance = 0;
      balanceEl.textContent = 0;
      setMessage(pick(BROKE_MESSAGES), 'lose');
      spinBtn.disabled = true;

      setTimeout(() => {
        if (balance <= 0) {
          balance = STARTING_BALANCE;
          animateBalance(0, STARTING_BALANCE);
          setMessage(
            'SYSTEM: Emergency token bailout authorized. OpenAI printed more tokens. You\'re back in the game!',
            null
          );
          updateDisplay();
        }
      }, 3000);
    }

    updateDisplay();
  }

  function hasPair(results) {
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        if (results[i] === results[j]) return true;
      }
    }
    return false;
  }

  // --- BET CONTROLS ---

  function changeBet(direction) {
    bet = Math.min(MAX_BET, Math.max(MIN_BET, bet + direction * BET_STEP));
    if (bet > balance) bet = Math.max(MIN_BET, Math.floor(balance / BET_STEP) * BET_STEP);
    updateDisplay();
  }

  // --- EVENT LISTENERS ---

  spinBtn.addEventListener('click', spin);
  betUpBtn.addEventListener('click', () => changeBet(1));
  betDownBtn.addEventListener('click', () => changeBet(-1));

  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      spin();
    } else if (e.code === 'ArrowUp') {
      changeBet(1);
    } else if (e.code === 'ArrowDown') {
      changeBet(-1);
    }
  });

  // --- INIT ---

  initMatrixRain();
  updateDisplay();
  renderStats();
  setMessage('Insert tokens and press GENERATE to begin inference...', null);
})();
