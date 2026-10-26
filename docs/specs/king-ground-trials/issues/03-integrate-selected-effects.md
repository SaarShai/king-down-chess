# Integrate the selected king ground effects

Status: resolved
Type: task

## Scope

The owner selects FILM Shadow hands, alternating original and painted Mud growth, and the new Stratus clouds. Flame and Spirit keep their selected original effects. Frost has no ground painting. The source decision is the owner message in the character animation chat: “shadow hands need FILM smoothing. mud - let's actually use both, alternating. stratus = use the new one. flame = original better. spirit = what's the difference?!” The parent chat authorizes this merge.

## Plan and checks

1. Compare the selected renderer against upstream `dab2cc41e64d9c35ae01228cdc04a7a30b421e03`. Keep the newer scene, court, effects registry and game code.
2. Merge the three selected ground effects. Preserve the native paintings, alpha atlas, exact prompts and interpolation records.
3. Check exact source hashes, stable clocks, quiet Mud joins, Shadow pose continuity, Stratus core and movement fade. Run `npm test` with a focused TypeScript selection; its painted-module phase checks these modules. Run the managed king-effects browser check. Root handles independent review.

## Acceptance

- Mud plays each complete eight-second cycle in turn, with soil joins.
- Shadow uses one complete FILM pose per hand and its existing floor clock.
- Stratus retains a cloud core while outer billows roll independently.
- Flame, Spirit, continuous figure clocks and Shadow smoke keep upstream behavior. Frost has no ground painting.
- No change to scene, court, registry or other game code. No new persistent server, commit or deployment.

## Source

Selected source worktree: `.claude/worktrees/ground-selected`, HEAD `0a043d4b0fed130c307a731147c8ac79bc8a5298`. The selected work is uncommitted. The imported module hash is `52a8bb04413024da1b1f5647ad8bfa6cad216dc70d400912733d7a5b603336d8`.

## Verification

- `KINGDOWN_TEST_FILE=src/piece-icons.test.ts KINGDOWN_TEST_LOCK_WAIT=60 npm test` passes. It includes app/tools typechecks, 14 selected icon unit tests and all 67 painted-module tests. No full-suite claim.
- The new tests cover Mud cycle order and joins, Shadow complete poses and all intermediate frame steps, Stratus persistent core, separate clocks, loop and movement fades.
- All 20 recorded source hashes match. All 130 hand-frame cells keep transparent four-pixel gutters. Native painted sources and the Mud atlas retain alpha. Mud's native source alpha range is 0–254; the source is unchanged.
- Flame layer/noise/render code, the Spirit section and Shadow smoke are byte-identical to upstream. The Lava A and Stratus paintings already match the selected source exactly.
- `git diff --check` passes. No scene, court, registry or other game source changes.
- Exact source hashes and checks are in [selected-effects.json](../provenance/selected-effects.json). Test log: `/tmp/kingdown-selected-effects-merge/test.log`.
- The initial `tools/plugin-board.test.ts` selection is stopped before completion because it starts a large browser fixture. It supplies no pass claim.

## Integrated preview and browser result

The existing preview uses each king's full period for Replay. Mud now stays awake for 16 seconds. Its text describes both eight-second styles. Stratus text describes the persistent core and rolling outer billows.

`npm run check:browser king-effects` passes in 124.142 seconds. Existing checks cover game motion controls, moves, captures, King Down, title effects, hidden tabs and desktop/phone frame cost. The added source-preview check uses local route fulfillment inside the managed browser; it starts no extra static server.

Mud requests 16000 ms of replay. The four kings still draw after 12 seconds: frame count rises from 715 at 12001.9 ms to 955 at 16102.1 ms. Screenshots show dense original growth at four seconds, sparse painted growth at twelve seconds and the clear soil join at the end. All existing checks pass. No checkout changes are reported during the managed run.

- [Managed run report](../evidence/integration-browser/run.json)
- [Browser log](../evidence/integration-browser/king-effects.log)
- [Full replay samples](../evidence/integration-browser/mud-replay.json)
- [Original growth](../evidence/integration-browser/mud-replay-4000.png), [painted growth](../evidence/integration-browser/mud-replay-12000.png), [end of cycle](../evidence/integration-browser/mud-replay-16100.png)
- [Static preview](http://127.0.0.1:5197/.claude/worktrees/animation-session-merge/docs/king-effects/preview.html#idle-mud)

## Independent review

The parent reader independently reviews the effects modules, existing tests, final preview/checker diff and the four-second/twelve-second Mud screenshots. No blocking finding remains. The review confirms that the selected source stays intact and both Mud growth styles appear in the full replay. No commit or deployment is made in this lane.

## Limits

The selected source records softer FILM fingertips in close view. This merge does not re-render source art. The full suite is not run. The targeted tests, managed browser check and independent review pass.

The repository size gate records the exact 2.45 MB Shadow atlas path with its preservation reason. The approved alpha atlas remains unchanged.
