# 18 · Server follow-ups, lane server-2

Status: needs-triage

## Scope

Build ticket 14 B4 and ticket 18-c on `claude/r9-server`.
The owner approves this scope and the exact B4 words on 2026-10-16.
The source tickets are in the owner's scratch ticket folder.

## Plan

1. Use the approved consent heading and six permission lines. Remove the token text and raw scope row. Keep the providers, account details and D8 password form.
2. Let each tool set `openWorldHint`. Set it true on find, say, invite, join and handle. Set it false on all other tools. Update the protocol check and checklist rows 28, 30 and 44, with the A6 result.
3. Add consent and tool-hint tests. Run `npx tsc --noEmit` and `npm test` with the specified local test database. Run `plugin-ui`, `plugin-ui-http` and the consent check on the M1, with the shared browser lock.
4. Check the diff and commit with both required trailers. Record results here.

## Verification criteria

- The consent page uses the owner's exact words. It shows no raw scope code or token text.
- The D8 form stays closed at first. Its mock password failure and success paths pass.
- Every tool has a boolean open-world hint. Only the five named tools that exist have a true value.
- Typecheck, unit tests and both required browser checks pass with the existing limits.

## Limits

- `kingdown_block` does not exist on this branch. Ticket 18-b adds it and must set its open-world hint true. This step does not build 18-b.
- Tickets 18-a, 18-d and 18-e are outside this step.

## Choices

- Remove the raw scope row, as the approved B4 rules permit. Keep the existing page layout and sign-in controls.

## Results

- B4 uses the exact approved heading, six list items and chat/email sentence. It removes the token text and scope row. The account details, provider buttons and D8 password form stay in place.
- 18-c adds an open-world value to the existing tool registration helper. Find, say, invite, join and handle set it true. The other 20 tools set it false. The unit test and protocol check cover all 25 tools. Checklist rows 28, 30 and 44 include the changes and the A6 result.
- `npx tsc --noEmit` passes. The commit hook's typecheck and staged gate also pass.
- Full `npm test`, with the specified test database: 2,554 passed, 8 skipped, 2 failed in 167 files. The two changed test files pass in that run. The later document tests do not run because the unit stage fails.
- Both changed files also pass on their own through `npm test` and `KINGDOWN_TEST_FILE`: 6 consent tests and 12 server tests. Each command also passes all 50 document tests. Both exit with code 0.
- The failures are in unchanged files. `tools/plugin-board.test.ts:245` reports targets below 48 px for eight card buttons and Abort at 320 × 568. `src/online/accounts.db.test.ts:266` expects report deletion to be refused. The current runtime SQL grants that operation for 12-month cleanup, with a row policy. These tests and their code have no diff from the code base `dbf79f54`. This step does not change either path.
- On the M1 at `a227601d`, `plugin-ui` passes (218.6 seconds), `plugin-oauth` passes (3.8 seconds), and the protocol check passes. The consent browser assertions check every approved line and the account details after the D8 mock password path. No real account signs in.
- The first `plugin-ui-http` run fails (152.4 seconds): the Join button stays hidden after a remount (`tools/plugin-ui-check.mjs:905`). The same check on the code base `dbf79f54` fails at the same line (162.6 seconds). No check limit changes. The comparison uses the lane's M1 folder and the shared browser lock.
- The final code repeat also fails at line 905 (160.1 seconds). The comparison restores `a227601d`, leaves the M1 lane clean, and releases its browser lock. All check jobs end. The two unit failures and this base HTTP failure need triage; the requested code and its focused checks are complete.

## Evidence

- Local: `/tmp/kd-r9-server-typecheck.log`, `/tmp/kd-r9-server-tests.log` and their `.exit` files.
- Focused tests: `/tmp/kd-r9-server-consent-test.log`, `/tmp/kd-r9-server-server-test.log` and `/tmp/kd-r9-server-targeted.exit` (`0 0`).
- M1: `/tmp/kd-r9-server-plugin-ui.log`, `/tmp/kd-r9-server-plugin-ui-http.log`, `/tmp/kd-r9-server-plugin-oauth.log`, `/tmp/kd-r9-server-protocol.log`, `/tmp/kd-r9-server-http-base.log` and `/tmp/kd-r9-server-http-repeat.log`. Each browser summary names its full check log.
