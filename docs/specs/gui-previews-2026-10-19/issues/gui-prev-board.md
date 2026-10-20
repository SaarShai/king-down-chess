# GUI previews 2026-10-19: the board screen and play loop

Status: done
Type: task

## Why and the rule
Saar, 2026-10-19: "by the time i get back - everything must be sleek and pixel-perfect and faultless and beautiful to look at and a joy to use." His standing rule: a taste call needs his approval. So this lane builds a PREVIEW of the recommended pick of each item below, on its own branch, at award-level craft. Nothing merges until he approves the item on his approval page. Build each pick exactly as its option text says; do not build the other options; add no idea that the item does not name. Where a pick leaves a detail open, choose the most restrained and clear answer, and name it in your answer as a taste choice.

Record: copy this ticket to docs/specs/gui-previews-2026-10-19/issues/<this file name> in the repo, set its Status to done, and add the check results at the end.

Screens before the change: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md names each image). The expert reviews: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md, /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/suggestions.md, review-astra.md, review-opus.md; /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/argon-1.md, argon-2.md.
Proof for each item: before and after screenshots of each screen it changes, at the sizes where it shows (plugin harness: 390x844 and 1280x800, light and dark; web: 390x844 and 1440x900), saved as /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-prev-board/previews/A<n>-<screen>-<size>-<theme>-before.png and -after.png. Take the before shots from the branch base, the after shots from your commit. A test for each behaviour change. npm test and the plugin-ui browser check pass. One commit per item.
Art: new or changed images only through Codex's built-in image_gen on the ChatGPT plan (never the paid images API). Match the painted cast (public/pieces/painted-2d/, docs/2d-first-pieces/) and keep every page under its size limit (the plugin page HTML stays under 1,000,000 bytes).

### A14 Turn button: sword only, or sword with words? (your 2026-10-15 choice)

Problem: On 2026-10-15 you chose a sword with no words. All five leads say new players do not know the sword means “End turn”; they rate it the top fault. I keep it as your call.

Build: **Sword plus words**. “End turn” (computer) or “Send your turn” (person) next to a small sword, 16 px bold.

Why this pick: Words on the button follow “recognition rather than recall”; the sword can stay beside the words.

Other options (do not build): Keep the sword only (Your 2026-10-15 choice.); Words only (Remove the sword.)

### A15 Selected piece: the glow hides behind front pieces

Problem: When you select a piece behind another figure, its foot glow hides under the front figure, so you cannot see what is selected. Your legend says “a warm glow and a gold ring at its feet”, but the ring does not draw today.

Build: **Add the gold ring from your legend, drawn on top**. Keep the foot glow; the thin gold ring draws after the front figures.

Why this pick: Drawing your own gold ring over the front figures fixes it with the look you already chose.

Other options (do not build): Lift the whole glow above the front figures (Brighter, can cover the front figure’s feet.); A gold square fill on the selected tile (The panel’s idea; check it against the green move tiles.)

### A17 Frozen piece: no mark on the board

Problem: After Freeze, the board shows nothing on the frozen piece. The look is an open question from the web review (F3, W12).

Build: **Reuse the Workshop frost mark**. Tint, blue ring and turn pips, as in the Workshop.

Why this pick: Reusing the Workshop frost mark keeps one visual language for “frozen”.

Other options (do not build): Ice with a turns-left badge and a thaw (The web-ux F3 design.); A small snowflake badge (The panel’s idea.)

### A18 Moves list says “No moves shown yet” while a move waits

Problem: After you stage a move, the moves line names it, but the list says “No moves shown yet.” Your send-turn choice T5 a says no extra “unsent” mark.

Build: **Change only the empty-list words**. For example “No turns sent yet.”

Why this pick: Changing only the empty-list words keeps T5 a and removes the mixed message.

Other options (do not build): Keep as is (); Label staged moves “Not sent” (This reverses T5 a.)

### A27 Phone board: an empty moves list opens at the start

Problem: On a phone the moves band opens at move 1 and says no moves are shown yet. It touches your moves-band layout and the empty-list words item.

Build: **Keep the band shut until the first move**. It opens by itself when there is a move to show.

Why this pick: A closed band at the start gives the board more room and shows nothing empty.

