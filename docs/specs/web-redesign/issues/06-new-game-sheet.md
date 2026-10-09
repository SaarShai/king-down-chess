# 06 · One short New game sheet, levels in words

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)

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
6. [x] A fixed footer: "Start game", or, when an unfinished game (or a lesson's kept game) would end, the line "This ends your game at move N." and "Start new game". A staged end counts as unfinished (`ended()` is false). N counts handed-over moves. The `confirm()` goes.
7. [x] Update `tools/new-game-ui.mjs` once; every check that starts a game uses it.

## Verification

- [x] `src/new-game.test.ts`: the warn line text with N; a staged end shows the warn line; "More…" keeps a remembered example army.
- [x] `new-game` check: Start in view in every mode at 390×844 and 844×390; the warn line replaces the question; each mode starts the right game; an example army and Custom… start from "More…".
- [x] `npm test` and the browser checks for this unit pass.
- [x] Rendered sample, 390×844 and 1440×900: Computer; Kings' powers with both current pickers; Two players; the fold open with "More…"; the warn line. The fast plan cuts the other sample sizes.
- [ ] The owner's yes on the sample, with the date, in Comments.

## Risks

- The short power lines must agree with `docs/RULES.md` and the preset counts.
- `claude/arrange-mode` changes `new-game.ts`: if the owner says yes to it, rebuild it on this sheet.

## Does not do

- No muster (15), no faces, no "By link" row, no change to the draw.

## Comments


- The sheet has three modes, level words, a Side and army fold, and a fixed Start footer. Close keeps the game.
- The warn line reads W1's `ended()` and the move at the turn start. A staged mate stays live, also in a lesson's kept game.
- Keep both current king pickers. The fast plan cuts the new picker layout. No muster, faces, or By link row.
- Red, green: the pure test catches the wrong move number; the M1 check catches the staged mate without a warn line. Both pass after the fix.
- `npm test`: 80 files pass, 1 skips; 1487 tests pass, 13 skip; all 50 motion tests pass. `npm run typecheck` passes.
- M1: `new-game`, `ux-defects`, `turn`, `link-game`, `lesson-return`, `visual-design`, `workshop`: all 7 pass. A second `new-game` run passes.
- `SAMPLE=W7`: 10 renders, 0 with a fault. Both contact sheets pass the review. The owner's sample review stays open.

Batch 2: decided by delegation (2026-10-09).
Each selected control has the same 2 px border and ink. Border contrast exceeds 3:1.
Focus uses the shared colour. The switch says "Play with kings' powers".
Power words use short sentences. The plugin keeps its text and rules.
All eight required browser checks pass. `npm test`: 1514 tests and 50 scene tests pass.
W7 has 10 inspected renders and no faults.
