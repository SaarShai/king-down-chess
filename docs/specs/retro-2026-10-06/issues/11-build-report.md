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

## State of the branch at `93402b5`

- `npx tsc --noEmit -p .`: exit 0.
- `npm test`: 1301 vitest tests and 42 node tests. Under a machine load of 25, two 5 s timeouts (`tools/gate.test.ts`, `tools/git-hooks/commit-msg.test.ts`); both files pass alone. The implementer's run under lower load passed in full.
- `npm run check:browser`: 14 of 14 pass. `painted-game` can fail at random when a 60-ply computer game has no capture.
- After the decisions: 5 more commits (`8e56f36` to `93402b5`). At `93402b5`, under a load of 25 to 35 from the owner's other apps, plain `npm test` hit ten 5 s timeouts; `vitest run --testTimeout=180000` gives 1301 of 1301, the node tests 42 of 42, tsc clean, and the `painted-game` and `workshop` checks pass.
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

The owner (2026-10-07): "use your best judgement for deciding these. complete what needs completing." The agent took the decisions below and recorded each one in its ticket.

1. workshop-finish 13: done. 22 items (93.7 MB) went to the Trash with Finder after a new hash check. The owner empties the Trash.
2. secrets-and-public-gates 10: keep `vercel@62.2.0`; the two `npx` calls stay.
3. secrets-and-public-gates 11: the kept-records list and the pin at `dd34fa5` stand.
4. checks-and-hooks 11: the `byName` entries stay unlinted.
5. steering-cut 04: the 14 closes and the label rule stand.
6. steering-cut 06: the Jev section and the Light/Dark kings line stand; resolved.
7. steering-cut 07: "Keep March" is the reading.
8. steering-cut 09: the handoff stays archived; resolved.
9. workshop-finish 08: the 568×320 build is approved; the empty-card text in short landscape is fixed.
10. workshop-finish 09: fixes 1, 8, 12 and 19 get full checks.
11. workshop-finish 12: WORKSHOP.md read in full; yes.
12. Archer far2: the owner's own commit `4f30e2e` says adoption waits. Not a part of this branch; it stays with the owner.
13. `painted-game`: the check now runs the computer game to 60 plies and at least one capture (or the end of the game) before it asserts a capture.
14. `policy.json`: stays as it is; the next run with a go refreshes it.
15. Retro ticket 09: only the owner can rotate the Typesafe key; open.

## Done after the decisions (2026-10-07)

- The stray untracked `docs/specs/retro-2026-10-06/retro.md` left the main checkout (a copy is in the session scratchpad). The main checkout now has no `docs/specs/`.
- `sim/nnue/policy.bin` is saved as `~/policy.bin.saved` (6,881,280 bytes, SHA-256 `e99256c8…`). After the merge: `cp ~/policy.bin.saved sim/nnue/policy.bin`.
- `core.hooksPath` is the relative `.githooks` in the shared config. The hooks run in each worktree that has the folder; in the main checkout they start with the merge. `npm run prepare` is no longer needed.
- Desktop probes (dev-environment 06): the preview probe is done (a worktree session reads its own launch file; AGENTS.md says so). The trailer probe shows that the setting writes nothing by itself and the prepare-commit-msg hook adds the trailer. The bypass-mode gate probe (secrets 12 item 4) is done in the owner's "Test" session: the gate refused `vercel` with the expected text. The packages probe needs a worktree that the app makes from main after the merge.

## Still with the owner

- The merge into main. Two other sessions work in the main checkout now (a game mode in Claude, the ChatGPT plugin in Codex): the checkout has an uncommitted TASKS.md change and four untracked research files. Merge after that TASKS.md change is committed, take this branch's TASKS.md in the union merge, and run the move of steering-cut 04 again against the new main commits.
- After the merge: restore `policy.bin`, then `tools/deploy.sh --publish` once (it needs the push of main too).
- Empty the Trash (the 22 art items). Rotate the Typesafe key (retro ticket 09).
