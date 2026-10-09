# 06 · One short New game sheet, levels in words

Status: in-progress (phase 1 passes; phase 2 waits for W1)
Blocked by: 02b (phase 2 only)

## Scope

- Owner choices: Starting a game A, one short sheet; levels in words, with no faces (our pick). Decisions D5 (no "By link" row) and D6 (option 2: the other armies stay in the sheet).
- Demo: `feat-new-game` option A (`index.html` 61–128; `app.js` 12–46 level lines, 150–172 the fold, 186–208 the footer).
- Files: `index.html` (`#new-game`), `src/new-game.ts` and test, `src/main.ts` (the start callback), `src/powers-ui.ts` (short power lines), `src/style.css`, `tools/new-game-ui.mjs`, `tools/verify-new-game.mjs`, `tools/ux-defects/d4-start-asks.mjs`, `docs/visual-design/verify.mjs`, `tools/verify-workshop.mjs`.

## Plan

1. [x] A sheet: the header "New game" and × (× drops the changes). Three modes as segments with icons: Computer, Kings' powers, Two players.
2. [x] Level: Beginner, Casual, Club, Strong, with one true line each ("New to King Down? Start here.", "Relaxed. It makes mistakes.", "A solid player. Keep your pieces safe.", "Thinks longer. A real fight."). The tooltip about think times goes.
3. [x] Two players: a Kings' powers switch. No "By link" row (D5).
4. [x] Keep both current king pickers inside the sheet, as the fast plan says. Keep the power pictures and rule lines.
5. [x] A fold row "Side and army" that names its values ("White · Random army"): You play White or Black; Army Random, Today's, Chess, with an icon strip and one line. The values `random`, `daily` and `classic` do not change. Under them, "More…" holds today's other armies: Custom… (today's prompt), the example codes and Ogre practice (D6, option 2).
6. [ ] A fixed footer: "Start game", or, when an unfinished game (or a lesson's kept game) would end, the line "This ends your game at move N." and "Start new game". A staged end counts as unfinished (`ended()` is false). N counts handed-over moves. The `confirm()` goes.
7. [x] Update `tools/new-game-ui.mjs` once; every check that starts a game uses it.

## Verification

- [x] `src/new-game.test.ts`: the warn line text with N; a staged end shows the warn line; "More…" keeps a remembered example army.
- [x] `new-game` check: Start in view in every mode at 390×844 and 844×390; the warn line replaces the question; each mode starts the right game; an example army and Custom… start from "More…".
- [ ] `npm test` and `npm run check:browser` pass.
- [ ] Rendered sample, 390×844, 844×390 and 1440×900: Computer; Kings' powers with your picker open; Two players; the fold open with "More…"; the warn line. The owner's yes, with the date, in Comments.

## Risks

- The short power lines must agree with `docs/RULES.md` and the preset counts.
- `claude/arrange-mode` changes `new-game.ts`: if the owner says yes to it, rebuild it on this sheet.

## Does not do

- No muster (15), no faces, no "By link" row, no change to the draw.

## Comments

- Phase 2 plan: share W1's end state with the kept game; count moves at its turn boundary; test a staged mate and the sheet after End turn.
- Test seam: the pure warn line reads a real game and W1's turn state. Browser checks cover the live and kept games.
- Checks: local `npm test` and type check; M1 `new-game`, `ux-defects`, and `turn`; W7 phone and desktop samples.
- Keep both current king pickers. Cut the new picker layout, muster, and faces, as the fast plan says.
