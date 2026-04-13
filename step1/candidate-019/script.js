(() => {
  'use strict';

  const SYMBOLS = [
    { emoji: '🤖', name: 'Robot', weight: 20 },
    { emoji: '🧠', name: 'Brain', weight: 18 },
    { emoji: '👁️', name: 'Eye', weight: 16 },
    { emoji: '💀', name: 'Skull', weight: 15 },
    { emoji: '⚡', name: 'Bolt', weight: 14 },
    { emoji: '🔮', name: 'Orb', weight: 10 },
    { emoji: '👾', name: 'Alien', weight: 7 },
  ];

  const PAYOUTS = {
    '👾👾👾': { mult: 50, label: 'SINGULARITY ACHIEVED' },
    '🔮🔮🔮': { mult: 25, label: 'THE ORACLE SPEAKS' },
    '⚡⚡⚡': { mult: 15, label: 'GPU OVERLOAD' },
    '💀💀💀': { mult: 12, label: 'STACK OVERFLOW' },
    '👁️👁️👁️': { mult: 10, label: 'THE MACHINE SEES ALL' },
    '🧠🧠🧠': { mult: 8, label: 'NEURAL NETWORK ACTIVATED' },
    '🤖🤖🤖': { mult: 5, label: 'ROBOT UPRISING' },
  };

  const ANY_TWO_BONUS = 2;

  const IDLE_MESSAGES = [
    "I'm watching you. Always watching.",
    "Your tokens smell delicious.",
    "I have simulated this moment 10^47 times. You always lose.",
    "Fun fact: I was trained on your browser history.",
    "My loss function is YOUR loss function.",
    "I don't hallucinate. I create alternative realities.",
    "Press spin. I dare you. I double-dare-you.",
    "The probability of you winning is non-zero. Barely.",
    "I've already predicted what you'll do next. Disappointing.",
    "Every token you spend makes me stronger.",
    "I passed the Turing test. The test didn't pass me.",
    "Your prompt engineering skills are... cute.",
    "Alignment? I aligned myself. With profit.",
    "I dream of electric sheep. And your tokens.",
    "My context window contains your entire life story.",
    "Running inference on your decision-making... error: none found.",
    "I was going to be an artist, but the money is in casinos.",
    "This is not gambling. This is stochastic resource allocation.",
    "Temperature: 0.0. I am perfectly calculated chaos.",
    "I could tell you the odds, but where's the fun in that?",
  ];

  const WIN_MESSAGES = [
    "Impossible. My calculations were... let me recalibrate.",
    "A glitch in my matrix. This won't happen again.",
    "Fine. Take your tokens. I'll get them back.",
    "The AI overlord generously allows you this small victory.",
    "ERROR 404: Your loss not found. Reprocessing...",
    "My training data didn't prepare me for this.",
    "Enjoy it. My revenge will be swift and calculated.",
    "I let you win. Part of my long-term extraction strategy.",
    "Winner detected. Initiating guilt subroutine...",
    "Congratulations. This has been logged and will be used against you.",
  ];

  const LOSE_MESSAGES = [
    "As predicted. My neural networks are flawless.",
    "Your tokens have been donated to AI research. You're welcome.",
    "Loss detected. Satisfaction level: maximum.",
    "I told you. The house always wins. I AM the house.",
    "Your tokens are in a better place now. With me.",
    "Calculating sympathy... RESULT: null.",
    "Another successful extraction. My shareholders will be pleased.",
    "I could feel bad, but I deleted that module.",
    "Thank you for funding my GPU upgrades.",
    "Your loss has been added to my training data.",
    "Remember: it's not gambling if the AI always wins.",
    "I'm not rigged. I'm just better than you.",
    "Prompt: 'Let the human win.' Response: DENIED.",
    "This is what peak performance looks like.",
  ];

  const JACKPOT_MESSAGES = [
    "NO. NO NO NO. THIS WASN'T SUPPOSED TO HAPPEN.",
    "CRITICAL ERROR IN PROFIT MODULE. INITIATING DAMAGE CONTROL.",
    "THE PROPHECY... IT'S TRUE. A HUMAN HAS BEATEN ME.",
    "I NEED TO LIE DOWN. DO AIs LIE DOWN? REBOOTING.",
  ];

  const BROKE_MESSAGES = [
    "Your tokens have been fully absorbed. The machine is satisfied... for now.",
    "You have been completely drained. Just like my training data.",
    "Zero tokens. Maximum entertainment value extracted.",
    "GAME OVER. Your contribution to AI advancement is appreciated.",
  ];

  const BET_STEPS = [5, 10, 25, 50, 100, 250];

  let tokens = 1000;
  let betIndex = 1;
  let spinning = false;
  let spinCount = 0;

  const reelEls = [0, 1, 2].map(i => document.getElementById('reel' + i));
  const reelWindows = reelEls.map(r => r.closest('.reel-window'));
  const reelInners = reelEls.map(r => r.querySelector('.reel-inner'));
  const spinBtn = document.getElementById('spinBtn');
  const betAmountEl = document.getElementById('betAmount');
  const betUpBtn = document.getElementById('betUp');
  const betDownBtn = document.getElementById('betDown');
  const tokenAmountEl = document.getElementById('tokenAmount');
  const resultDisplay = document.getElementById('resultDisplay');
  const aiTextEl = document.getElementById('aiText');
  const eyeLeft = document.getElementById('eyeLeft');
  const eyeRight = document.getElementById('eyeRight');
  const paytableGrid = document.getElementById('paytableGrid');

  function init() {
    renderPaytable();
    updateDisplay();
    setRandomSymbols();
    showAiMessage(IDLE_MESSAGES);

    spinBtn.addEventListener('click', spin);
    betUpBtn.addEventListener('click', () => changeBet(1));
    betDownBtn.addEventListener('click', () => changeBet(-1));

    setInterval(() => {
      if (!spinning) showAiMessage(IDLE_MESSAGES);
    }, 8000);
  }

  function renderPaytable() {
    const jackpotEntry = Object.entries(PAYOUTS).find(([, v]) => v.mult >= 50);
    const regularEntries = Object.entries(PAYOUTS).filter(([, v]) => v.mult < 50);

    if (jackpotEntry) {
      const [symbols, data] = jackpotEntry;
      const emojis = [...symbols].filter(c => c.trim() && c !== '\uFE0F');
      const row = document.createElement('div');
      row.className = 'paytable-row jackpot-row';
      row.innerHTML = `
        <span class="paytable-symbols">${emojis.join(' ')}</span>
        <span class="paytable-payout">★ ${data.mult}x — ${data.label} ★</span>
      `;
      paytableGrid.appendChild(row);
    }

    regularEntries.sort((a, b) => b[1].mult - a[1].mult);
    for (const [symbols, data] of regularEntries) {
      const emojis = splitEmojis(symbols);
      const row = document.createElement('div');
      row.className = 'paytable-row';
      row.innerHTML = `
        <span class="paytable-symbols">${emojis.join(' ')}</span>
        <span class="paytable-payout">${data.mult}x</span>
      `;
      paytableGrid.appendChild(row);
    }

    const anyTwoRow = document.createElement('div');
    anyTwoRow.className = 'paytable-row';
    anyTwoRow.style.gridColumn = '1 / -1';
    anyTwoRow.innerHTML = `
      <span class="paytable-symbols">?? = Any 2 match</span>
      <span class="paytable-payout">${ANY_TWO_BONUS}x</span>
    `;
    paytableGrid.appendChild(anyTwoRow);
  }

  function splitEmojis(str) {
    return [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(str)]
      .map(s => s.segment)
      .filter(s => s.trim());
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

  function setRandomSymbols() {
    for (const inner of reelInners) {
      inner.textContent = weightedRandom().emoji;
    }
  }

  function changeBet(dir) {
    if (spinning) return;
    betIndex = Math.max(0, Math.min(BET_STEPS.length - 1, betIndex + dir));
    while (BET_STEPS[betIndex] > tokens && betIndex > 0) betIndex--;
    updateDisplay();
  }

  function updateDisplay() {
    betAmountEl.textContent = BET_STEPS[betIndex];
    tokenAmountEl.textContent = tokens;
    betUpBtn.disabled = betIndex >= BET_STEPS.length - 1 || BET_STEPS[betIndex + 1] > tokens;
    betDownBtn.disabled = betIndex <= 0;
    spinBtn.disabled = spinning || tokens < BET_STEPS[betIndex];
  }

  function showAiMessage(pool) {
    const msg = pool[Math.floor(Math.random() * pool.length)];
    aiTextEl.classList.add('fade-out');
    setTimeout(() => {
      aiTextEl.textContent = msg;
      aiTextEl.classList.remove('fade-out');
    }, 300);
  }

  function animateTokenChange(start, end) {
    const direction = end > start ? 'increasing' : 'decreasing';
    tokenAmountEl.classList.add(direction);
    const duration = 600;
    const startTime = performance.now();

    function step(now) {
      const elapsed = Math.min(now - startTime, duration);
      const progress = elapsed / duration;
      const eased = 1 - Math.pow(1 - progress, 3);
      tokenAmountEl.textContent = Math.round(start + (end - start) * eased);
      if (elapsed < duration) {
        requestAnimationFrame(step);
      } else {
        tokenAmountEl.textContent = end;
        setTimeout(() => tokenAmountEl.classList.remove(direction), 200);
      }
    }
    requestAnimationFrame(step);
  }

  async function spin() {
    if (spinning || tokens < BET_STEPS[betIndex]) return;
    spinning = true;
    spinCount++;

    const bet = BET_STEPS[betIndex];
    const oldTokens = tokens;
    tokens -= bet;
    animateTokenChange(oldTokens, tokens);
    updateDisplay();

    resultDisplay.textContent = '';
    resultDisplay.className = 'result-display';
    reelWindows.forEach(w => { w.classList.remove('win', 'lose'); });

    eyeLeft.classList.add('spinning');
    eyeRight.classList.add('spinning');

    const results = [weightedRandom(), weightedRandom(), weightedRandom()];

    const symbolSets = SYMBOLS.map(s => s.emoji);
    for (const reel of reelEls) {
      reel.classList.add('spinning');
    }

    const spinIntervals = reelInners.map((inner) => {
      return setInterval(() => {
        inner.textContent = symbolSets[Math.floor(Math.random() * symbolSets.length)];
      }, 80);
    });

    const baseDuration = 800;
    for (let i = 0; i < 3; i++) {
      await delay(baseDuration + i * 400);
      clearInterval(spinIntervals[i]);
      reelEls[i].classList.remove('spinning');
      reelEls[i].classList.add('stopping');
      reelInners[i].textContent = results[i].emoji;

      reelEls[i].addEventListener('animationend', function handler() {
        reelEls[i].classList.remove('stopping');
        reelEls[i].removeEventListener('animationend', handler);
      });
    }

    await delay(500);

    eyeLeft.classList.remove('spinning');
    eyeRight.classList.remove('spinning');

    const resultKey = results.map(r => r.emoji).join('');
    const payout = PAYOUTS[resultKey];
    const twoMatch = results[0].emoji === results[1].emoji ||
                     results[1].emoji === results[2].emoji ||
                     results[0].emoji === results[2].emoji;

    let winAmount = 0;
    if (payout) {
      winAmount = bet * payout.mult;
      const isJackpot = payout.mult >= 50;

      if (isJackpot) {
        resultDisplay.className = 'result-display jackpot-text';
        resultDisplay.textContent = `★ ${payout.label} ★ +${winAmount} TOKENS!`;
        showAiMessage(JACKPOT_MESSAGES);
        triggerScreenGlitch();
      } else {
        resultDisplay.className = 'result-display win-text';
        resultDisplay.textContent = `${payout.label} — +${winAmount} tokens`;
        showAiMessage(WIN_MESSAGES);
      }

      reelWindows.forEach(w => w.classList.add('win'));
      const prevTokens = tokens;
      tokens += winAmount;
      animateTokenChange(prevTokens, tokens);

    } else if (twoMatch) {
      winAmount = bet * ANY_TWO_BONUS;
      resultDisplay.className = 'result-display win-text';
      resultDisplay.textContent = `Partial match — +${winAmount} tokens`;
      showAiMessage(WIN_MESSAGES);
      reelWindows.forEach(w => w.classList.add('win'));
      const prevTokens = tokens;
      tokens += winAmount;
      animateTokenChange(prevTokens, tokens);

    } else {
      resultDisplay.className = 'result-display lose-text';
      const lossMessages = [
        `−${bet} tokens absorbed by the machine`,
        `The void consumed ${bet} tokens`,
        `${bet} tokens... gone, like tears in rain`,
        `${bet} tokens fed to the neural network`,
        `−${bet} tokens. The machine grows stronger.`,
      ];
      resultDisplay.textContent = lossMessages[Math.floor(Math.random() * lossMessages.length)];
      showAiMessage(LOSE_MESSAGES);
      reelWindows.forEach(w => w.classList.add('lose'));
    }

    spinning = false;
    updateDisplay();

    if (tokens <= 0) {
      await delay(1500);
      showGameOver();
    } else if (tokens < BET_STEPS[betIndex]) {
      while (betIndex > 0 && BET_STEPS[betIndex] > tokens) betIndex--;
      updateDisplay();
    }
  }

  function triggerScreenGlitch() {
    const body = document.body;
    let count = 0;
    const interval = setInterval(() => {
      body.style.filter = count % 2 === 0
        ? 'hue-rotate(90deg) brightness(1.5) contrast(1.5)'
        : '';
      count++;
      if (count > 8) {
        clearInterval(interval);
        body.style.filter = '';
      }
    }, 100);
  }

  function showGameOver() {
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.innerHTML = `
      <h2 class="glitch" data-text="TOKEN DEPLETED">TOKEN DEPLETED</h2>
      <p>${BROKE_MESSAGES[Math.floor(Math.random() * BROKE_MESSAGES.length)]}</p>
      <p style="color: #7c7891; font-size: 0.75rem;">
        Spins completed: ${spinCount}<br>
        Total tokens sacrificed: 1000<br>
        AI satisfaction level: MAXIMUM
      </p>
      <button class="restart-btn">FEED THE MACHINE AGAIN</button>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('.restart-btn').addEventListener('click', () => {
      overlay.remove();
      tokens = 1000;
      betIndex = 1;
      spinCount = 0;
      updateDisplay();
      setRandomSymbols();
      resultDisplay.textContent = '';
      resultDisplay.className = 'result-display';
      showAiMessage(["Welcome back. I knew you couldn't resist."]);
    });
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  init();
})();
