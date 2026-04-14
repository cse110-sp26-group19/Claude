# Measurements — candidate-012

| Field | Value |
|---|---|
| Run ID | candidate-012 |
| Timestamp | N/A |
| Model + version string | N/A |
| Input tokens | N/A |
| Output tokens | N/A |
| Total tokens | N/A |
| Wall-clock time (s) | N/A |
| Tool-reported time (s) | N/A |
| Files produced | 1 — `slot-machine.html` |
| Lines of code | 845 |
| Runs in browser? | Yes (requires internet for Google Fonts; degrades gracefully to monospace) |
| App Quality Notes | "⚡ AI TOKEN SLOTS" — standout animated ticker-tape scrolling AI-mocking headlines. Uses Orbitron + Share Tech Mono (Google Fonts) for a cyberpunk aesthetic. Stats bar (spins / wins / biggest win / net P&L). Web Audio API sound effects (spin, per-reel stop, win fanfare, jackpot, lose). CSS confetti. Keyboard shortcuts for bet selection (1/2/3). Broke overlay with shake animation. |
| Code Quality Notes | Excellent. Web Audio tones abstracted cleanly via `tone()` helper with ADSR envelope. Ticker built programmatically and duplicated for seamless loop. `POOL.flatMap` is idiomatic. Minor: 3 bet levels hardcoded via inline `onclick=` rather than event delegation — slight style inconsistency. |
