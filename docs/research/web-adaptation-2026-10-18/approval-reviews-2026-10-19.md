# Ticket 18 preparation: independent reviews (2026-10-19)

The reviews of the spec refresh, the build tickets and the approval draft for [Approve the adaptation spec and build order](../../specs/web-adaptation/issues/18-approve-spec.md). The owner delegated the spec approval (2026-10-18), each decision after an independent review. No reviewer wrote the reviewed text. One author wrote the draft and made one fix round; then the main session checked the result.

## Round 1: three lenses

| Review | Verdict | Required changes | Result |
|---|---|---|---|
| Consistency (spec against tickets 01 to 17) | Accept with changes | 1. Hosting ticket 06 still gives the invite path form; record the ticket 13 fragment rule at approval. 2. Build ticket 06 must name the `src/plugin/` handover. | Both done. |
| Slicing (build tickets) | Accept | None. Optional: keep the support-handling check only in build ticket 15. | Done through review 3, change 3. |
| Approval (ticket 18 checklist) | Accept with changes | 1. Let build tickets 01 and 02 start code work before the deploy record. 2. Use the "decided by delegation" record form, with review links. 3. Build ticket 13: a support-handling check is evidence, not a new owner go. | 2 and 3 done. 1 overtaken by the owner's order of 2026-10-19: ticket 18 closes at the current main before ticket 08, and ticket 01 code starts now. Tests, commits and pushes on this Mac wait for the deploy record. The order covers ticket 01 only, not ticket 02. |

## Round 2: full spec check

The first consistency review read only parts of the spec, and the refresh cut about 150 lines. Three more reviews read the whole spec.

| Review | Verdict | Required changes | Result |
|---|---|---|---|
| Spec lines 1 to 165 | Accept with changes | Link the worker-cache gap to ticket 06 as well as ticket 01. | Done; the optional "hidden arrangement" item is also in. |
| Spec lines 166 to the end | Accept with changes | 1. Phase 2 must name stored-engine continuation and its evidence. 2. Link the "before MCP" dispatch to ticket 06. 3. Ticket 08 also waits for the served commit. 4. "Coordinate limit", not "coordinate hiding". | All done. |
| Lost content (old spec against new) | Accept with changes | Six rules were in no place after the cut: the actor comes only from the verified session; the seat-view write limits; the first-step legal list and the server re-check of the whole turn; recovery by error type and stale reads; the complete turn with an explicit pass and engine end detection; the setup constraints, colour and seat ownership, and the setup, open-game and invite periods; the WebKit DOM-move and pan-and-drag rules. All 103 user stories are in both versions. | All six restored from the old spec text, each with its source link. |

After the fixes: `npm run test:docs` passes (160 tests), `git diff --check` passes, and the model-name scan finds none.