Other options (do not build): Change only the empty-list words (Keeps your band layout.); Keep as it is (The band opens empty.)

### A39 Take or Shove: the choice covers the squares

Problem: The Take or Shove choice sits at the board centre and covers the piece and the squares the player chooses between.

Build: **Put the choice at the board foot**. The squares stay in view.

Why this pick: With the choice at the board foot, the player sees the move they choose.

Other options (do not build): Put the choice beside the board on a wide screen (Phones keep the centre.); Keep as it is (At the board centre.)

### A8 Motion: quieter and controllable

Problem: Long quiet moves, a dot wave on legal moves, and resting pawn motion make play feel slow; there is no motion setting.

Build: **Shorter quiet moves and an Animations setting**. Quiet moves at most 420 ms (Normal) or 260 ms (Fast); legal-move dots appear together; Animations Normal/Fast/Off beside Sound; no flashing End turn; no idle pawn motion.

Why this pick: Short moves keep the game snappy; a setting respects players who want less motion.

Other options (do not build): Same pace, tap to skip (Keep timing; a tap skips any animation.)


## Plan and checks

Base: `bc62f4ee`. Build A14, A15, A17, A18, A27, A39, and A8 in that order. Keep one commit per item.

For each item: add a behaviour check, run the type check and unit tests, commit, then run `plugin-ui` with the lane runner. Capture the changed screens at device scale 2. Use the saved base build for before screens. Inspect the screen pairs. Keep all work on this branch for owner approval.

The final check covers all seven items. No server contract changes are planned.

## A14 check record

The visible label and sword pass the screen check at both plugin sizes, in both host themes, for computer and person games. The type check passes. The eight after screens are in `previews/`. The full plugin check passes before the capture step in run A14-1. Run A14-4 reaches the fixed 420 second limit. The unit test run remains in the shared test queue.

Taste: the sword is 22 by 16 px. The gap is 6 px. The 16 px label can wrap on narrow screens.

## A15 preview

Keep the foot glow. Draw a 1.5 CSS px gold ring after the last figure row. Use the legend gold and a dark gold edge. The unit check covers both board directions and the final draw order.

## A17 preview

Share the Workshop frost drawing with the painted board. Keep its blue tint, crystal lines, blue ring, and moon pips. Read the mark and turns from the engine. Clear the drawing when the mark ends or its piece leaves. The pips draw after all figures. The unit check covers two sides, two turns, expiry, empty squares, own pieces, and Ice Wall.

A15 saves its plugin and web builds at commit `1694b5f9` for the final screen check.

## A18 preview

Both empty history views say “No turns sent yet.” The staged move line stays as it is. No unsent mark is added. The browser check stages a move, opens Moves, and checks the words.

A17 saves its plugin and web builds at commit `1b24c86b`.

## A27 preview

The phone band stays shut with no sent moves. The first sent move opens it. A manual close still holds on resize. A staged move alone does not open an empty list. The browser check covers these four states.

Taste: “first move” means the first sent move, because this list shows sent history. A18 saves its plugin build at `da987ecc`.

## A39 preview

The web Take or Shove choice sits below the board when it fits. On a tall board, it sits at the board foot and stays in the viewport. It follows a resize. The dialog keeps its focus and Cancel rules. The unit check covers a phone, desktop, and short viewport. The browser check checks that the target square stays above the choice. The plugin still needs the same space rule. See the second review fix below.

Taste: use a 12 px gap and a light 16 percent veil with no blur for this choice. A27 saves its plugin build at `12555419`.

## A8 preview

Normal quiet moves take at most 420 ms. Fast quiet moves take at most 260 ms. The shared renderer sets these limits, including quiet knight and paladin moves. Legal move marks appear together. Resting pawns stay still. The turn button has no flash.

Animations sits beside Sound in Settings. Normal, Fast, and Off stay on this device. Off stops canvas and CSS motion. The system reduced motion setting still holds. The web setting uses the same name.

Taste: Normal is the default. A39 saves its web build at `26690bb5`.

## Check split and visual review

All saved preview assertions pass in run final-2. The combined capture and plugin flow reaches the fixed 420 second limit. The preview now has its own named check, `gui-board-preview`, with a 180 second limit. `plugin-ui` keeps its 420 second limit. Both run through the lane runner.

