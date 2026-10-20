# GUI faults 2026-10-19: the board screen

Status: done
Type: task

Source: the expert design panel (/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md) and an independent check of each fault (/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/fault-plan.json). Each part below is a verified FAULT with one right fix. Build only what each part says. Anything the part calls taste or "for Saar" stays out. Saar's look decisions stand (docs/specs/*/spec.md; the painted look only).

Record: copy this ticket to docs/specs/gui-faults-2026-10-19/issues/<this file name> in the repo, and set its Status to done with the check results at the end.

Gallery for the before state: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md). Render compares: use tools/render-compare (see AGENTS.md) where the part asks for one.

### F05

Fix: In src/plugin/screens/board.ts, copy the web keyboard cursor (src/screen/play.ts:72-76 and :262-275): append one aria-hidden #board-marks div to #board, and where the plugin calls board.setPreview(cursor) for the keyboard cursor (board.ts:253 and :410) also place or clear one <i class="mk-cursor"> at board.screenOf(cursor) while cursorShown is true. Remove it when cursorShown is false and redraw it on resize. Keep setPreview for the move preview. The styles in src/style.css:138-144 are already loaded through app.css:1. Do not change #board:focus-visible in src/style.css (a 6 px vellum inset is a new look for Saar), and do not move drawMarks out of src/screen/play.ts.

Files: src/plugin/screens/board.ts

Proof: Browser check in the plugin harness: focus the board, press an arrow key, assert one #board .mk-cursor exists, its box matches screenOf(cursor) within 1 px, and its computed outline or border is 3px rgb(28, 91, 176); after Escape or blur it is gone. Render-compare a light tile before and after.

Web overlap: None in tickets 03-06. Web ticket 14 cites board.ts:251-254 as evidence only; web ticket 09 and 02 change play.ts, so play.ts stays unchanged.

### F06

Fix: In strips() (src/plugin/screens/board.ts:305-316), for your own usable card coins set `b.dataset.state = 'armed'` when mine && armedCard === index && the coin is not spent, else keep 'used' or 'always'; set aria-pressed to 'true' or 'false' on your own usable card coins only (as the power coin does at :300). The existing .coin[data-state='armed'] rule (src/style.css:511: inset 2px ink, 5px gold-bright) then draws the ring, and app.css:132 already leaves it out of the plain ring. The card image at inset 3px covers most of that ring, so add one rule in src/plugin/screens/board.css beside its card-coin img rule (board.css:14): `#game-table .coin.card-coin[data-state='armed'] img { inset: 5px; width: calc(100% - 10px); height: calc(100% - 10px); }`. No new ring, no outer ring (the phone coin gap is 4 px), no change to unarmed coins.

Files: src/plugin/screens/board.ts, src/plugin/screens/board.css

Proof: Browser check in the plugin harness (390x844 dark, card mode): open the Strike read sheet and use it; assert #card-w-<i> has data-state='armed' and aria-pressed='true', the other own coins have aria-pressed='false', and Cancel resets it. Pixel check: the 2-5 px band inside the armed coin is gold-bright. Render-compare against plugin-card-targets-390x844-dark.png.

Web overlap: Web-adaptation ticket 12 Part 2 and inventory B15 port claude/od-board (direct card arming J6, card faces) into the same strips() lines; parked tickets shared-screens-later 10 and 11 change them too. Build F06 before that port or give it to the same writer. Tickets 03-06 do not touch these files.

### F10

Fix: In src/plugin/screens/board.ts, split sound(step) into the hit (capture or move) and the check. In choose() (:182) and in the replay loop (:512-516), make a once-only hit() guarded by the generation token, pass it as the onContact argument of board.animateMove (src/render/PaintedView.ts:19, :146), call hit() again after the await as the fallback (reduced motion, skip, Motion Off, drop), then play the check sound at rest. Copy the pattern of src/screen/play.ts:292-305. Do not add the web's launch sounds (soundsFor / momentKind): that is new sound design for Saar. Sound stays off by default.

Files: src/plugin/screens/board.ts

Proof: Browser check in the plugin harness with Sound On: stub the sound player to log calls with timestamps and stub animateMove's resolve time; assert the capture sound fires before animateMove resolves and exactly once per step, also with reduced motion (fallback path) and after a skip; the check sound fires after rest.

