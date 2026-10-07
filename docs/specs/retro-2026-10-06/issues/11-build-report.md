# Build report: the five specs on `claude/retro-2026-10-06`

Type: report
Status: ready-for-human

## What happened

The build ran on 2026-10-07 under implement-spec. The branch starts at `f1b8e72` (main at approval time) and holds 377 commits: 52 tickets from the five specs, their merges, and 14 review-fix commits. Main moved to `043859d` during the build (Archer far2, MirrorB and no Rescue, queue results); a trial merge of `043859d` into the branch is clean.

| Spec | Tickets | Built |
| --- | --- | --- |
| checks-and-hooks | 12 | 12 |
| secrets-and-public-gates | 12 | 12 |
| dev-environment | 6 | 6 |
| workshop-finish | 14 | 14 |
| steering-cut | 9 | 9 |

The review (code-review, Standards and Spec axes, fixed point `f1b8e72`) raised 92 findings; 3 refuters per finding kept 20. With 5 the aggregator added, one implementer fixed 25 in 14 commits (`265255c` to `954fe65`). Each owning ticket has a Comment line.

## State of the branch at `954fe65`

- `npx tsc --noEmit -p .`: exit 0.
- `npm test`: 1301 vitest tests and 42 node tests. Under a machine load of 25, two 5 s timeouts (`tools/gate.test.ts`, `tools/git-hooks/commit-msg.test.ts`); both files pass alone. The implementer's run under lower load passed in full.
- `npm run check:browser`: 14 of 14 pass. `painted-game` can fail at random when a 60-ply computer game has no capture.
- Working tree clean. No model name in any commit, AGENTS.md or `docs/specs`. Every commit carries the neutral trailer.

## Before the merge into main

1. Move the untracked `docs/specs/retro-2026-10-06/` out of the main checkout; the branch adds tracked files at that path.
2. Copy `sim/nnue/policy.bin` aside (SHA-256 starts `e99256c8`); the size gate and the art cleanup touch large files.
3. After the merge, run `npm run prepare` so `core.hooksPath` points at `.githooks`, then `tools/deploy.sh --publish` once.
4. TASKS.md has the union merge driver. Take this branch's TASKS.md. If main changes TASKS.md after `043859d`, run the move again (steering-cut ticket 04).

## Needs the owner's desktop session

- dev-environment 06: the preview-folder probe, the packages-link probe, and the trailer probe of `attribution.commit` (owner step 6).
- secrets-and-public-gates 12, item 4: the live `bypassPermissions` probe.

## Decisions

1. workshop-finish 13: 78 files (about 90 MB) of rejected art batches go to the Trash only after a recorded `Owner-go:` yes.
2. secrets-and-public-gates 10: keep `vercel@62.2.0`, or move to 62.7.0? Two `npx` calls in `deploy.sh` acceptable?
3. secrets-and-public-gates 11: the kept-records list and the pin at `dd34fa5` acceptable?
4. checks-and-hooks 11: keep the `byName` lint as written?
5. steering-cut 04: the 14 closes in the TASKS.md move and the label rule acceptable?
6. steering-cut 06: the Jev section and the Light/Dark kings line in AGENTS.md acceptable?
7. steering-cut 07: "Keep March" is the reading of the Card deal line; correct?
8. steering-cut 09: the handoff is archived in the branch; revert `a0788c4` to keep it live?
9. workshop-finish 08: the empty-card text in short landscape; approve the visual?
10. workshop-finish 09: fixes 1, 8, 12 and 19 are checked in part; accept, or ask for a full check?
11. workshop-finish 12: read the new 111-line WORKSHOP.md and say yes or no.
12. Archer far2: when does it replace `plusDiagFwd2` on main?
13. `painted-game`: give the check a fixed seed, or accept a rare random failure?
14. `sim/nnue/policy.json`: refresh it with the next run, or leave it?
15. Retro ticket 09: the Typesafe key rotation is still open.