The 2× review finds one new spacing fault: the Animations label sits 12 px left of Sound. The final A8 change gives both rows the same inner gutter. The preview check measures their text edges.

## Final check results

The seven preview builds are done. Owner approval is still open. The full unit suite is blocked.

- `npx tsc --noEmit`: passes. It also passes in each commit hook.
- `gui-board-preview`: passes in 119.7 seconds at `2e47f799`. It checks the saved item builds and the final A8 build.
- `plugin-ui`: passes in 324.6 seconds at `2e47f799`. The lane runner ends with exit 0.
- `npm test`: cannot start the suite. Another lane holds the shared test lock. The first request stays in the queue for more than 40 minutes. This lane stops only that queued request. A five-second lock retry ends with exit 75. No test time limit is raised. The new unit tests have not run.
- `plugin-ui-http`: not required. No server code or contract changes.
- The final MCP board resource payload is 762,291 bytes, below 1,000,000 bytes.
- There are 88 proof screens, at device scale 2: 44 before and 44 after. The artifact `previews/INDEX.md` links each pair. The base is `bc62f4ee`. The saved builds keep each after screen tied to its item commit.

The final record change also makes a missing saved build fail with a clear error. It cannot label the current board as a before screen. This guard does not change the product.

## 2× review

The review checks the changed marks, words, action targets, spacing, and dialog positions against the seven picks. The turn label first has a 14 px cascade fault; the fix sets it to 16 px. The Animations row first has a 12 px gutter fault; the fix aligns it with Sound. The final screens show no further fault in the changed parts. The selected pawn's ring stays visible above the front king. The frost pips stay sharp. The choice leaves the Ogre, victim, and landing square in view.

No item is left unbuilt. No new bitmap art is needed. Nothing is pushed, merged, or deployed. The required full unit check remains open because of the shared lock.

## Review fix plan

Check both reviews against the source. Fix the six distinct faults. Keep the three item fixes in separate commits.

- A39: reserve space below the board. Check lower-rank targets and landing squares in both board directions, on phone and desktop. Check resize and Cancel.
- A8: make Off stop aiming. Advance the pawn test timers. Check the phone select with a real tap. Capture the web Menu and assert its labels and options.
- A17: check the actual board drawing after Freeze, expiry, and Undo. A removed draw call must fail the test.

Verification: run `npm test` with the local test database. Run `plugin-ui` and `gui-board-preview` through the lane runner after commits. Keep the fixed time limits. No server code changes are needed.

### A39 review fix

Reviews A1 and B2 are confirmed. The old viewport clamp covers d2 and d1. Reserve the measured choice height below the board. Reduce the board height when needed. The check uses d3 to d2 and, after a flip, d6 to d7. It checks the full board bounds, resize, focus, and Cancel.

### A8 review fixes

Reviews A2, A3, A4, B1, and B3 are confirmed. Off now sets reduced motion in the scene. The board test checks that call for all three settings, with and without system reduced motion, while aiming at a legal square. The pawn test installs its timer queue and restores the real timer in `finally`. Both phone hit-layer rules raise selects with inputs. The browser test uses a real tap and checks its target and the open select. The web proof opens Menu and checks Sound, Animations, and Normal/Fast/Off before capture. It also captures Motion on the base build.

### A17 review fix

Review A5 is confirmed. The old tests check mark data and SVG strings only. The new board test runs the registered scene draw callback with an engine Freeze, expiry, Undo of expiry, and Undo of Freeze. It checks both drawn layers and their square bounds. The browser check observes the actual game canvas draw calls. It checks the two-turn plugin mark, then plays Freeze on the web, checks Undo, and plays both turns until the mark ends. It uses the current build for the after proof.

### First review check

`plugin-ui` passes at `63a04845` in 226.8 seconds. The preview check catches a wrong test expectation: the web Freeze lasts one turn, not two. Both frost layers draw. The check now follows that rule. The plugin fixture still checks two pips. The web Off check also measures board frames while the selected Archer aims. The A39 check captures the same lower-rank positions from the base build. The unit suite still waits for the workshop lane's test lock.

