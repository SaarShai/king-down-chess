# 08: No tracker line citations; the Workshop matrix note cites revision 3

**What to build:** A reader who follows a citation into a tracker finds the right text, because no tracked file cites a tracker by a line number that the cut has moved. The archive, the specs folder and the Workshop revision 3 file keep their old citations as records. The Workshop note in the ability matrix cites the dated revision 3 file. With this ticket the whole steering lint passes on the integration branch.

**Blocked by:** 07 (shares the steering lint); workshop-finish/12 (revision 3 moved whole into its dated file, and the anchor table that cites a run id, not a task-list line)

**Status:** ready-for-agent

- [x] Red first: before the fixes, the rule fails and names each citing file and line. On today's branch these are the Workshop anchor table, the Workshop doc and the 2026-09-21 takeover review; after the blockers land, only the takeover review remains. The output goes in this ticket.
- [x] Rule: no tracked file outside the tasks archive, the specs folder and the revision 3 file holds a citation of the form `TASKS.md:<n>`, `LESSONS.md:<n>`, `QUEUE.md:<n>` or `HANDOFF*.md:<n>`.
- [x] The takeover review cites the QUEUE.md section by its heading, not by line 156.
- [x] Rule: the Workshop note in MATRIX.md cites the revision 3 file, and that file exists.
- [x] The MATRIX.md row guard of ticket 01 still passes; the D.1 row, the D.2 row and the Workshop heading do not change.
- [x] `npm test` passes with every steering rule of this spec on.

**Owns:** `docs/MATRIX.md` (the Workshop note only), `docs/research/opencode-takeover-review-2026-09-21.md` (the citation only), `tools/steering.docs.test.ts`. Shared files: secrets-and-public-gates/11 edits the link lines of `docs/MATRIX.md` and of the takeover review first (this ticket comes after it through ticket 01)

**Verify:** `npm test`; `npm run test:docs`; `git grep -n -E "(TASKS|LESSONS|QUEUE|HANDOFF[^ :]*)\.md:[0-9]" -- . ':!docs/tasks-archive' ':!docs/specs'`, with the revision 3 file also excluded.

## Comments

**Builder, 2026-10-07 (branch `build/steering-cut-08`).**

Red first (commit 94b491e, `npx vitest run tools/steering.docs.test.ts -t "line citations|Workshop note"`: 2 failed, 3 passed). The blockers had landed, so the Workshop anchor table and the Workshop doc were clean. The rule named these faults:

```text
docs/research/opencode-takeover-review-2026-09-21.md § Corrections to the final game-design synthesis (line 63): cites a tracker by a line number ("QUEUE.md:156"); cite the heading
src/workshop/workshop.docs.test.ts § (top) (line 144): cites a tracker by a line number ("TASKS.md:9"); cite the heading
docs/MATRIX.md § Workshop (build 1a, 2026-10-06) (line 273): the Workshop note cites docs/WORKSHOP.md by a section; cite the revision 3 file
docs/MATRIX.md § Workshop (build 1a, 2026-10-06) (lines 271-274): the Workshop note must name docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md
```

The fixes (commit d75c703):

- The takeover review cites the `gs-wall-front` and `gs-wall-split` item under the heading "Dropped" in `docs/QUEUE.md`. On 2026-09-21 (eec083c), line 156 of QUEUE.md was that item, and the current QUEUE.md holds it under the same heading.
- The MATRIX.md Workshop note cites "revision 3 §3.3, §8.4" with a link to the dated file. The D.1 row, the D.2 row and the Workshop heading do not change; the row guard of ticket 01 passes.
- Outside the Owns line: `src/workshop/workshop.docs.test.ts:144` (workshop-finish/12) held a fixture citation in a string. The fixture now builds it from parts (`TASKS.md${':'}9`); the test asserts the same fault. The merger can accept this one-line change, or exempt that file instead.

The rules, in `tools/steering.docs.test.ts`:

- `line citations`: a fixture test (four citations found, in fenced code too; `sim-balance.md:30`, a `§` citation and `MATRIX.md:4` are not citations); a test that the `git grep` pattern and the line pattern agree; the live rule, which runs `git grep -I -l -E` with the tasks archive, the specs folder and the revision 3 file excluded. The `-I` flag skips binary files (the grep reads about 4,000 files in 0.7 s, not 2 s), and the test has a 30 s time limit, because this Mac runs at a load average of 20 to 27.
- `MATRIX.md Workshop note`: a fixture test (a `WORKSHOP.md §` citation and a missing name are faults; a missing heading is a fault); the live rule, which also checks that the revision 3 file exists.

Verify, after the merge of the integration tip (f9f6603; already up to date):

- `npm test`: vitest 66 files, 1284 tests passed; node --test 42 passed. Two earlier runs had one or three tests over the 5 s limit (`judge.test.ts` random designs, `piece-activity.test.ts`, `gate.test.ts` push mode) at that load; each passes alone, and the third full run passed with no failure.
- `npm run test:docs`: 4 files, 74 tests passed.
- `git grep -n -E "(TASKS|LESSONS|QUEUE|HANDOFF[^ :]*)\.md:[0-9]" -- . ':!docs/tasks-archive' ':!docs/specs' ':!docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md'`: no output (exit 1).
