# Move targets differ by shape

Status: ready-for-human (the owner approves the rendered sample)

A player who does not see colour well could not tell a move target from a capture or a special action: all were rings, and only the colour changed. Each target on the web play board now has its own shape. All shapes keep the umber keyline, so each reads at 5.30:1 on light stone and 3.43:1 on dark stone (`plain-marks.test.ts`).

| Kind | Shape | Where it comes from |
| --- | --- | --- |
| Move to an empty square | a dot on the floor | no power, no swap, no drop, no enemy on the target |
| Capture | a ring broken into four arcs (gaps at the front, back and sides) | an enemy on the target, no power or card |
| Special action: a swap, a card or king-power target, a drop, the second Haste step (dashed), a piece that an armed card can use | a flat diamond round the foot | `m.power`, `m.swap` or `m.drop` (`marks.ts` `shape`) |

The selected piece keeps its solid ring. The Freeze target keeps its frost square. Route marks (an Ogre landing, the later Beast bites) and lasting state rings keep their rings. The check marks do not change.

The plugin and the connector do not draw these marks: `PaintedView` draws plain marks only with the `plainMarks` option, and only the web play screen sets it. So the new shapes need no new option.

Pictures: `targets-1280.png`, `targets-390.png` in the run folder (rook d4: dots and two captures; Maester d4: three swap diamonds).
