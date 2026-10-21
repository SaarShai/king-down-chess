# Integrated casual staging acceptance

Status: in progress. Parent: U09. Staging only.

## Checkable plan

1. Integrate the reviewed Node search split, explicit ceremony names and deliberate Play-list refresh. Preserve the accepted roster, rules, artwork, command receipts and old archives.
2. Publish the new enforcement pair explicitly. Prepare a recovery source with the matching private adapter and search helper; the older adapter alone cannot handle the new worker response.
3. Run the complete source suite once on the combined tree with the disposable database. This closes integration gaps after changes to game ownership, hashing, worker loading and shared screen entry. Record required skips or failures explicitly.
4. Build the exact release and recovery artifacts. Record both helper hashes. Prove a new recovery computer turn, retries, conflicts, pending setup completion and AI continuation for all retained archives.
5. Run the four existing compiled checks on the final source: `shared-mechanics`, `plugin-ui-http`, `web-online` and `painted-game`. Repair confirmed failures at their cause; do not repeat unchanged green checks without a new concern.
6. Deploy only the guarded staging preview. Verify the alias bytes, first web update, new and retained games, and the repaired Play entry on the actual host.

## Gates and limits

The prior accepted staging source is `0b504fb3`. Its four compiled checks and backend recovery pass. The next source is not accepted merely because an isolated slice passes.

The Play-entry slice passes its targeted checks. The wider Hall/App run has 159 passes and three failures at existing board-readiness boundaries. Its focused repairs must preserve the original assertions. The combined full source run below must resolve this cumulative-run gap; do not repeat an intermediate full run on an unchanged subset.

Fresh native ChatGPT acceptance remains pending while the Mac is locked. An existing resource refresh does not load new application code. The old loaded resource reads the new `812aef27` game but has an empty move picker. Its exact loaded resource identity and the cause are not established; an engine fingerprint mismatch alone does not explain the older client's code. Do not claim a current-resource ChatGPT write. The supported recovery to verify is a deliberate Open of the same game, a current resource mount, unchanged saved state, and a legal turn. The existing old-URI resource test is not a real-host recovery pass.

The earlier intermittent cache refusal is unclassified. Keep the safe phase diagnostic and test the next legitimate update with the heavy test lane idle. A later successful open does not prove that prior failure is fixed.

The parent project's shared-mechanics verification report and development entry hold the concise current state and artifact receipts. Do not promote to production, activate a new ranked policy or submit an additional host under this ticket.

## Integrated source

The reviewed Play slice integrates at `40d3caec`, ceremony names at `40dacf4f`, and recovery checker at `3cb4a43e`. The ceremony source passes 20 focused cases and two existing mouse/touch review flows. The new checker proves a fresh recovery computer turn and all eight archived AI paths against the unchanged prior artifacts. These results do not replace the next exact-release rehearsal.

Explicit publication adds engine `febb9239470eea930cce5e1b588838bafd2c6687f0419d1bbf1072c975603ae2`. All eight prior archive pairs remain byte-identical. The matching private adapter/helper recovery and integrated checks remain pending.

Previous-turn/help wording and named-device performance percentiles remain separate acceptance gaps. Do not claim complete cosmetic isolation or a measured phone performance baseline. No obsolete shared controller is confirmed for deletion; local play, learning and Workshop still use their entry path.

## Complete source gate

The complete `npm test` run at clean `3e979f1b` ends with 4,375 passes, 110 failed tests and 21 skipped cases in 516.43 seconds including typecheck. The tree stays unchanged. Most failures are in the board fixture and report `Not current`; investigate the shared cause before changing individual assertions. Other failures cover source-module readiness, SDK remount setup, connection retry, Profile scroll, the asynchronous Play-list read and document length.

Ten skipped database cases come from a failed setup hook: its pre-switch schema omits the admission column required by current game storage. Ticket 18 repairs that fixture and passes all ten cases, with all grants, data-preservation and fail-closed assertions retained. Its combined 60-case database/document check passes; it does not close the complete gate. The source-run receipt and raw log are under `evidence/staging-next-ticket-candidates/u09-integrated/` beside this repository.

Ticket 17 identifies the common board failure: raw source fixture HTML does not load Vite's dev environment, so the configured page engine stays undefined. The app correctly requests server preview for synthetic games that have no server record. The shared harness now loads the existing dev environment before the app. Five selected cases pass, including an unstamped-source case that still uses actual server preview. Gameplay assertions and production code stay unchanged. The repaired whole-source run remains required.

Ticket 15 also finds a product connection failure. The SDK closes its transport before rejecting initialization; the adapter forwards that close as full runtime disposal, which then suppresses the connection error. The adapter now forwards ordinary close only after initialization succeeds. Explicit host teardown stays unconditional. A direct regression proves the old close-then-reject order, and 14 focused cases pass, including the visible Retry journey, late teardown and established connection disposal. Source-export waits, SDK remount fixtures and the asynchronous Play-scroll check also pass with their original behavior assertions.

The Profile check assumed the parchment roller remained visible at the page end after new trailing controls were added. Measured geometry confirms the page scrolls correctly with no inner registry overflow. Continuity ticket 16 retains both full-roller bounds at the parchment's end, proves matching page movement and checks the trailing Collection/Settings controls at the page end. The focused case, typecheck and 54 art checks pass without a layout change.

All four repair slices have independent read review and normal hooks. Run the combined complete source gate next; focused passes do not replace it.
