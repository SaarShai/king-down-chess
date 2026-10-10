# 04 — Pure modules: Glicko-2 and deadlines

Type: task
Status: ready-for-agent
Wave: 1 · Model: Sonnet · Branch: `claude/mp-04`

## What to build

Two small, pure TypeScript modules with no I/O. Read part 02 of the report, section 2.2 (Glicko-2 settings), and part 03, sections 5.4, 5.7 and 6.5 (G7).

1. `src/online/glicko2.ts`: Glicko-2 (Glickman's paper) for one game result between two players, with RD growth for idle time (fractional rating periods, as Lichess). Defaults: rating 1500, RD 350, volatility 0.06, tau 0.75 (keep the constants in one exported object). A `provisional(rd)` helper: true while RD ≥ 110. A colour term input that defaults to 0. No dependency.
2. `src/online/deadline.ts`: one function `nextDeadline(state, now)` that returns the next deadline and its kind for a game: Daily turn deadline (days per move), the 3-day first-turn cancel, the 80% reminder time, live clock flag with increment once per turn (Haste: one turn, one increment), the 45 s first-action timer, and the away/claim time (30 s × speed factor 1, 2, 4 or 10; at least 60 s for a ChatGPT seat). Pure inputs (times in ms), no `Date.now()` inside.

## Checks

- Glicko-2: reproduce the worked example of Glickman's paper (1500/200 against three opponents gives about 1464.06 and RD about 151.52) and a few checks: a win raises the rating, a draw between equals leaves it, RD falls after a game and grows with idle time.
- Deadlines: a fake-clock test for each kind, Haste included.
- `npm test` passes.

## Comments
