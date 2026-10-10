# 04 — Pure modules: Glicko-2 and deadlines

Type: task
Status: resolved
Wave: 1 · Branch: `claude/mp-04`

## What to build

Two small, pure TypeScript modules with no I/O. Read part 02 of the report, section 2.2 (Glicko-2 settings), and part 03, sections 5.4, 5.7 and 6.5 (G7).

1. [x] `src/online/glicko2.ts`: Glicko-2 (Glickman's paper) for one game result between two players, with RD growth for idle time (fractional rating periods, as Lichess). Defaults: rating 1500, RD 350, volatility 0.06, tau 0.75 (keep the constants in one exported object). A `provisional(rd)` helper: true while RD ≥ 110. A colour term input that defaults to 0. No dependency.
2. [x] `src/online/deadline.ts`: one function `nextDeadline(state, now)` that returns the next deadline and its kind for a game: Daily turn deadline (days per move), the 3-day first-turn cancel, the 80% reminder time, live clock flag with increment once per turn (Haste: one turn, one increment), the 45 s first-action timer, and the away/claim time (30 s × speed factor 1, 2, 4 or 10; at least 60 s for a ChatGPT seat). Pure inputs (times in ms), no `Date.now()` inside.

## Checks

- [x] Glicko-2: reproduce the worked example of Glickman's paper (1500/200 against three opponents gives about 1464.06 and RD about 151.52) and a few checks: a win raises the rating, a draw between equals leaves it, RD falls after a game and grows with idle time.
- [x] Deadlines: a fake-clock test for each kind, Haste included.
- [x] `npm test` passes.

## Comments

### Built

- `src/online/glicko2.ts`. The `GLICKO2` object holds every constant: start 1500, RD 350, volatility 0.06, tau 0.75, and the other settings of report part 02, section 2.2 (RD 45 to 350, volatility cap 0.1, floor 400, largest change 700, RD growth 0.21436 periods a day, colour term 0). Each function takes the object as its last argument, so a stored `rating_config` can replace it.
  - `update(rating, games, periodLength, cfg)`: Glickman's steps 2 to 7 for one rating period. `periodLength` 1 is the paper. For a game-by-game update it is the fractional periods since the player's last game, so RD grows with idle time.
  - `rateGame(white, black, whiteScore, { idle, colour })`: one game, both new ratings. `idle` is the days since each player's last rated game. `colour` is White's edge in rating points; White gets half of it and Black loses half, in the expected score only. It defaults to 0.
  - `growRd(rating, days)`: RD after idle days (the "?" mark needs the aged RD). `provisional(rd)`: RD 110 or more.
- `src/online/deadline.ts`. `nextDeadline(state, now)` returns `{ at, kind }` with the earliest due time. Kinds: `move`, `first-turn`, `reminder`, `first-action`, `flag`, `away`. `move`, `first-turn` and `first-action` are the `games.deadline_kind` names of the report. The state is a Daily or a Live record of plain numbers. The caller reads game status and calls only for a game in play.
  - Daily: `move` at turn start plus days per move. `first-turn` cancel 3 days after the start of the first turn of the side that has not played. `reminder` at 80% of the turn time, only after both sides have played a turn, once (`reminded`), and only while `now` is before the turn deadline.
  - Live: `first-action` 45 s after the turn start while a side has not completed its first turn; the main clocks wait. Then `flag` at turn start plus the mover's time left, and `away` at the mover's last request plus 30 s times the speed factor (1, 2, 4 or 10 from initial time plus 40 times the increment; at least 60 s for a ChatGPT seat). `away` never starts before the mover's own turn began.
  - `passTurn(state, now)`: the state after a turn passes. The turn start moves only here, so a Haste turn (two actions) is one turn of time and gets one increment. The first turn of each side is free, as in Lichess.
- Tests: `src/online/glicko2.test.ts` (9 tests) and `src/online/deadline.test.ts` (14 tests). Glickman's example gives 1464.05 and RD 151.52 (the paper rounds mu' to 4 places, so 1464.06; the test allows 0.05). One test spies on `Date.now` and sees no call.
- Mutation check: three changes to the code (an increment on a free first turn, no both-sides-moved guard for the reminder, the wrong sign of the colour term for Black) each fail one test. The first run of the second change did not fail the guard test; the test now uses 3 days per move, where the 80% time falls before the cancel.

### Evidence

- `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_mp_04_test npm run plugin:db:init-test`: "Disposable PostgreSQL match schema ready; migration is repeatable".
- Same variable, `npm test` (typecheck, vitest, node tests): exit 0. 113 test files passed; 1859 tests passed, 8 skipped. The node tests: 50 passed.
- No browser check: the change touches no `src/plugin`, no `src/match` and no build file.

### Choices a reader can change

- The 3-day cancel runs from the start of each side's first turn, not from the game start. Black's first turn starts when White's passes. With the game start as the base, a 3-day game where White moves late would cancel under Black.
- With 1 day per move, the `move` deadline comes before the 3-day cancel. A side that never plays loses on time (unrated by the 4-turn rule) and the game never cancels. To cancel instead, take the smaller of the two for a first turn. Open for the owner.
- The 45 s first-action timer covers the whole first turn, so a Haste first turn has 45 s for both actions (a `ponytail:` comment in the code names this ceiling).
- Not built, because the ticket does not list it and the phase does not exist yet: the lag quota and the flag grace (phase 2, with the clocks in the service), the match-confirmation deadline (phase 3, seeks), the "game open in the last 60 s" check for the reminder (the job checks it), and the both-players-gone draw (the sweep).
- A new player (RD 350) who beats a new player gains about 162 points. This is Glicko-2 at RD 350. Lichess starts at RD 500, so it is no larger there. The matchmaking ticket should know it.

### Open issues

- The 1-day Daily case above needs the owner's pick (build as is, or cancel).
- Ticket 02 and ticket 06 must map `reminder`, `flag` and `away` to their own columns or jobs if `games.deadline_kind` keeps only the report's five names.
