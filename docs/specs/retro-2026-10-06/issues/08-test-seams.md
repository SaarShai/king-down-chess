# Test seams for the five specs

Type: grilling
Status: ready-for-human
Blocked by: 03, 04, 05, 06

## Question

At which seams does each spec test its behaviour? to-spec asks for the highest existing seam and as few seams as possible. Candidates: `npm test` (vitest + node --test + tsc), the browser checks behind one runner, git hooks exercised by a test that runs them in a temporary repo, and the Claude hooks exercised by feeding them JSON on stdin. Confirm the list with the owner.

## Answer

The pick (2026-10-07), under "do what you recommend"; work continues under it.

1. `npm test` is the first seam: `tsc --noEmit`, then vitest, then the node tests. Everything that can be a unit test is one: the judge, look, text and store modules; the steering-doc lints (sizes, headings, no model names, no stray tags); the Claude hooks, fed JSON on stdin; the git hooks, run in a temporary repository.
2. One browser-check runner is the second seam: it builds, starts the preview server itself on a free port, runs the named checks one at a time, writes screenshots to an untracked folder, and fails on a page error or a changed tracked file. The Workshop layout assertions (both boards and Try it in view at every size) and the review-fix checks live there on a shared assertion module.
3. Motion is the one open branch: a DOM test under happy-dom if `Element.animate` works there, else the browser check alone. The Workshop spec states both branches; the builder picks after one probe.

No other seam. No CI on push in this effort (the pages workflow stays manual); a test workflow is a one-file follow-up the checks spec may name.
