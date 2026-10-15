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
