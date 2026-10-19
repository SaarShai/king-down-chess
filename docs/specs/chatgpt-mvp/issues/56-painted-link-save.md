# The painted-game check: "lessons leave the saved game alone" fails after a game link

Status: done
Type: task

Record: copy this ticket to docs/specs/chatgpt-mvp/issues/56-painted-link-save.md in the repo, and set its Status to done with the check results at the end.

## The failure

The release deploy of main 50f7d2cb (2026-10-19, try 1) failed one browser check, painted-game, on this Mac:

```
AssertionError [ERR_ASSERTION]: lessons leave the saved game alone
+ actual   {"back":"RNBQKBNR",...,"moves":["e2-e4","e7-e5"],...,"link":0,...}
- expected {"back":"RNBQKBNR",...,"moves":["e2-e4","e7-e5"],...,"link":1,...}
    at tools/verify-painted-game.mjs:272:12
```

The full log: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/deploy/deploy-69-try1.log (the painted-game part), and the check log /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/tree-iSD8Gg/painted-game.log. The same check passed in the PR 66 deploy (try 2) and in CI. Only the `link` field differs.

The check (tools/verify-painted-game.mjs, block 2f then 2g): the friend's device writes a save with moves ["e2-e4"] and link 0, opens the game link (?army=RNBQKBNR&moves=e2-e4_e7-e5), then block 2g reads `before` from localStorage, runs six lessons, and expects the same save. The save at `before` had link 1; after the lessons it had link 0.

## Task

1. Find the root cause: which code writes `link` 1 and then `link` 0 (src/screen/play.ts restore(), save(), linkSide, previously.load and the link replay; src/main.ts:186). Decide whether the product is right (which side should `link` hold on the friend's device after it opens a continuation link?) or wrong. Read docs/specs for the game-link design to answer it.
2. If the product is wrong (the save holds a wrong or changing link side), fix the product at the root and keep the check as it is. If the product is right and the check reads `before` while the app has not yet saved its settled state, fix the check: wait for the settled save (a condition, not a sleep), then read `before`. Never remove or weaken the assertion. Never raise a time limit.
3. Prove it: a test that fails without the fix where you can make one (for example, delay the settle step in a unit or browser test), and the painted-game check passes 5 runs in a row. Run browser checks only through the lane's check-runner (painted-game is not WebKit, so the M1 can run it).

## Plan and pass criteria

1. Read the link design and trace each save write. Confirm the side on each device.
2. Fix the check at the save boundary. Keep the full save comparison after the lessons.
3. Add a test with a held save write. The check must wait until the expected moves and side are saved.
4. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit the fix.
5. Run `painted-game` five times in a row through the supplied check runner. Run `plugin-ui` through that runner. Record each result and the tested head.

Proof criteria: the held-write test fails without the fix; painted-game passes five times in a row; the lesson save assertion stays unchanged; no check time limit changes. Record all requested check results, including any full-suite failure.

## Root cause

The product is correct. [The link design](../../web-redesign/spec.md#46-modes) gives each device its own side. The sender keeps Black (`link: 1`) after `e7-e5`. The friend receives White (`link: 0`) after that move.

`restore()` calls `previously.load()`. It plays the link into the game and sets `linkSide` from `game.pos.turn`. The replay reads the kept history. It does not change the game or `linkSide`. `save()` writes that side to local storage. Lessons keep the saved game and copy only settings.

The check uses `window.view.pos.board` as its load signal. That position exists before `await view.ready()` ends in `main.ts`. The start-up save comes after that wait. Thus a board read can pass while local storage still holds the prior device's side.

The preceding reload has the same gap. The check can write the friend's test save before that reload's start-up save. The late save can replace the test save with the sender's two moves and Black side. The next link then has no fresh move for Previously to show. Its final board appears before its start-up save. Block 2g can read Black as `before`; start-up then saves White. The lesson comparison reports that change.

## Change

Use `waitForLinkSave()` at all three link load boundaries in block 2f. It waits for the loading status to clear, the exact army and move list, both human players, and this device's side. The loading condition also protects a reload whose prior save already matches. The full save comparison after all six lessons stays unchanged. No product code, sleep or time limit changes.

Tests hold the old save while the board already shows the final position. They cover a missing save, the wrong side, missing or extra moves, the wrong army, computer players, and a reload that still loads art. The test releases the save write and checks that the wait then ends.

## Check results

Tested code head: `61d7a01a`.

- `npx tsc --noEmit`: pass. The commit hooks also pass.
- Old-condition proof: replace only the new wait with the former board condition in a separate test copy. All 16 new cases fail because the wait ends before the save write. The other 18 helper tests pass.
- Fixed helper: `KINGDOWN_TEST_FILE=tools/app-ui.test.ts npm test` passes all 34 helper tests and all 51 scene tests.
- Full `npm test`: 3 files fail; 190 files pass. Tests: 5 fail, 3,233 pass, 8 skip. All five failures are timeouts in unchanged files: the fixed-depth search test (5 s), the workshop judge property test (30 s), and three plugin board Home loads (3 s each). The full run ends with exit 1.
- A second full run uses `VITEST_MAX_WORKERS=1` with the same time limits. It stays in the shared test queue. Another lane holds the lock and has been active for 43 minutes at the check. This lane cancels its own queued retry with exit 130. The full suite remains red; this ticket does not claim a clean full test result.

The supplied check runner runs each browser check from the committed head. These five `painted-game` runs are consecutive. Each ends with `check-runner: <runner> exit 0 at 61d7a01a`.

| Check | Runner | Seconds | Result |
|---|---|---:|---|
| painted-game 1 | M1 | 136.5 | pass |
| painted-game 2 | this Mac | 150.1 | pass |
| painted-game 3 | this Mac | 141.9 | pass |
| painted-game 4 | this Mac | 126.3 | pass |
| painted-game 5 | this Mac | 112.9 | pass |
| plugin-ui | this Mac | 251.7 | pass |

No server code changes, so `plugin-ui-http` does not apply. The lane scratch folder holds `unit-red.txt`, `unit-targeted.txt`, `unit-full.txt`, `unit-full-serial.txt`, and `checks-<name>-<number>.txt`.

## Review and scope

The smallest complete fix is a check wait. An earlier product save would change working start-up code to repair a test data race. The shared helper serves all three affected loads. The held-write tests guard its conditions. The six-lesson comparison stays unchanged. No time limit changes.

All three ticket parts are complete. No taste choice is needed. The full unit test result above remains a verification limit. No push, merge or deploy occurs.