### Clock check

The second preview run passes frost, both lower-rank board directions, and the real phone select tap. Its new Off frame check resets the fake clock after scene timers start. That leaves an old draw deadline in the future. Install the clock before page load, then pause it for the frame check. No product change is needed.

## Review fix results

All eight review entries are confirmed. They describe six faults. Each fault has a fix and a test. The review fix stays on `claude/gui-prev-board`.

- A1 and B2: reserve room below the board for Take or Shove. The board shrinks when needed. Lower-rank targets and landing squares stay clear in both board directions. Resize, dialog focus, and Cancel pass.
- A2: Off sets reduced motion in the scene. The browser frame check shows one frame for Archer aiming, with no follow-up weapon frames. The unit check also covers all settings and system reduced motion.
- A3: the pawn test uses the fake timer queue and restores the real timer in `finally`.
- A4 and B3: web captures show Menu with Sound and Animations. The check asserts the label and Normal/Fast/Off. The base captures show Motion. Both web sizes have the correct before and after screens.
- A5: the board draw test checks Freeze, expiry, and Undo. The browser check observes both frost layers on the real game canvas and checks expiry and Undo. The plugin fixture checks two pips. The web game checks its one-turn rule.
- B1: both phone hit-layer rules raise the select above the label. A real tap reaches the select and opens its choices.

Check results:

- `plugin-ui`: passes at `63a04845` in 226.8 seconds. Later commits change the check scripts and this record only.
- `gui-board-preview`: passes at `7102e06f` in 151.7 seconds. The lane runner reports exit 0.
- The commit hooks pass the type check and repository gate. JavaScript syntax checks and `git diff --check` pass.
- `npm test`: blocked. The last five-second lock retry exits 75 before the suite starts. The workshop lane holds the shared lock. Only this lane's first queued request is stopped. No test or check limit is raised.
- `plugin-ui-http`: not required. No server code changes.
- The screen index has 46 complete pairs, 92 PNGs, at device scale 2. The screen review checks the desktop lower ranks, the flipped phone lower ranks, frost, and both web Menu sizes. The largest current board resource is 762,389 bytes.

Unit verification remains open. Keep this ticket in progress until the full suite can run.

## Test repair (2026-10-19)

Plan:

1. Merge `origin/main` into this preview branch. Keep the fault fixes and the seven preview picks.
2. Run the unit suite on the M1 at the merge commit. Class each failure as old text (a), a missing fixture field (b), a product fault (c), or load (d).
3. Fix each cause. Keep every size, touch, timing, and access guard. Commit each repair kind.
4. Run each repaired test file on the M1. Then run the full unit suite there again. Run `npx tsc --noEmit` here.

Pass criteria: all M1 tests pass, except database tests that need the local database. The type check passes. No check limit changes. Browser checks and new screen captures stay with CI, as the repair ticket directs.

The merge takes `origin/main` at `0a7ec40b`. It has no conflicts. The automatic merge keeps the board, seat, cursor, and keyboard fault fixes with their tests.

Kind b, A8: `src/plugin/app.test.ts` now gives the board mock its `animations` and `setAnimations` exports. The app tests keep their real client, queue, and router. Three new cases check the initial select value and each motion choice.

Kind a, A14: the six Menu cases in `tools/plugin-board.test.ts` expect the visible person-game label, `Send your turn`. The W7 case expects the visible computer-game label, `End turn`. The sword, menu fit, single send, and focus checks stay in place.

Kind a, A8: the two Settings cases in `tools/plugin-ios-size.test.ts` expect four rows. A new check names all four controls, with Animations last. Every row still has the 44 px floor. The three online choices keep the same count and floor.

Kind c, A14: `src/plugin/app.css` uses `var(--fs-body)` for the turn label. This is the existing 16 px token. The type-scale guard stays as it is. This repair does not change the rendered size or screen layout.

The merge baseline (`unit-1.txt`, `89fc4e64`) ends with 86 failed, 3,044 passed, and 164 skipped tests in 280.61 seconds. Four files fail. The 12 skipped files all need the database. The judge test from main passes. The baseline shows all four Settings rows at 44 px; only the old count fails.

