# Find and fix the base plugin UI test and browser check failures

Status: complete on branch `staging/lane-uifails`; not merged, not deployed. Parent: U09. Base: `73387e66`.

## What

At `73387e66` the full `npm test` fails 11 plugin UI tests: `tools/plugin-app.test.ts` (3), `tools/plugin-lobby.test.ts` (2), `tools/plugin-profile.test.ts` (1) and `tools/plugin-screen-lifecycle.test.ts` (5). `npm run check:browser plugin-ui` also fails on a click timeout. Find the cause of each failure and fix it without a weaker test.

## Why

Every lane sees the same red tests and calls them machine load. A known-red suite hides new faults. One of the causes is a product defect.

## Scope

The four test files, their helpers (`tools/plugin-protocol-fixture.ts`, `tools/plugin-ui-harness.ts`, `tools/plugin-browser-check.mjs`) and one product file, `src/plugin/screens/end.ts`. No change to `src/rules/`, `src/match/`, `src/ui/`, `tools/verify-turn.mjs` or `tools/app-ui.mjs`. No deploy.

The two helper `.ts` files are outside the literal `tools/lib/` and `tools/plugin-*.mjs` list. They are the harness and the fixture service of the four test files, so this ticket treats them as their helpers.

## Acceptance

- The ticket names the cause of each failing group, with evidence.
- The 11 tests and `plugin-ui` pass. No assertion is removed, no time limit grows, no test is skipped.
- For a product defect, the ticket says what a player sees and since when.

## Result

### Not load, not the clock

Each file fails the same tests when it runs alone at `73387e66` (one `npm test` at a time, under the shared test lock):

| File | Result alone | Time |
| --- | --- | --- |
| `tools/plugin-app.test.ts` | 3 failed, 133 passed (136) | 239.47 s |
| `tools/plugin-lobby.test.ts` | 2 failed, 32 passed (34) | 84.16 s |
| `tools/plugin-profile.test.ts` | 1 failed, 25 passed (26) | 42.17 s |
| `tools/plugin-screen-lifecycle.test.ts` | 5 failed, 9 passed (14) | 46.23 s |

The clock is not the cause. On 2026-10-22, with the real clock, all 17 tests that match the failing names pass at `e289f0d6` (2026-10-20 13:33). Each group below has a first failing commit. A `git bisect run` over the first-parent history found each one, with the focused test as the probe.

### Causes

1. **Teardown tests (6): stale tests.** `f27694f7` (2026-10-21 05:54, "Clear private panel content when the host closes it") replaces the whole page with one closed notice when the host closes the panel. The six tests still read the private screen after teardown, so `innerHTML` waits for an element that is gone. Evidence: all six pass at `26bc317c` (its parent) and fail at `f27694f7`. A probe shows the frame body after teardown is only `<p role="status">This game panel is closed. Open King Down again to continue.</p>`. Fix: the tests assert that notice after teardown, and that the late reply then adds no call, no widget write and no change to it.
2. **Minute tick (2): stale test.** `74023abb` (2026-10-21 03:22, ticket 40) makes a solo board poll every 5 s. The test puts in a one-time solo view with a deadline over a friend game. The first poll inside the 60 s clock step reads the fixture game (`deadline_at: null`), so the time text is empty. Evidence: a probe shows the poll call `kingdown_get {since_revision: 0}` and the friend view after the step. The test passes at `5d56af49` and fails at `74023abb`. Fix: the host answers each game read with the sample view and its own current `server_now`, as a server that holds the game.
3. **Five-second wait budget (1): stale test.** The same commit `74023abb` makes each solo tick read the solo board and the waiting human game. The test counted every `kingdown_get`, so it got two reads where it expected one. Evidence: a read log shows one board read and one background watch read per tick. The test passes at `5d56af49` and fails at `74023abb`. Fix: the test counts the watch reads, and requires the board read in the same tick too.
4. **Back during a held invite (1): stale test.** `714bab13` (2026-10-21 02:33, ticket 38) sends Invite on the command lane. The ticket asks for this ("Run invitation writes through the existing command lane"). A write in flight locks the page, Back included. The test still pressed Back during the held invite. Evidence: the test passes at `8284dd16` and fails at `714bab13`, on a click that waits for a disabled `#page-back`. Fix: the test asserts the lock, releases the invite, then checks the new code on the Play row after Back and the row lock during Resume. The lock is the design for every lane write, so this ticket does not change the product. The earlier friend review note ("a code can arrive after Back") no longer applies.
5. **Rematch during a held end read (1): product defect.** `07fa9a7c` (2026-10-21 03:52, "Keep result controls mounted across unchanged reads") returns early from `endScreen` when the result is unchanged. That return also skips the last step, `pollUpdate()` and `updateEnd`. A Rematch queued during a slow result read then waits for the next poll. Evidence: the test passes at `279368d4` and fails at `07fa9a7c`. A call log shows the `kingdown_rematch` 5079 ms after the release, in the same tick as the next poll read. Fix: `src/plugin/screens/end.ts` runs that last step after an unchanged pass too. The test now also requires the rematch to go before any later read, so a lucky poll time cannot hide the fault. Without the fix the test fails (`1 failed | 1 passed`, `page.waitForFunction: Timeout 5000ms exceeded`); with it, it passes.
   - **What a player sees:** on the result card, the player taps Play again, Rematch or Accept while the result is still loading. The button stays off and nothing happens until the next poll: about 5 s in a solo game, 3 to 15 s in a game with a person. Then the new game opens.
   - **Since when:** every build that contains `07fa9a7c` (2026-10-21 03:52 PDT). The staged source `d161231f` (ticket 52) contains it. This ticket does not check the production build.
