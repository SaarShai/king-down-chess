# 11 · The move story: one sentence in player words, and a Review state

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 03, 04

## Scope

- Owner choice: the move history at rest, A, one line (ticket 03 gives the line). This ticket gives its words and the open story. Advisors: show an old move in a clear Review state. Decision D12 (d): no chips, scrubber or ghost, and no "B as a Menu choice".
- Demo: `feat-move-story` option A (`tell()` 42–91, the line 168–176).
- Files: `src/ui/table.ts`, `src/main.ts` call sites, `src/game.ts`, pure `src/review.ts` and tests, `index.html`, table styles and check helpers.

## Plan

The fast plan, §2, keeps only this small part in W2.

1. [x] Cut `storyLine`. Reuse today's `describeMove` sentence and keep its shared default.
2. [x] Add the represented piece's icon to the one Moves line. Cut the verb badge.
3. [x] Add each row's piece icon. Keep LAN in data fields and the existing turn groups.
4. [x] Keep row and arrow navigation in Review, including its last ply. Add Back to game. Only Back to game or Esc exits. Cut the arrow header.
5. [x] Let the one Moves line show the finished move's sentence. Keep existing hover marks.
6. [x] Undo shows the prior move's line.
7. [x] Keep LAN check helpers. Cut the new move-story check; test Review in `game-screen`.

## Verification

- [x] Test the last-ply position reader and Review navigation through pure modules.
- [x] Check row and arrow routes to the last ply, a read in Review, Back to game, Freeze icons and the free-mark pass in `game-screen`.
- [x] Keep existing Clay replay assertions. Use Back to game before Undo. Check Copy moves through the named checks.
- [x] Run `npm test`, the named checks and both plugin checks. Run the new W2 checks twice after the merge.
- [x] Render the Moves sheet, last-ply Review, Freeze and the free pass in W2.
- [ ] The owner's yes on the sample waits.

## Risks

- The screen reader keeps the full `describeMove` sentence; the line must not be a second live region.

## Does not do

- No chips, no scrubber, no notation switch, no ghost replay over the live board (D12).

## Comments

W2 builds only the part kept by the fast plan, §2.
Use today's sentence, piece icons and LAN data fields. Keep the shared default.
The last ply stays in Review. Back to game and Esc give an explicit exit.
Freeze draws the enemy piece. The free-mark pass names the mark.
Cut: `storyLine`, verb badges, the arrow header and the new move-story check.
`npm test`: 1499 tests and 50 scene tests pass. All 19 named checks pass; both new W2 checks pass twice after the merge.
Both plugin checks pass. The page stays at 4,291,968 bytes. The M1 script uses its local fallback.
W2 has 45 clean renders and four inspected sheets outside Git.
