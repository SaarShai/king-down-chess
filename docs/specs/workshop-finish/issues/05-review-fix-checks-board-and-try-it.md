# 05: Checks for the review fixes: the board, Try it and the judge

**What to build:** The other review fixes that lost their check get one again. A paint stroke ends when the player releases the button off the board (fix 5). In Try it, a square with two actions asks which one (fix 6); the arrow keys move, focus lands on the landing square and the move is announced (fix 9); a Safe rule shows its exact words, says whether it holds, or says it cannot be tested here (fix 13). The board lines have their dark edge (the line part of fix 28). The judge test asserts that Why? names the band (the other part of fix 28). The judge test's seeded case "never lowers W" gets a 30 s limit, as the checks-and-hooks spec asks, so that it does not fail under load. Where a check finds a fix broken, this ticket repairs the code.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] The `workshop` check has one named group per fix, each naming its fix number: 5, 6, 9, 13 and 28.
- [ ] Fix 5: a pointer press on a cell, a move off the board and a release there end the stroke; the next move over the board paints nothing.
- [ ] Fix 6: Try it on a design with a move-or-take square asks for a choice; each choice gives its own result.
- [ ] Fix 9: in Try it, the arrow keys move the focus, Enter moves the piece, focus lands on the landing square, and the live region announces the move.
- [ ] Fix 13: a design with a Safe rule shows the rule's exact words in Try it, and "holds", "does not hold" or "cannot be tested here".
- [ ] Fix 28, lines: the board lines have a computed dark edge colour, as the fix set it.
- [ ] Fix 28, Why?: a judge test asserts that the Why? text names the verdict's band.
- [ ] The judge test case "never lowers W for an added square, line or ability" has a 30 s limit.
- [ ] Each browser group fails once when the builder reverts its fix locally (noted in Comments, not committed).
- [ ] `npm test` and `npm run check:browser workshop` pass.

**Verify:** `npm test`; `npm run check:browser workshop`

**Owns:** tools/verify-workshop.mjs, src/workshop/judge.test.ts; src/workshop/dialog.ts, src/workshop/sandbox.ts and src/workshop/workshop.css only where a check finds a fix broken
