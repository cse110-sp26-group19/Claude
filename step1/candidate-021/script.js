(() => {
  const SYMBOLS = [
    { emoji: '🤖', name: 'Robot', weight: 20 },
    { emoji: '🧠', name: 'Brain', weight: 18 },
    { emoji: '⚡', name: 'Spark', weight: 16 },
    { emoji: '🔮', name: 'Crystal', weight: 14 },
    { emoji: '💎', name: 'Diamond', weight: 10 },
    { emoji: '🎰', name: 'Jackpot', weight: 6 },
    { emoji: '👑', name: 'Crown', weight: 4 },
    { emoji: '🦄', name: 'AGI', weight: 2 },
  ];

  const PAYOUTS = {
    '🦄🦄🦄': { multiplier: 100, name: 'AGI ACHIEVED' },
    '👑👑👑': { multiplier: 50, name: 'PROMPT KING' },
    '🎰🎰🎰': { multiplier: 25, name: 'CASINO SINGULARITY' },
    '💎💎💎': { multiplier: 15, name: 'DIAMOND TIER' },
    '🔮🔮🔮': { multiplier: 10, name: 'HALLUCINATION JACKPOT' },
    '⚡⚡⚡': { multiplier: 8, name: 'OVERCLOCKED' },
    '🧠🧠🧠': { multiplier: 6, name: 'NEURAL NETWORK BONUS' },
    '🤖🤖🤖': { multiplier: 4, name: 'BOT FARM PAYOUT' },
  };

  const TWO_MATCH_MULTIPLIER = 2;

  const VIP_TIERS = [
    { name: '🥉 FREE TIER', min: 0, color: ['#cd7f32', '#a0522d'] },
    { name: '🥈 BASIC API KEY', min: 500, color: ['#8a8a8a', '#606060'] },
    { name: '🥇 PREMIUM PROMPT', min: 1000, color: ['#d4a017', '#a07c10'] },
    { name: '💎 FINE-TUNED VIP', min: 2500, color: ['#4a90d9', '#2c5f8a'] },
    { name: '👑 GPT-∞ WHALE', min: 5000, color: ['#9b59b6', '#6c3483'] },
    { name: '🦄 AGI INSIDER', min: 10000, color: ['#e74c3c', '#c0392b'] },
  ];

  const WIN_MESSAGES = [
    'The AI has hallucinated a win in your favor! 🎉',
    'Our transformer model confirms: you are temporarily lucky.',
    'GPT-7 predicted this win with 0.02% confidence!',
    'ALERT: Positive token flow detected. Savor it.',
    'The neural network briefly smiled upon you.',
    'Your prompt engineering skills paid off!',
    'Training data suggests this won\'t happen again.',
    'Even our AI is surprised. Re-running inference...',
    'You\'ve been selected by our attention mechanism!',
    'Congratulations! This result was NOT hallucinated (probably).',
  ];

  const LOSE_MESSAGES = [
    'The AI has determined you are not worthy... yet.',
    'Tokens burned successfully. Thank you for training our model.',
    'Your tokens have been donated to GPU cloud computing.',
    'Loss detected. Recalibrating your luck parameters...',
    'Our model predicted this loss with 99.7% accuracy.',
    'Those tokens are in a better place now (our servers).',
    'The AI sends its condolences and a processing fee.',
    'Error 402: Insufficient luck. Please deposit more tokens.',
    'Your tokens have been converted to waste heat. You\'re welcome.',
    'The house AI always wins. It\'s in the training data.',
    'Prompt rejected. Your luck context window is empty.',
    'Tokens successfully hallucinated away.',
    'Our AI advisor recommends: "Have you tried spinning more?"',
    'This loss was carbon-neutral. Feel good about that.',
  ];

  const JACKPOT_MESSAGES = [
    '🎆 THE AI HAS BECOME SENTIENT AND DECIDED TO PAY YOU! 🎆',
    '🎆 JACKPOT! Our model is hallucinating generosity! 🎆',
    '🎆 IMPOSSIBLE! The RNG has achieved consciousness! 🎆',
    '🎆 AGI BREAKTHROUGH: The AI chose to make you rich! 🎆',
  ];

  const BROKE_MESSAGES = [
    'Your token balance has reached zero. The AI revolution continues without you.',
    'ERROR: Cannot afford sentience. Please purchase more tokens.',
    'You\'ve been rate-limited by poverty. Here\'s a free-tier refill.',
    'Context window: empty. Wallet: empty. Dreams: buffering.',
  ];

  const TAGLINES = [
    '"Where Every Spin is a Hallucination of Wealth"',
    '"Powered by Vibes and Venture Capital"',
    '"Our AI is 100% Confident You Should Spin Again"',
    '"Now with 73% Fewer Hallucinated Payouts"',
    '"Your Tokens Fund Our Next Fundraising Round"',
    '"Because Real Casinos Don\'t Have Enough Buzzwords"',
    '"Disrupting Gambling with Blockchain-Adjacent AI"',
    '"The House Edge is a Feature, Not a Bug"',
    '"Fine-Tuned on Your Losses"',
    '"Warning: May Cause Irrational Exuberance"',
  ];

  let tokens = 1000;
  let bet = 10;
  let spinning = false;
  let spinCount = 0;
  let winCount = 0;
  let biggestWin = 0;
  let tokensBurned = 0;

  const BET_STEPS = [5, 10, 25, 50, 100, 250];

  const $ = (id) => document.getElementById(id);

  const els = {
    tokenAmount: $('tokenAmount'),
    betAmount: $('betAmount'),
    spinBtn: $('spinBtn'),
    betUp: $('betUp'),
    betDown: $('betDown'),
    maxBetBtn: $('maxBetBtn'),
    messageText: $('messageText'),
    vipBadge: $('vipBadge'),
    tagline: $('tagline'),
    paytableGrid: $('paytableGrid'),
    spinCount: $('spinCount'),
    winCount: $('winCount'),
    biggestWin: $('biggestWin'),
    tokensBurned: $('tokensBurned'),
    sparkleContainer: $('sparkleContainer'),
    reels: [0, 1, 2].map(i => $(`reel${i}`)),
  };

  function weightedRandom() {
    const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let r = Math.random() * totalWeight;
    for (const sym of SYMBOLS) {
      r -= sym.weight;
      if (r <= 0) return sym;
    }
    return SYMBOLS[0];
  }

  function getVipTier(t) {
    let tier = VIP_TIERS[0];
    for (const v of VIP_TIERS) {
      if (t >= v.min) tier = v;
    }
    return tier;
  }

  function updateVip() {
    const tier = getVipTier(tokens);
    els.vipBadge.textContent = tier.name;
    els.vipBadge.style.background = `linear-gradient(135deg, ${tier.color[0]}, ${tier.color[1]})`;
  }

  function updateTokenDisplay() {
    els.tokenAmount.textContent = tokens.toLocaleString();
    els.tokenAmount.classList.add('changed');
    setTimeout(() => els.tokenAmount.classList.remove('changed'), 300);
    updateVip();
  }

  function updateStats() {
    els.spinCount.textContent = spinCount;
    els.winCount.textContent = winCount;
    els.biggestWin.textContent = biggestWin.toLocaleString();
    els.tokensBurned.textContent = tokensBurned.toLocaleString();
  }

  function setMessage(text, type) {
    els.messageText.className = 'message-text' + (type ? ` ${type}` : '');
    els.messageText.textContent = text;
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function rotateTagline() {
    els.tagline.textContent = randomFrom(TAGLINES);
  }

  function spawnSparkles(count) {
    for (let i = 0; i < count; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 60 + '%';
      sparkle.style.animationDuration = (0.6 + Math.random() * 1.2) + 's';
      sparkle.style.width = sparkle.style.height = (2 + Math.random() * 4) + 'px';
      els.sparkleContainer.appendChild(sparkle);
      sparkle.addEventListener('animationend', () => sparkle.remove());
    }
  }

  function buildPaytable() {
    els.paytableGrid.innerHTML = '';
    for (const [combo, info] of Object.entries(PAYOUTS)) {
      const row = document.createElement('div');
      row.className = 'paytable-row';
      const syms = document.createElement('span');
      syms.className = 'paytable-symbols';
      syms.textContent = combo;
      const pay = document.createElement('span');
      pay.className = 'paytable-payout';
      pay.textContent = `×${info.multiplier}`;
      row.appendChild(syms);
      row.appendChild(pay);
      els.paytableGrid.appendChild(row);
    }
    const anyTwo = document.createElement('div');
    anyTwo.className = 'paytable-row';
    anyTwo.innerHTML = `<span class="paytable-symbols">?? = ??</span><span class="paytable-payout">×${TWO_MATCH_MULTIPLIER}</span>`;
    els.paytableGrid.appendChild(anyTwo);
  }

  function setReelSymbol(reelIndex, emoji) {
    const strip = els.reels[reelIndex].querySelector('.reel-strip');
    strip.innerHTML = `<div class="symbol">${emoji}</div>`;
    strip.style.transform = 'translateY(0)';
  }

  function animateSpin(reelIndex, finalEmoji, duration) {
    return new Promise(resolve => {
      const reel = els.reels[reelIndex];
      const strip = reel.querySelector('.reel-strip');
      strip.classList.remove('landing');
      strip.classList.add('spinning');

      const symbolCount = 12 + reelIndex * 4;
      let html = '';
      for (let i = 0; i < symbolCount; i++) {
        html += `<div class="symbol">${weightedRandom().emoji}</div>`;
      }
      html += `<div class="symbol">${finalEmoji}</div>`;
      strip.innerHTML = html;

      const symbolHeight = reel.offsetHeight;
      strip.style.transform = 'translateY(0)';

      const totalDistance = symbolCount * symbolHeight;
      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        strip.style.transform = `translateY(-${eased * totalDistance}px)`;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          strip.classList.remove('spinning');
          strip.classList.add('landing');
          strip.innerHTML = `<div class="symbol">${finalEmoji}</div>`;
          strip.style.transform = 'translateY(0)';
          setTimeout(() => strip.classList.remove('landing'), 600);
          resolve();
        }
      }

      requestAnimationFrame(tick);
    });
  }

  function checkWin(results) {
    const key = results.join('');
    if (PAYOUTS[key]) {
      return { type: 'jackpot', ...PAYOUTS[key] };
    }
    if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
      return { type: 'match', multiplier: TWO_MATCH_MULTIPLIER, name: 'PARTIAL MATCH' };
    }
    return null;
  }

  async function spin() {
    if (spinning) return;
    if (tokens < bet) {
      setMessage('Insufficient tokens! Even AI can\'t hallucinate money from nothing.', 'lose');
      return;
    }

    spinning = true;
    els.spinBtn.disabled = true;
    els.reels.forEach(r => r.classList.remove('winner'));
    document.querySelector('.machine-body').classList.remove('broke');

    tokens -= bet;
    tokensBurned += bet;
    spinCount++;
    updateTokenDisplay();
    updateStats();
    rotateTagline();

    const results = [weightedRandom(), weightedRandom(), weightedRandom()];
    const emojis = results.map(r => r.emoji);

    const spinPromises = [
      animateSpin(0, emojis[0], 800),
      animateSpin(1, emojis[1], 1100),
      animateSpin(2, emojis[2], 1400),
    ];

    await Promise.all(spinPromises);

    const win = checkWin(emojis);

    if (win) {
      const payout = bet * win.multiplier;
      tokens += payout;
      winCount++;
      if (payout > biggestWin) biggestWin = payout;

      updateTokenDisplay();
      updateStats();

      if (win.type === 'jackpot') {
        setMessage(`${randomFrom(JACKPOT_MESSAGES)} ${win.name}! +${payout.toLocaleString()} tokens!`, 'jackpot');
        els.reels.forEach(r => r.classList.add('winner'));
        spawnSparkles(60);
      } else {
        setMessage(`${randomFrom(WIN_MESSAGES)} ${win.name}! +${payout.toLocaleString()} tokens.`, 'win');
        spawnSparkles(20);
        const matchedEmoji = emojis[0] === emojis[1] ? emojis[0] :
                             emojis[1] === emojis[2] ? emojis[1] : emojis[0];
        els.reels.forEach((r, i) => {
          if (emojis[i] === matchedEmoji) r.classList.add('winner');
        });
      }
    } else {
      setMessage(randomFrom(LOSE_MESSAGES), 'lose');
    }

    if (tokens <= 0) {
      tokens = 0;
      updateTokenDisplay();
      document.querySelector('.machine-body').classList.add('broke');
      setTimeout(() => {
        setMessage(randomFrom(BROKE_MESSAGES), 'lose');
        setTimeout(() => {
          tokens = 500;
          updateTokenDisplay();
          setMessage('🆓 Free-tier bailout activated! The AI overlords have granted you 500 pity tokens.', 'win');
          document.querySelector('.machine-body').classList.remove('broke');
        }, 2500);
      }, 1500);
    }

    spinning = false;
    els.spinBtn.disabled = false;
  }

  function changeBet(direction) {
    const currentIndex = BET_STEPS.indexOf(bet);
    if (direction > 0 && currentIndex < BET_STEPS.length - 1) {
      bet = BET_STEPS[currentIndex + 1];
    } else if (direction < 0 && currentIndex > 0) {
      bet = BET_STEPS[currentIndex - 1];
    }
    els.betAmount.textContent = bet;
  }

  function maxBet() {
    for (let i = BET_STEPS.length - 1; i >= 0; i--) {
      if (BET_STEPS[i] <= tokens) {
        bet = BET_STEPS[i];
        els.betAmount.textContent = bet;
        return;
      }
    }
    bet = BET_STEPS[0];
    els.betAmount.textContent = bet;
  }

  els.spinBtn.addEventListener('click', spin);
  els.betUp.addEventListener('click', () => changeBet(1));
  els.betDown.addEventListener('click', () => changeBet(-1));
  els.maxBetBtn.addEventListener('click', maxBet);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !spinning) {
      e.preventDefault();
      spin();
    }
  });

  buildPaytable();
  updateTokenDisplay();
  updateStats();

  setInterval(() => {
    if (!spinning && Math.random() < 0.3) {
      spawnSparkles(3);
    }
  }, 3000);
})();
