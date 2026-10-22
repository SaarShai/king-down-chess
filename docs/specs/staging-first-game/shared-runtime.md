# Shared account-game runtime

Status: implemented; integrated staging checks remain with the main task.

## Plan and checks

1. Extract the complete plugin controller into `src/account-game/runtime.ts`. Keep one queue, epoch gate, router, board and set of screens. Give each surface a small host adapter. Check plugin client and controller tests.
2. Mount that controller on `/play`, `/g/<id>` and `/j#<key>` with the existing account sign-in flow and HTTP client. Keep other entries on the local controller. Check the web build excludes server code and the MCP SDK.
3. Save command input before sending it, with the account, full game ID, command ID and base revision. Keep uncertain receipts through reload. Bind draft replay to account, full game ID, revision and rules. Check lost replies, storage failures, account changes and draft scope.
4. Keep account-only entry assets outside the public offline graph. Keep the plugin bootstrap and its host callbacks. Check both builds and the existing style assertions.

## Implementation

- `src/plugin/app.ts` is the plugin entry. Its bootstrap configures the SDK adapter before it loads the shared runtime.
- `src/online/entry.ts` runs the existing sign-in return checks. It mounts the existing plugin screen markup after sign-in and account-access checks.
- `src/online/runtime.ts` maps the existing screen requests to typed HTTP calls. Browser page state and command receipts use separate account-scoped storage keys. Storage failure prevents a command send. A draft advances to a newer revision only when a complete intervening command chain changes no board state; legal replay then saves its new base revision.
- The full runtime and its screens do not construct or import the SDK at runtime. A build test refuses SDK and server imports.
- The web selector pass runs after CSS imports expand, so setup and playing boards receive the same imported table layout. A build regression checks the imported grid and strip selectors.
- Invitation previews publish only while their route generation is current. Navigation invalidates both replies and errors. Held-preview tests cover Back, another invitation and in-app navigation.
- A cancelled rematch selection releases its attempted-opening marker. A later visit can open the same accepted rematch. Completed or refused selections keep their guard; transport failure keeps the existing Retry. Use the command outcome to distinguish these cases. Browser history tests must keep the same mounted document, so reload cannot hide stale page state.
- Profile history selects the exact finished game through the queue's guarded continuation. Before routing, it marks an existing rematch as already followed. The result stays available for inspection and offers Open rematch. A rematch that arrives later during a live result watch still follows automatically. Reuse the result screen and its guard; do not add another saved-game reader or history store.
- The existing single poll reads solo setup and playing games as well as human games. Solo play and the solo result's rematch watch read every five seconds for two minutes after the newest command or the game start, then every fifteen seconds (ticket 56). Setup and the waiting human watch use the existing five-to-fifteen-second cadence. A solo tick also reads its waiting human game. No computer presence write is needed. The result watch follows a rematch created on another host. Unchanged reads preserve the local draft and mounted result controls, including keyboard focus and board inspection; an accepted board change invalidates its old draft base. Result read/queue locks update without rebuilding unchanged content. A retained result-details request permits a queued rematch; a stale game read locks rematch until recovery. Hidden pages stop polling and read on return.
- A changed position in the same playing game keeps the read-only Moves sheet open. Replace only its move rows and preserve its body scroll and Close control. Close uses the existing free-control marker so a background computer command cannot disable it and drop focus. Other position-dependent sheets, game switches and results keep their close behavior. Check real command locks as well as direct view routing.
- Source-page browser checks use a shared helper to await and assign the module exports. A ready button alone can precede that assignment.

## Verification

- `npm run typecheck`: pass.
- `npm run build`: pass.
- Focused `npm test`: 8 files, 201 tests and 53 artwork checks pass; zero skips.
- The main task owns integrated HTTP/MCP database checks and browser checks. No production deployment or real ChatGPT-host validation occurs in this branch.


## Compact end-card check

The compiled fixture reproduces a 1 CSS pixel scroll offset at 870 × 280 for both results. The title, result and first action remain fully inside the card and frame. Every action remains reachable. The active element is the page body. This is an overexact scroll-offset assertion, not hidden content. The check permits at most 1 CSS pixel and keeps every visibility and hit check. Product layout stays unchanged. The focused diagnosis takes 9.8 seconds; the registered HTTP browser check at `db486473` plus this change passes every ticket 36 size and action check. The complete check then stops at an unrelated profile reading-row assertion (`checkFlatRows`, line 85). Log: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/web-game-eOy136/plugin-ui-http.log`. No product CSS changes.


## Profile selection ordering

The profile game row routes through the command queue before the selection lane unlocks. Previously it awaited a route-free Resume and routed in an outer continuation. The unlocked Profile state could accept a newer navigation before the older continuation opened Board. A held-Resume browser regression fails on that ordering and checks that Board routes while the lane is still held. Error handling and current-job guards stay in the shared queue. The focused browser regression fails before the fix and passes after it; 53 artwork checks also pass. The registered HTTP check passes Profile and Collection at all three sizes, plus setup and hidden-seat checks. It then stops at the separate focused-row shadow assertion in `checkFlatRows` (`plugin-ui-check.mjs:1234`). Log: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/web-game-lVbkBR/plugin-ui-http.log`.


## Resting row check

The flat-row helper measures an unfocused sample before it checks the resting face. A clicked Settings input can correctly leave the approved gold focus ring on its label. The helper clears only focus inside the sampled rows; dedicated keyboard-focus and selected-segment checks stay unchanged. Focused button and label fixtures verify the baseline check. Product focus CSS stays unchanged.

## Private draft audit

The final widget-state audit accepts full IDs only at the private draft scope paths. The plugin's account scope must equal its current server-owned per-actor `board_id`; browser drafts instead use the signed-in account ID. The game, revision and serialized rules must match a private game view observed by the harness. Model content stays empty when private widget state is supported. The existing no-widget-state host fallback remains limited to public `status` and `your_turn`; the UUID check still rejects every other path. Regressions reject unrelated IDs, an extra scope ID and mismatched account, game, revision or rules. The focused checker run passes 10 tests and 53 artwork checks. The previous complete HTTP browser run reached this final audit after all GUI and gameplay journeys passed.

The strict audit exposed a transient save during a new plugin board binding: selection had changed `board_id` before redraw discarded the previous draft. The shared save boundary now drops a draft whose account scope differs from the current signed-in account or plugin board ownership ID. A deterministic regression fails before the fix; browser account scope remains valid when only its board binding changes. The combined focused run passes 37 tests and 53 artwork checks.

Final registered verification with the ownership-save fix: `PLUGIN_TEST_DATABASE_URL=<disposable DB> npm run check:browser plugin-ui-http` passes in 245.5 seconds. It covers real HTTP MCP/PostgreSQL, setup and both hidden seats, profile/collection, all GUI sizes, touch, Haste, lost replies and remounts, friend polling, match switching, all game journeys and the strict final private widget-state audit. Log: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/web-game-I83y66/plugin-ui-http.log`. This uses the local AppBridge harness, not a real ChatGPT host.

Obsolete drafts without a full scope are now discarded on hydration and before any save. They were already ineligible for replay; retaining their old FEN until redraw served no current path. The two deterministic hydration/save regressions fail before this cleanup and pass after it. Final focused verification: `KINGDOWN_TEST_FILE='src/plugin/client.test.ts' npm test` passes typecheck, all 27 client tests and 53 artwork checks. The full registered check above completed before this narrow invalid-state cleanup; no second full run is needed for removing state that cannot replay.
