# 16 · First visit: one Start button and the first deal

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 01, 06

## Scope

- Owner choices: the first minute, a plain Start button (no first-shot lesson); the first deal, B, a chosen seed with an Archer and a Beast; the base look, the Quiet Table only (ticket 01 puts the title on the floor).
- Demo: `feat-first-minute` (the deal only: `fm.js` 11–17, seed 83 against Beginner as White). Its title is dark; the app's title stands on the floor (owner's words).
- Files: new `src/first-deal.ts` and test; `src/main.ts` (the title decision and the title choice; call lines only); `index.html` (the title actions); `src/style.css` (`.title-actions`); `docs/visual-design/verify.mjs`, `tools/verify-king-effects.mjs`, `tools/verify-workshop.mjs`, `tools/ux-defects/d8-letters-stay.mjs`.

## Plan

1. [x] `FIRST_DEAL = 'QRNAKBBS'`: the back rank that seed 83 of the real draw gives (one Archer, one Beast, chess pieces for the rest). The draw rule does not change.
2. [x] The first visit: no key `kingdown.first-deal` on the device, and no saved game with moves. (Start-up saves a new game before the title closes, so "no save" alone is not a first visit.) The title keeps the six kings, the lineup and the wordmark on the floor. Its actions become one button, "Start" (`#title-start`), with the focus. Learn, Play and Workshop leave the first-visit title; the lessons are in Menu › Guide and the Workshop in Menu › Extra.
3. [x] Start closes the title, sets the key `kingdown.first-deal` (in `try`/`catch`) and starts the first game at once: `FIRST_DEAL`, Beginner, you play White, no powers. It also stores that setup, so the next New game opens on Beginner.
4. [x] A saved return visit uses Home (ticket 17). `?title=0`, a game link, `?fen=`, `?army=` and `?design=` skip the title and the first deal, as today, so the browser checks do not change their first game.
5. [x] The game uses neutral words; nothing says "unlocked".

## Verification

- [x] `src/first-deal.test.ts`: `FIRST_DEAL` equals `randomBackRank(mulberry32(83))`; it has one `A` and one `S` and the rest from Q, R, B, N, K; the start position accepts it; its bishops stand on squares of two colours.
- [x] `visual-design`: a first visit shows one Start button with the focus; Start shows the back rank `QRNAKBBS`, White, against Beginner; a reload before Start still shows the first visit; a reload after Start skips it; no title for `?title=0` or a game link.
- [x] `king-effects`: the title kings run, and Start stops and removes them.
- [x] `npm test` and the affected browser checks pass.
- [x] First-visit renders at 390×844 and 1440×900 pass in phase 1. The fast plan cuts the light-and-dark sample. W8 has three Home states at both sizes.
- [ ] The owner says yes to the sample.

## Risks

- A later change of the piece pool can make seed 83 draw another army; the test catches it, and the constant keeps the first game the same.
- The account can bring a saved game after the first paint; it replaces the first game with its usual line.
- The Archer reading can change (spec rule 11): the first game holds an Archer, so its sample shows the reading in force.

## Does not do

- No first-shot lesson, no tour, no Learn button on the first-visit title.

## Comments
- One Start deals `QRNAKBBS`, Beginner, White, no powers. The seed test uses the real draw at seed 83.
- Saved return visits use Home. The first-visit gate, setup store and link rules stay in place.
- The fast plan cuts the light-and-dark sample. The first visit has no lesson or tour.
- `npm test`: 87 files pass, 1 skips; 1,542 tests pass, 13 skip; all 50 art tests pass. Typecheck passes.
- `home` passes twice (10.2 s, 7.6 s); `visual-design` 19.9 s, `account` 53.6 s, `king-effects` 99.5 s, `workshop` 64.4 s, `ux-defects` 69.1 s, `new-game` 13.1 s.
- The supplied M1 launcher uses this Mac. The full test run uses two workers and 30 s deadlines; the test script returns to its original text.
- W8 has six renders with no fault. The review checks both contact sheets in the requested sample folder. The sample waits for the owner's yes.
