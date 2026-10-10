# 04 · The split, step 3: the table snapshot

Status: done (PR #36 merged 2026-10-10)
Blocked by: 03

## Scope

- [Spec §4](../spec.md#4-part-b-the-game-screen-split), order 4. The DOM writes of `refresh()` move to `renderTable(snapshot)` in `src/ui/table.ts`. Last, because today's `refreshTable` reads back the DOM that `refresh()` writes.
- Files: `src/ui/table.ts`; `src/screen/play.ts`.

## Plan

1. [x] (The info card and End turn stay in `play.ts`; see Comments.) `src/ui/table.ts`: `renderTable(snapshot)` takes the values that the DOM writes of `refresh()` need (help line text, header text, status text, moves html inputs, captured codes, button states, lesson progress) and writes them; `refresh()` builds the snapshot and calls `renderTable`, then `refreshTable` as today, once. One move-only commit.

## Verification

- [x] After each commit: `npm run typecheck`, `npm test`, and `end`, `their-turn`, `game-screen`, `turn`, `powers`, `special-moves`, `painted-game`.
- [x] Before the pull request: the full `npm run check:browser` passes.
- [x] The build compare and the render compare of ticket 02 (`docs/specs/web-ux/render-compare.mjs`, threshold 16, with a second render of main to find the unstable motion states): no stable state differs.
- [x] `wc -l src/main.ts` and the `let` count (Comments).

## Risks

- `refreshTable` reads back DOM text that `renderTable` now writes: the order stays, render then refreshTable, both inside `refresh()`.
- A second `refreshTable` call adds a second icon to each move row: `refresh()` stays the one caller.

## Does not do

- No logic change. No change to the Ceremony (`src/game-end.ts`, `src/ceremony.ts`).

## Comments

- 2026-10-10, branch `claude/split-table` on main 19a366d6 (tickets 01 to 03). Three commits: the move (ff8ec48c); the spec citation (86932d13: the review record of `docs/specs/web-redesign/spec.md` now names `ui/table.ts:renderTable` for the hidden Share button, where ticket 03 wrote `screen/play.ts:refresh`); this record.
- **The seam.** `renderTable(s: TableSnapshot)` in `src/ui/table.ts` writes the selection actions and Stop here, the help line, the header and the status, the setup text and title, the moves list, the captured pieces, Undo, Resign, Copy, Share, Next lesson with its label, Return to game and Show me. The snapshot is flat and typed: plain values, three arrays of small records (the moves, the marked moments, the captured codes) and no callback. The text and the html come from the moved code: the help table, the header text, the moves html and `names` (the captured pieces). The state reads stay in `play.ts` and fill the snapshot: `candidates` (`canFinish`), `currentTurn`, `turnLine`, `ended`, `finished`, `myTurn`, `undoOn`, `resigner`, `lessonShelf(progress())`, `moments.reviewNote()`, `moments.result()`, `moments.marked()`, `toFen`, and the captured-codes loop over the history. Each of them is a pure read, so a read before the first write gives the same value as a read between the writes. `refresh()` keeps `view.highlight`, `refreshCoins`, `drawMarks`, `refreshTable` and `home.refresh()`.
- **Plan change: the info card and End turn.** `showInfo` (the info card: `readPiece`) and the End turn writes (`refreshTurnButton`, `gameEnd.refresh()`) stay in `play.ts`. They run right after `renderTable`; before, `showInfo` ran between the captured pieces and Undo, and `refreshTurnButton` and `gameEnd.refresh()` ran between Undo and Resign. Reason: they read the shown position, the game and the closure of `game-end.ts`, and the snapshot takes no callback. Spec §8 also puts `showInfo` in `screen/play.ts`; `readPiece` is in `table.ts` already. Each element still gets the same writes in the same order. None of these three reads an element that `renderTable` writes (`renderTurnButton`, `turnButton` and `gameEnd.refresh` read no DOM but the result dialog's `open`), and they write only `#all-rules`, `#end-turn` and the result dialog. They change no state that the snapshot reads, so `resigner`, `finished`, `myTurn`, the staged count and the lesson shelf give the same values before them as after. Every write that comes before the moves list's scroll read stays before it. No `MutationObserver` in `src/` watches these elements.
- **The move commit.** `git diff --color-moved=zebra --color-moved-ws=allow-indentation-change 19a366d6 ff8ec48c`: of 71 removed lines, 45 move word for word (to `renderTable`, and the captured-codes loop inside `refresh()`). The other 26: three import lines, and 23 lines whose state read became a snapshot value (one of them, `let html = ''`, is the same text but too short for the move detection). Of 123 added lines, 78 are new: the `TableSnapshot` interface, the `renderTable` head, the snapshot call in `refresh()`, the imports and those 23 lines. The first form of the commit read every value as `s.<name>`, so git found almost no moved line. Now `renderTable` destructures the 13 plain values, and the moved lines keep their text. Both forms passed `npm test` and the seven named checks. `git blame -w -C -C -M`: 43 of the 68 lines of `renderTable` keep their old commits and authors.
- **Numbers.** `src/main.ts`: 210 lines, 3 top-level `let`, no change. `src/screen/play.ts`: 899 lines before, 841 after; 27 `let` inside `connectPlay`, no change. `refresh()`: 105 lines before, 47 after. `src/ui/table.ts`: 162 lines before, 272 after; 2 top-level `let`, no change.
- **Tests.** `npm run typecheck` and `npm test` after each code commit: 99 files, 1,768 tests pass (13 skipped), node 50 pass. `npm run test:docs` passes (74 tests).
- **Named checks.** `end`, `their-turn`, `game-screen`, `turn`, `powers`, `special-moves` and `painted-game`: 7 of 7 on the first form of the move commit and 7 of 7 on ff8ec48c.
- **Full run** on 86932d13 (the move commit and the spec citation): `npm run check:browser`, 25 of 25 (893 s of checks), with `playable-clay`, `qa`, `lesson-return` and `account` green.
- **Build compare** (`vite build` of main 19a366d6 in a scratch worktree outside the checkout, and of ff8ec48c in another): the same 36 asset names and the same 170 precache entries. Both CSS files have the same names and the same sha256 (`main.css`, `dialog.css`). `index.html` is the same with the hashes removed. Every chunk is byte-identical except `main.js` (389,629 to 390,232 bytes, +603) and `index.js` (the same size; it names the new main chunk). The clay look, the account client and the Workshop stay separate chunks.
- **Render compare** (the method of tickets 02 and 03). Each build served by Vite's preview on its own port; `SAMPLE=<nn> capture.mjs` for `00` and `W1` to `W12`, 297 renders a build; main rendered a second time, alone; `render-compare.mjs` at threshold 16.
  - main against main: 24 renders differ (the unstable states): W2 lesson-task; W3 always-on, black-side; W4 beast-all-rules, four-bites, read-archer, read-beast, swap; W9 all-learned, piece-shelf; W11 haste-chain, haste-takes, long-turn, see-again; W12 share, share-actions.
  - main against the branch: 28 renders differ. 18 are in those states. The other ten:
    - Six differ only in the first branch render: W4 `archer-all-rules-phone` (4 pixels), `ogre-all-rules-phone` (4), `read-ogre-desktop` (479); W8 `first-deal-desktop` (95); W12 `shelf-smallPhone` (109), `shooter-phone` (4). A second render of the branch (00, W4, W8 and W12, alone) matches both main renders there, and differs from the first branch render by the same counts. Ticket 03 found W8 first-deal and W12 shelf and shooter unstable too.
    - Four differ the same way in both branch renders, while the two main renders agree: 00 `move-laptop` (2 pixels), W4 `read-paladin-smallPhone` (37), W12 `rules-desktop` (216) and `rules-phone` (660). More renders of each build show that main itself flips there: 00 `move-laptop`, five renders a build: the two pixels on the top-left corner of End turn take one of two values at random, in main (3 and 2 of 5) and in the branch (2 and 3 of 5). W4 and W12, four renders a build: the fourth main render differs from the first by the same 37 pixels (the piece sprites on the board) and the same 216 pixels (the Rook Rider art in the rules sheet; the same box flips in `share-actions` between the first two main renders); the third and fourth main renders differ from the first in `rules-phone` by the same 660 pixels. Ticket 03 found 00 move, W4 read-paladin and W12 rules unstable too.
  - main2 against the branch: 22 renders differ, all in the states above.
  - No stable state differs between main and the branch. Sample `00` exits 1 on every build with the same 20 faults, word for word (its stale `controls` selector `#panel .menu button, #panel .actions button`); its 20 renders are complete.
- **Reviews of PR #36** (2026-10-11). GPT via Codex, read-only, on the diff and the before-and-after files: merge after fixes (a note on the Next lesson label, a note on this record's order sentence, and a request to check the three reordered calls). A three-lens Opus panel (the DOM writes; the order and the read timing; shape and rules), each should-fix checked by a second reader: writes merge (all 25 writes present, the same element, the same property, the same order for each element), order merge (the reordered calls write only `#all-rules`, `#end-turn` and the result dialog; every snapshot read is pure; no observer or CSS rule sees the write order), shape merge after fixes. The findings and what changed:
  - The Next lesson label (Codex and the panel): `renderTable` tested the name string where `refresh()` tested the shelf's lesson. Now `s.nextLesson != null`, the same condition. Lesson names are never empty, so no player met a difference.
  - Spec §4.3 row "table" and the §8 row (confirmed): they said that the info card and all button states move to `renderTable`. Now they say that the info card and End turn stay in `screen/play.ts` and run right after `renderTable`.
  - This record (Codex and the panel): the order sentence named the wrong place for `showInfo`; it is corrected above, with a sentence on the state reads.
  - `TableSnapshot` (panel notes): `taken` is typed readonly; the doc says that `renderTable` reads the snapshot at once and keeps no part of it (`pending`, `sides` and `marked` are the live arrays); the `renderTable` comment names what stays outside it.
  - Notes left as they are: the order change sits in the move commit (a later split step puts a reorder in its own commit before the move); `renderTable` reads `matchMedia` itself; the `TableState` overlap and the New game Start handler go to TASKS.md after the merge as follow-ups.
  - Checks after the fixes: `npm test`, `npm run test:docs`, `npm run check:browser lesson-return game-screen`.
- **Open.**
  - `TableSnapshot` and `TableState` share ten fields. `refreshTable` needs `coins.context` and the `armed` value that `refreshCoins` returns, so the two stay apart in this step. It also reads back four values that `renderTable` writes (the status, the header, Stop here's `hidden` and Resign's `disabled`, which it copies to `aria-disabled`). A later step gives `refreshTable` the snapshot, reads the four from it, and writes Resign's `aria-disabled` once in `renderTable`.
  - The New game Start handler stays in `main.ts` (the note of ticket 03).
