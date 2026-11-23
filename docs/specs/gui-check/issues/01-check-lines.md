# Check threat lines and the checkmate hold

Status: ready-for-human (the owner approves the rendered frames)

**Check.** A thin wax-red line runs from each checking piece to the edge of the checked king's square, with a wax bead at the foot of the checking piece. A straight line for a rook, bishop or queen; a short arc for a knight jump, a catapult lob, an archer shot of two squares or a line over a piece (`checkersOf` in `src/move-text.ts` gives the checkers and the path kind). The existing check square on the king stays: the lines join it, so one fact has one mark. The lines draw under the figures and under every ring, so they hide no piece and no move target.

- Draw-in: 200 ms, from the attacker to the king, with the check square scale-in (one tween: `drawCheckIn` in `main.ts`). Then static.
- At once, with no draw-in: after a reload, at the end of an online opponent playback, in Replay, in reduced motion and Motion off.
- Ink: wax `#b8322a` (body width 3% of a square) in the umber keyline of the board marks. The body alone is 4.1:1 on light stone and 2.3:1 on dark stone, so the keyline carries the contrast, as for every board mark: 5.30:1 and 3.43:1 (`plain-marks.test.ts`).
- A check with no attacking piece (an effect of a card) has no line: the check square shows alone.

**Checkmate hold.** When the game ends in checkmate and the mated king stands (solo, and a live online result):

| Time | What shows |
| --- | --- |
| 0 ms | The threat lines and the check square stand. The check sound plays. |
| 0 to 160 ms | A wax-red ring drops from 1.8 times the king's ring onto the king's foot (`closeIn` in `fx/canvas.ts`). |
| 160 to 360 ms | A brass glint leaves the ring. |
| 300 to 480 ms | The ring fades. |
| 600 ms | The hold ends: the existing result moment (impact, fall, light) and then the result card; online, the card and the fall. |

A timer (not the effect clock) ends the hold, so it also ends on a hidden page. A hidden page shows the card at once. A hard end at 3 s shows the card if the fall never ends. Skip and Menu work during the hold. A taken king keeps its own moment, with no hold. Reduced motion: no beat, a plain 300 ms pause with the lines, then the card.

Frames: `PLAYABLE_OUT=<folder> node docs/specs/gui-check/capture.mjs` (after `npm run build`): `check-<width>.png` and `mate-<width>-strip.png` (0, 150, 300, 450, 600 ms after End turn), at 1280x800 and 390x844.
