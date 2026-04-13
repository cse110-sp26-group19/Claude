(function () {
  'use strict';

  const SYMBOLS = [
    { emoji: '🤖', name: 'Robot-chan', multiplier: 10 },
    { emoji: '🧠', name: 'Big Brain', multiplier: 7 },
    { emoji: '✨', name: 'Sparkle AI', multiplier: 5 },
    { emoji: '💬', name: 'Prompt', multiplier: 4 },
    { emoji: '🎀', name: 'Kawaii Bow', multiplier: 3 },
    { emoji: '🔮', name: 'Crystal GPU', multiplier: 2 },
    { emoji: '🍡', name: 'Dango Data', multiplier: 1.5 },
    { emoji: '🌸', name: 'Sakura Net', multiplier: 1 },
  ];

  const WIN_MESSAGES = [
    "AI-chan is impressed! Your prompt engineering is sugoi~ ✿",
    "Ooh! The neural network blushes in your favor! (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)",
    "GPT-chan whispers: 'You're my favorite user~' ♡",
    "The transformer model transformed your luck! Kyaa~!",
    "Your tokens multiplied like attention heads! すごい!",
    "AI-chan hallucinated a win for you... wait, it's real!",
    "Gradient descent led straight to your wallet! ♡",
    "The loss function couldn't find any loss today~ えへへ",
    "Even RLHF couldn't make this more rewarding! ✿",
    "Your context window is FULL of wins!",
  ];

  const LOSE_MESSAGES = [
    "AI-chan ate your tokens... oishii~ (◕‿◕✿)",
    "Token limit exceeded! Just like my API bills...",
    "The model hallucinated your winnings. They don't exist~ ♡",
    "That spin had the same energy as 'GPT, write me a novel in 10 tokens'",
    "Your prompt wasn't specific enough! Try again~ がんばって!",
    "Error 429: Too many losing requests ♡",
    "AI-chan's training data says you should spin again~",
    "Hmm... the temperature was too low for creativity today!",
    "Those tokens are in the latent space now~ bye bye!",
    "The attention mechanism was NOT paying attention to you!",
    "Your tokens went to fine-tune AI-chan's cuteness! Worth it~ ♡",
    "Context window full of L's... but you're still kawaii!",
    "That spin was more confusing than a transformer diagram~",
    "AI-chan needs your tokens for GPU rent! Gomen ne~ ♡",
  ];

  const JACKPOT_MESSAGES = [
    "JACKPOT! AI-chan is malfunctioning with joy!!! ✿✿✿",
    "SUGOI!!! You broke the neural network! All tokens for you~!",
    "MAX WIN! Even Sam Altman is jealous! きゃー!!!",
    "THE SINGULARITY IS HERE and it's PAYING OUT! ♡♡♡",
  ];

  const BROKE_MESSAGES = [
    "AI-chan feels bad... all your tokens are gone! (╥﹏╥) Here's 100 more~",
    "No tokens left! But AI-chan likes you, so here's a bailout ♡",
    "You've been rate-limited by poverty! AI-chan gives you 100 pity tokens~",
    "Token balance: NaN. AI-chan reboots your wallet with 100 tokens!",
  ];

  const NEAR_WIN_MESSAGES = [
    "So close! Two out of three... the third reel was hallucinating!",
    "Almost! AI-chan was rooting for you~ (◕︵◕)",
    "Two matched! The third one had a different opinion~ like an AI debate!",
  ];

  const MOODS = {
    neutral: '(◕ᴗ◕✿)',
    happy: '(✧ω✧)♡',
    excited: '(ﾉ◕ヮ◕)ﾉ✧',
    sad: '(◕︵◕)',
    mischievous: '(◕‿◕✿)',
    broke: '(╥﹏╥)',
    rich: '₍₍◞( •௰• )◟₎₎',
  };

  const BET_STEPS = [5, 10, 25, 50, 100, 250];
  const STARTING_TOKENS = 1000;
  const BAILOUT_AMOUNT = 100;
  const SPIN_DURATION_BASE = 1200;
  const SPIN_STAGGER = 400;
  const REEL_COUNT = 3;
  const SYMBOLS_IN_STRIP = 30;

  let tokens = STARTING_TOKENS;
  let betIndex = 1;
  let spinning = false;
  let totalSpins = 0;
  let biggestWin = 0;

  const els = {
    tokenCount: document.getElementById('tokenCount'),
    betAmount: document.getElementById('betAmount'),
    betUp: document.getElementById('betUp'),
    betDown: document.getElementById('betDown'),
    spinBtn: document.getElementById('spinBtn'),
    messageText: document.getElementById('messageText'),
    messageBox: document.getElementById('messageBox'),
    totalSpins: document.getElementById('totalSpins'),
    biggestWin: document.getElementById('biggestWin'),
    aiMood: document.getElementById('aiMood'),
    winOverlay: document.getElementById('winOverlay'),
    winAmount: document.getElementById('winAmount'),
    winMessage: document.getElementById('winMessage'),
    winParticles: document.getElementById('winParticles'),
    paytableGrid: document.getElementById('paytableGrid'),
    reels: Array.from({ length: REEL_COUNT }, (_, i) => document.getElementById('reel' + i)),
    reelWindows: null,
  };

  function init() {
    els.reelWindows = Array.from(document.querySelectorAll('.reel-window'));
    buildPaytable();
    buildReelStrips();
    setInitialPositions();
    attachEvents();
    updateDisplay();
  }

  function buildPaytable() {
    const grid = els.paytableGrid;
    SYMBOLS.forEach(function (sym) {
      var row = document.createElement('div');
      row.className = 'paytable-row';
      row.innerHTML =
        '<span class="paytable-symbols">' +
        sym.emoji + sym.emoji + sym.emoji +
        '</span>' +
        '<span class="paytable-payout">×' + sym.multiplier + '</span>';
      grid.appendChild(row);
    });
  }

  function buildReelStrips() {
    els.reels.forEach(function (reel) {
      var strip = reel.querySelector('.reel-strip');
      strip.innerHTML = '';
      for (var i = 0; i < SYMBOLS_IN_STRIP; i++) {
        var sym = SYMBOLS[i % SYMBOLS.length];
        var div = document.createElement('div');
        div.className = 'reel-symbol';
        div.textContent = sym.emoji;
        div.dataset.index = i % SYMBOLS.length;
        strip.appendChild(div);
      }
    });
  }

  function setInitialPositions() {
    var symbolHeight = getSymbolHeight();
    els.reels.forEach(function (reel) {
      var strip = reel.querySelector('.reel-strip');
      var idx = Math.floor(Math.random() * SYMBOLS.length);
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(' + (-idx * symbolHeight) + 'px)';
      strip.dataset.currentIndex = idx;
    });
  }

  function getSymbolHeight() {
    var firstSymbol = els.reels[0].querySelector('.reel-symbol');
    return firstSymbol ? firstSymbol.offsetHeight : 120;
  }

  function attachEvents() {
    els.spinBtn.addEventListener('click', spin);
    els.betUp.addEventListener('click', function () { changeBet(1); });
    els.betDown.addEventListener('click', function () { changeBet(-1); });
    els.winOverlay.addEventListener('click', dismissWinOverlay);

    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space' && !spinning) {
        e.preventDefault();
        spin();
      }
    });
  }

  function changeBet(dir) {
    if (spinning) return;
    betIndex = Math.max(0, Math.min(BET_STEPS.length - 1, betIndex + dir));
    updateDisplay();
  }

  function getCurrentBet() {
    return BET_STEPS[betIndex];
  }

  function updateDisplay() {
    els.tokenCount.textContent = tokens;
    els.betAmount.textContent = getCurrentBet();
    els.totalSpins.textContent = totalSpins;
    els.biggestWin.textContent = biggestWin;

    els.betDown.disabled = betIndex === 0;
    els.betUp.disabled = betIndex === BET_STEPS.length - 1;

    var container = document.querySelector('.app-container');
    if (tokens <= 0) {
      container.classList.add('broke');
    } else {
      container.classList.remove('broke');
    }
  }

  function animateTokenCount(from, to) {
    var diff = to - from;
    var steps = 20;
    var stepVal = diff / steps;
    var current = from;
    var i = 0;

    els.tokenCount.classList.add('changing');

    var interval = setInterval(function () {
      i++;
      if (i >= steps) {
        clearInterval(interval);
        current = to;
        els.tokenCount.textContent = Math.round(current);
        els.tokenCount.classList.remove('changing');
        return;
      }
      current += stepVal;
      els.tokenCount.textContent = Math.round(current);
    }, 30);
  }

  function setMessage(text, type) {
    els.messageText.textContent = text;
    els.messageText.className = 'message-text' + (type ? ' ' + type : '');
  }

  function setMood(mood) {
    els.aiMood.textContent = MOODS[mood] || MOODS.neutral;
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function spin() {
    if (spinning) return;

    var bet = getCurrentBet();

    if (tokens < bet) {
      if (tokens <= 0) {
        tokens = BAILOUT_AMOUNT;
        setMessage(randomFrom(BROKE_MESSAGES), 'lose');
        setMood('broke');
        updateDisplay();
      } else {
        setMessage("Not enough tokens! Lower your bet, baka~ ♡", 'lose');
        setMood('sad');
      }
      return;
    }

    spinning = true;
    var oldTokens = tokens;
    tokens -= bet;
    animateTokenCount(oldTokens, tokens);
    totalSpins++;
    els.spinBtn.disabled = true;
    setMessage("Spinning~ AI-chan is calculating your fate... ♡", '');
    setMood('mischievous');

    els.reelWindows.forEach(function (w) { w.classList.remove('winner'); });

    var results = [];
    for (var i = 0; i < REEL_COUNT; i++) {
      results.push(Math.floor(Math.random() * SYMBOLS.length));
    }

    spinReels(results, function () {
      evaluateResult(results, bet);
      spinning = false;
      els.spinBtn.disabled = false;
      updateDisplay();
    });
  }

  function spinReels(results, callback) {
    var symbolHeight = getSymbolHeight();
    var completed = 0;

    els.reels.forEach(function (reel, i) {
      var strip = reel.querySelector('.reel-strip');
      reel.classList.add('spinning');

      var spinTime = SPIN_DURATION_BASE + i * SPIN_STAGGER;

      setTimeout(function () {
        reel.classList.remove('spinning');

        var fullRotations = (3 + i) * SYMBOLS.length;
        var targetIndex = results[i];
        var totalSymbols = fullRotations + targetIndex;
        var targetY = -(targetIndex * symbolHeight);

        strip.style.transition = 'none';
        strip.style.transform = 'translateY(' + (-(totalSymbols % SYMBOLS_IN_STRIP) * symbolHeight) + 'px)';

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            strip.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            strip.style.transform = 'translateY(' + targetY + 'px)';
            strip.dataset.currentIndex = targetIndex;
          });
        });

        setTimeout(function () {
          completed++;
          if (completed === REEL_COUNT) {
            setTimeout(callback, 200);
          }
        }, 650);
      }, spinTime);
    });
  }

  function evaluateResult(results, bet) {
    var sym0 = SYMBOLS[results[0]];
    var sym1 = SYMBOLS[results[1]];
    var sym2 = SYMBOLS[results[2]];

    if (results[0] === results[1] && results[1] === results[2]) {
      var multiplier = sym0.multiplier;
      var winAmount = bet * multiplier;
      var oldTokens = tokens;
      tokens += winAmount;

      if (biggestWin < winAmount) biggestWin = winAmount;

      els.reelWindows.forEach(function (w) { w.classList.add('winner'); });

      if (multiplier >= 7) {
        showWinOverlay(winAmount, randomFrom(JACKPOT_MESSAGES));
        setMood('excited');
        setMessage(randomFrom(JACKPOT_MESSAGES), 'jackpot');
      } else {
        setMessage(randomFrom(WIN_MESSAGES), 'win');
        setMood('happy');
      }

      animateTokenCount(oldTokens, tokens);
      animateMascot('happy');
    } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
      setMessage(randomFrom(NEAR_WIN_MESSAGES), 'lose');
      setMood('sad');
      animateMascot('sad');
    } else {
      setMessage(randomFrom(LOSE_MESSAGES), 'lose');
      setMood('mischievous');
      animateMascot('sad');
    }

    if (tokens <= 0) {
      setMood('broke');
    } else if (tokens > STARTING_TOKENS * 2) {
      setMood('rich');
    }
  }

  function animateMascot(type) {
    var face = document.querySelector('.mascot-face');
    face.classList.remove('happy', 'sad');
    void face.offsetWidth;
    face.classList.add(type);
  }

  function showWinOverlay(amount, message) {
    els.winAmount.textContent = '+' + amount + ' tokens!';
    els.winMessage.textContent = message;
    els.winOverlay.classList.add('active');
    spawnParticles();

    setTimeout(function () {
      dismissWinOverlay();
    }, 3000);
  }

  function dismissWinOverlay() {
    els.winOverlay.classList.remove('active');
    els.winParticles.innerHTML = '';
  }

  function spawnParticles() {
    var particles = ['✿', '♡', '⋆', '✧', '🌸', '🎀', '✨', '💖'];
    els.winParticles.innerHTML = '';

    for (var i = 0; i < 20; i++) {
      var p = document.createElement('span');
      p.className = 'win-particle';
      p.textContent = randomFrom(particles);

      var angle = (Math.PI * 2 * i) / 20;
      var distance = 80 + Math.random() * 80;
      var tx = Math.cos(angle) * distance;
      var ty = Math.sin(angle) * distance;
      var rot = Math.random() * 360;

      p.style.left = '50%';
      p.style.top = '50%';
      p.style.setProperty('--tx', tx + 'px');
      p.style.setProperty('--ty', ty + 'px');
      p.style.setProperty('--rot', rot + 'deg');
      p.style.animationDelay = (Math.random() * 0.3) + 's';

      els.winParticles.appendChild(p);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
