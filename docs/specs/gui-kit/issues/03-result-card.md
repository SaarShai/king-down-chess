# Result card: gaps that origin/main has too (review of PR 450)

Status: needs-triage

- A friend game card has no players line, no numbers and no See the game; the first Rematch gives no side (`src/interface/play/main.ts:1483-1498`).
- A friend draw says "The game ends." for stalemate, the 50-move rule, repetition, insufficient material and the history limit; abort and a failed start say it too (`main.ts:363-369, 1489`).
- At 568x320 a 20-letter winner name drops to 11.1 px (`src/interface/play/reading-b.css:470-471`).
- After a loss, See the game hides the sheet but keeps the dark board filter (`reading-b.css:507`, `main.ts:1516-1519`).
- With reduced motion the seal skips its press, but the card still fades for 120 ms (`src/interface/play/play.css:169`).
- The `layout-result` check (`tools/verify-layout.mjs:68`) expects king art at 852x393 and fails on main; CI does not run it. Make it expect no art on a short landscape screen and check the actions.
- By design: a short screen hides the solo players line, and a phone hides the online seal when an offer arrives.
