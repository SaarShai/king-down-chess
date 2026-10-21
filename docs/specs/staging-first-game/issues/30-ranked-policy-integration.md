# Implement the approved first ranked family

Status: active. Parent: U10. Staging only.

## Approved scope

The owner approves ticket 29's proposal: random opponents, three days per move, full fairy pool, four shared cards, existing always-on king choice, drawn arrangement and random colours. Built-in guidance stays; outside active-position move advice is prohibited by policy. New custom, friend and rematch games are Casual. Keep current rating values, completed history and existing games' treatment. No production release.

## Plan and checks

1. Add one immutable policy value at the existing creation/storage/result boundary. Backfill existing games to their old treatment without modifying results, ratings, saves or engine identity. New creation defaults to Casual; ranked creation fixes the approved family before drawing.
2. Separate ranked and casual matching in all paths, including Any rules, own waiting games, direct acceptance and rematch. Preserve start and command receipts, concurrent seat/result safety and existing privacy.
3. Add the smallest shared Ranked entry and policy labels/rules. Reuse setup, board, list, result and account adapters. HTTP and MCP accept the same contract; no host fork or ranked engine.
4. Add focused source and disposable-database proof of policy immutability, old/new eligibility, exact family matching, retries and concurrent outcomes. Update existing fixtures at the actual type boundary. Run the affected compiled shared journey and migration/recovery checks once the integrated source passes.
5. Independent review resolves material findings. Deploy only the guarded staging artifact after its schema is ready. Verify actual web/ChatGPT entry, labels and continuation where accounts permit; distinguish synthetic two-player evidence from actual host play. Preserve earlier U05 evidence and engine archives.

## Ownership and compute

Use isolated worktrees for parallel writers. One writer owns backend policy/storage/protocol/migrations and backend tests. A second writer owns the shared screens. Root owns transport adapters, integration and evidence. Agree the request/view contract before UI edits. One heavy test/build lane runs at a time; workers request it. Existing report and development entry remain the acceptance reference. No green matrix rerun without a changed boundary or unresolved risk.

## Source integration checkpoint

Backend `c1a3ce7c` and shared screens `0e567598` are integrated. Backend checks pass 139 selected service/setup/results/policy/matchmaking cases and 33 migration/access cases. Initial integrated checks pass 232 transport/interface cases, typecheck and 54 art checks. These are selected checks, not the full suite.

Independent review accepts the backend and finds two interface integration errors: Ranked setup sends a redundant time field that strict Find rejects, and a remounted lobby can show saved Casual while Retry retains Ranked. Remove the redundant field at its source; test transport admission using the actual UI argument builder. Derive the effective lobby setup from its retained request. Both repairs need integrated verification.

Recovery check `2689baac` adds real release-created Casual games to the existing four compiled consumer paths. A recovery artifact must finish them without rating changes and keep totals/history. Previous rating-unaware recovery is not a valid recovery target for this release. Engine rules, artwork and archive pairs stay unchanged.

## Full-suite findings and repair

The first full run passes 4,522 cases and exposes 28 failures in ten files, with 11 optional skips. Most failures are old test inputs that omit the required acceptance policy or expect new friend games to change ratings. Preserve those journeys; give random accepts their displayed policy, join friend games through their actual invitation, and assert Casual results with unchanged ratings. Exact model-summary checks now allow the public policy field while retaining private-state exclusions.

The run also finds two real layout defects: full policy prose expands the compact Menu, and a policy separator can wrap alone in a game row. Put the policy button in the Menu header and open details in their own sheet; keep the existing action-fit and wrap checks. Blank end reasons show only the policy without a trailing separator. The repaired six viewport cases, four policy-label cases and two selected review-account seed cases pass with typecheck and 54 art checks. Remaining browser contract updates are integrated from `c400dd6e`; the clean full suite and compiled checks follow.
