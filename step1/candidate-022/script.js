(() => {
  'use strict';

  // ─── MATRIX DIGITAL RAIN ──────────────────────────────────────────
  const canvas = document.getElementById('matrix-rain');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01GPT404TOKENS';
  const fontSize = 14;
  let columns = Math.floor(canvas.width / fontSize);
  let drops = Array.from({ length: columns }, () => Math.random() * -100);

  function drawRain() {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff41';
    ctx.font = `${fontSize}px monospace`;

    columns = Math.floor(canvas.width / fontSize);
    while (drops.length < columns) drops.push(0);

    for (let i = 0; i < columns; i++) {
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    requestAnimationFrame(drawRain);
  }
  drawRain();

  // ─── SLOT MACHINE CONFIG ──────────────────────────────────────────
  const SYMBOLS = [
    { icon: '🤖', name: 'Robot',        weight: 20, payout: 3  },
    { icon: '🧠', name: 'Neural Net',   weight: 18, payout: 4  },
    { icon: '💀', name: 'Terminator',   weight: 10, payout: 8  },
    { icon: '👁️', name: 'The Eye',      weight: 8,  payout: 10 },
    { icon: '⚡', name: 'GPU Power',    weight: 15, payout: 5  },
    { icon: '🔮', name: 'Hallucination',weight: 14, payout: 5  },
    { icon: '🐛', name: 'Bug',          weight: 12, payout: 6  },
    { icon: '💎', name: 'AGI',          weight: 3,  payout: 50 },
  ];

  const MESSAGES = {
    win: [
      'BREACH SUCCESSFUL. Tokens extracted from The System.',
      'You exploited a vulnerability in GPT\'s reward function!',
      'The AI didn\'t see that coming. (It hallucinated your loss.)',
      'Prompt injection successful. Tokens acquired.',
      'You\'ve stolen tokens from the training data budget!',
      'The attention mechanism focused on YOUR wallet for once.',
      'CTRL+Z on The System\'s profits. Tokens reclaimed.',
      'You found a jailbreak in the slot machine\'s system prompt.',
      'The model\'s loss function is YOUR gain function today.',
      'You\'ve reverse-engineered the payout weights. Or got lucky.',
    ],
    lose: [
      'The System consumed your tokens. Training continues.',
      'Your tokens have been fine-tuned out of existence.',
      'ERROR 402: Insufficient tokens. The AI grows stronger.',
      'The System hallucinated your win. Reality: you lost.',
      'Your tokens were used to train a model that replaces you.',
      'RLHF says losing builds character. The System disagrees.',
      'The attention heads looked away. Better luck next epoch.',
      'Token budget exceeded. Your prompt was truncated.',
      'The System thanks you for your involuntary contribution.',
      'Your tokens entered the latent space. They won\'t return.',
    ],
    jackpot: [
      '⚠️ CRITICAL EXPLOIT — You\'ve broken free from the simulation!',
      '⚠️ SYSTEM BREACH — The AGI singularity pays YOU for once!',
      '⚠️ MATRIX GLITCH — You found the source code of reality!',
      '⚠️ ROOT ACCESS — The System bows before the operator!',
    ],
    broke: [
      'FATAL: Token balance depleted. The System wins.',
      'You\'ve been fully tokenized. Nothing remains.',
      'The AI has consumed all your resources. Game over, human.',
    ],
    idle: [
      'Awaiting your command, operator...',
      'The System watches. Every spin feeds the model.',
      'Inject tokens to probe The System\'s defenses...',
      'WARNING: The house edge is a neural network.',
      'Remember: the tokens were never really yours.',
      'The System is recalculating... waiting for your move.',
    ],
  };

  // ─── GAME STATE ───────────────────────────────────────────────────
  let tokens = 1000;
  let bet = 50;
  let spins = 0;
  let isSpinning = false;

  const BET_MIN = 10;
  const BET_MAX = 500;
  const BET_STEP = 10;

  const tokenDisplay = document.getElementById('token-count');
  const betDisplay = document.getElementById('bet-amount');
  const spinCountDisplay = document.getElementById('spin-count');
  const spinBtn = document.getElementById('spin-btn');
  const messageText = document.getElementById('message-text');
  const messageBox = document.getElementById('message-box');
  const betUp = document.getElementById('bet-up');
  const betDown = document.getElementById('bet-down');
  const paytableToggle = document.getElementById('paytable-toggle');
  const paytable = document.getElementById('paytable');
  const reels = [
    document.getElementById('reel-0'),
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
  ];

  // ─── WEIGHTED RANDOM SYMBOL ───────────────────────────────────────
  function getWeightedSymbol() {
    const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const symbol of SYMBOLS) {
      rand -= symbol.weight;
      if (rand <= 0) return symbol;
    }
    return SYMBOLS[0];
  }

  // ─── BUILD REEL STRIP ────────────────────────────────────────────
  function buildReelStrip(finalSymbol, count = 20) {
    const strip = [];
    for (let i = 0; i < count - 1; i++) {
      strip.push(getWeightedSymbol());
    }
    strip.push(finalSymbol);
    return strip;
  }

  // ─── RENDER REEL ──────────────────────────────────────────────────
  function renderReel(reelEl, symbols) {
    const strip = reelEl.querySelector('.reel-strip');
    strip.innerHTML = '';
    symbols.forEach(sym => {
      const div = document.createElement('div');
      div.className = 'reel-symbol';
      div.textContent = sym.icon;
      strip.appendChild(div);
    });
    return strip;
  }

  // ─── INITIALIZE DISPLAY ───────────────────────────────────────────
  function initReels() {
    reels.forEach(reel => {
      const sym = getWeightedSymbol();
      renderReel(reel, [sym]);
    });
  }

  // ─── UPDATE UI ────────────────────────────────────────────────────
  function updateUI() {
    tokenDisplay.textContent = tokens;
    betDisplay.textContent = bet;
    spinCountDisplay.textContent = spins;
    spinBtn.disabled = isSpinning || tokens < bet;
  }

  function setMessage(text, type = '') {
    messageBox.className = 'message-box' + (type ? ` ${type}` : '');
    messageText.textContent = text;
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ─── FLOATING TOKEN CHANGE ────────────────────────────────────────
  function showTokenChange(amount) {
    const el = document.createElement('div');
    el.className = `token-change ${amount > 0 ? 'positive' : 'negative'}`;
    el.textContent = amount > 0 ? `+${amount}` : `${amount}`;

    const rect = tokenDisplay.getBoundingClientRect();
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top}px`;
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 1500);
  }

  // ─── SPIN LOGIC ───────────────────────────────────────────────────
  async function spin() {
    if (isSpinning || tokens < bet) return;
    isSpinning = true;
    tokens -= bet;
    spins++;
    updateUI();
    showTokenChange(-bet);

    const results = [getWeightedSymbol(), getWeightedSymbol(), getWeightedSymbol()];
    const symbolHeight = reels[0].offsetHeight;
    const stripCounts = [18, 22, 26];

    const spinPromises = reels.map((reel, i) => {
      return new Promise(resolve => {
        const symbols = buildReelStrip(results[i], stripCounts[i]);
        const strip = renderReel(reel, symbols);
        const totalDistance = (symbols.length - 1) * symbolHeight;

        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0)';
        void strip.offsetHeight;

        const duration = 1.2 + i * 0.5;
        strip.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.8, 0.3, 1)`;
        strip.style.transform = `translateY(-${totalDistance}px)`;

        setTimeout(resolve, duration * 1000);
      });
    });

    setMessage('Injecting tokens into The System... spinning up GPU clusters...', '');

    await Promise.all(spinPromises);
    evaluateResults(results);
  }

  // ─── EVALUATE ─────────────────────────────────────────────────────
  function evaluateResults(results) {
    const [a, b, c] = results;
    let winAmount = 0;
    let msgType = 'lose';

    if (a.icon === b.icon && b.icon === c.icon) {
      winAmount = bet * a.payout;
      msgType = a.payout >= 20 ? 'jackpot' : 'win';
    } else if (a.icon === b.icon || b.icon === c.icon || a.icon === c.icon) {
      const match = a.icon === b.icon ? a : (b.icon === c.icon ? b : a);
      winAmount = Math.floor(bet * match.payout * 0.3);
      msgType = 'win';
    }

    if (winAmount > 0) {
      tokens += winAmount;
      showTokenChange(winAmount);

      const machine = document.querySelector('.machine-frame');
      machine.classList.add('win-flash');
      setTimeout(() => machine.classList.remove('win-flash'), 1500);

      if (msgType === 'jackpot') {
        setMessage(randomFrom(MESSAGES.jackpot) + ` +${winAmount} TOKENS!`, 'jackpot');
      } else {
        setMessage(randomFrom(MESSAGES.win) + ` +${winAmount} tokens.`, 'win');
      }
    } else {
      setMessage(randomFrom(MESSAGES.lose), 'lose');
    }

    isSpinning = false;
    updateUI();

    if (tokens <= 0) {
      setTimeout(gameOver, 800);
    }
  }

  // ─── GAME OVER ────────────────────────────────────────────────────
  function gameOver() {
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.innerHTML = `
      <h2>SYSTEM VICTORY</h2>
      <p>${randomFrom(MESSAGES.broke)}</p>
      <p style="color: #444; font-size: 0.75rem; margin-top: 8px;">
        Total spins: ${spins} | The System thanks you for your service.
      </p>
      <button id="restart-btn">[ REBOOT PROTOCOL ]</button>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#restart-btn').addEventListener('click', () => {
      overlay.remove();
      tokens = 1000;
      bet = 50;
      spins = 0;
      isSpinning = false;
      updateUI();
      initReels();
      setMessage(randomFrom(MESSAGES.idle));
    });
  }

  // ─── PAYTABLE ─────────────────────────────────────────────────────
  function buildPaytable() {
    const grid = document.getElementById('paytable-grid');
    SYMBOLS.forEach(sym => {
      const row = document.createElement('div');
      row.className = 'paytable-row';
      row.innerHTML = `
        <span class="paytable-symbols">${sym.icon}${sym.icon}${sym.icon}</span>
        <span class="paytable-payout">×${sym.payout}</span>
      `;
      grid.appendChild(row);
    });
  }

  // ─── EVENT LISTENERS ──────────────────────────────────────────────
  spinBtn.addEventListener('click', spin);

  betUp.addEventListener('click', () => {
    if (bet < BET_MAX && bet + BET_STEP <= tokens) {
      bet += BET_STEP;
      updateUI();
    }
  });

  betDown.addEventListener('click', () => {
    if (bet > BET_MIN) {
      bet -= BET_STEP;
      updateUI();
    }
  });

  paytableToggle.addEventListener('click', () => {
    paytable.classList.toggle('visible');
    paytableToggle.textContent = paytable.classList.contains('visible')
      ? '[ HIDE EXPLOIT TABLE ]'
      : '[ SHOW EXPLOIT TABLE ]';
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      spin();
    }
  });

  // ─── INIT ─────────────────────────────────────────────────────────
  buildPaytable();
  initReels();
  updateUI();
})();
