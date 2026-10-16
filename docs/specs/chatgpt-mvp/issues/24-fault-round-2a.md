# Fault round 2: board and seat

Status: ready-for-human

The owner requests these fixes on 2026-10-15. Work stays on `claude/fault-round-2a`, from `66738a7b`. Do not push or merge.

## Plan and checks

1. Read each fault file. Check all callers before a shared change.
2. Add a failing test for each code fix. Use one browser test for text and hit areas. Keep the art size and row height.
3. Mark both last-move squares and card users with the current marks. Name card owners and features. Fix the seat and header text.
4. Check the first board frames and the end card. Fix F13 and F14 only if they still occur.
5. Under reduced motion, keep the slide and fade the victim for 150 ms. Remove strikes and shake from that path. Test the shared scene.
6. Run the touched tests, type check, plugin build and local UI check. Check both phone host copies. Record limits. Commit with both requested trailers.

## Changes and results

| Fault | Files | Before → after |
| --- | --- | --- |
| F1 | `screens/board.ts` | One landing square, or no square for Freeze → source, landing and affected squares. The first computer Vault marks a8 and a6. Card Freeze and king Freeze mark their target. A pass has no square; a drop has no source square. |
| F7 | `screens/seat.ts` | Computer: “both players are ready” → “Their side stays hidden until you are ready.” The two-player line stays as it is. |
| F8 | `screens/board.ts`, `screens/friend.ts` | “Freeze” in each hand → “Your Freeze” and “Opponent's Freeze”. Feature icons have the image role and the feature name. |
| F9 | `app.css` | 44 × 44 px touch targets → at least 48 × 48 px through a clear hit layer. The layer extends up to stay inside the frame. Card art stays 26 px; king and power art stays 30 px. Player rows stay 56 px and 44 px in the two phone copies. |
| F11 | `screens/board.ts` | No marks when Vault starts → each piece that can use it has the current power-target mark. After selection, the current destination marks show. |
| F13 | `scene.mjs` (check only) | not reproduced. With the stone request held, the canvas pixel is clear: `[0, 0, 0, 0]`. After release, the stone draws. The load gate matches `66738a7b`. No fix. |
| F14 | Board and end screens (check only) | not reproduced. The canvas box changes by 0 px when the end card opens, on both phone copies. The end-table box rule is already in the branch base. No fix. |
| F19 | `screens/board-model.ts` | “Computer Computer · Beginner” → “Computer Beginner”. The name row says Computer; the small row gives the level. |
| Reduced motion | `render/PaintedView.ts`, `docs/2d-first-pieces/board/scene.mjs` | Strikes and shake → a plain slide and a 150 ms victim fade. The fade takes 150 ms at Normal and Fast pace. All 12 pool piece types use the slide. Swaps and shoves keep their travel. The shared website renderer gets the same fix. |

`src/plugin/screens/friend.ts` is outside the file list. It holds the shared feature icon helper. `src/plugin/screens/board-model.ts` holds the shared strip line; Board is its only UI caller. The new browser test is `tools/plugin-board.test.ts`, beside the other plugin browser tests. The scene file is in `docs/2d-first-pieces/board/`. No dependency changes occur.

Each code fix first has a test that fails on the old code. The tests use legal engine moves for an ordinary move, Vault, card Freeze and king Freeze. The Vault mode test checks the power marks before selection. The reduced-motion test records the victim opacity and board transform with a paused frame clock. It checks the fade against real elapsed time at both paces.

The phone copies use 393 × 852 with insets 102/118 and 320 × 568 with insets 63/84. The tests hide the harness Remount bar and give the iframe the full viewport height. The hit tests check all four corners of a 48 px area with `elementFromPoint`. They cover cards, power coins, the seat king coin and buttons in the source page and the served build. The build expands the shared table selectors for Seat; the served check covers that path.

## Checks

