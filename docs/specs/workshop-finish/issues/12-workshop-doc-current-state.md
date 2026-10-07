# 12: WORKSHOP.md tells only the current Workshop

**What to build:** The owner reads one true account of the Workshop. Revision 3 of the Workshop doc moves whole, word for word, into a dated review file beside the other Workshop reviews. A new Workshop doc, in ASD-STE100, covers only what runs today: screens, layouts (the landscape layout included), model, judge, motion (A1, A4 and A5, the 600 ms limit, reduced motion), art (the sources by id, the art script, the 68 webp), accessibility and checks. It names the runner's untracked screenshot folder, not the revision 3 screenshot folder. Code comments that cite revision 3 sections name the dated file. The anchor table and the new doc cite run ids (such as `pv-A-af2` for the Archer far2), not task-list lines. A doc lint, with the doc-lint suffix of checks-and-hooks, fails on a deny list of removed features.

**Blocked by:** 07, 08, 09, 11; checks-and-hooks/01 (the `test:docs` script that runs the doc-lint suffix)

**Status:** ready-for-agent

- [ ] The dated file holds revision 3 unchanged (`git diff --stat -M` shows a rename or a byte-equal copy), and its first line names its date and says it is history.
- [ ] The new doc has one section each for screens, layouts, model, judge, motion, art, accessibility and checks, and makes no claim the code does not meet (each claim checked against the code; the list is in Comments).
- [ ] No Workshop source file cites a revision 3 section by the old doc's name; each such comment names the dated file.
- [ ] The anchor table cites a run id for the Archer far2 and no tracker line; the new doc cites run ids only.
- [ ] The doc lint fails when the new doc names a removed feature from its deny list (Mix two, the Saved screen, brushes, Edit sheets, the uncertainty gauge, plinth, floor, rim, halo, glow on the model, the placeholder cast), the revision 3 screenshot folder, or a section of the eight is missing. Each case is checked once by hand.
- [ ] The doc lint also fails when a Workshop source file cites the new doc by a revision 3 section number.
- [ ] `npm test` passes, and `npm run test:docs` runs the lint.

**Verify:** `npm test`; `npm run test:docs`

**Owns:** docs/WORKSHOP.md, docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md (new), src/workshop/*.ts (header comments only), src/workshop/anchors.ts, src/workshop/workshop.docs.test.ts (new)