The repaired files run in sequence at `af0bfae9` (`unit-2.txt`). The run ends with 276 passed and one failed test in 243.79 seconds. All 86 baseline failures pass. The new failure is the Fast reduced-motion check: no victim frame exists when the opacity check starts. This case passes in the full baseline run.

Kind b, A8: the reduced-motion fixture installs its clock before page load, through the existing `open` option. It keeps one clock from scene load through the capture. It no longer replaces a clock after the scene queues frames. This applies the clock rule already used in the preview check. A new assertion requires a victim frame before the opacity checks. The 420/210 ms slide, 150 ms fade, opacity formula, completion, and no-shake guards stay in place. No limit or retry changes. No product change.

### Repair check results

All repaired files pass on the M1:

- `src/plugin/app.test.ts`: 79 passed. The three new A8 cases pass.
- `src/plugin/type-scale.test.ts`: 7 passed.
- `tools/plugin-ios-size.test.ts`: 31 passed. All four Settings rows meet the 44 px floor at both sizes.
- `tools/plugin-board.test.ts`: 160 passed at `f2dc4eca` in 185.49 seconds (`unit-3.txt`). Both reduced-motion speeds, all six Menu fit cases, and W7 pass. This file runs alone.

The first three files pass in sequence in `unit-2.txt`. The final full suite checks all four files again at `f2dc4eca` (`unit-4.txt`): 3,133 passed, zero failed, and 164 skipped tests. It has 186 passed files and 12 skipped files. All skips need PostgreSQL, which the M1 does not have. The suite ends with exit 0 in 283.95 seconds.

`npx tsc --noEmit` and `git diff --check` pass. The commit hooks pass the type check and repository gate. No test limit, STEP value, assertion scope, or retry changes. No kind-d failure remains.

The repair ticket directs browser checks and screen captures to CI. This lane runs no browser check, capture script, or unit suite on this Mac. The only kind-c product repair keeps the same 16 px label size, so it needs no new screen sample. No server code changes.

The test repair is done. All seven parts remain built. Owner approval for the previews is still open. This repair makes no new taste choice. Nothing is pushed, merged to main, or deployed.

## Second review fix plan

Review A has two confirmed faults. Review B has no finding.

1. Reserve space below the plugin board for its move choice. Check both seats at phone and desktop sizes. Check the full board, resize, focus, and Cancel.
2. Use the current plugin build for all after checks. Keep saved builds for before samples. Remove each A18 and A27 product change in turn and confirm that its check fails.
3. Run `npm test` here with the test database. Commit, then run `plugin-ui` and `gui-board-preview` through the lane runner. Record the results. Keep all time limits.

Pass criteria: each confirmed fault has a test. Both mutation checks fail for the correct cause. The unit suite and browser checks pass at the fixed code. No server code changes are needed.

The first check at `52fff956` passes `plugin-ui` in 225.0 seconds. The preview check passes A18 and A27 on the current build. It also captures all eight plugin A39 screens after the layout, resize, focus, and Cancel checks pass. The combined preview check reaches its fixed 180 second limit. Remove saved before builds from the routine check list. The before capture mode and saved samples stay available. All current-build checks stay in the list.

## Second review fix results

Both Review A findings are confirmed and fixed. Review B supplies no finding.

- A1, A39: the plugin move choice uses the shared board-foot position code. It reserves the measured choice height below the board. A long list can scroll. The light veil leaves the squares in view. The check covers both seats, both host themes, 390 × 844 and 1280 × 800, and a viewport 100 px shorter. It checks the full board, both move choices, resize, Tab and Shift+Tab, Escape, Close, restored focus, and no played move after Cancel. All eight new plugin screens pass visual review. The piece, target, and landing square stay clear.
- A2, A18 and A27: all plugin after checks use the current build. Saved builds serve only historical samples. The routine check list contains current samples only. No current assertion is removed. Removing both A18 word changes makes the check fail on the old empty-list text in 5.1 seconds. Removing the A27 history guard makes the check fail on the open empty band in 3.5 seconds. Both fault checks run through the lane runner on the M1. The fixed files and full check list are restored before the final checks. The temporary fault commits do not stay on the branch.

Checks:

