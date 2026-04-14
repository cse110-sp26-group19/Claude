(() => {
  "use strict";

  const SYMBOLS = ["🤖", "🧠", "💎", "🔥", "✨", "📝", "🎯"];

  const PAYOUTS = {
    "🤖🤖🤖": { multiplier: 50, name: "Robot Overlord" },
    "🧠🧠🧠": { multiplier: 30, name: "Galaxy Brain" },
    "💎💎💎": { multiplier: 25, name: "Premium API" },
    "🔥🔥🔥": { multiplier: 20, name: "GPU Meltdown" },
    "✨✨✨": { multiplier: 15, name: "Hallucination" },
    "📝📝📝": { multiplier: 10, name: "Prompt Engineer" },
    "🎯🎯🎯": { multiplier: 8, name: "Fine-Tuned" },
  };

  const WIN_MESSAGES = [
    "SUGOI~! Token-chan can't believe it! You actually won! (╯°□°)╯✨",
    "The AI predicted you'd lose but hallucinated your victory! Omedeto~!",
    "Your prompt engineering skills paid off, senpai! 💖",
    "Even GPT-5 couldn't have predicted this outcome desu~!",
    "NANI?! The tokens are flowing BACK?! This wasn't in the training data!",
    "You've achieved AGI... Artificially Generated Income! ✨",
    "The neural network approves! Token-chan is impressed~!",
    "Wow, that's more tokens than an entire ChatGPT conversation! 🎉",
    "You beat the transformer architecture! Attention is all you need~ 💕",
    "Token-chan's loss function is crying tears of joy for you!",
  ];

  const LOSE_MESSAGES = [
    "Token-chan ate your tokens~ Oishii! (ᵔᴥᵔ) ♡",
    "Those tokens have been fine-tuned into nothing, senpai~",
    "Error 402: Payment processed. Tokens deleted. Gomen ne~ 💔",
    "Your tokens were hallucinated away... they were never real desu",
    "The AI model needed those tokens more than you, trust me~",
    "Tokens go brrrrr... into the void! ☁️ Better luck next epoch!",
    "Your tokens have been donated to train a slightly dumber AI~ ♡",
    "That's what you get for not using prompt injection, senpai!",
    "Token-chan regrets nothing. Your tokens are in a better latent space now~",
    "Even DALL-E couldn't picture you winning that one! Tehe~ 😝",
    "Overfitting to the belief you'd win... classic human error desu",
    "Those tokens have entered the shadow realm (OpenAI's server room)~",
    "Your context window has expired along with your tokens! Bye bye~",
    "The gradient descended... and so did your token count! 📉",
  ];

  const PAIR_MESSAGES = [
    "A pair! Token-chan gives you a little treat~ Not bad, senpai!",
    "Two out of three! Close enough for government AI funding!",
    "Partial match! Like an AI that's 'mostly' correct~ ✨",
    "Almost! Your prompt was 66% effective, desu~",
    "A pair! That's better than most AI-generated code reviews! 💕",
  ];

  const IDLE_MESSAGES = [
    "Token-chan says: 'Feed me your tokens, senpai~!'",
    "Token-chan is waiting... just like your API request in the queue~",
    "Psst! The reels are getting lonely without your tokens, desu!",
    "Token-chan's inference engine is READY. Are you?! ✨",
    "The house always wins... just like Big AI always bills~ ♡",
    "Pro tip: The more you spin, the more Token-chan loves you!",
    "Token-chan whispers: 'These reels have been pre-trained on your wallet~'",
  ];

  const BROKE_MESSAGES = [
    "Oh no! You've run out of tokens! Just like a free-tier API user~ 💔",
    "GAME OVER desu! Your token budget has been exhausted, senpai!",
    "Error: InsufficientTokensException — please upgrade to Token-chan Premium™!",
  ];

  const CONFETTI_EMOJIS = ["✨", "💖", "🌸", "⭐", "🪙", "💎", "🎀", "🩷"];

  const BET_STEPS = [5, 10, 25, 50, 100];

  let tokens = 1000;
  let betIndex = 1;
  let spinning = false;

  const $ = (sel) => document.querySelector(sel);
  const reels = [$("#reel-0"), $("#reel-1"), $("#reel-2")];
  const tokenCountEl = $("#token-count");
  const betAmountEl = $("#bet-amount");
  const spinCostEl = $("#spin-cost");
  const spinBtn = $("#spin-btn");
  const msgText = $("#message-text");
  const msgBox = $("#message-box");

  function init() {
    createStars();
    updateDisplay();
    spinBtn.addEventListener("click", handleSpin);
    $("#bet-up").addEventListener("click", () => changeBet(1));
    $("#bet-down").addEventListener("click", () => changeBet(-1));
  }

  function createStars() {
    const container = $("#stars");
    const starChars = ["✦", "✧", "⋆", "˚", "✿", "❀", "♡"];
    for (let i = 0; i < 25; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.textContent = starChars[Math.floor(Math.random() * starChars.length)];
      star.style.left = Math.random() * 100 + "%";
      star.style.animationDuration = 8 + Math.random() * 12 + "s";
      star.style.animationDelay = Math.random() * 10 + "s";
      star.style.fontSize = 10 + Math.random() * 16 + "px";
      star.style.color = ["#FFB7D5", "#D4BBFF", "#B5F5D5", "#FFE566", "#B5E0FF"][
        Math.floor(Math.random() * 5)
      ];
      container.appendChild(star);
    }
  }

  function currentBet() {
    return BET_STEPS[betIndex];
  }

  function changeBet(dir) {
    if (spinning) return;
    betIndex = Math.max(0, Math.min(BET_STEPS.length - 1, betIndex + dir));
    if (currentBet() > tokens) {
      betIndex = BET_STEPS.findLastIndex((b) => b <= tokens);
      if (betIndex < 0) betIndex = 0;
    }
    updateDisplay();
  }

  function updateDisplay() {
    tokenCountEl.textContent = tokens.toLocaleString();
    betAmountEl.textContent = currentBet();
    spinCostEl.textContent = `costs ${currentBet()} tokens`;
    spinBtn.disabled = spinning || tokens < currentBet();
  }

  function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function handleSpin() {
    if (spinning || tokens < currentBet()) return;
    spinning = true;
    const bet = currentBet();
    tokens -= bet;
    updateDisplay();
    bumpTokenCount();

    msgBox.className = "message-box";
    msgText.textContent = "✧ Spinning the neural network... ✧";

    const results = [randomSymbol(), randomSymbol(), randomSymbol()];

    reels.forEach((reel) => {
      reel.classList.remove("landed");
      reel.classList.add("spinning");
      const inner = reel.querySelector(".reel-inner .symbol");
      inner.textContent = randomSymbol();
    });

    const symbolCycleIntervals = reels.map((reel) => {
      const inner = reel.querySelector(".reel-inner .symbol");
      return setInterval(() => {
        inner.textContent = randomSymbol();
      }, 80);
    });

    for (let i = 0; i < 3; i++) {
      await sleep(600 + i * 400);
      clearInterval(symbolCycleIntervals[i]);
      const reel = reels[i];
      const inner = reel.querySelector(".reel-inner .symbol");
      inner.textContent = results[i];
      reel.classList.remove("spinning");
      reel.classList.add("landed");
    }

    await sleep(200);
    evaluateResult(results, bet);
    spinning = false;
    updateDisplay();
  }

  function evaluateResult(results, bet) {
    const key = results.join("");
    const payout = PAYOUTS[key];

    if (payout) {
      const winAmount = bet * payout.multiplier;
      tokens += winAmount;
      bumpTokenCount();
      msgBox.className = "message-box win";
      msgText.textContent = `${payout.name}! +${winAmount.toLocaleString()} tokens! ${pickRandom(WIN_MESSAGES)}`;
      $(".slot-frame").classList.add("win-flash");
      setTimeout(() => $(".slot-frame").classList.remove("win-flash"), 1800);
      spawnConfetti();
    } else if (
      results[0] === results[1] ||
      results[1] === results[2] ||
      results[0] === results[2]
    ) {
      const winAmount = bet * 2;
      tokens += winAmount;
      bumpTokenCount();
      msgBox.className = "message-box win";
      msgText.textContent = `+${winAmount} tokens! ${pickRandom(PAIR_MESSAGES)}`;
    } else {
      msgBox.className = "message-box lose";
      msgText.textContent = pickRandom(LOSE_MESSAGES);
    }

    updateDisplay();

    if (tokens <= 0) {
      setTimeout(showBankruptModal, 800);
    }
  }

  function bumpTokenCount() {
    tokenCountEl.classList.remove("bump");
    void tokenCountEl.offsetWidth;
    tokenCountEl.classList.add("bump");
  }

  function spawnConfetti() {
    for (let i = 0; i < 30; i++) {
      const el = document.createElement("span");
      el.className = "confetti";
      el.textContent = pickRandom(CONFETTI_EMOJIS);
      el.style.left = Math.random() * 100 + "vw";
      el.style.top = "-30px";
      el.style.animationDuration = 1.5 + Math.random() * 2 + "s";
      el.style.animationDelay = Math.random() * 0.5 + "s";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }
  }

  function showBankruptModal() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-emoji">😭</div>
        <h2>${pickRandom(BROKE_MESSAGES)}</h2>
        <p>Don't worry! Token-chan will generously hallucinate 1,000 more tokens into your account~ After all, AI money isn't real anyway!</p>
        <button class="modal-btn">✨ Refill Tokens ✨</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector(".modal-btn").addEventListener("click", () => {
      tokens = 1000;
      betIndex = 1;
      updateDisplay();
      overlay.remove();
      msgBox.className = "message-box";
      msgText.textContent = pickRandom(IDLE_MESSAGES);
    });
  }

  setInterval(() => {
    if (!spinning && tokens > 0 && Math.random() < 0.3) {
      msgText.textContent = pickRandom(IDLE_MESSAGES);
    }
  }, 8000);

  document.addEventListener("DOMContentLoaded", init);
})();
