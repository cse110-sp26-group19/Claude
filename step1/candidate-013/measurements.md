# Measurements — candidate-013

| Field | Value |
|---|---|
| Run ID | candidate-013 |
| Timestamp | N/A |
| Model + version string | N/A |
| Input tokens | N/A |
| Output tokens | N/A |
| Total tokens | N/A |
| Wall-clock time (s) | N/A |
| Tool-reported time (s) | N/A |
| Files produced | 1 — `index.html` |
| Lines of code | 901 |
| Runs in browser? | Yes |
| App Quality Notes | "AI Token Slots 🤖" — decorative physical lever (CSS-only, clickable) positioned on the machine frame. Web Audio sound effects including a per-cell click tick as each reel symbol passes. Balance starts at 500 with a "Buy +200" button. Stats pills: spins / win rate / best win / longest loss streak. Canvas confetti. Jackpot flash and shake animations on the machine frame. |
| Code Quality Notes | Excellent. `spinReel()` uses `requestAnimationFrame` with custom `easeOutQuint` and audible ticks on cell-boundary crossing — very tactile feel. `playJackpotSound` layers two sequential phases. CSS-only lever with `pulled` class toggle is creative. DOM refs stored with `$`-prefixed `const` vars for clarity. |
