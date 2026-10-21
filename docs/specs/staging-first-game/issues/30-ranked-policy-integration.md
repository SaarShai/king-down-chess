# Implement the approved first ranked family

Status: complete for bounded staging acceptance; public release gates remain open. Parent: U10. No production release.

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

The clean full run on `34ef2eec` passes 4,547 tests with 11 optional skips. Three tests fail because they select any header button as Close; Menu now has two. Select the accessible Close name in the focus, close-mark and related card-motion checks. Keep all geometry, pointer and focus assertions. The three repaired cases and two related card-motion cases pass with typecheck and 54 art checks. The selector repair changes no runtime source. This is a full-run baseline plus five focused repairs, not an all-green full rerun.

The separate staging database applies migration 0018. A transaction compares all ten existing games (apart from the new policy column), player ratings and rating history before and after. All remain equal; all ten games are Legacy. Production is untouched. The recovery source `d2932d77` includes the policy-aware result writer while retaining its prior default engine and all eleven archives. Compiled release, recovery and hosted acceptance remain pending.

The first compiled run passes web cache takeover in 103 seconds. Three drivers stop before their new acceptance paths finish: the normal web helper sits outside its game ID scope; the profile/result checks omit the new policy label; and recovery reads the HTTP acknowledgment as a full View. Keep the same assertions, move the helper into its game scope, use exact policy labels and unwrap the acknowledgment after checking its type and command ID. The first recovery MCP Casual finish already passes. Reuse the unchanged release/recovery artifacts and the passed cache check; rerun only the three affected drivers before backend and routing checks. No product change follows these findings.

The repaired web journey passes Ranked creation, MCP join, shared turns and a rated result in 39.1 seconds; its Casual results leave ratings unchanged. All four recovery consumer paths pass in 9.8 seconds, including Casual completion without ratings. A later embedded check exposes a real lobby defect: entering Ranked changes the header before replacing the prior Casual rows. Those rows remain clickable during the fetch. Clear the old list at entry, hide the empty-state claim until the read completes, and show loading. Hold the reply in a regression test to prove no stale game can be accepted under the new policy. Apply the same shared-screen fix to release and recovery, then check the changed artifacts before publication.

The held-reply test reproduces one old clickable Casual row under the Ranked header. The entry-clear repair passes that case and the existing handle continuation and failed-read recovery cases: four selected tests, typecheck and 54 art checks. Exact Ranked acceptance remains asserted. Replies already filter against the current selected mode, so no request-generation layer is added. A fresh compiled run follows on this final shared-screen source.

The next compiled run passes the web Ranked/combined-mechanics journey, all four recovery paths and web cache takeover. The late embedded viewport sweep finds a real Menu header defect: at 197 pixels the new policy button leaves the title zero width; at 240 pixels the title wraps one letter per line. Below 300 pixels, let the header wrap and place the policy control on a full second row. Keep Menu and Close together. The regression first fails at both widths, then all eight selected Menu checks pass across Casual, Ranked and Legacy, with typecheck and 54 art checks. Recovery `65f8d9f0` includes the same repair; its engine and eleven archives stay unchanged. Freeze both sources for the final compiled gate.

The full embedded sweep next exposes a compact winning-result defect. Policy text wraps the reason, while fixed 144/224-pixel card caps and an empty status paragraph before the ordered actions hide the next-action scroll cue. Use the available frame height, place status/error after actions as in landscape, and reduce compact portrait spacing without shrinking text or touch targets. The focused check passes 12 browser cases, including 60 policy/reason presentations at five compiled zoom sizes, Back clearance, long text scrolling, and a populated status plus actual failed-read recovery. Typecheck and 54 art checks pass. Existing compiled visibility assertions stay unchanged. The web journey, four recovery consumers and cache takeover pass on the preceding artifact; carry those results only after runtime/archive byte equality is checked. Rerun the complete embedded journey and the required backend/archive and routing gates on the final repair before staging publication.

## Staging checkpoint

Final release source `5ac73cc9` and policy-aware recovery `2069c589` pass the complete embedded journey (240.5 seconds), backend/archive checks and routing guards. Server/runtime and all eleven archive bytes match the preceding passed web, recovery-consumer and cache evidence; HTML and generated service-worker bytes change with the layout. Both built trees remain immutable during checks. Independent review is clear.

The guarded preview `dpl_CtN33YipFC2U7etN9tC8FrJkahfD` now serves `https://kingdown-staging.vercel.app`. Its HTML SHA-256 is `3366947ff84c2b94928b738439f77653857c1b0374d532365ecfa08a98460030`. All eleven prior archives remain unchanged. The first immediate alias hash check fails during the handoff; a later independent read matches the built file. No production project or database changes.

Actual web proof preserves the nine-action game `1ccbc2a2-71f6-8b47-a4db-aede1260beed`, including its cards and powers, and shows Legacy treatment. The separate staging profile uses `stagingcheck`; rating 1500 and the prior 1 played/1 lost record stay unchanged. Web creates Ranked game `667be0f9-9a4f-83e5-8795-ef0f404a5269` through the name-setup continuation. The live MCP games/open tools confirm the same random, daily, three-day, `ranked-v1` game; the web list labels it Ranked. Leave this waiting test game for the native cross-host check, then cancel it through the normal UI.

The Mac locks before the untouched native ChatGPT check. Unlock is requested. A browser-controlled reload of an existing ChatGPT tab shows the host's display failure; Try again is not used. Three cache warnings provide no established root cause. Do not call ChatGPT acceptance complete or infer that automation caused the failure. A later read from an older Codex panel times out before cross-host discovery is proved. The next step is a fresh native ChatGPT open after unlock, followed by the Ranked game/list/policy check and the existing-game continuation. Reuse the accepted artifacts and receipts; do not rebuild or rerun green mechanics without a new defect. The parent evidence folder has `staging-ranked-policy/hosted/receipt.json`.


## Native staging acceptance

After unlock, three new native Chrome tabs load the actual ChatGPT staging app without Try again. Their distinct init IDs are in the hosted receipt. The first open discovers the web-created Ranked game; its waiting screen opens and normal cancellation succeeds. Refreshed web and live MCP lists both return to the nine old games. No active two-account Ranked result is claimed.

The native board preserves all nine earlier history actions, with cards and always-on powers visible. Choose a move and End turn commit the Maester swap from g1 to h1. The web board then shows eleven actions, including that swap and the computer pawn reply b7 to c6. The live profile retains rating 1500 and the prior 1 played/1 lost record. Two further fresh ChatGPT opens show the continued game at move 6.

This completes the bounded actual-host acceptance of ticket 30 in staging. These tabs use native controls and are not claimed by extension control, but a browser-wide debugging banner remains visible from other tabs. Do not call this a debugger-detached browser. The earlier attached-tab display failure remains recorded with unknown cause; three successful native opens do not prove a universal startup fix. No code rebuild or production change occurs during this acceptance.
