# Desktop rail: one compact stack

Status: ready-for-human

Design E of the GUI life study: on the wide form the rail is one group that starts level with the board top.

- Order: opponent bar, turn text, History row, the hand 18 px after History, Undo and End turn 16 px below the hand. Spare space stays below the group (`layout.ts`).
- History is one 48 px row between two gilt hairlines: its name, the newest record (one line, an ellipsis when long), a chevron that turns when it opens (no turn when motion is reduced or Off).
- The open History covers the turn text and the hand and stops 8 px above the command tray. It scrolls (`panelBox` in `layout.ts`).
- The board keeps its size: 688 px at 1280x800, 704 px at 1440x900. Phones, short landscape and the result card keep their boxes.
- At the first turn the History row stays hidden, as before; the hand keeps its place.

Owner check: the before and after sheet `gui-rail-sheet.png`.

## Open follow-ups (`main` has them too)

- At 1280x800, End turn moves 43.7 px when Replay becomes Undo (`reading-b.css:424-425`).
- With History open, backward Tab from Close history puts focus on a control behind the panel (`main.ts:777,1641`).
- At 800x640 with a staged move, History overlaps the hand (`layout.ts:45-46`).
