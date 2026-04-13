(function () {
  'use strict';

  const SYMBOLS = [
    { emoji: '🤖', name: 'Robot', weight: 18 },
    { emoji: '🧠', name: 'Brain', weight: 16 },
    { emoji: '💀', name: 'Skull', weight: 14 },
    { emoji: '🔥', name: 'Fire', weight: 14 },
    { emoji: '✨', name: 'Sparkle', weight: 12 },
    { emoji: '🦾', name: 'MechArm', weight: 10 },
    { emoji: '👁️', name: 'Eye', weight: 8 },
    { emoji: '💎', name: 'Diamond', weight: 5 },
    { emoji: '🌈', name: 'AGI', weight: 3 },
  ];

  const PAYOUTS = {
    '🌈🌈🌈': { mult: 100, label: 'AGI ACHIEVED — Singularity bonus!' },
    '💎💎💎': { mult: 50, label: 'Venture capital secured!' },
    '👁️👁️👁️': { mult: 25, label: 'The model is watching you back!' },
    '🦾🦾🦾': { mult: 15, label: 'Full automation deployed!' },
    '✨✨✨': { mult: 10, label: 'Maximum sparkle — marketing approved!' },
    '🔥🔥🔥': { mult: 8, label: 'GPUs on fire! (literally)' },
    '💀💀💀': { mult: 6, label: 'Your training run died... in style!' },
    '🧠🧠🧠': { mult: 4, label: 'Neural network fully connected!' },
    '🤖🤖🤖': { mult: 3, label: 'Another chatbot wrapper funded!' },
  };

  const ANY_TWO_BONUS = 1.5;

  const WIN_MESSAGES = [
    "The model didn't hallucinate for once!",
    'Your prompt engineering paid off!',
    'Congratulations! You beat the temperature parameter!',
    'The attention mechanism is attending to YOUR wallet!',
    'Fine-tuned for profit! (this time)',
    'RLHF says: reward signal detected!',
    'Your loss function actually decreased!',
    'Token prediction: CORRECT (for once)',
    'The weights aligned in your favor!',
    'Gradient descent found a local minimum of sadness!',
    'Even GPT-5 couldn\'t have predicted this win!',
    'Your embedding landed in the "money" cluster!',
  ];

  const LOSE_MESSAGES = [
    'The model hallucinated your winnings.',
    'Your tokens have been fed to the void.',
    'Training loss: increasing. Wallet: decreasing.',
    'The AI confidently predicted you\'d win. It was wrong.',
    'Catastrophic forgetting... of your balance.',
    'Error 402: Insufficient tokens for happiness.',
    'The transformer transformed your tokens into nothing.',
    'Mode collapse detected in your luck distribution.',
    'Your prompt was too vague. The machine returned garbage.',
    'Overfitting to the losing distribution.',
    'The attention heads looked everywhere except your wallet.',
    'Another failed inference. Consider retraining your strategy.',
    'RLHF feedback: this spin was not helpful.',
    'Tokenizer error: your hopes were out of vocabulary.',
    'Beam search explored all paths. None led to profit.',
    'The softmax function softly said: no.',
  ];

  const NEAR_MISS_MESSAGES = [
    'So close! The model almost got it right (as usual).',
    'Two out of three — like most AI benchmarks.',
    'Almost! The last reel had a hallucination.',
    'The context window cut off right before your win.',
    'Nearly there! Just need another $10M in compute.',
  ];

  const GAME_OVER_SUBTEXTS = [
    'Just like a real AI project budget.',
    'Have you considered a Series B?',
    'The inference costs were... significant.',
    'At least the VCs aren\'t watching.',
    '"We\'ll optimize costs later." — Every AI startup',
    'Your runway just hit zero. Pivot to consulting?',
    'Context window: full. Wallet: empty.',
  ];

  const IDLE_MESSAGES = [
    'Insert tokens to generate a completion...',
    'The model awaits your input...',
    'Sampling from the distribution of bad decisions...',
    'Warming up the GPUs...',
    'Loading weights from the casino layer...',
    'Attention is all you need (and tokens)...',
  ];

  const BET_STEPS = [5, 10, 25, 50, 100, 250];
  const STARTING_TOKENS = 1000;
  const REEL_COUNT = 3;
  const SYMBOLS_IN_STRIP = 40;
  const SPIN_DURATION_BASE = 1800;
  const SPIN_DURATION_STAGGER = 500;

  let tokens = STARTING_TOKENS;
  let betIndex = 1;
  let spinning = false;
  let autoSpin = false;
  let spinHistory = [];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    tokenCount: $('#tokenCount'),
    burnRate: $('#burnRate'),
    messageBox: $('#messageBox'),
    messageText: $('#messageText'),
    spinBtn: $('#spinBtn'),
    betAmount: $('#betAmount'),
    betUp: $('#betUp'),
    betDown: $('#betDown'),
    autoBtn: $('#autoBtn'),
    maxBetBtn: $('#maxBetBtn'),
    paytableToggle: $('#paytableToggle'),
    paytable: $('#paytable'),
    paytableGrid: $('#paytableGrid'),
    historyList: $('#historyList'),
    gameOverModal: $('#gameOverModal'),
    modalSubtext: $('#modalSubtext'),
    restartBtn: $('#restartBtn'),
    machine: $('.machine'),
    payline: $('.payline'),
    reels: Array.from({ length: REEL_COUNT }, (_, i) => $(`#reel${i}`)),
  };

  function weightedRandomSymbol() {
    const totalWeight = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
    let r = Math.random() * totalWeight;
    for (const sym of SYMBOLS) {
      r -= sym.weight;
      if (r <= 0) return sym;
    }
    return SYMBOLS[0];
  }

  function buildReelStrip(reelEl) {
    const strip = reelEl.querySelector('.reel-strip');
    strip.innerHTML = '';
    const symbols = [];
    for (let i = 0; i < SYMBOLS_IN_STRIP; i++) {
      const sym = weightedRandomSymbol();
      symbols.push(sym);
      const div = document.createElement('div');
      div.className = 'reel-symbol';
      div.textContent = sym.emoji;
      div.setAttribute('data-symbol', sym.emoji);
      strip.appendChild(div);
    }
    return symbols;
  }

  function getSymbolHeight() {
    const window = els.reels[0].closest('.reel-window');
    return window.clientHeight;
  }

  function initReels() {
    els.reels.forEach((reel) => {
      const symbols = buildReelStrip(reel);
      reel._symbols = symbols;
      reel._currentIndex = 0;
      const strip = reel.querySelector('.reel-strip');
      strip.style.transition = 'none';
      strip.style.transform = `translateY(0px)`;
    });
  }

  function spinReel(reelIndex, targetSymbol) {
    return new Promise((resolve) => {
      const reel = els.reels[reelIndex];
      const strip = reel.querySelector('.reel-strip');
      const symbols = reel._symbols;
      const symHeight = getSymbolHeight();

      let targetIndex = -1;
      const searchStart = Math.floor(SYMBOLS_IN_STRIP * 0.6);
      for (let i = searchStart; i < symbols.length; i++) {
        if (symbols[i].emoji === targetSymbol.emoji) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex === -1) {
        targetIndex = searchStart;
        symbols[targetIndex] = targetSymbol;
        strip.children[targetIndex].textContent = targetSymbol.emoji;
        strip.children[targetIndex].setAttribute('data-symbol', targetSymbol.emoji);
      }

      const totalDistance = targetIndex * symHeight;
      const duration = SPIN_DURATION_BASE + reelIndex * SPIN_DURATION_STAGGER;

      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0px)';
      strip.offsetHeight; // force reflow

      strip.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
      strip.style.transform = `translateY(-${totalDistance}px)`;

      setTimeout(() => {
        reel._currentIndex = targetIndex;
        resolve(targetSymbol);
      }, duration);
    });
  }

  function determineResults() {
    const results = [];
    for (let i = 0; i < REEL_COUNT; i++) {
      results.push(weightedRandomSymbol());
    }
    return results;
  }

  function calculateWin(results, bet) {
    const key = results.map((r) => r.emoji).join('');
    if (PAYOUTS[key]) {
      return {
        amount: Math.floor(bet * PAYOUTS[key].mult),
        message: PAYOUTS[key].label,
        type: 'jackpot',
      };
    }

    if (results[0].emoji === results[1].emoji || results[1].emoji === results[2].emoji || results[0].emoji === results[2].emoji) {
      const matchedSymbol = results[0].emoji === results[1].emoji ? results[0]
        : results[1].emoji === results[2].emoji ? results[1] : results[0];
      return {
        amount: Math.floor(bet * ANY_TWO_BONUS),
        message: NEAR_MISS_MESSAGES[Math.floor(Math.random() * NEAR_MISS_MESSAGES.length)],
        type: 'partial',
        matchedSymbol,
      };
    }

    return { amount: 0, message: null, type: 'loss' };
  }

  function updateTokenDisplay(animated) {
    els.tokenCount.textContent = tokens.toLocaleString();
    els.burnRate.textContent = `~$${(getCurrentBet() * 0.002).toFixed(3)}/spin`;

    if (animated) {
      els.tokenCount.classList.remove('win-flash', 'loss-flash');
      void els.tokenCount.offsetHeight;
      els.tokenCount.classList.add(animated);
      setTimeout(() => els.tokenCount.classList.remove('win-flash', 'loss-flash'), 600);
    }
  }

  function getCurrentBet() {
    return BET_STEPS[betIndex];
  }

  function setMessage(text, type) {
    els.messageText.textContent = text;
    els.messageBox.classList.remove('win', 'lose');
    if (type) els.messageBox.classList.add(type);
  }

  function randomMessage(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function addHistoryEntry(results, net) {
    const entry = {
      symbols: results.map((r) => r.emoji).join(''),
      net,
    };
    spinHistory.unshift(entry);
    if (spinHistory.length > 50) spinHistory.pop();
    renderHistory();
  }

  function renderHistory() {
    els.historyList.innerHTML = '';
    const toShow = spinHistory.slice(0, 20);
    toShow.forEach((entry) => {
      const div = document.createElement('div');
      div.className = 'history-entry';
      const syms = document.createElement('span');
      syms.className = 'history-symbols';
      syms.textContent = entry.symbols;
      const result = document.createElement('span');
      result.className = 'history-result ' + (entry.net > 0 ? 'win' : 'lose');
      result.textContent = entry.net > 0 ? `+${entry.net}` : `${entry.net}`;
      div.appendChild(syms);
      div.appendChild(result);
      els.historyList.appendChild(div);
    });
  }

  function showGameOver() {
    els.modalSubtext.textContent = randomMessage(GAME_OVER_SUBTEXTS);
    els.gameOverModal.classList.add('visible');
  }

  function restart() {
    tokens = STARTING_TOKENS;
    spinHistory = [];
    autoSpin = false;
    els.autoBtn.classList.remove('active');
    els.autoBtn.textContent = 'AUTO-PROMPT';
    els.gameOverModal.classList.remove('visible');
    updateTokenDisplay();
    setMessage(randomMessage(IDLE_MESSAGES));
    renderHistory();
    initReels();
  }

  async function spin() {
    const bet = getCurrentBet();
    if (spinning || tokens < bet) return;

    spinning = true;
    els.spinBtn.disabled = true;
    els.machine.classList.add('spinning');
    els.machine.classList.remove('celebrating');
    els.payline.classList.remove('win');

    tokens -= bet;
    updateTokenDisplay('loss-flash');
    setMessage('⏳ Running inference... (burning tokens at an alarming rate)');

    initReels();

    const results = determineResults();
    const promises = results.map((sym, i) => spinReel(i, sym));
    await Promise.all(promises);

    const win = calculateWin(results, bet);
    const net = win.amount - bet;

    if (win.amount > 0) {
      tokens += win.amount;
      updateTokenDisplay('win-flash');
      els.payline.classList.add('win');
      if (win.type === 'jackpot') {
        els.machine.classList.add('celebrating');
        setMessage(`🎉 ${win.message} +${win.amount} tokens!`, 'win');
      } else {
        setMessage(`${win.message} +${win.amount} tokens`, 'win');
      }
    } else {
      setMessage(randomMessage(LOSE_MESSAGES), 'lose');
    }

    addHistoryEntry(results, win.amount > 0 ? win.amount : -bet);
    els.machine.classList.remove('spinning');

    spinning = false;
    els.spinBtn.disabled = false;

    if (tokens < BET_STEPS[0]) {
      autoSpin = false;
      els.autoBtn.classList.remove('active');
      els.autoBtn.textContent = 'AUTO-PROMPT';
      setTimeout(showGameOver, 800);
      return;
    }

    if (betIndex > 0 && tokens < getCurrentBet()) {
      betIndex = BET_STEPS.findIndex((b) => b <= tokens);
      if (betIndex === -1) betIndex = 0;
      els.betAmount.textContent = getCurrentBet();
    }

    if (autoSpin && tokens >= getCurrentBet()) {
      setTimeout(spin, 600);
    }
  }

  function buildPaytable() {
    els.paytableGrid.innerHTML = '';
    Object.entries(PAYOUTS)
      .sort((a, b) => b[1].mult - a[1].mult)
      .forEach(([symbols, data]) => {
        const row = document.createElement('div');
        row.className = 'paytable-row';
        const syms = document.createElement('span');
        syms.className = 'paytable-symbols';
        syms.textContent = symbols;
        const payout = document.createElement('span');
        payout.className = 'paytable-payout';
        payout.textContent = `×${data.mult}`;
        row.appendChild(syms);
        row.appendChild(payout);
        els.paytableGrid.appendChild(row);
      });
    const anyTwoRow = document.createElement('div');
    anyTwoRow.className = 'paytable-row';
    anyTwoRow.style.gridColumn = '1 / -1';
    const anyLabel = document.createElement('span');
    anyLabel.className = 'paytable-symbols';
    anyLabel.textContent = '🎲 Any 2 match';
    anyLabel.style.fontSize = '0.8rem';
    const anyPay = document.createElement('span');
    anyPay.className = 'paytable-payout';
    anyPay.textContent = `×${ANY_TWO_BONUS}`;
    anyTwoRow.appendChild(anyLabel);
    anyTwoRow.appendChild(anyPay);
    els.paytableGrid.appendChild(anyTwoRow);
  }

  function setupEvents() {
    els.spinBtn.addEventListener('click', spin);

    els.betUp.addEventListener('click', () => {
      if (betIndex < BET_STEPS.length - 1) {
        const nextBet = BET_STEPS[betIndex + 1];
        if (nextBet <= tokens) {
          betIndex++;
          els.betAmount.textContent = getCurrentBet();
          updateTokenDisplay();
        }
      }
    });

    els.betDown.addEventListener('click', () => {
      if (betIndex > 0) {
        betIndex--;
        els.betAmount.textContent = getCurrentBet();
        updateTokenDisplay();
      }
    });

    els.maxBetBtn.addEventListener('click', () => {
      for (let i = BET_STEPS.length - 1; i >= 0; i--) {
        if (BET_STEPS[i] <= tokens) {
          betIndex = i;
          els.betAmount.textContent = getCurrentBet();
          updateTokenDisplay();
          break;
        }
      }
    });

    els.autoBtn.addEventListener('click', () => {
      autoSpin = !autoSpin;
      els.autoBtn.classList.toggle('active', autoSpin);
      els.autoBtn.textContent = autoSpin ? 'STOP AUTO' : 'AUTO-PROMPT';
      if (autoSpin && !spinning) spin();
    });

    els.paytableToggle.addEventListener('click', () => {
      els.paytable.classList.toggle('open');
      els.paytableToggle.querySelector('.toggle-btn').textContent =
        els.paytable.classList.contains('open')
          ? '📊 HIDE TABLE'
          : '📊 HALLUCINATION TABLE';
    });

    els.restartBtn.addEventListener('click', restart);

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spin();
      }
    });
  }

  function init() {
    initReels();
    buildPaytable();
    setupEvents();
    updateTokenDisplay();
    setMessage(randomMessage(IDLE_MESSAGES));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
