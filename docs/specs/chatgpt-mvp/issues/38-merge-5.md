# 38 Merge 5: the five fault lanes and main into the release candidate

Status: in-progress
Branch: claude/release-candidate (head a9894b6a after merge 4), worktree .claude/worktrees/release-candidate. Tickets 29 and 34 have the earlier merges and their rules.

Why: five lanes fixed faults from 4692477c beside merge 4. Integrate them before the iOS and Android rechecks and rolling QA 3.

## Merge, in this order (git merge --no-ff; no squash, no rebase)

1. claude/rc-fixes at f2977935 (ticket 33: service.ts invitation, board.ts lessons).
2. claude/qa2-faults at e8098d2c (ticket 32: end.css under 320 px, lobby.css Share and Copy, board.ts "Vault.").
3. claude/touch-scroll at 82efdb65 (ticket 35: app.css and PaintedView touch-action pan-y with the drag guard).
4. claude/android-fixes at 5c7b76ac (ticket 36: F9 bar row, T-B compact end card in short landscape).
5. claude/k-picks at 15f8f02c (ticket 37: K1 a two-row strip up to 440 px, K2 a Resume on two lines).
6. origin/main at 04b7af87 (PR 60: the harness remount).

Expected conflicts:
- end.css: qa2-faults (max-width 319px, the cut action, the 224 px cap on short views) and android-fixes (max-height 480px landscape). Keep both rules; check that each media query still matches only its own case.
- app.css: touch-scroll, android-fixes and k-picks each touch it. Keep each change.
- board.ts: rc-fixes (lessons) and qa2-faults (the stop on the armed line).

## Then, small changes on top (each with a test)

- N1 (ticket 32 iOS section): run zoomEndFits at 201 x 357 with insets 31/17 and with 62/34 (iOS Safari 200% zoom). If a fault shows, fix it under the same rules as ticket 32 C.
- Touch guard (ticket 35 review note): on the other player's turn, a swipe that starts on their piece must scroll. The drag guard (preventDefault on touchstart) applies only when the board takes this player's input. Add a browser check with touch on the other player's turn.

## Done when

- Each merge commit message lists each conflict and how both sides keep their intent.
- npx tsc --noEmit, npm test (through the test lock), plugin-ui (check-runner, the M1), plugin-ui-http (this Mac, the test database) and WebKit plugin-ui (PLAYABLE_BROWSER=webkit check-runner.sh ... plugin-ui; this Mac) pass at the head.
- The answer lists the head, each merge, each conflict, N1, the touch guard, and the check results.

Then: the iOS Simulator recheck (swipe, End turn, K1 and K2 look), the Android F9 recheck, rolling QA 3, and two Codex reviews of the delta.

Note for the end.css merge: android-fixes measured the end card at 197 x 426 (loss: scrollTop 137, title and result out of view at first view). qa2-faults C owns the under-320 px end card. After the merge, the qa2-faults zoomEndFits and the android-fixes T-B check must both pass; neither rule may change the other's case.

## Build plan

1. Merge the six local refs in the given order. Record each conflict in its merge commit.
2. Add the N1 size cases. Keep the cut action cue at each size.
3. Limit the touch drag guard to a board that takes player input. Test scroll and drag.
4. Review the head against a9894b6a. Use scratch copies for review probes.
5. Run the type check, full test suite, and the three browser checks at the head.

Pass criteria: each lane keeps its change. The narrow and landscape end checks both pass.
A swipe on the other turn scrolls. An own-piece drag on the player turn moves the piece.
All required checks pass. No push, pull request, merge to main, or deploy occurs.

## Merge record

- d8e210b5: rc-fixes. Resolve board.ts. Keep stale-turn and draw messages. Put a fresh lesson first.
- ea5a387e: qa2-faults. No conflicts. Keep all three fixes and the stronger end check.
- 1b6049f2: touch-scroll. Resolve the card focus note and browser helpers. Keep explicit WebKit focus and both touch and end checks.
- 8dd01de5: android-fixes. Resolve end.css and the bar size check. Keep the narrow cap and add the separate landscape block. Keep the recent moves check.
- 83c25c59: k-picks. Resolve Resume and size tests. Keep the Home wait, two-line text, extra coin row, and touch bar.
- 0db1c1b5: main. Resolve the harness mount. Replace the target widget frame. Keep the per-widget state and call hooks.

## Added checks

N1 uses 201 x 357 with insets 31/17 and 62/34 for win and loss.
The other-turn swipe starts on a piece of the side to move. Existing touch drags still send a move once.
The drag guard uses the board input gate and the player seat.

The first browser run at 12a4bbec stops on the old F9 board widths.
K1 adds an approved coin row at 393–440 px. Set the F9 widths to that layout.
Keep the 4 px bar cost check. All F9 hit sizes and all short landscape end cases pass in this run.

N1 fails at fb415019: the loss card at 201 x 357, insets 31/17, hides New game.
Use compact spacing only below 380 px high in narrow portrait. Keep Back clear.
Move the input gate to the touchstart guard only. Keep mouse drag read checks.
The fresh-frame remount test must find the new frame, not use the detached frame.

Both independent readers find the same N1 issue at fb415019. No other confirmed finding.
The fix at 51354ad3 passes both loss N1 cases on the M1 so far.
The first full test run has 4 failures: two mouse read-drag assertions, the detached frame reference, and a width of 300 instead of 299.
Keep setup touch drags as before. Add a setup touch guard assertion. Use the measured 300 px width.

## Review and final check record

The two read-only reviews at fb415019 report one N1 issue each. The M1 check passes at 51354ad3 after the N1 fix.
Each review uses a separate source copy from git archive. Final reviews use the final source and a9894b6a as the base.
The touch unit check sends pointercancel when native pan takes the gesture. It still requires touchstart to remain uncancelled.
The N1 spacing choice applies only to narrow portrait views below 380 px high: a 144 px card cap, compact gaps, and no decorative King Down line. Keep the result, title, and actions.
No dependency or game rule changes. No push, pull request, merge to main, deploy, or sign-in.
Final check logs and the complete result go in scratchpad/lanes/merge-5/merge-5-build.md, as the owner requests.

Final review at 7fcec973 finds one weak F9 check: show() can measure the prior sample before the next read ends.
Add the existing game-read wait and wait for Reload to unlock. Then measure the new sample.
The full suite passes at 7fcec973: 191 files, 3137 tests pass, 8 skip; the 51 art tests pass.
The final head must pass the full suite and all three browser paths after this check change.

The HTTP check at afc03876 finds a K1 fault: the own name has 108 px of text in 94 px beside the rating.
The fixture name is short, so only the HTTP profile exposes it. Both cases already test full name bounds.
In the existing two-row card strip, use the base two-line name and rating layout within its 44 px first row.
Keep the coins on the second row. Keep the grid and the board size. This choice gives each name the full 188 px span.
The failed HTTP log is checks-afc-http.txt; its detail log is in the runner output folder.

The M1 run at 2578ad9f confirms both names fit in 188 px. The first K1 measure catches the upward card-deal motion.
Wait for the table animations to end before the K1 row measure. Keep all fit and second-row assertions.
The name and rating keep the full first row. The product grid does not change.
