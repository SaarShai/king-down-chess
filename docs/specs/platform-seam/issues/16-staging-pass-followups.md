# Follow-ups of the staging pass of PR 485

Status: ready-for-agent

Class: B. Size: S.

Source: the staging pass of 2026-11-26 (head `05c8fa9c8`) and the local playtest of 2026-11-26 (head `ede901b79`). Reports: the lead's run folder `runs/web-faults-485/` (`staging.md`, `local.md`).

## Points

1. **Medium. A name with a hyphen breaks before its last characters** in a Home games row at 844x390, 667x375 and 360x640: "BOLD-OGRE- / 97". A name of 20 letters breaks with a last line of one letter. Wanted: the name stays on one line and is cut with "…" when it does not fit; the full name stays available to a screen reader.
2. **Low. Home says "Time is up · less than 1 hour"** for a game whose move time ran out. Wanted: "Time is up" only.
3. **Low. The other player's Home says "<name> to move · less than 1 hour"** for the same game. Wanted: Home tells that player that the time is up and that a claim is possible (the game page already shows "Claim win").
4. **Low. A tap on a piece or a card after the time ran out says "Wait for your turn."** while the clock says "Your move · Time is up". Wanted: one message that agrees with the clock.
5. **Low. In "Invite by name", Enter in the name field does nothing.** Wanted: Enter sends the invite when one result matches, or moves focus to the Invite button.
6. **Low. "Skip to content" shows after a mouse click** on "Show all games" (desktop). Wanted: it shows only for keyboard focus.
7. **Not examined. The first move of a friend game showed on the other screen after 25 s** (local stack); the next moves in about 1 s. Find the cause before a repair.
8. **Not examined. Staging has no sweep for games that run out of time** (`supabase/ops/cron.sql` posts to the live address only). Operations; not a client change.