- `plugin-ui`: passes on this Mac at `52fff956` in 225.0 seconds. Later changes affect the check list and this ticket only.
- `gui-board-preview`: passes on this Mac at `d065bffe` in 125.1 seconds. The final run passes on the M1 at the same commit in 132.7 seconds. Both lane runs end with exit 0.
- `npm test`: passes here at `d065bffe` with the local test database. All 198 files pass: 3,289 tests pass and 8 skip. All 53 art tests also pass. The unit phase takes 223.25 seconds. The command ends with exit 0.
- The first unit run has 5 failures, 3,284 passes, and 8 skips. Its package link points to the removed `release-main` installation. The failures name missing `tsx` or `vitest`, or the missing link target. `tools/wt.sh add` repairs only this worktree's link to the main checkout's matching packages. The full second run clears every failure. No tracked package file changes.
- The type check, commit hooks, JavaScript syntax check, and whitespace check pass. No test or check time limit changes.
- `plugin-ui-http` is not required. No server code changes.

This Mac briefly runs out of disk space between the fault checks. Only PNG output from this run's completed `plugin-ui` check is removed. Its text logs stay in place. The eight new A39 proof screens stay in the preview folder. The unit request is paused only during the fault checks, then resumes on the restored fixed code. No process from another lane is stopped.

The review fix is complete. Owner approval for the original previews stays open. Nothing is pushed, merged to main, or deployed.

## Owner picks 2026-10-20

Status: review fixes in progress. The owner authorizes picks-1020, Lane board.

Review fix plan and pass criteria:

1. A8: let the active reply or ceremony finish before the renderer consumes
   the gesture. Test real mouse and touch input for a two-move Haste reply,
   the web final blow, and the plugin king fall. Check the final position,
   cleared timers, and no second action from the same gesture.
2. A15: draw the gold fill before check and threat marks. Keep figures and
   frost above it. Test selection with check and threats in the same draw.
3. Run each changed test file, then `npm test` here with the local test
   database. Commit before the lane runner checks `plugin-ui`. Keep all
   limits and assertions. Record each finding and the check results.

Plan and pass criteria:

1. A8: restore the main move timing, marker wave, pawn motion, and turn pulse. Remove the plugin motion setting. A tap ends board motion and cannot also act on a square or button. Test skip, final state, and reduced motion.
2. A14: keep the sword alone. Keep the computer and person accessible names. Check size, focus, menu fit, and one send.
3. A15: put a gold fill under the selected tile. Remove the ring. Check layer order and both themes.
4. A18: remove all empty move-list words on both hosts. Keep the list name and the closed phone band. Test empty and sent history.
5. Y3: show only the king and power in the seat line. Keep the Ready help. Test both states.

Commit each item. Run the type check here. Run the unit suite through m1-unit.sh and browser checks with KD_RUNNER=m1. Capture the changed screens one browser at a time. Check every screen. Record the results here and in the lane report. Keep each existing guard and time limit.

### A8 build

Main timing, the marker wave, resting pawn motion, and the turn pulse are restored. The plugin uses its main pace and has no Animations row. The web keeps its original Motion control. A document capture handler ends a move or a king fall before the tap reaches a square or button. It consumes the release and click too. Reduced motion keeps the slide and 150 ms victim fade. Unit checks cover the full gesture, the restored wave and pawn motion. Browser unit cases check real mouse and touch input, the final capture, and the saved draft. The type check passes. M1 checks follow after all five commits.

### A14 build

The turn button shows the original full-width sword alone. Its accessible name and title remain End turn for a computer and Send your turn for a person. The six menu cases and the staged-turn case now expect no visible words. Size, focus, menu fit, and single-send checks stay in place. The type check and commit gate pass. M1 checks follow.

### A15 build

The selected tile has a solid gold fill under all figures. A dark gold square edge keeps it clear on both stone colours. The thin ellipse and foot glow are removed. This is the taste choice: one clear tile mark, with no second glow. Green move tiles, the transparent last-move wash, and blue frost keep their own marks. Frost draws above the fill. The draw test checks the exact tile, layer, and edge in both board directions. M1 checks and screen review follow.

### A18 build

