# Share the account client and page host

Type: task
Status: needs-info
Blocked by: 03
Starts: after ticket 18 approval and the plugin session handover of src/plugin/
Parent: [Web build](../README.md)

## What to build

Put the account hall and read flow behind the game-client and page-host boundaries while the plugin remains complete. Move only the common state and screens that ticket 07 needs. Each later consumer moves its own screen and removes the old definition. Keep one implementation. This ticket changes no public web exposure.

Use the phase 2 row and common push gate in [the test gate][gate]. Keep future operations closed. The [build index](../README.md) holds the approval and source gates.

## Acceptance criteria

- [ ] [Test gate: T2; phase 2 and pure seam][gate]. Move the common state, hall and read flow needed by ticket 07 with their tests. Remove their old definitions. Keep later screens on their current path until their consumer ticket moves them. Keep raw MCP envelopes, widget persistence, board pointers, fullscreen and host messages in the plugin adapter.
- [ ] [Test gate: T3; phase 2 and shared plugin checks][gate]. Prove complete plugin startup and navigation through plugin-ui and plugin-ui-http; retain seat, board and result regressions. The page-host/game-client interfaces have only their two concrete callers, with no provider framework.
- [ ] [Test gate: T3/T4; sample focus/contrast rows][gate]. Put the accepted spent-coin and focus fixes in one shared CSS definition. Check the rendered contrast, focus and affected selectors on both surfaces. Keep web hit-area sizing in its page host.
- [ ] [Test gate: T4/T5; local and built-output seams][gate]. Keep the local controller and save path separate. Reuse the asset/symbol transform and check that browser-facing modules contain no server modules or service credential.
- [ ] [Test gate: common push gate and evidence record][gate]. Record the exact source/tree, commands, exits, counts, skips (no required skip), affected selectors and device evidence. An independent reader checks this diff; fix each confirmed fault. Obtain the owner's merge word for its exact scope.
- [ ] [Test gate: scoped phase and release stops][gate]. This preparation has no publish of its own. Its later carrier publish needs the [source checks](../README.md#owner-and-branch-gates) and a reviewed [release packet][route], the owner's separate publish go and the applicable live probes. The merge word alone gives no publish or database-write go.

## Notes

- [Adaptation answer 02](../../web-adaptation/issues/02-shared-client.md).
- [Adaptation answer 08](../../web-adaptation/issues/08-release-evidence.md).
- [Adaptation answer 12](../../web-adaptation/issues/12-scope-picks.md).
- [Adaptation answer 14](../../web-adaptation/issues/14-visual-sample.md).
- [Adaptation answer 17](../../web-adaptation/issues/17-release-route.md).
- [Spec](../../web-adaptation/spec.md), [test gate][gate] and [release route][route].
- The five parked branches stay [later work](../../shared-screens-later/README.md). Use a codex/web-* branch from the accepted main base. Keep one writer for shared files.

## Checkpoint at the scope freeze (2026-10-20)

- The branch holds slices 1 and 2 and criterion 3 parts 1 and 2 (`7aa27c8b`), merged up to `fad703b9` with main `cc1081b2`. Slice 2 and parts 1 and 2 ran focused tests only before commit. The full suite at `fad703b9` fails 8 tests in 7 files: plugin-board F05 and F06, plugin-motion (the king flip), plugin-lobby (Share during Resume), plugin-journeys (Play readiness), plugin-ios-size (Fairy pieces at 197 px), plugin-qa-protocol.docs and privacy-policy.docs.
- The regression-fix run stopped at 12:40 UTC on the owner's freeze, after both fix patches were complete. It applied, committed and reviewed nothing. The patches and their reports are kept outside the repository, with SHA-256 values in `MANIFEST.md`:
  - `/Users/za/Documents/king down chess (new)/docs/specs/unified-blueprint/evidence/claude-web/rga.patch`: F05, F06, the king flip and the 197 px Cards ring (`scroll-margin` 5px). Report `rga.md`.
  - `/Users/za/Documents/king down chess (new)/docs/specs/unified-blueprint/evidence/claude-web/rgb.patch`: Share during Resume, Fairy pieces at 197 px and the two docs tests. Report `rgb.md`. Play readiness passes twice alone on each runner (load).
  - Both apply cleanly to `fad703b9`, alone and together. Neither adds a file. The worktree has no untracked files.
- Next, when the integration order allows: apply both patches, run the full suite, have both changes reviewed, then merge this branch into 06, 07 and 08.
- Criterion 3 also waits for the coin paint split in the plugin controls lane. Group opacity dims a spent card's focus ring (2.41:1). That lane is frozen.

[gate]: ../../web-adaptation/test-gate.md
[route]: ../../web-adaptation/release-route.md
