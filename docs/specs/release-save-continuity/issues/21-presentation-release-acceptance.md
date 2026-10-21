# Verify the complete presentation boundary in staging

Status: active. Parent: U05/U08/U09.

## Plan and pass criteria

1. Integrate the reviewed cut from ticket 20. Preserve rules, artwork and existing game histories. Its 244 focused tests and read-piece/verb-marks checks pass. The cursor journey fails identically on the unchanged base; staging ticket 26 owns that check repair.
2. Publish one exact worker/save pair. Keep all ten previous pairs unchanged. Use current staging source `e92871fd`, the new pair and the reviewed startup-status fix from staging ticket 27 as the recovery candidate; its default remains `8d628361`.
3. Run the complete source gate once, with the local test database. This wider cut changes five helpers and direct callers across both clients, so the earlier complete source result is not sufficient alone.
4. Build exact release and recovery artifacts. Require all 112 shared mechanics executions, four recovery consumer paths, web cache takeover, embedded HTTP journeys and the corrected backend/static-asset check. Record immutable artifact hashes. Reuse focused checks already passed unless a later change affects them.
5. Publish only the guarded staging preview after these checks pass. Compare accepted server/worker/helper bytes, preserve old archives and verify fresh web opens plus old/new game turns with the CPU lane idle. Refresh and inspect the authenticated staging connector. Native current-resource ChatGPT rendering/write remains a separate gate until the locked Mac is available; do not count a tool read or host harness as that gate.
6. Update the preservation report and unified backlog from evidence. Continue the next unblocked acceptance item, without adding gameplay or new infrastructure.

## Initial evidence

The reviewed source is integrated at `c6eaa1aa`. One explicit publication adds engine `cdac045daa373bf2417f22e767b6099893928fb8a90b0580efd16b019b138a7d` and its fixture save. All ten prior pairs remain byte-identical. The outer `u08-presentation-release/publication.json` records the exact files and hashes. This publishes a local archive, not a hosted deployment.

The real-builder wording controls preserve worker identity while the mechanical negative control changes it. Four owner-conflict cases cover names, refusal text, legal reach, mark meanings, frost, threats and design rails. No fallback, public rule scope or new presentation runtime is added.

## Complete-source findings

The first complete run at clean `a812ceb7` passes 4,514 tests and fails seven cases in two browser-test files. The failed assertions call `describeMove`, `readText` or `pieceGuide` with the old signature. These tools are outside the source TypeScript include. Product callers use the new signature. The test callers now pass their fixture's owned rules, or the same default owner as Collection. No assertion is removed. The first failed log and receipt stay in `u08-presentation-acceptance/source-first-failed.*`.

For this API migration, search imports and calls under both `src` and `tools`; source typecheck alone does not cover tool callers. The complete source gate must pass after this correction. Optional source-art and opt-in balance skips are reported separately; database cases must run.

The complete source gate passes at clean `87e31ff4`: 4,521 tests in 249 files, type check and 54 art checks, in 362.585 seconds. Eleven optional cases skip. Database cases run. Cursor ticket 26 also passes all ten browser cases with no errors.

## First compiled findings

The frozen `app-sOwSin` run passes recovery consumers, web cache takeover and painted-game checks. Two checks fail. Embedded HTTP reaches a `threatsIn` assertion with the old helper signature; it now receives the exact view's owned rules. The arrow assertions remain unchanged. The mechanics matrix passes the full piece/card/power roster, then its Firewall expiry web reload stops at public availability before a private game read. This is not a passed matrix.

Staging ticket 27 reproduces a real startup fault: an open status answer can reuse the final millisecond of a cached proof and expire in transit. Public status now requests a fresh database proof; private requests retain the five-second cache. The original failed reload did not capture the status body, so its exact cause remains unclassified. The added diagnostic records only bounded public status and elapsed time.

The failed run, artifact hashes and receipt remain in `u08-presentation-acceptance`. The corrected run uses a separate evidence folder. Reuse the complete source result above plus the focused status regression and database checks; rerun the compiled paths affected by the status and assertion fixes. Painted rendering is unchanged, so reuse its passed result. The recovery candidate must include the same startup fix so a recovery cannot restore this fault.
