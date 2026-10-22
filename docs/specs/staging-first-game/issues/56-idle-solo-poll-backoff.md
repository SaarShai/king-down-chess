# Back off the visible idle solo poll

Status: done; owner-approved. On 2026-10-21 the owner approves the cadence for the staging release: "Yes, include the idle solo poll back-off (5 s for 2 min after the last move, then 15 s) in the staging release." Poll cadences are product decisions (commit `45a89487`, UX review U8). Parent: U07; follows ticket 40.

## What

A visible solo game reads every 5 seconds for 2 minutes after its newest command, then every 15 seconds. A game with no command yet uses its start time (`created_at`). When the view has no readable time, the delay stays at 5 seconds. The solo End-screen rematch watch uses the same rule: `src/plugin/screens/end.ts:48` gives the poll the finished solo view as a playing view.

## Why

At `73387e66`, `pollDelay` returns 5000 ms for every visible solo game, with no idle limit (`src/plugin/poll.ts:11`). Human games already back off after 2 minutes (`src/plugin/poll.ts:13-20`). Hidden pages already stop (`src/plugin/poll.ts:7`). A return to the page reads at once (`wake`, `src/plugin/poll.ts:56`). Each tick runs one `kingdown_get` call (`src/account-game/runtime.ts:473`). The recorded hosted cost is p50 352 ms for each function call. I verified all five code claims against the source.

The human rule measures age as `server_now` minus the newest `last_commands[].at`, with a 120000 ms limit. The solo rule uses the same signal and limit, and adds `created_at` as the floor so that a new game gets its first 2-minute window. The solo rule counts all commands (also the computer's and seat-less ones), because in a solo game every command is activity of the one player.

## Scope

`src/plugin/poll.ts`, `src/plugin/poll.test.ts`, `docs/specs/staging-first-game/shared-runtime.md` (line 22, the solo cadence), this ticket. `tools/plugin-app.test.ts` is unchanged; its pinned delays are friend and daily games.

## Acceptance

- [x] A fake-clock test counts timed reads in 10 idle visible minutes (one solo game, last command at the start, each read returns the server's current time). Before: 120. After: 56. One idle hour: 720 before, 256 after (−64%). The 10-minute "after" count is 24 reads in the first 2 minutes and 32 in the next 8. Each count excludes the one read at mount. The "before" number comes from the same test run against the unchanged `pollDelay` (`AssertionError: expected 120 to be 56`).
- [x] The existing solo setup, turn, hidden and finished cases still hold, unchanged.
- [x] New cases: idle solo game (newest command 120000 ms old) gives 15 s; a command 119999 ms old gives 5 s; a game with no command gives 5 s until 120000 ms after `created_at`; a missing or empty commands list falls back to `created_at`; an unreadable `server_now` or no readable time gives 5 s. The solo End-screen rematch watch view gives 5 s, then 15 s after 2 idle minutes.
- [x] A remote move at 90001 ms or 119999 ms into the idle time appears within 5 s. A remote move at 300001 ms appears within 15 s. After each one, the poll goes back to 5 s.
- [x] The Status line records the owner's approval of the cadence (2026-10-21).
- [x] `shared-runtime.md:22` states the new rule (ticket 56). It merges with the code.

## Proposal for the owner

Rule: in a solo game that shows on screen, read every 5 seconds for 2 minutes after the last move, then every 15 seconds. The same rule applies to the End-screen rematch watch: after 2 idle minutes on the result, a rematch from another device shows within 15 seconds. Numbers: 120 → 56 reads in 10 idle minutes; 720 → 256 reads in an idle hour. A move from another device shows within 15 seconds (within 5 seconds in the first 2 minutes). Pick: yes. On yes, this branch goes to staging through the normal path.

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

## Review fixes

An adversarial review found these items. Each line gives the change.

1. CONFIRMED, `shared-runtime.md:22` still said that solo play reads every five seconds, and this ticket did not record it. Fixed: the lead allowed the change in this branch. Line 22 now states the new rule with "(proposal; owner approval pending, ticket 56)". Scope and Acceptance name the line. The Status line keeps the owner approval.
2. CONFIRMED and NIT, Acceptance said a missing commands list gives 5 s. The code falls back to `created_at`. Fixed: Acceptance now says so. A new `poll.test.ts` case checks a missing list with an old `created_at` (15 s).
3. CONFIRMED, the same `shared-runtime.md:22` finding from a second lens. Fixed by item 1.
4. NIT, the solo "either turn" case passed only through the no-known-time fallback. Fixed: those views now have a current `created_at`, so they check an active game on each turn.
5. NIT, the ticket did not say that the solo End-screen rematch watch also slows to 15 s. Fixed: What and the owner proposal now say so. Two `poll.test.ts` cases check a finished solo view that the End screen gives as playing (`src/plugin/screens/end.ts:48`): 5 s at 119999 ms, 15 s at 180000 ms.
6. NIT, "Parent: U8" named the UX review item, not a blueprint item. Fixed: the citation is now "UX review U8", and the parent is U07, the parent of ticket 40, which added the solo poll.
7. NIT, two passive sentences. Fixed: both are active now.

Checks after these fixes: `npm run typecheck` exits 0 with no output. `KINGDOWN_TEST_FILE=src/plugin/poll.test.ts npm test`: `Tests  15 passed (15)` (the new cases are in existing tests). `npm run test:docs`: see check 7. Checks 2, 3, 5 and 6 come from the first commit; these fixes change no product file.
