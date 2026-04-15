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

  // --- MATRIX RAIN BACKGROUND ---

  function initMatrixRain() {
    const canvas = document.getElementById('matrix-bg');
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01AIGPT';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff41';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      requestAnimationFrame(draw);
    }

    draw();
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
    messageBox.classList.remove('win', 'lose', 'jackpot');
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

  // --- SPIN LOGIC ---

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
    messageBox.classList.remove('win', 'lose', 'jackpot');
    reels.forEach(r => r.classList.remove('winner', 'stopped'));

    setMessage('Running inference... please wait...', null);

    const results = Array.from({ length: REEL_COUNT }, () => randomSymbol());

    reels.forEach((reel, i) => {
      reel.classList.add('spinning');
      const symbolEl = reel.querySelector('.symbol');

      const flickerInterval = setInterval(() => {
        symbolEl.textContent = randomSymbol();
      }, 80);

      const stopTime = SPIN_DURATION_BASE + i * SPIN_STAGGER;

      setTimeout(() => {
        clearInterval(flickerInterval);
        reel.classList.remove('spinning');
        reel.classList.add('stopped');
        symbolEl.textContent = results[i];

        if (i === REEL_COUNT - 1) {
          setTimeout(() => resolveOutcome(results, previousBalance - bet), 300);
        }
      }, stopTime);
    });
  }

  function resolveOutcome(results, balanceAfterBet) {
    spinning = false;
    spinBtn.classList.remove('processing');
    spinText.textContent = 'GENERATE RESPONSE';

    const key = results.join('');
    const tripleMatch = PAYOUTS[key];

    let winAmount = 0;

    if (tripleMatch) {
      winAmount = bet * tripleMatch.multiplier;
    } else if (hasPair(results)) {
      winAmount = bet * PAIR_MULTIPLIER;
    }

    if (winAmount > 0) {
      const from = balance;
      balance += winAmount;
      animateBalance(from, balance);
      payline.classList.add('visible');

      if (tripleMatch) {
        reels.forEach(r => r.classList.add('winner'));

        if (tripleMatch.multiplier >= 20) {
          setMessage(
            tripleMatch.name + '! +'  + winAmount + ' tokens! ' + pick(JACKPOT_MESSAGES),
            'jackpot'
          );
        } else {
          setMessage(
            tripleMatch.name + '! +' + winAmount + ' tokens! ' + pick(WIN_MESSAGES),
            'win'
          );
        }
      } else {
        setMessage('Pair matched! +' + winAmount + ' tokens. ' + pick(WIN_MESSAGES), 'win');
      }
    } else {
      setMessage(pick(LOSE_MESSAGES), 'lose');
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
  setMessage('Insert tokens and press GENERATE to begin inference...', null);
})();
