# Test seams for the five specs

Type: grilling
Status: open
Blocked by: 03, 04, 05, 06

## Question

At which seams does each spec test its behaviour? to-spec asks for the highest existing seam and as few seams as possible. Candidates: `npm test` (vitest + node --test + tsc), the browser checks behind one runner, git hooks exercised by a test that runs them in a temporary repo, and the Claude hooks exercised by feeding them JSON on stdin. Confirm the list with the owner.
