# 05: Checks for the review fixes: the board, Try it and the judge

**What to build:** The other review fixes that lost their check get one again. A paint stroke ends when the player releases the button off the board (fix 5). In Try it, a square with two actions asks which one (fix 6); the arrow keys move, focus lands on the landing square and the move is announced (fix 9); a Safe rule shows its exact words, says whether it holds, or says it cannot be tested here (fix 13). The board lines have their dark edge (the line part of fix 28). The judge test asserts that Why? names the band (the other part of fix 28). The judge test's seeded case "never lowers W" gets a 30 s limit, as the checks-and-hooks spec asks, so that it does not fail under load. Where a check finds a fix broken, this ticket repairs the code.

**Blocked by:** 04

**Status:** resolved

- [x] The `workshop` check has one named group per fix, each naming its fix number: 5, 6, 9, 13 and 28.
- [x] Fix 5: a pointer press on a cell, a move off the board and a release there end the stroke; the next move over the board paints nothing.
- [x] Fix 6: Try it on a design with a move-or-take square asks for a choice; each choice gives its own result.
- [x] Fix 9: in Try it, the arrow keys move the focus, Enter moves the piece, focus lands on the landing square, and the live region announces the move.
- [x] Fix 13: a design with a Safe rule shows the rule's exact words in Try it, and "holds", "does not hold" or "cannot be tested here".
- [x] Fix 28, lines: the board lines have a computed dark edge colour, as the fix set it.
- [x] Fix 28, Why?: a judge test asserts that the Why? text names the verdict's band.
- [x] The judge test case "never lowers W for an added square, line or ability" has a 30 s limit.
- [x] Each browser group fails once when the builder reverts its fix locally (noted in Comments, not committed).
- [x] `npm test` and `npm run check:browser workshop` pass.

**Verify:** `npm test`; `npm run check:browser workshop`

**Owns:** tools/verify-workshop.mjs, src/workshop/judge.test.ts; src/workshop/dialog.ts, src/workshop/sandbox.ts and src/workshop/workshop.css only where a check finds a fix broken

## Comments

Builder, 2026-10-07, branch `build/workshop-finish-05`.

**What changed.** `tools/verify-workshop.mjs` gets five groups after the groups of ticket 04, one per fix, each named by its number. Each assertion message starts with "fix N:". `PIECES` gets an Ogre, a Guard and a Guard whose Safe rule works only in the enemy half. No fix was broken, so no source file changed.

| Group | What it asserts |
|---|---|
| `fix5StrokeEndsOffBoard` | at 1280×900: a press on a cell of the move board paints it; a move to a point off both boards and a release there; then moves over four other cells paint nothing; the Workshop stays open |
| `fix6TwoActionChoice` | Try it with the Ogre: after d4 to d5, the pawn on d6 says "take or push"; a tap on it asks "Take" or "Push" ("On d6 it can take or push. Which one?"); Take gives "Took the enemy pawn on d6." and an empty d7; Push gives "Pushed the enemy pawn from d6 to d7." and the pawn on d7; Reset between them |
| `fix9TryKeyboard` | at 1280×900: the board is one tab stop, on d4; ArrowUp, ArrowRight and ArrowLeft move the focus and no piece; Enter moves to d5, the focus lands on d5, the live region says "Moved to d5.", still one tab stop; ArrowUp and Enter on d6 put the focus on the choice, Enter there takes, the focus lands on d6 and the live region says "Took the enemy pawn on d6." |
| `fix13SafeRule` | the Guard: "It cannot be taken by anything but a king. That holds now. The other side never moves, so Try it cannot test this rule." and a shield; the enemy-half Guard on d4: "In the enemy half, it cannot be taken by pawns. That does not hold now. …" and no shield; on d5: "… That holds now. …" and a shield |
| `fix28LineEdge` | a Rook link: each of the 12 line cells on the move and the take board has a computed `background-image` with a gold colour (luminance over 140) and a dark one (under 90); stops with alpha 0 do not count |

**Fix 28, Why?** `src/workshop/judge.test.ts` gets "names the band in Why? (review fix 28)": over the pool and each tenth random design (about 0.3 s), the Why? title of each verdict that is not an unchanged Pawn or Queen, and not a fair design with a warning, is `Why “<band>”?`; the Why? head says "Most pieces are worth 2½ to 5 pawns, the shaded part of the gauge." (from `THRESHOLDS`), except an untested shape, whose head ends "It may be overpowered."; the bands fair, possibly and likely overpowered all occur.

**The 30 s limit.** The case "never lowers W for an added square, line or ability" already has `30000` (line 202 before this ticket, from checks-and-hooks). Nothing to change.

**Each check fails once when its fix is reverted** (a local edit, `npx vite build`, the group alone against `vite preview` on 127.0.0.1, then `git checkout` of the file; nothing committed):

| Check | Local revert | Failure |
|---|---|---|
| `fix5StrokeEndsOffBoard` | `dialog.ts`: no `setPointerCapture` and no `buttons` test in `onpointermove` | "fix 5: after a release off the board, the next move over the board paints nothing" |
| `fix6TwoActionChoice` | `sandbox.ts` `tap()`: no choice, the first move plays | "fix 6: a square with two actions asks which one" false !== true |
| `fix9TryKeyboard` | `sandbox.ts`: each square `tabindex="0"`, no focus restore, no "Moved to" announcement | "fix 9: the board is one tab stop" 64 !== 1 |
| `fix13SafeRule` | `sandbox.ts`: the note says "Enemies cannot take this piece." and the shield is permanent | "fix 13: an Always Safe rule: its words, …" |
| `fix28LineEdge` | `workshop.css`: the old line gradient (gold only) | "fix 28: a move board line has a gold middle and a dark edge" |
| judge "names the band in Why?" | `judge.ts` `whyHead` without ", the shaded part of the gauge" | expected the head to contain the fair band sentence |

The first form of `fix28LineEdge` passed against the revert: "transparent" computes as `rgba(0, 0, 0, 0)` and counted as dark. The group now leaves out stops with alpha 0, and the revert fails it.

**Runs.**
 Before the merge: `npm test` green (vitest 63 files, 1217 tests; node tests 42 of 42); `npm run check:browser workshop` ok 45.2 s, all 1 passed. After the merge of the integration tip `2d7847c` (merge `65f41c6`, ticket and gate files only): `npm run check:browser workshop` ok 44.7 s, all 1 passed; `npm test` green at a load average near 14 (vitest 63 files, 1217 tests; node tests 42 of 42). Three runs before it, at load averages of 35 to 56, failed only on 5 s time-outs (7 to 10 tests in `tools/gate.test.ts`, `commit-msg.test.ts`, `power-fixes.test.ts`, `piece-activity.test.ts`, `search.test.ts` and the judge case "keeps the line within 90 characters"); those six files alone pass 116 of 116.

**For the owner or a later ticket.** The judge case "keeps the line within 90 characters" runs about 2.8 s alone and times out at 5 s under load in each busy run. A 30 s limit, as on "never lowers W", would stop that. This ticket does not set it, because the spec names only "never lowers W".
