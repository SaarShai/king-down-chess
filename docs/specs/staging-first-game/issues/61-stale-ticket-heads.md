# Close stale open heads on specs and tickets

Status: done on `staging/lane-heads`. Follows ticket 53.

## What

Eight spec and ticket heads read `ready-for-agent` for work that is finished or replaced. Each now reads `done` or `replaced`, with one "Closed by" or "Replaced by" line under it. Every other open head stays as it is.

## Why

Agents pick work from `Status:` lines. A wrong head costs an agent a session.

## Scope

Only the `Status:` line and one line under it, in spec and ticket files under `docs/specs/`. Not changed: `docs/specs/staging-first-game/` (except this file), `release-save-continuity/`, `TASKS.md`, `LESSONS.md`, `docs/QUEUE.md`.

Method: `git grep` for `^Status:` with the labels in `docs/agents/triage-labels.md` (`ready-for-agent`, `needs-triage`, `needs-info`, `ready-for-human`) and the other open forms (`in-progress`, `open`). A head closes only when its child tickets show done and the merge commits are ancestors of `main`.

## Acceptance

- Each changed head cites the commit or spec that closes or replaces it.
- No head that is still open is closed.
- The table lists every head checked.

## Result

### Closed or replaced (8)

| File | Decision | Evidence |
| --- | --- | --- |
| after-redesign/spec.md | done | Tickets 01 to 05 done; PRs #33 to #36 merged (50eae990, d69245f1, 19a366d6, 1280616f); 793bf41d and ee751fdf on main |
| checks-and-hooks/spec.md | done | Tickets 01 to 13 all resolved or done |
| steering-cut/spec.md | done | Tickets 01 to 09 all resolved |
| park-clay/spec.md | done | Ticket 01 done; PR #51 merged (b7ff1555, 81a10fe7, c57c9606) |
| workshop-proving-ground/spec.md | done | Tickets 01 to 18 done; PR #42 merged (87ae195e); cutover 65846b20 |
| workshop-finish/spec.md | replaced | Own text says superseded; replaced by workshop-proving-ground, cutover 65846b20 |
| web-redesign/issues/00-check-helpers.md | done | Own notes cite 12a2387, 42eaa94, ebcd5a7, 04d3d46, a118cdb; PR #26 merged (0355ad3e) |
| web-ux/issues/02-game-screen-sample.md | replaced | web-redesign spec approved 2026-10-09 builds the game screen in the app; PR #26 merged |

### Left open (proof is missing or work remains)

| File | Head | Reason |
| --- | --- | --- |
| chatgpt-mvp/spec.md | ready-for-agent | Release and fault tickets (19, 21, 22, 38, 39, 55, 57) are open |
| chatgpt-mvp/issues/17-fold-in-main.md | ready-for-agent | Repeating task ("Size: S (repeats)") |
| dev-environment/spec.md | ready-for-agent | Ticket 06 is `ready-for-human` |
| secrets-and-public-gates/spec.md | ready-for-agent | Ticket 11 is `ready-for-human` |
| web-adaptation/spec.md | ready-for-agent | Build phases follow the approval; no proof they ended |
| web-redesign/spec.md | ready-for-agent | Tickets 20 and 24 are `needs-info`; no proof the umbrella ended |
| chatgpt-mvp tickets 18 to 57, plugin-submission 06 to 10 and 18, send-turn/03 | in-progress, open, needs-triage, ready-for-human | No proof of completion; not checked further |
| shared-screens-later 01 to 27, web-build 03 to 20, gui-previews controls, web-redesign 20 and 24 | needs-triage, needs-info | Deferred or waiting on the owner; open by design |
| web-ux/issues/01, web-ux/review.md, retro-2026-10-06 tickets and retro | ready-for-human, needs-info, draft | Wait on the owner |
| web-build/release/pr71-packet.md | OPEN (section labels) | Not a head; open release gates |

### Checks

- `npm run test:docs`: pass. `Test Files  13 passed (13)`, `Tests  161 passed (161)`.