6. **`plugin-ui` browser check: test fixture faults, no player effect.** The check stops at the first fault, so a fix showed the next one. The faults, in order:
   - Click timeout at `tools/lib/plugin-android-check.mjs:61` (17.6 s; reproduced at the base product). The fixture service plays the source engine (`sha256:6066ea0c…`), but the built page carries the compiled worker identity (`sha256:677b4eea…`). Since `2ff37ba8` (2026-10-20 15:07), a game whose engine differs from the page asks the server for each preview. The check's sample views have made-up game ids, so the preview fails. The card sheet then shows "Close this sheet and select Try again." in place of Use. The same mismatch puts an empty `draft` key in the widget state after Profile opens a game (`tools/plugin-ui-check.mjs:473`). On the hosted service the page and the server use one compiled runtime, so no player sees this.
   - Timeout on "replaced on another page" (`tools/plugin-ui-check.mjs:1469`). `714bab13` adds an `invite_id` to the service, but not to the fixture service.
   - Timeout on the Profile history row (`tools/lib/solo-sync-check.mjs:87`). `85d6e3f2` (2026-10-21 04:23) opens a finished game from Profile, but the fixture lists only seeded history rows.

   Fix: `tools/plugin-browser-check.mjs` passes the built runtime to the fixture service (`tools/plugin-ui-harness.ts`, `tools/plugin-protocol-fixture.ts`). Its games then carry the page's engine, as on the hosted service. The fixture also gets the service's invite identity (the token hash) on the invite reply, the waiting friend view and the inbox row. Its history also lists the games that finish in it after any seeded rows. Source-page tests keep the source engine by default. This ticket does not bisect the check itself; the source commits come from the code.

### Changes

- `src/plugin/screens/end.ts`: an unchanged result pass runs the poll update and the queued step (`followUp`).
- `tools/plugin-app.test.ts`, `tools/plugin-lobby.test.ts`, `tools/plugin-profile.test.ts`, `tools/plugin-screen-lifecycle.test.ts`: as in the causes above. No assertion is removed, no time limit changes, no test is skipped. Each test now asserts more or an exact current state.
- `tools/plugin-protocol-fixture.ts`, `tools/plugin-ui-harness.ts`, `tools/plugin-browser-check.mjs`: the built runtime, the invite identity and the finished history rows.

### Checks

Each command ran with `PLUGIN_TEST_DATABASE_URL` set to the lane's loopback test database.

| Command | Result line |
| --- | --- |
| `KINGDOWN_TEST_FILE=tools/plugin-app.test.ts npm test` (base) | `Tests  3 failed \| 133 passed (136)` |
| `KINGDOWN_TEST_FILE=tools/plugin-lobby.test.ts npm test` (base) | `Tests  2 failed \| 32 passed (34)` |
| `KINGDOWN_TEST_FILE=tools/plugin-profile.test.ts npm test` (base) | `Tests  1 failed \| 25 passed (26)` |
| `KINGDOWN_TEST_FILE=tools/plugin-screen-lifecycle.test.ts npm test` (base) | `Tests  5 failed \| 9 passed (14)` |
| `npm run check:browser plugin-ui` (base product) | `FAIL plugin-ui 17.6 s locator.click: Timeout 10000ms exceeded.` |
| The 17 tests of the failing names at `e289f0d6` | `Tests  17 passed \| 185 skipped (202)` |
| Rematch test with the old `end.ts` | `Tests  1 failed \| 1 passed \| 134 skipped (136)` |
| The failing names after the fix (four files) | `Tests  18 passed \| 192 skipped (210)` |
| `KINGDOWN_TEST_FILE=tools/plugin-app.test.ts npm test` (after) | `Tests  136 passed (136)`, 237.63 s |
| `KINGDOWN_TEST_FILE=tools/plugin-lobby.test.ts npm test` (after) | `Tests  34 passed (34)`, 87.39 s |
| `KINGDOWN_TEST_FILE=tools/plugin-profile.test.ts npm test` (after) | `Tests  26 passed (26)`, 36.92 s |
| `KINGDOWN_TEST_FILE=tools/plugin-screen-lifecycle.test.ts npm test` (after) | `Tests  14 passed (14)`, 26.15 s |
| `KINGDOWN_TEST_FILE='tools/plugin-protocol-*.test.ts' npm test` | `Tests  12 passed (12)` |
| `KINGDOWN_TEST_FILE='tools/plugin-{app,lobby,profile,screen-lifecycle}.test.ts' npm test` | `Tests  210 passed (210)` |
| `npm run check:browser plugin-ui` | `ok   plugin-ui         233.4 s` |
| `npm run check:browser plugin-ui-http` | `ok   plugin-ui-http    251.2 s` (an earlier run printed its final PASS line, but the runner failed it because I edited this ticket during the run) |
| `npm run typecheck` | passes (no output after `tsc --noEmit`) |
| `npm run test:docs` | `Test Files  13 passed (13)`, `Tests  161 passed (161)` |
| `npm run plugin:build:runtime`, before and after | all 15 outputs in `plugin-dist/` keep the same sha256; `worker.mjs` stays `677b4eeaa35113f0cf2b677f1e3650ae512de72485f0ce2c6617383c3af83f0b` |
| `npm test` (full, at `f3aca084`) | `Test Files  254 passed (254)`, `Tests  4641 passed \| 8 skipped (4649)`, `ℹ fail 0` (54 node tests) |
