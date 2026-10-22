# Back off the visible idle solo poll

Status: code complete on branch; needs-info (the owner's approval of the cadence). The code change is on branch `staging/lane-poll`. The new cadence is a proposal: it needs the owner's approval before it goes to staging, because poll cadences are product decisions (commit `45a89487`, U8). Parent: U8.

## What

A visible solo game reads every 5 seconds for 2 minutes after its newest command, then every 15 seconds. A game with no command yet uses its start time (`created_at`). When the view has no readable time, the delay stays at 5 seconds.

## Why

At `73387e66`, `pollDelay` returns 5000 ms for every visible solo game, with no idle limit (`src/plugin/poll.ts:11`). Human games already back off after 2 minutes (`src/plugin/poll.ts:13-20`). Hidden pages already stop (`src/plugin/poll.ts:7`). A return to the page reads at once (`wake`, `src/plugin/poll.ts:56`). Each tick runs one `kingdown_get` call (`src/account-game/runtime.ts:473`). The recorded hosted cost is p50 352 ms for each function call. All five code claims are verified against the source.

The human rule measures age as `server_now` minus the newest `last_commands[].at`, with a 120000 ms limit. The solo rule uses the same signal and limit, and adds `created_at` as the floor so that a new game gets its first 2-minute window. The solo rule counts all commands (also the computer's and seat-less ones), because in a solo game every command is activity of the one player.

## Scope

`src/plugin/poll.ts`, `src/plugin/poll.test.ts`, this ticket. `tools/plugin-app.test.ts` is unchanged; its pinned delays are friend and daily games.

## Acceptance

- [x] A fake-clock test counts timed reads in 10 idle visible minutes (one solo game, last command at the start, each read returns the server's current time). Before: 120. After: 56. One idle hour: 720 before, 256 after (−64%). The 10-minute "after" count is 24 reads in the first 2 minutes and 32 in the next 8. Each count excludes the one read at mount. The "before" number comes from the same test run against the unchanged `pollDelay` (`AssertionError: expected 120 to be 56`).
- [x] The existing solo setup, turn, hidden and finished cases still hold, unchanged.
- [x] New cases: idle solo game (newest command 120000 ms old) gives 15 s; a command 119999 ms old gives 5 s; a game with no command gives 5 s until 120000 ms after `created_at`; a missing commands list, an unreadable `server_now` or no readable time gives 5 s.
- [x] A remote move at 90001 ms or 119999 ms into the idle time appears within 5 s. A remote move at 300001 ms appears within 15 s. After each one, the poll goes back to 5 s.
- [x] The cadence is recorded as a proposal for the owner (see Status).

## Proposal for the owner

Rule: in a solo game that shows on screen, read every 5 seconds for 2 minutes after the last move, then every 15 seconds. Numbers: 120 → 56 reads in 10 idle minutes; 720 → 256 reads in an idle hour. A move from another device shows within 15 seconds (within 5 seconds in the first 2 minutes). Pick: yes. On yes, this branch goes to staging through the normal path.

## Result

Commit `Back off the visible idle solo poll to 15 s after 2 minutes`.

Checks (`PLUGIN_TEST_DATABASE_URL` set to the disposable loopback test database):

1. `KINGDOWN_TEST_FILE=src/plugin/poll.test.ts npm test` before the change: `AssertionError: expected 120 to be 56`. After: `Tests  15 passed (15)`.
2. `KINGDOWN_TEST_FILE='src/account-game/**/*.test.ts' npm test`: `Test Files  4 passed (4)`, `Tests  63 passed (63)`.
3. `KINGDOWN_TEST_FILE=tools/plugin-app.test.ts npm test`: `Tests  3 failed | 133 passed (136)`. The same 3 fail with the same messages when `src/plugin/poll.ts` is the `73387e66` copy (`Tests  3 failed | 1 passed | 132 skipped (136)` for both copies with `KINGDOWN_TEST_NAME`).
4. `npm run typecheck`: exit 0 (`tsc --noEmit`, no output).
5. `npm run check:browser plugin-ui-http`: `ok   plugin-ui-http    275.5 s`, `check: all 1 passed`.
6. Full `npm test`: `Test Files  4 failed | 250 passed (254)`, `Tests  11 failed | 4633 passed | 8 skipped (4652)`.
7. `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  161 passed (161)`.

The 11 full-suite failures are not from this change. With the `73387e66` copy of `src/plugin/poll.ts` (the only product file this branch changes), the same tests fail with the same messages and lines:

- `tools/plugin-app.test.ts`: held end read rematch (leave false) at line 1089, `TimeoutError: page.waitForFunction`; minute tick for `power-w` and `card-w-0` at line 2092, `expected '' to be '2 min left'`.
- `tools/plugin-lobby.test.ts`: Your games after Back at line 139, `locator.click: Timeout 5000ms` (`#page-back` disabled); computer handoff budget at line 290, `expected 9 to be 8`.
- `tools/plugin-profile.test.ts`: held notice page at line 158, `locator.innerHTML: Timeout 5000ms`.
- `tools/plugin-screen-lifecycle.test.ts`: five held-reply teardown cases at lines 94, 113 and 123, `locator.innerHTML: Timeout 4000ms`.

The focused rerun of the lobby, profile and screen-lifecycle files gives `Tests  8 failed | 66 passed (74)` for both copies, with an identical failure signature. These failures need their own ticket.
