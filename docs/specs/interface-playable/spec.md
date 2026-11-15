# Playable: save, resume and the board on the new page

Status: ready-for-human

Branch: `redesign` (the uncommitted tree of the interface move, stages A and B). No commit, push, pull request or deploy until the owner says so.

## 1. Source

The lead's decisions of 2026-11-13 for the launch stage "Playable" (design project, `runs/playable/decisions.md`, decisions 1 to 21). Their sources: the launch plan, the carry list of the interface move (`runs/move/carry.md`), the checks of move stage B, and the audit items B1 (no solo save) and M15 (old settings lost). AGENTS.md also asks for the owner's yes on a rendered sample before a visual change merges (part C2).

## 2. The plan

### Goal

On `/next.html` the solo game is safe to play on a phone: it saves after each step, it resumes after a reload, it shares one saved game with the old page, and the board shows coordinates, sound and the small faults of the move are fixed.

### Scope

- Part C1 ([issue 01](issues/01-c1-save-resume.md)): decisions 1 to 13. The save, Continue, the confirm, the kept copy, unreadable data, the stored choices, the level map, the stage B check findings, and the private-data check of the build.
- Part C2 ([issue 02](issues/02-c2-board-and-faults.md)): decisions 14 to 21. The Versus colours, Coordinates, Sound, Motion speed in `pace`, the words, the carry faults 1 to 12, the browser run of the end states, the page head colour.
- One writer at a time. C2 starts when C1 is done and checked.

### Where a decision cannot hold as written

Each item names the decision, the reason from the code, and the plan's choice. The lead can reverse each one.