- `npx vitest run tools/plugin-board.test.ts src/plugin/screens/board-model.test.ts src/plugin/screens/seat-model.test.ts src/render/marks.test.ts tools/plugin-lobby.test.ts`: 62 pass. No time limit changes.
- The final board run passes all 20 tests. The fade assertion uses the frame timestamp. The end check waits for a non-zero canvas box. The motion check works when the OS already requests reduced motion.
- `npm run typecheck`, `npm run plugin:build`, `npm run test:docs` (113 tests) and `git diff --check` pass.
- `node tools/plugin-ui-check.mjs` passes on the final build in the local fixture host, with no page error. It needs no database. Its board resource is 656,533 JSON bytes. The host uses port 64603; the agent stops that host after the check. The first build also passes the full check.
- Logs are in `/private/tmp/kingdown-round-2a-*.log`. The red checks are `red.log` and `motion-red.log`. The complete check logs are `final-tests.log`, `board-final.log`, `docs.log` and `final-ui-check.log` with that prefix.

## Not checked

The full suite runs later on the M1. I do not check native ChatGPT, physical Android or iPhone devices, VoiceOver, TalkBack, WebKit, a database or the website page. The browser checks use Chromium with touch and coarse-pointer emulation. No public site, push, merge or deploy occurs.

The commit hook normally reads the owner's credential files. The owner's no-read rule prevents that check here. The gate uses an empty folder and `/dev/null` through its two source overrides. Its type, path and size checks still run. The value scan does not run.

## Review fixes

A second reader reviews commit `9bf584d9`. The fixes are on `claude/fault-round-2`, after `539a74c4`. Each fix has a test that fails on the old code.

| Finding | Files | Fix |
| --- | --- | --- |
| Should-fix 1 (F9): at 320 and 360 wide, a hit layer covers the control above it. With a card armed at 320, a tap on the lower edge of Cancel opens Menu. At 360, a tap on the lower edge of the Moves line opens Resign or Menu. | `app.css`, `plugin-board.test.ts` | Under touch, the Moves line button is above the table bar (`z-index: 1`), and the context buttons are above the Moves line (`z-index: 2`). The rule names `button#moves-line`, because the build maps `#moves-line` to a Seat `div` too. At 360 the Moves line was 48 px in a 44 px row, so its box went 4 px into the bar. In the short-table layout it is now 44 px, the same as its row. The tests add 360 × 740 (insets 80/100). A new edge check taps 1 px inside each edge of each visible control, with a card armed and not armed, in the source page and the served build. Each tap must hit that control. The 48 px corner check accepts a point that is in the visible box of a neighbour control. |
| Should-fix 2 (F1): no last-move mark when the opponent's turn ends with a pass. | `screens/board.ts`, `plugin-board.test.ts` | The marks come from all steps of the last turn (the same side to move), not only the last step. A pass step adds no square. Haste then stop marks a7 and a6 (it marked nothing). Two Haste moves mark a7, a6 and a5 (a7 had no mark). |
| Should-fix 3: the fast-pace reduced-motion test is flaky. | `plugin-board.test.ts` | The test polls `motionQuery.matches`, then calls `setPace`, which applies reduced motion to the scene. A second cause also makes the test flaky: a frame that the scene requests before `clock.install` runs on real time, so the fade starts at a random time. The test now waits until the scene draws no frame for 100 ms before it installs the clock. |
| Note 4 (F8): power coins do not name the owner. | `screens/board.ts`, `plugin-board.test.ts` | The power coin label starts with "Your" or "Opponent's", as the card coins do: "Your Freeze, 2 left" and "Opponent's Freeze, 2 left". |
| Note 6: the served 48 px check passes when the width is `NaN`. | `plugin-board.test.ts` | Both size checks use `parseFloat(...) \|\| 0`, so `NaN` counts as 0 and fails. |

Note 5 (the website hit sound comes after the slide under reduced motion) stays as it is.

### Review fix checks

- Red: on the old code, the new tests fail. The two Haste tests give `[]` and `[40, 32]`. The power label test fails. With the old `app.css`, the 48 px tests fail at 320 (cards, armed: Cancel → `board-menu`) and at 360 (Moves line → `resign`, `board-menu`).
- `npx vitest run tools/plugin-board.test.ts src/plugin/screens/board-model.test.ts`: 33 pass. No time limit changes.
- The reduced-motion tests pass in 6 of 6 runs, after the final change (and 6 of 6 in an earlier run with the same wait).
- `npm run typecheck` passes.
- `npm run check:browser plugin-ui` (the build, then `tools/plugin-ui-check.mjs` in the fixture host on a free port) passes in 281 s on the committed fixes. It needs no database.
