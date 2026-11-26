# Home results, first Tab, and time words

Status: ready-for-agent

Class: B. Size: S.

Source: the two-account staging pass of PR 486 on 2026-11-26 (head `a36cee399`). Report: the lead's run folder `runs/web-followups-486/staging.md`. Each point is also on the live site, and none comes from PR 486.

## Points

1. **Medium. A result does not show on Home when the game ends in front of the player.** After a claim or a resignation, neither Home list gets a row for that game. Cause: the client writes the "seen" key when a finished game view arrives (`src/interface/people/host/index.ts`, near line 340), and `refresh()` (near lines 185 to 195) drops each seen result. Both players have the game page open, so the row never shows. Wanted: Home keeps a result row for 24 hours after the end, seen or not. The limit of 10 rows stays.
2. **Medium. The first Tab on Home does not show "Skip to content".** Cause: two lines focus the H1 on the first draw (`src/interface/play/shell.ts`, near line 125; `src/interface/play/main.ts`, near line 567), and the link is before the H1. Wanted: no focus move on the first draw; the focus moves to the H1 only after a route change in the app. A check case: load Home, push Tab one time, the link shows.
3. **Low. "2 days left" directly after a join with "3 days for each move".** Cause: `timeWords` rounds down (`src/interface/people/words.ts`, line 10). Wanted: with 2 days or more left, show days and hours ("2 days 23 hours"), or round to the nearest day. Never show more time than the player has by more than half a day. The Home row and the invite expiry line use the same words.
4. **Low. A finished row says "<name> wins"**, and the row already shows the name. Wanted: "They win". The scene rule that a status must not repeat the name then holds for each status.
5. **Low. A status wraps with one short word alone on line 2** ("win", "wins", "player") at 390x844, 844x390, 667x375 and 320x568. Wanted: the status is on one line, or it breaks only at the "·".
6. **Low. The game header at 390x844 starts line 2 with the dot**: "Your move" / "· Time is up". Wanted: the break comes after the dot, or the dot goes away at the break.

## Closed by design

- The screen-reader label "Opponent's cards: ..." names the same four cards as the player's own. The rules give both players the same four open cards (`docs/RULES.md`, the hands show). It is not a leak.

## Open from ticket 16

- Point 7: the first move of a friend game took 25 s in one local run. No cause is proven.
- Point 8: staging has no sweep for timed-out games (ops).

## Release note

The first release run of PR 486 stopped at the local frame check `painted-game` ("quiet walk: normal 665 ms, fast 232 ms"). Other work ran on the machine at that time. The second run passed with a quiet machine. The cause is not proven; if the line fails again on a quiet machine, examine it.