1. **Decision 9 (write a setting only when it is not at its default).** The `save.ts` rule is for a new field (`labels`). The four fields here are old fields, and `src/screen/settings.ts` `settingsOf` writes them in every save. The old page reads a missing `sound` as On (`index.html`: the Sound box is checked) and a missing `skill` as Strong (`settings.ts` `applySettings`). So a new page that leaves out `sound: false` makes the old page play sound, and a save with no `skill` plays Strong there. The account sync (`account/sync.ts` `stamp`) also sees a different settings copy at each page change. Plan: write `skill`, `coords`, `sound` and `pace` in every write, in the old order, and keep `queen`, `threats` and `labels` from the stored data.
2. **Decision 15 (expose the renderer's coordinates through `board-api`).** The renderer draws the labels in the frame margin of the canvas (`scene.mjs`: files at `SIZE - inset`, ranks at x 15). The new layout cuts that margin: `.play-board-host` has `clip-path: inset(0 0 calc(var(--board) * 32 / 896) 0)`, which removes the file letters, and on a phone the board is 8 px narrower than the screen, so the rank numbers fall off the screen. Plan: the page draws the labels in the edge squares (file letter in the lower right corner of each rank 1 square, rank number in the upper left corner of each a-file square), with CSS on the grid cells. No renderer change, no layout change. (Found by reading the CSS and the scene code; not seen in a browser.)
3. **Decision 8 (unreadable data).** The decision gives no line for the home screen, and the old rule lets a new game write over the unreadable bytes. Plan: unreadable bytes take the path of decision 7 (one copy to `kingdown.save.kept` when that key is empty, the same line), so the line "It is kept." is true.
4. **Decision 1 (a game that starts on one page continues on the other), for "With powers and cards".** Card mode is parked in the old screens (`docs/PARKED.md`): the old page has no card controls, but its computer gets the card moves from the engine. A cards game from the new page opens on the old page with cards for the computer only. The old page must not change. Plan: write the cards game to the one save as decided, and record this as a known limit until the cutover. The lead can choose instead that the new page does not write a cards game.
5. **Decision 10, a save with no `skill`.** The old page plays it as Strong. Plan: show and play it as Club too, and write `club` at the next save.
6. **Decisions 3 and 4, a save with no move.** The old page writes a save with no move at each visit (`main.ts`: `if (!fen) play.save()`). Plan: a save with no move gives no Continue and no confirm, and it gets no kept copy.
7. **Decision 7, the kept copy.** "Once, when that key is empty": a second save that cannot resume, while the key holds the first, is lost at the next new game. Plan: keep the rule as decided and record it. Check repair: a later state of the kept game (the old page played it on) is not a second save; it replaces its copy, so its newest moves are not lost.
8. **Decision 2, an open Beast chain.** A chain capture is not a whole engine move, so it cannot go into `moves`. Plan: a reload restores all whole steps of the turn and returns to the step before the open chain.
9. **Decision 16, the audio unlock.** `src/render/sfx.ts` has no unlock function: `play()` calls `resume()` at each sound, which a phone refuses outside a tap. Plan: a new export `unlockSound()` in `sfx.ts`. The old screens do not call it, so they do not change.
10. **Decision 20 needs positions near an end.** The new page has no position parameter. Plan: the browser run writes a fixture save before the page loads and opens it with Continue. So a save with a FEN start (`back` empty) must resume (its pieces must be known), and Rematch of such a game starts again from its first position (the old page's rule).
11. **Decision 8, "the old protection".** The old page also refuses a write when another tab changed the saved game. Plan: keep that check with the old page's line "Your saved game changed in another tab. Reload to load it, or start a New game."
12. **Decision 15, the Menu group name.** The kit's `choiceGroup` has one legend and its choices. Plan: legend "Coordinates", choices On and Off (and legend "Sound", choices On and Off).

### What does not change for the old screens

- `index.html`, `src/main.ts`, `src/screen/*`, `src/account/*`, the routes, `public/sw.js`, the manifest and the deploy scripts.
- Shared modules change only by an addition that the old screens do not call: `unlockSound()` in `sfx.ts`, and for carry fault 10 at most one `PaintedView.skip` option that is off by default.
- The save shape: the new page writes the old `Save` type with the old field set, and the old page reads it with its own code.

### Checks

- `npm test` and `npm run test:docs` pass. No test is removed or weakened. Baseline (stage B): Vitest 6,307 passed and 384 skipped; `node --test` 114 of 114; docs 187 passed and 1 skipped.
- `npm run build` passes. `dist/` has no symbolic link and no private runtime data. The ALLOWLIST and PRECACHE of `dist/sw.js` name no `next.html` and no `interface/` file; the report gives their counts before and after.
- Each part has its browser record: part C1 the save and resume flows, part C2 the run of decision 20.
- Reports: `runs/playable/c1.md` and `runs/playable/c2.md` in the design project.

## 3. Verification

Part C1: [issue 01](issues/01-c1-save-resume.md), section "Verification". Part C2: [issue 02](issues/02-c2-board-and-faults.md), section "Verification".

## 4. Reviews

- Approval: the owner gave the design and build decisions of this project to the lead (`docs/DECISIONS.md`). The lead answered the 12 items of section 2 on 2026-11-13 and accepted the plan for each (`runs/playable/decisions.md` in the design project, "The lead's answers"). That file says 14 places and has 14 entries: they answer the 12 items here in 10 entries, and 4 entries are not items of section 2 (the Versus card, fault 10, the spec status of `interface-move`, the approval). The count of 12 is correct for section 2. The owner sees the result on a rendered page before any publish.
- Plan review of part C1 (2026-11-13): 14 findings. The builder applied 12 and part of one, and declined one; issue 01 lists each with its reason.
- The new strings of part C1 have no entry in the copy table of `runs/learning/learning-spec.md`.
- Part C1 is built (issue 01, ready-for-human). A checker reads it before part C2 starts.
- Check of part C1 (2026-11-13, three checkers: save safety, repository and tests, play regression): 12 findings. The repair fixed 1 blocker, 2 majors and 4 minors, recorded 1 minor as accepted, and moved 4 minors to `runs/move/carry.md`; issue 01, section "Check repair", lists each. An independent review comes before a pull request.

- Part C2 is built and repaired (issue 02, ready-for-human). It also repairs the two C1 recheck faults. The repair's full test run has 6363 passes and 384 skips; the Node checks have 114 passes. The three source-export cases return to execution with the installed Python. Chromium and WebKit each pass the original four-size fixture matrix. The design-project report `runs/playable/c2.md`, section Repair, holds the repair checks and the before and after evidence. Carry 11 remains in part; 13 stays outside scope; 14 is an accepted limit. An independent review comes before a pull request.
