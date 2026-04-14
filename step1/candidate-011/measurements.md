# Measurements — candidate-011

| Field | Value |
|---|---|
| Run ID | candidate-011 |
| Timestamp | N/A |
| Model + version string | N/A |
| Input tokens | N/A |
| Output tokens | N/A |
| Total tokens | N/A |
| Wall-clock time (s) | N/A |
| Tool-reported time (s) | N/A |
| Files produced | 1 — `slot-machine.html` |
| Lines of code | 796 |
| Runs in browser? | Yes |
| App Quality Notes | "AI Token Slots" — bet selector uses +/− stepper buttons (6 discrete levels), win-line highlight box, canvas-based confetti on wins, win burst overlay text, auto-bailout that resets to 100 when balance hits zero. Combo table uses a `null`-wildcard pattern (e.g. `['token','token',null]`) enabling positional partial matches. |
| Code Quality Notes | Good. Null-wildcard combo matching is a clever and readable design. Canvas confetti well-implemented with gravity and alpha fade. Reel animation uses CSS blur keyframe during spin then a CSS transition snap — simpler than Promise chaining but functional. Slightly fewer lines and less message variety than peers. |
