# Seven faults from the staging pass of tickets 05 and 07

Status: needs-triage.

Source: the two-account pass on staging of 2026-11-25 (head `920573c7a`, PR 479). The report and the pictures are in the lead's run folder `runs/seam-staging-479/` (`pass.md`).

None of these blocks ticket 07: that change changes no screen layout, no style sheet and no game rule; it removes the off build. These faults are probably older than this build (an inference from the diff; no comparison with the live site ran).

1. **Medium. An ended game shows as a live game.** A game that ended on move time stays on Home as "Your move". The game page shows "Your move · Time is up" with cards and SEND. Resign gets HTTP 409 `MATCH_TERMINAL`, and only then the result shows. The other player sees "Their move · Time is up" with "Claim win".
2. **Medium. Home in landscape (844x390): a friend name breaks into pieces of two or three letters,** one piece on each line, so each row of the games list is very tall. At 390x844 and 360x640 the list is correct.
3. **Medium. The sender does not see a declined invite.** After the receiver declines an invite by name, the sender's Home keeps "Invite sent to ...". A reload shows no sign of the decline.
4. **Low. An invite by name does not show on an open Home.** It showed after a reload (20 s wait before).
5. **Low. The join page is blank for about 5 s** for a signed-in player who opens an invite link.
6. **Low. Offline Home shows "Sign in"** in place of the account pill. The pill comes back online.
7. **Low. "Link sent. We tell you when your friend joins." shows in the error colour.**

The pass also gave one result for ticket 05; see that ticket.