Web overlap: Inventory B12 and the ticket 12 Part 2 od-board port also change board.ts, but not choose() or the replay sound lines. Tickets 03-06 do not touch board.ts.

### F11

Fix: In src/plugin/screens/board.ts, in board.onSquareClick, the drag-select hook and the Escape handler (:214-218), add `if (animating) { board.skip(); return; }` before canRead() or select() runs. The tap only skips; it does not select (as web play.ts:505). Do not change canRead(). choose() needs nothing more: skip resolves animateMove and its .finally() syncs under the token guard. For the replay loop (:512-516) add a local rush flag that the skip sets; when it is set the loop skips animateMove for the remaining steps but still runs board.sync(step.pos) and the hit-sound fallback, then the existing final sync(authoritative), animating=false, refresh() and scheduleComputer(). Do not bump generation. Keep the networkBlocked() locks. Do not change the motion pace (T08 is taste).

Files: src/plugin/screens/board.ts

Proof: Browser check in the plugin harness: start a multi-step computer reply, tap the board during the first step; assert animating becomes false within one frame after the remaining steps, the final position equals the server position, no piece is selected, and the computer schedule still runs. Repeat with Escape. A tap when not animating still selects.

Web overlap: Inventory B12, B14, B29 and the ticket 12 Part 2 od-board port change select() and the Escape handler in board.ts. Tickets 03-06 do not touch board.ts.

### F13

Fix: Center the close mark. The base button (src/style.css:163-166) is display:flex with text-align:left, and these two rules have no justify-content. In src/plugin/screens/board.css:25 change `#board-sheet .sheet-head button` to `width: 44px; min-width: 44px; padding: 0; justify-content: center;`. In src/plugin/screens/seat.css:13 add `justify-content: center;` to `#seat-menu-sheet .sheet-head button`. The page-sheet rule at app.css:203 already centers. Keep the text '×' and '‹ Play' (tools/plugin-ui-check.mjs:1077 asserts the Back text); a new SVG close mark, chevron or gap is taste for Saar.

Files: src/plugin/screens/board.css, src/plugin/screens/seat.css

Proof: Browser check in the plugin harness at 390x844 dark and light: open the board Menu sheet and the seat menu sheet; assert the × glyph's text box center (Range.getBoundingClientRect) is within 1 px of the button center, and the button is 44x44. Render-compare plugin-board-menu-390x844-dark.png.

Web overlap: None; board.css and seat.css are plugin only. Inventory B28 later moves plugin screen CSS; no ticket 03-06 changes them.

## Build plan and checks

Build F05, F06, F10, F11 and F13 in that order. Commit each part with its test.
Use the plugin harness for the proof above. Run the type check and tests.
Run plugin-ui from committed HEAD with the supplied runner. Compare the requested renders.
Do not change the look, sound design, motion pace or shared web screen.

## Results

All five parts are built in order. Each part has its own commit and test.

- F05: one shared keyboard cursor mark follows the tile on resize. Escape and blur clear it. The test checks the tile bounds within 1 px and the 3 px blue border. Blur changes only the cursor, so an action button keeps its click target.
- F06: your unspent cards expose pressed state. Only the armed card uses the existing armed ring and 5 px image inset. The test opens Strike, uses it, checks the state and gold band pixels, then cancels it. Other own coins stay unpressed; opponent coins have no pressed state.
- F10: each step has a once-only hit callback under the generation guard. Contact plays the hit. Rest supplies the fallback and check sound. Tests cover local capture, replay, reduced motion without contact, Motion Off, skip and a superseded board state. Sound stays off by default.
- F11: tap, drag-select and Escape skip before selection. Replay skips its remaining motion, keeps each position sync and hit fallback, then restores the server position and schedules the computer. Tests check a two-step reply, completion by the next frame, final FEN, no selected piece, the schedule timer and a later normal selection. A real pointer tap also skips a local move. Network locks and generation stay unchanged.
- F13: the existing close mark is centered in both sheet headers. In dark and light at 390 x 844, DOM Range checks put each glyph center within 1 px of the button center. Both buttons measure 44 x 44. The Back text stays unchanged.

