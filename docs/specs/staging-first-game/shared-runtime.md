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