Empty move lists have no text in the plugin or web game. The web empty-state CSS and empty last-move words are removed too. The plugin region keeps its Moves name. Both sheets keep their names. A27 still keeps the phone band closed until sent history exists. New phone and desktop cases check empty text and accessible names. The capture check still checks the full empty sheet. M1 and web screen checks follow.

### Y3 build

The seat line says Spirit · Mercy, or the chosen king and power. It has no coin instruction. The help below the strip still says Choose your king, then press Ready. A new case checks both the choosing and ready states and the visible coin. No taste choice is needed. M1 checks follow.

### First check results

The M1 unit suite passes at `0599dad7`: 186 files pass, 12 database files skip, 3,142 tests pass, and 164 tests skip. It takes 353.02 seconds. All 167 board cases pass. The type check and commit gates pass.

The first browser run passes A14, A15, A18, and Y3. Two failures have clear causes:

- Y3: the main plugin check still expects the removed coin instruction. Its exact text assertion now expects Mud · March.
- A8: the restored marker wave keeps a draw timer active after Motion becomes Off. Reduced motion now clears that timer. A new live-board case starts a wave, selects Off, and checks that frames stop. The existing one-frame hover guard stays unchanged.

No assertion, touch floor, time limit, or retry changes. The fixed code needs the M1 suite and the two failed browser checks again.

The next run passes A8. The main plugin check clicks Menu while the computer piece still moves. A8 consumes that click, as required. The menu helper now waits for the board move to end before it opens Menu. The separate A8 checks still prove that a skip tap cannot open a menu or act on a square. No assertion or time limit changes.

The menu wait must not require a visible board. The failed-load case hides the board and keeps Menu available. The wait now checks only that board motion ends. The failed-load assertions stay in place.

### Final check results

All five parts are built. Each part has its own first commit: A8 `38fbba11`, A14 `dd64c7f1`, A15 `6adcdd80`, A18 `135d994c`, and Y3 `b8bcebe3`. Later commits add the capture matrix and fix the check failures above.

| Check | Code commit | Result |
| --- | --- | --- |
| Full M1 unit suite through m1-unit.sh | `0677b599` | Pass, 313.54 seconds. 186 files pass and 12 database files skip. 3,143 tests pass and 164 skip. |
| plugin-ui | `0677b599` | Pass, 257.9 seconds. Runner exit 0. |
| gui-board-a8 | `215a32ee` | Pass, 24.3 seconds. |
| gui-board-a14 | `0599dad7` | Pass, 25.6 seconds. |
| gui-board-a15 | `0599dad7` | Pass, 24.2 seconds. |
| gui-board-a18 | `0599dad7` | Pass, 30.4 seconds. |
| gui-board-y3 | `0599dad7` | Pass, 13.1 seconds. |

The later code changes do not change the four screens checked at `0599dad7`. The two commits after `215a32ee` change the menu check and this record only. All 168 board tests, 13 PaintedView tests, 11 marks tests, and 31 phone size tests pass in the final suite. The type check, commit gates, and whitespace check pass. The board resource is 907,534 JSON bytes, which includes the HTML and stays below the 1,000,000-byte limit.

All 42 after captures pass visual review: A8 10, A14 8, A15 10, A18 10, and Y3 4. They cover 390 × 844 and 1280 × 800 in both themes. The web also has 1440 × 900 captures. Each image has device scale 2. The gold tile stays visible behind the front figure and differs from green move tiles and the pale last-move wash. The sword, empty sheets, settings, and seat line have no new fit fault.

The taste choice is a solid gold tile (`#d8aa43`) with a dark gold edge (`#684819`) at 2 CSS pixels. It has no foot glow. The other four parts need no new taste choice.

The ticket's M1 helper replaces the requested local npm test command. It runs the Vitest suite, not the separate Node art phase. The skips include database cases and existing engine and balance cases. No local unit suite or browser check runs. No server code changes, so plugin-ui-http is not required. No part remains unbuilt. No assertion, touch floor, time limit, or retry is weakened. Nothing is pushed, merged to main, or deployed.

Evidence is in the lane output folder: `unit-5.txt`, `checks-picks-5.txt`, `plugin-ui-final.log`, the earlier pick-check logs, `shots-review.json`, and `shots/`. The complete handoff is `picks-board-build.md` in that folder.