### Final checks

- `npx tsc --noEmit`: pass. Both test commands also run the type check.
- `KINGDOWN_TEST_FILE=tools/plugin-board.test.ts npm test`: 142 passed; 51 artwork tests passed. Log: `gui-board-final-board-tests.txt`.
- `KINGDOWN_TEST_FILE='src/**/*.test.ts' npm test`: 122 files passed; 1,838 tests passed; 8 skipped; 51 artwork tests passed. Log: `gui-board-source-tests.txt`.
- Both test commands use the supplied local test database URL and the shared test lock. No time limit changes.
- Supplied runner, M1, `plugin-ui`: pass at `8b792e42` in 271.2 s (`checks-f05-2.txt`).
- Supplied runner, M1, `plugin-ui`: pass at code commit `1ceed760` in 277.7 s (`checks-final-1.txt`). The final amendment changes only this ticket.
- No server code changes. `plugin-ui-http` is not required.
- `git diff --check`: pass.

### Render checks

Use `docs/specs/web-ux/render-compare.mjs`, threshold 16. All three comparisons return 1 because the images differ.

- F05: controlled light-tile before/after, 1,166 changed pixels. The visible cursor is the expected change.
- F06: compare with `plugin-card-targets-390x844-dark.png`, 171,928 changed pixels. The reference is reduced from 2x to CSS size. The new rules fixture and host safe areas also differ, so this full-page comparison does not isolate the ring. The separate coin pixel test proves the gold band within one color level.
- F13: compare with `plugin-board-menu-390x844-dark.png`, 172,655 changed pixels. The reference is reduced from 2x to CSS size. The rules fixture and host safe areas also differ. The direct glyph and button bounds checks prove the correction. Visual inspection confirms both close marks are centered.

Evidence is in `gui-01-board-proof/` beside the requested lane report. It contains the final logs, screenshots and compare images.

No part is omitted. No taste choice is made. The focus style, ring design, launch sounds, motion pace, close text, Back text and shared web screen stay unchanged.

## Review fix plan

Review A and Review B report the same F11 fault. The animation branch returns
before `closeBoardSheet()`. Escape from an open sheet skips the reply but leaves
the sheet open. Both findings are confirmed against the handler and sheet code.

1. Add Menu and Moves sheet cases to the F11 replay test. Confirm they fail.
2. Close the sheet in the animation branch. Keep the rush flag and return.
3. Run the board test file and source unit tests through `npm test`.
4. Commit the fix. Run `plugin-ui` from HEAD with the supplied runner.

Pass criteria: one Escape closes each sheet and restores focus. The reply ends
by the next frame. The final FEN, sound count, selection and schedule checks pass.
No server code changes are needed.

### Review fix evidence

- Review A: confirmed. Review B: confirmed; it reports the same fault.
- Before the fix, both new cases fail at the open-sheet count after Escape.
  The other 142 board tests pass. Log: `gui-01-review-red.txt` in the lane folder.
- The fix calls `closeBoardSheet()` when Escape skips motion and a sheet is open.
  The existing close code restores focus and clears the page lock.
- The test covers Menu and Moves. It keeps the reply position, selection, hit
  sound and computer schedule checks.

- After the fix, `KINGDOWN_TEST_FILE=tools/plugin-board.test.ts npm test` passes:
  144 board tests and 51 artwork tests. Log: `gui-01-review-board-tests.txt`.
- `KINGDOWN_TEST_FILE='src/**/*.test.ts' npm test` passes: 122 files,
  1,838 tests passed, 8 skipped, and 51 artwork tests passed.
  Log: `gui-01-review-source-tests.txt`.
- Both commands use the supplied database URL and shared test lock. Both type
  checks pass. `git diff --check` passes.
- The supplied runner passes `plugin-ui` on the M1 at code commit `78fb9f60`
  in 275.2 s. It reports `check-runner: M1 exit 0 at 78fb9f60`.
  Log: `checks-review-fix-1.txt` in the lane folder.
  The final amendment changes only this ticket. No server code changes occur,
  so `plugin-ui-http` is not required.

Both review findings are fixed by the same close call. Neither is refuted.
All review fix checks pass. No time limit changes occur.
