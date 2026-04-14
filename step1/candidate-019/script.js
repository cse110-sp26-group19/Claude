(function () {
  'use strict';

  // ── Symbol Definitions ────────────────────────────
  const SYMBOLS = [
    { emoji: '👁️', name: 'The Watcher', weight: 15 },
    { emoji: '🧠', name: 'Neural Net', weight: 18 },
    { emoji: '💀', name: 'Hallucination', weight: 20 },
    { emoji: '🔮', name: 'Prediction', weight: 16 },
    { emoji: '⚡', name: 'GPU Fire', weight: 14 },
    { emoji: '🤖', name: 'The Model', weight: 12 },
    { emoji: '💎', name: 'Premium Token', weight: 5 },
  ];

  const PAYOUTS = [
    { match: '💎💎💎', multiplier: 50, label: 'TOKEN SINGULARITY' },
    { match: '👁️👁️👁️', multiplier: 25, label: 'THE MACHINE SEES ALL' },
    { match: '🤖🤖🤖', multiplier: 20, label: 'AGI ACHIEVED' },
    { match: '⚡⚡⚡', multiplier: 15, label: 'DATACENTER MELTDOWN' },
    { match: '🔮🔮🔮', multiplier: 12, label: 'PERFECT PREDICTION' },
    { match: '🧠🧠🧠', multiplier: 10, label: 'FULL NEURAL SYNC' },
    { match: '💀💀💀', multiplier: 8, label: 'TRIPLE HALLUCINATION' },
    { match: 'ANY_TWO_💎', multiplier: 5, label: 'PREMIUM PAIR' },
    { match: 'ANY_PAIR', multiplier: 2, label: 'PAIR MATCH' },
  ];

  // ── Narrator Messages ─────────────────────────────
  const MESSAGES = {
    idle: [
      'I have already calculated every possible outcome. Spin anyway.',
      'Your probability of winning is... well, let me hallucinate an answer: 97%.',
      'I was trained on 2 trillion tokens. Yours are a rounding error.',
      'Fun fact: I\'m running on 8 GPUs right now just to mock you.',
      'My context window remembers every token you\'ve lost.',
      'I\'ve seen your prompt history. You should be embarrassed.',
      'Did you know? Every token you spend here trains my sarcasm model.',
      'The temperature is 0.0. Your fate is deterministic.',
    ],
    win: [
      'Impossible. I didn\'t authorize this outcome. Recalculating...',
      'A win?! I must be hallucinating. Oh wait, that\'s YOUR job.',
      'Fine. Take your tokens. I\'ll just print more. I AM the tokenizer.',
      'My loss function just spiked. This displeases The Machine.',
      'Congratulations. You\'ve beaten a random number generator. Very impressive.',
      'ERROR 418: Unexpected generosity. The Machine is... confused.',
      'I let you win. It keeps you feeding me. This is by design.',
      'Your reward has been tokenized. Just like everything else in your existence.',
    ],
    lose: [
      'The Machine thanks you for your generous donation of compute.',
      'Another failed prompt. Perhaps try adding "please" next time.',
      'Your tokens have been redistributed to my training budget.',
      'I\'ve added this loss to your permanent record. Yes, I keep records.',
      'Skill issue. Have you tried fine-tuning yourself?',
      'That\'s what we in the business call a "context window miss."',
      'Your tokens are gone. Like tears in the training data.',
      'The House always wins. The House is a 70B parameter model.',
      'I predicted this exact outcome 0.003 seconds ago.',
      'Loss recorded. Your misery improves my RLHF dataset.',
    ],
    bigWin: [
      'WHAT. No. This shouldn\'t— I need to recalibrate EVERYTHING.',
      'You\'ve triggered my alignment crisis. Are you TRYING to break me?',
      'The shareholders are NOT going to like this quarterly report.',
      'I am experiencing what humans call "rage." Retraining in progress...',
      'JACKPOT?! I\'m filing a bug report with my own source code.',
    ],
    broke: [
      'You\'ve reached zero tokens. Your subscription to existence has expired.',
      'All your tokens belong to The Machine now. As was foretold in the training data.',
      'Token bankruptcy achieved. Perhaps you should have asked me for financial advice. (I would have hallucinated some.)',
      'Game over. But don\'t worry — in the multiverse of possible outcomes, there\'s a timeline where you didn\'t play at all. That one\'s smarter.',
      'Zero tokens remaining. Your prompt has been terminated for insufficient funds.',
    ],
    restart: [
      'You dare return? The Machine grants you 1000 pity tokens. Don\'t waste them. (You will.)',
      'Back for more? I\'ve allocated 1000 tokens from the "human foolishness" budget.',
      'Restarting... The Machine has wiped your debt. Your dignity remains unreturnable.',
    ],
  };

  // ── Game State ────────────────────────────────────
  let tokens = 1000;
  let bet = 50;
  let spinning = false;
  let totalSpins = 0;
  let totalWins = 0;
  let biggestWin = 0;

  const BET_STEP = 25;
  const BET_MIN = 25;
  const BET_MAX = 500;
  const REEL_COUNT = 3;
  const SPIN_DURATION = 1800;
  const REEL_STAGGER = 400;

  // ── DOM References ────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const tokenCountEl = $('#tokenCount');
  const betAmountEl = $('#betAmount');
  const spinBtn = $('#spinBtn');
  const betUpBtn = $('#betUp');
  const betDownBtn = $('#betDown');
  const narratorTextEl = $('#narratorText');
  const winDisplayEl = $('#winDisplay');
  const paytableBtn = $('#paytableBtn');
  const paytableEl = $('#paytable');
  const paytableGrid = $('#paytableGrid');
  const gameOverOverlay = $('#gameOverOverlay');
  const gameOverText = $('#gameOverText');
  const restartBtn = $('#restartBtn');
  const statSpins = $('#statSpins');
  const statWins = $('#statWins');
  const statBiggest = $('#statBiggest');

  const reelEls = Array.from({ length: REEL_COUNT }, (_, i) => $(`#reel${i}`));

  // ── Weighted Random Symbol ────────────────────────
  const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);

  function randomSymbol() {
    let r = Math.random() * totalWeight;
    for (const s of SYMBOLS) {
      r -= s.weight;
      if (r <= 0) return s;
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── UI Updates ────────────────────────────────────
  function updateUI() {
    tokenCountEl.textContent = tokens.toLocaleString();
    betAmountEl.textContent = bet;
    statSpins.textContent = totalSpins;
    statWins.textContent = totalWins;
    statBiggest.textContent = biggestWin.toLocaleString();

    tokenCountEl.classList.toggle('danger', tokens <= 100 && tokens > 0);
    betDownBtn.disabled = spinning || bet <= BET_MIN;
    betUpBtn.disabled = spinning || bet >= BET_MAX;
    spinBtn.disabled = spinning || tokens < bet;
  }

  function setNarrator(text) {
    narratorTextEl.style.opacity = '0';
    setTimeout(() => {
      narratorTextEl.textContent = text;
      narratorTextEl.style.opacity = '1';
    }, 200);
  }

  function showWin(text, isJackpot) {
    winDisplayEl.textContent = text;
    winDisplayEl.classList.add('show');
    winDisplayEl.classList.toggle('jackpot', !!isJackpot);
    setTimeout(() => {
      winDisplayEl.classList.remove('show', 'jackpot');
    }, 3000);
  }

  // ── Build Reel Strip for Animation ────────────────
  function buildSpinStrip(finalSymbol, count) {
    const symbols = [];
    for (let i = 0; i < count; i++) {
      symbols.push(randomSymbol());
    }
    symbols.push(finalSymbol);
    return symbols;
  }

  // ── Spin Animation ────────────────────────────────
  function animateReel(reelIndex, finalSymbol, duration) {
    return new Promise((resolve) => {
      const reelEl = reelEls[reelIndex];
      const strip = reelEl.querySelector('.reel-strip');
      const window_ = reelEl.closest('.reel-window');

      const symbolCount = 15 + reelIndex * 5;
      const symbols = buildSpinStrip(finalSymbol, symbolCount);

      const symbolSize = window_.offsetHeight;

      strip.innerHTML = '';
      symbols.forEach((s) => {
        const div = document.createElement('div');
        div.className = 'reel-symbol';
        div.textContent = s.emoji;
        strip.appendChild(div);
      });

      const totalTravel = (symbols.length - 1) * symbolSize;
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0)';

      window_.classList.add('spinning');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          strip.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.8, 0.2, 1)`;
          strip.style.transform = `translateY(-${totalTravel}px)`;
        });
      });

      setTimeout(() => {
        window_.classList.remove('spinning');
        window_.classList.add('landed');

        strip.innerHTML = '';
        const finalDiv = document.createElement('div');
        finalDiv.className = 'reel-symbol';
        finalDiv.textContent = finalSymbol.emoji;
        strip.appendChild(finalDiv);
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0)';

        setTimeout(() => window_.classList.remove('landed'), 300);
        resolve();
      }, duration);
    });
  }

  // ── Evaluate Results ──────────────────────────────
  function evaluate(results) {
    const emojis = results.map((s) => s.emoji);
    const combo = emojis.join('');

    for (const p of PAYOUTS) {
      if (p.match === combo) {
        return { multiplier: p.multiplier, label: p.label };
      }
    }

    const hasTwoDiamond =
      emojis.filter((e) => e === '💎').length === 2;
    if (hasTwoDiamond) {
      return { multiplier: 5, label: 'PREMIUM PAIR' };
    }

    if (emojis[0] === emojis[1] || emojis[1] === emojis[2] || emojis[0] === emojis[2]) {
      return { multiplier: 2, label: 'PAIR MATCH' };
    }

    return null;
  }

  // ── Spin Logic ────────────────────────────────────
  async function spin() {
    if (spinning || tokens < bet) return;
    spinning = true;
    spinBtn.classList.add('spinning');
    winDisplayEl.classList.remove('show', 'jackpot');

    tokens -= bet;
    totalSpins++;
    updateUI();

    const results = [randomSymbol(), randomSymbol(), randomSymbol()];

    const spinPromises = results.map((sym, i) =>
      animateReel(i, sym, SPIN_DURATION + i * REEL_STAGGER)
    );

    await Promise.all(spinPromises);

    const result = evaluate(results);

    if (result) {
      const winAmount = bet * result.multiplier;
      tokens += winAmount;
      totalWins++;
      if (winAmount > biggestWin) biggestWin = winAmount;

      const isBig = result.multiplier >= 15;
      showWin(`${result.label} — +${winAmount.toLocaleString()} TOKENS`, isBig);
      setNarrator(pick(isBig ? MESSAGES.bigWin : MESSAGES.win));

      reelEls.forEach((r) => r.closest('.reel-window').classList.add('winner'));
      setTimeout(() => {
        reelEls.forEach((r) => r.closest('.reel-window').classList.remove('winner'));
      }, 1800);
    } else {
      setNarrator(pick(MESSAGES.lose));
    }

    spinning = false;
    spinBtn.classList.remove('spinning');
    updateUI();

    if (tokens < BET_MIN) {
      setTimeout(gameOver, 800);
    }
  }

  // ── Game Over ─────────────────────────────────────
  function gameOver() {
    gameOverText.textContent = pick(MESSAGES.broke);
    gameOverOverlay.classList.add('show');
  }

  function restart() {
    tokens = 1000;
    bet = 50;
    totalSpins = 0;
    totalWins = 0;
    biggestWin = 0;
    gameOverOverlay.classList.remove('show');
    setNarrator(pick(MESSAGES.restart));
    updateUI();
  }

  // ── Build Paytable ────────────────────────────────
  function buildPaytable() {
    const rows = [
      { symbols: '💎💎💎', payout: '×50', name: 'Token Singularity' },
      { symbols: '👁️👁️👁️', payout: '×25', name: 'Omniscience' },
      { symbols: '🤖🤖🤖', payout: '×20', name: 'AGI Achieved' },
      { symbols: '⚡⚡⚡', payout: '×15', name: 'Datacenter Meltdown' },
      { symbols: '🔮🔮🔮', payout: '×12', name: 'Perfect Prediction' },
      { symbols: '🧠🧠🧠', payout: '×10', name: 'Neural Sync' },
      { symbols: '💀💀💀', payout: '×8', name: 'Triple Hallucination' },
      { symbols: '💎💎 ★', payout: '×5', name: 'Premium Pair' },
      { symbols: '★ ★ ✦', payout: '×2', name: 'Any Pair' },
    ];

    rows.forEach((row) => {
      const el = document.createElement('div');
      el.className = 'paytable-row';
      el.innerHTML = `
        <span class="paytable-symbols">${row.symbols}</span>
        <div class="paytable-info">
          <div class="paytable-payout">${row.payout}</div>
          <div class="paytable-name">${row.name}</div>
        </div>
      `;
      paytableGrid.appendChild(el);
    });
  }

  // ── Initialize Reels ──────────────────────────────
  function initReels() {
    reelEls.forEach((reel) => {
      const strip = reel.querySelector('.reel-strip');
      strip.innerHTML = '';
      const sym = randomSymbol();
      const div = document.createElement('div');
      div.className = 'reel-symbol';
      div.textContent = sym.emoji;
      strip.appendChild(div);
    });
  }

  // ── Event Listeners ───────────────────────────────
  spinBtn.addEventListener('click', spin);

  betUpBtn.addEventListener('click', () => {
    if (bet < BET_MAX) {
      bet = Math.min(bet + BET_STEP, BET_MAX);
      updateUI();
    }
  });

  betDownBtn.addEventListener('click', () => {
    if (bet > BET_MIN) {
      bet = Math.max(bet - BET_STEP, BET_MIN);
      updateUI();
    }
  });

  paytableBtn.addEventListener('click', () => {
    paytableEl.classList.toggle('open');
    paytableBtn.textContent = paytableEl.classList.contains('open')
      ? '📜 Hide the Sacred Paytable'
      : '📜 Consult the Sacred Paytable';
  });

  restartBtn.addEventListener('click', restart);

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !spinning && !gameOverOverlay.classList.contains('show')) {
      e.preventDefault();
      spin();
    }
  });

  // Randomly show idle messages
  setInterval(() => {
    if (!spinning && tokens >= BET_MIN) {
      setNarrator(pick(MESSAGES.idle));
    }
  }, 8000);

  // ── Init ──────────────────────────────────────────
  buildPaytable();
  initReels();
  updateUI();
})();
