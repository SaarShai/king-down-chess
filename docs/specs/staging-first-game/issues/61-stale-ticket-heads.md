# Close stale open heads on specs and tickets

Status: done on `staging/lane-heads`.

## What

Eight spec and ticket heads read `ready-for-agent`, and one reads `ready-for-human`, for work that is finished or replaced. Each now reads `done` or `wontfix`, with one "Closed by" or "Replaced by" line under it. Every other open head stays as it is.

## Why

Agents pick work from `Status:` lines. A wrong head costs an agent a session.

## Scope

Only the `Status:` line and one line under it, in spec and ticket files under `docs/specs/`. Not changed: `docs/specs/staging-first-game/` (except this file), `release-save-continuity/`, `TASKS.md`, `LESSONS.md`, `docs/QUEUE.md`.

Method: `git grep` for `^Status:` with the labels in `docs/agents/triage-labels.md` (`ready-for-agent`, `needs-triage`, `needs-info`, `ready-for-human`) and the other open forms (`in-progress`, `open`, and `claimed` from `docs/agents/issue-tracker.md`). A head closes only when its child tickets show done and the merge commits are ancestors of the lane base 73387e66, which carries `main`. The local `main` ref (418d4101) is stale, so it is not the test. A replaced head takes `wontfix`, the closed label in `triage-labels.md`, because `tools/lib/known-red.mjs` reads only `resolved` and `wontfix` as closed.

## Acceptance

- Each changed head cites the commit or spec that closes or replaces it.
- No head that is still open is closed.
- The table lists every head checked.

## Result

### Closed or replaced (9)

| File | Decision | Evidence |
| --- | --- | --- |
| after-redesign/spec.md | done | Tickets 01 to 05 done; PRs #33 to #36 merged (50eae990, d69245f1, 19a366d6, 1280616f); 793bf41d and ee751fdf on main |
| checks-and-hooks/spec.md | done | Tickets 01 to 13 all resolved or done; PR #8 merged (fd88d7f0) for 01 to 12; PR #57 (8a9c0f7d) for the ticket 13 fix 7d9cccf8; PR #82 (7047467f) for the later ticket 04 update |
| steering-cut/spec.md | done | Tickets 01 to 09 all resolved; PR #8 merged (fd88d7f0), ticket 09 as a0788c48 |
| park-clay/spec.md | done | Ticket 01 done; PR #51 merged (b7ff1555, 81a10fe7, c57c9606) |
| workshop-proving-ground/spec.md | done | Tickets 01 to 18 done; PR #42 merged (87ae195e); PR #48 (ce2fe345) for ticket 16; PR #49 (13861709) for the ticket 17 follow-ups; cutover 65846b20 |
| workshop-finish/spec.md | wontfix (replaced) | Own text says superseded; replaced by workshop-proving-ground, cutover 65846b20 |
| web-redesign/issues/00-check-helpers.md | done | Own notes cite 12a2387, 42eaa94, ebcd5a7, 04d3d46, a118cdb; PR #25 merged (af13c349) |
| web-ux/issues/01-defects.md | done | No open items; PR #24 merged (57b87928), with the last ticket edit 7dee7046 |
| web-ux/issues/02-game-screen-sample.md | wontfix (replaced) | web-redesign spec approved 2026-10-09 builds the game screen in the app; PR #26 merged |

### Left open (proof is missing or work remains)

| File | Head | Reason |
| --- | --- | --- |
| chatgpt-mvp/spec.md | ready-for-agent | Release and fault tickets (19, 21, 22, 38, 39, 55, 57) are open |
| chatgpt-mvp/issues/17-fold-in-main.md | ready-for-agent | Repeating task ("Size: S (repeats)") |
| dev-environment/spec.md | ready-for-agent | Ticket 06 is `ready-for-human` |
| secrets-and-public-gates/spec.md | ready-for-agent | Ticket 11 is `ready-for-human` |
| web-adaptation/spec.md | ready-for-agent | Build phases follow the approval; no proof they ended |
| web-redesign/spec.md | ready-for-agent | Tickets 20 and 24 are `needs-info`; no proof the umbrella ended |
| chatgpt-mvp tickets 18 to 57, plugin-submission 06 to 10 and 18, send-turn/03 | in-progress, open, needs-info, needs-triage, ready-for-human, ready-for-review, claimed | No proof of completion; not checked further |
| shared-screens-later 01 to 27, web-build 03 to 20, gui-previews controls, web-redesign 20 and 24 | needs-triage, needs-info | Deferred or waiting on the owner; open by design |
| web-ux/review.md, retro-2026-10-06 tickets and retro | ready-for-human, needs-info, draft | Wait on the owner |
| casual-account-journeys/09, check-flakes/25, owner-decisions/05, web-build/02 | claimed | An agent holds each claim; this lane does not close a claim. check-flakes/25 may be stale: its last commit f29ed7a5 merged in PR #58 (66ee7155) |
| web-build/release/pr71-packet.md | OPEN (section labels) | Not a head; open release gates |

### Checks

- `npm run test:docs`: pass. `Test Files  13 passed (13)`, `Tests  161 passed (161)`.

### Review fixes

- Closed heads with no commit (checks-and-hooks, steering-cut): each "Closed by" line and table row now names PR #8 (fd88d7f0); checks-and-hooks also names PR #57 (8a9c0f7d) for ticket 13 and PR #82 (7047467f) for the ticket 04 update.
- False reason for web-ux/issues/01: PR #24 is merged (57b87928) and the ticket has no open items. The head now reads `done` with a "Closed by" line; the row moves to the closed table.
- after-redesign: the merge hashes now follow the PR order (50eae990 is #33, d69245f1 is #34).
- web-redesign/00: cites PR #25 (af13c349), the merge of its own branch, not PR #26.
- workshop-proving-ground: also cites PR #48 (ce2fe345) for ticket 16 and PR #49 (13861709) for ticket 17.
- `claimed` heads: the method adds `claimed`; a new row lists the four claimed heads outside chatgpt-mvp; the chatgpt-mvp row gives its exact labels.
- New word `replaced`: both replaced heads now read `wontfix`, a label in `triage-labels.md` that the known-red lint reads as closed; the "Replaced by" lines stay.
- "Follows ticket 53": removed; the two tickets are not related.
- Method: the ancestor test now uses the lane base 73387e66, because the local `main` ref is stale.
