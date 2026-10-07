# 08: No tracker line citations; the Workshop matrix note cites revision 3

**What to build:** A reader who follows a citation into a tracker finds the right text, because no tracked file cites a tracker by a line number that the cut has moved. The archive, the specs folder and the Workshop revision 3 file keep their old citations as records. The Workshop note in the ability matrix cites the dated revision 3 file. With this ticket the whole steering lint passes on the integration branch.

**Blocked by:** 07 (shares the steering lint); workshop-finish/12 (revision 3 moved whole into its dated file, and the anchor table that cites a run id, not a task-list line)

**Status:** ready-for-agent

- [ ] Red first: before the fixes, the rule fails and names each citing file and line. On today's branch these are the Workshop anchor table, the Workshop doc and the 2026-09-21 takeover review; after the blockers land, only the takeover review remains. The output goes in this ticket.
- [ ] Rule: no tracked file outside the tasks archive, the specs folder and the revision 3 file holds a citation of the form `TASKS.md:<n>`, `LESSONS.md:<n>`, `QUEUE.md:<n>` or `HANDOFF*.md:<n>`.
- [ ] The takeover review cites the QUEUE.md section by its heading, not by line 156.
- [ ] Rule: the Workshop note in MATRIX.md cites the revision 3 file, and that file exists.
- [ ] The MATRIX.md row guard of ticket 01 still passes; the D.1 row, the D.2 row and the Workshop heading do not change.
- [ ] `npm test` passes with every steering rule of this spec on.

**Owns:** `docs/MATRIX.md` (the Workshop note only), `docs/research/opencode-takeover-review-2026-09-21.md` (the citation only), `tools/steering.docs.test.ts`. Shared files: secrets-and-public-gates/11 edits the link lines of `docs/MATRIX.md` and of the takeover review first (this ticket comes after it through ticket 01)

**Verify:** `npm test`; `npm run test:docs`; `git grep -n -E "(TASKS|LESSONS|QUEUE|HANDOFF[^ :]*)\.md:[0-9]" -- . ':!docs/tasks-archive' ':!docs/specs'`, with the revision 3 file also excluded.
