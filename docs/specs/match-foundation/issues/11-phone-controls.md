# Repair phone board controls

Status: resolved

## Report and scope

The owner checks the real phone client. The saved friend board shows move 4, White to move, Black seat. Layout fits, but board taps do not move a piece and buttons repeatedly disable. In a new solo game, piece selection works but a destination tap does not move it. Reopening keeps the selected game. The owner asks to remove Fullscreen.

## Plan and verification

Inspect pointer handling and move ambiguity before changing game behavior. Reproduce the reported input path with touch events. Separate background friend reads from user actions so polling does not lock all controls or repaint an unchanged board. Keep move submission serialized and ignore obsolete background results after a game switch. Remove the plugin Fullscreen control and its obsolete handler/check. Verify touch selection, move choices, successful submission, polling during a game switch, retry and immediate reopening through fixture and real HTTP/PostgreSQL browser checks. Run the required tests, then use the approved pull request and release path. The owner performs the real phone retest; a narrow viewport alone is not a phone pass.

## Findings

The owner uses the iPhone ChatGPT app. The screenshot shows e2 selected and four explicit ordinary/Haste choices. A destination can have both an ordinary and a Haste version. The owner confirms the named button moves the pawn but the board tap does not. A board tap now selects the ordinary move when exactly one exists; the named Haste button remains explicit. Other ambiguous moves still require a choice. The control list has no visible instruction. Add a short move-choice instruction and bring it into view when a destination needs a choice. The touch check selects e2 and taps e4 to submit the ordinary move once. A separate explicit Haste-button check keeps the extra action, then a board tap completes it. No game rule changes.

Friend polling uses the same busy flag as user commands and disables every button for each read. A held-read browser regression fails with `Background polling must not disable game controls` before the repair. The repair uses a separate in-flight poll flag, leaves controls active, skips unchanged results and ignores a reply/error after another action changes the board. User commands remain serialized. Fullscreen and its host-mode handlers are removed.

Fixture and compiled HTTP/PostgreSQL browser checks pass with touch input at 390px, a held background read, a game change during that read, move ambiguity, retries and immediate reopening. Log: `/tmp/kingdown-phone-green.log`. The owner retest below provides the separate real iPhone result.

The first full run passes 1,395 tests and 42 artwork checks. After the owner's move-button confirmation, the destination policy changes to prefer the single ordinary move. Both browser checks pass again with direct ordinary touch movement and explicit Haste followed by its extra touch move. The push gate verifies this final code with the full suite. The review keeps the existing move IDs, server authority, power costs and pending-command recovery unchanged.

## Release

PR 21 merges as `13ba48b814bc8448ea511c72db3c92e7160738b3` after the full push gate and all hosted jobs pass. The approved release script repeats 1,395 tests, 42 artwork checks, HTTP/database, worker, protocol and all three browser checks. Deployment `dpl_HE4fST7syxDZ6hiUC98xEYseLF5Y` is live and passes unsigned checks. Log: `/tmp/kingdown-phone-release.log`.

A fresh ChatGPT request resumes the owner's existing Alicia solo match `7744fcbb-fd7f-4177-8525-9f5aa7ea3e3c`, revision 1 after e2-e4, with Black to move. No move is made. The initial fresh response reuses a preloaded old resource with Fullscreen despite Refresh tools. Full chat reload loads the new resource: no Fullscreen button, correct saved position, no error, and Computer move available. For the iPhone retest, fully close/reopen the app and use the latest response; confirm the missing Fullscreen button before testing.

## Answer

On October 8, 2026, the owner retests in the iPhone ChatGPT app and reports "seems to be working" for destination taps. The owner then retries Computer move and confirms "that worked". Earlier phone checks confirm the layout fits and reopening keeps the selected game. These owner reports complete the real phone acceptance check. The browser checks separately verify that background reads keep controls active and the released resource removes Fullscreen.

The owner reports a slight delay between a destination tap and the piece moving. The board waits for the server to save the move. This work does not measure or reduce that delay. No further failed move is reported. The released repair and its acceptance work are complete.
