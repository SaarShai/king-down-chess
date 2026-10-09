# 04 · Tap to read: the words and the reach of a piece

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 03

## Scope

- Owner choice: Reading a piece, A, tap to read (the words in the fixed line; "its reach shows on the board"). Hold is out.
- Demo: `feat-hold-to-read` (`LINE`, the one-line piece texts; `reachOf` 86–101, `attacksOf` 108–127, `infoFor` 202–236, `drawReach` 313–355). Its tip says "Tap or hold"; here it says "Tap". The demo's words are a model only: the app's words come from the rules in force (spec rule 11).
- Files: new `src/read-text.ts`, `src/read.ts` and their tests; `src/render/renderer.ts` (an optional `Highlights.read`); `src/render/marks.ts` (reading shapes); `src/render/PaintedView.ts` (pass the field); `src/main.ts` (the read, the selection, the I key, the tip); `docs/visual-design/verify.mjs`; `tools/ux-defects/d10-enemy-card.mjs`; new `tools/verify-read-piece.mjs`.

## Plan

1. [ ] `src/read-text.ts` (pure): one line for each piece type, 8 words or fewer, made from the rules in force (`RULES` and the engine): for example the Archer's line follows `RULES.archerShots`, and the Ogre's line follows its shove rule (it steps in, or it does not). A fallback for Workshop pieces. State lines with their time: "Frozen: no move on its next turn.", "Ice Wall: nothing can take it now.", "It never takes.", "It checks your king." The piece's name always shows.
2. [ ] `reachOf(pos, sq)` (pure): the moves that play offers for the piece, from its own side, with Haste and free marks cleared. It keeps the counted March and Leap moves that show among ordinary moves, and drops the moves that need arming, the pass and drops. It gives steps, takes, shots, pushes and swaps. For a frozen piece it gives the squares it still attacks (it still gives check).
3. [ ] An optional `Highlights.read`; the plugin page passes none and does not change.
4. [ ] Reading shapes in `marks.ts`, outlines only, so they never look like your move marks: a ring for a step; a crimson ring for a take; a dashed arc and a sight for a shot; a teal arrow for a push; a dashed violet ring for a swap; thin ice sights for a frozen piece. Shape, not colour alone.
5. [ ] The taps of spec §4.10: an enemy piece shows its words and its reach outlines; your own piece, when you can move it, shows its words and only its legal verb marks (a pin can stop a reach move). Any piece shows the reach outlines while you cannot move (the computer plays, the turn waits, after the end). In review, a tap reads the piece in the shown position. A read never changes a kept selection; with a piece selected, a tap on an enemy piece it cannot take reads that piece and says why (the D-10 rule).
6. [ ] "All rules" in the line opens the Guide at that piece. The same piece again, or a tap on an empty square, closes the read.
7. [ ] The I key reads the cursor square while the board has the focus. Enter and Space keep their move role.
8. [ ] A tip "Tap any piece to read it." shows in the context line until the first read (stored on the device in `try`/`catch`).
9. [ ] The Clay look ignores the field.

## Verification

- [ ] `src/read-text.test.ts`: every pool piece and the king have a line of 8 words or fewer; the Archer line for each Archer reading in use; the Ogre line for its shove rules; the state lines.
- [ ] `src/read.test.ts`: the reach of each piece type; March and Leap moves (counted and unlimited); Darkness pawns; an Ogre under each shove rule; a pinned piece; a frozen piece gives its attack squares; a frozen checker; a Guard has no takes; Ice Wall, Holy Light's shelter and Mercy's aura remove the takes they forbid; marks of both sides; no armed power, pass or drop move; the Archer reach for each Archer reading.
- [ ] New check `read-piece`: for fixed positions, `view.highlights.read` has the expected squares; your own selected piece shows only legal marks; the I key reads only with the board focused; the tip shows once; a read of an enemy piece does not change the selection; a read while the turn waits and in review.
- [ ] The D-10 probes and `visual-design` pass, with `Removed-check:` trailers for the lines that read the old card.
- [ ] `npm test`, `npm run check:browser` and `plugin-ui` pass. Record the plugin page size. The plugin session knows before the pull request.
- [ ] Rendered sample, 390×844 and 1440×900: an enemy Archer (shot reach), an enemy Ogre (push), a frozen enemy piece, your Maester (legal marks and words), a read in review. The owner's yes, with the date, in Comments.

## Risks

- The reach is not the legal moves (a pin or check can stop a move). The read line says "can", never "will".
- `marks.ts` also draws in the plugin page.
- A rule preset can make a demo sentence false; the tests per rule guard it.

## Does not do

- No hold, no card over the board, no ? lens.

## Comments
