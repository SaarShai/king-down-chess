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

Then: the iOS Simulator recheck (swipe, End turn, K1 and K2 look), the Android F9 recheck, rolling QA 3, and a Sol + Astra review of the delta.

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
