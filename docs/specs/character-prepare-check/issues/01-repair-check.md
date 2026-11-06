# Repair the character preparation browser check

Status: needs-review

## Plan and checks

1. Read the failed logs, fallback code, history and CI selection.
2. Assert the current quiet-move fallback. Keep image recovery, stalled Undo and
   actual HTTP cancellation checks. Select this check in default CI.
3. Run `character-prepare` once in Chromium and once in WebKit. Run the focused
   check runner and check lint tests once. Open a PR into `staging/first-game`.
4. Wait for one CI round. Fix a small confirmed fault, or report the fault.

Pass criteria: the held turn image cannot block the move; the painted rest pose
moves with the pawn hop; Undo restores the board; a later move uses the recovered
image; late image delivery cannot restart a cancelled move; HTTP requests stay
within six slots and close on timeout and disposal.

## Findings

- The owner supplies the failed logs in `~/kd-runs/fin-attack/`. The same old
  assertion fails with and without PR 259.
- Commit `a54a6003a` changes quiet-move fallback to retain the painted rest pose
  and use the whole-figure gait. Its scene test checks that behavior. The old
  browser assertion still expects no painted body. The game is correct.
- The registry marks `character-prepare` as `byName: true`. The CI default job
  omits it, and no named CI step selects it. Remove this flag so default CI runs
  the check. This check does not need a GPU.
- The release gate opens only after `~/kd-runs/rel10/release.exit` exists with
  value `0`. No tests, builds or browsers run for this task before that gate.
- Base: `dd7d6693b0daab45448b357ab260c1d87ead1ff0`.
- Before the PR, staging moves the renderer into `src/render/painted/`. Rebase
  onto `362d0cf46f94c58381be91a79e9f42f8b593348c` and keep both runtime paths
  from that move. CI checks this integrated head; local checks use the earlier
  paths. No further local tests run.

## Results

- Chromium passes in 13.4 seconds. All later cases pass. The HTTP case observes a
  peak of six requests and confirms that all seven close.
- The first WebKit run passes fallback, then times out in `waitForResponse`.
  The check excludes the first held request by identity. Recovery must depend on
  the rendered frame, which the existing hash assertion checks. Remove this
  extra response wait and keep the frame assertion. One WebKit recheck confirms
  that recovery and Undo during preparation pass. A separate response identity
  is not required for the recovered frame to draw.
- WebKit then fails the actual HTTP case in 20.5 seconds: `started=6, closed=0`.
  The seventh request never reaches the server in the 12-second wait. Disposal
  is not reached. Keep this check strict. The remaining fault is in
  [ticket 02](02-webkit-http-cancellation.md).
- One `KINGDOWN_TEST_FILE='tools/{check,checks.lint}.test.ts' npm test` call
  passes 38 selected tests, both type checks and 70 board checks. This is not a
  full-suite pass. No further local tests run.
- PR and CI results go in `~/kd-runs/fix-prepare-check/fix-prepare-check.md`.
  The PR stays open. No merge or deploy is part of this task.
