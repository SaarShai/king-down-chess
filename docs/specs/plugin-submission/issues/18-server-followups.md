# 18 · Server follow-ups, lane server-2

Status: in-progress

## Scope

Build ticket 14 B4 and ticket 18-c on `claude/r9-server`.
The owner approves this scope and the exact B4 words on 2026-10-16.
The source tickets are in the owner's scratch ticket folder.

## Plan

1. Use the approved consent heading and six permission lines. Remove the token text and raw scope row. Keep the providers, account details and D8 password form.
2. Let each tool set `openWorldHint`. Set it true on accept, create, find, say, invite, join and handle. Set it false on all other tools. Update the protocol check and checklist rows 28, 30 and 44, with the A6 result.
3. Add consent and tool-hint tests. Run `npx tsc --noEmit` and `npm test` with the specified local test database. Run `plugin-ui`, `plugin-ui-http` and the consent check on the M1, with the shared browser lock.
4. Check the diff and commit with both required trailers. Record results here.

## Verification criteria

- The consent page uses the owner's exact words. It shows no raw scope code or token text.
- The D8 form stays closed at first. Its mock password failure and success paths pass.
- Every tool has a boolean open-world hint. The seven named tools have a true value, including create because its random path can join another player's game.
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

## Review fix plan

1. Check A1–A5 and B1 against the source and the approved choices. Ask the owner to replace the exact closing consent sentence. Keep the heading and six permission lines.
2. Restore the approved privacy link. Replace the old consent quote in the privacy evidence. Base case N2 on input schemas. Set the hints on accept and create to true: both can join another player's random game, under the owner's rule, "True on tools that reach others".
3. Add tests for each confirmed fault. Check the OAuth issue and refresh claims in the local test database. Keep all test limits.
4. Run `npm test` here with the specified test database. Run `plugin-ui`, `plugin-ui-http`, `plugin-oauth` and the protocol check on the M1 in this lane, with the browser lock. Record each result, check the diff and commit with both trailers.

### Review verification criteria

- The consent text states the true chat and email limits, with the owner's approval. The privacy link opens a new tab and keeps the consent page open.
- Tests check the email and provider metadata that the token hook keeps for the client on issue and refresh.
- The privacy evidence cites tool inputs. N2 does not use open-world hints to claim that tools can open other sites.
- All 25 tools have a boolean open-world hint. The seven true values include accept and create.
- Each changed test passes. Full tests and required M1 checks have recorded results. Any old failure has evidence from the base.

### Finding checks

- A1 and B1: confirmed. The access token hook keeps the email claim and provider metadata. The consent sentence also names the wrong reader of the chat. The owner must choose the new exact closing words. [Supabase's token hook contract](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) requires the email claim; [its OAuth flow](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows) gives the tokens to the client. The new database test checks the claims on issue and refresh for Google and GitHub metadata. It uses test data and does not sign in.
- A2: confirmed. The option file includes the privacy link in all three footers. The owner removes only the stop line. The source restores the link before the buttons, with a new tab and `noopener`. Unit and mock browser assertions check it.
- A3: confirmed. The privacy evidence quotes words that the page no longer has. It now cites the strict tool input schemas, which have no chat transcript. A document test checks this evidence.
- A4: confirmed. N2 uses a false all-tools hint claim. It now cites the tool input schemas for the other-site refusal. A document test checks that basis.
- A5: confirmed. Accept joins another player's game. Create can call the same find path as Find when kind is random. Both hints now use true under the owner's rule. The tool unit test and protocol check cover all seven true values and all 18 false values. Checklist rows 28 and 30 give the reason.

### Review check results

- Code commit: `9cdb1e2c`. Typecheck and both commit gates pass. The consent closing sentence still needs the owner's new choice; row 44 records this limit.
- Full local `npm test`, with the specified test database: 2,558 passed, 8 skipped, 2 failed in 167 files (130.76 seconds). All changed test files pass. The unit stage failure stops the later document stage.
- The accounts failure is the same report-delete expectation at `src/online/accounts.db.test.ts:266` as before. The other failure is `tools/plugin-app.test.ts:32`: after remount, `body[data-page]` is null when the test expects home. Both files, the app code and the browser check have no diff from `dbf79f54`. A focused repeat includes the changed tests and this app test. No test limit changes.
- Local logs: `/tmp/kd-r9-review-tests.log` and `.exit`; the focused repeat uses `/tmp/kd-r9-review-focused.log` and `.exit`.
- M1 identity and local test database checks pass. The lane is clean at the code commit. Its detached job waits for the shared browser lock. It will run `plugin-ui`, `plugin-ui-http`, `plugin-oauth` and the protocol check, then release the lock. Logs use `/tmp/kd-r9-review-<check>.log` and `.exit`; the job log is `/tmp/kd-r9-review-browser.log`.

## Parts 18-a and 18-b: plan

1. Replace `show_online` with `online_visible_to`: everyone, mutual and nobody. Use three Settings choices. Change both Settings menu rows (A-F4), privacy text and review notes.
2. Add `kingdown_block` through the account service. Read the current block, block and unblock by a shared game. Add a confirmed action and an undo path to the game Menu. Use the existing Find, join and message rules.
3. Test all three online values through MCP and the database. Test block, unblock, input checks, Find, joins and hidden messages. Check the controls in both M1 browser checks.
4. Run `npx tsc --noEmit` and `npm test` with the local test database. Keep all limits. Check the diff and commit each part with both trailers. Record each result here.

### Acceptance checks

- The default shows Friends only. Each choice persists and controls who gets the activity time. Each target is at least 44 px high.
- Block and unblock use the same account relations as the website. Each tool hint is explicit. A block prevents matches through Find and joins to open games, and hides messages. The Menu shows the saved block after a reload.
- Each new test passes. Record all required check results and any old failure with its evidence.

### Scope for this step

Parts 18-a and 18-b, with A-F4, are approved by the owner's task. Parts 18-d and 18-e stay outside this step. Part 18-c and B4 are in the earlier commits above.

### Build choices for 18-a and 18-b

- Use the existing three-choice control and the stored `online_visible_to` values. No database change is needed. Both Settings menu rows name the control.
- Put Unblock player in the same Menu and in a blocked-player list in Profile. The Profile path stays available after the game ends. Use the same control during setup and play. Confirm both actions. Keep the current game in progress, as the website's block rules do. Unblock does not restore follows.
- Read block status through the same tool with no `blocked` input. This read does not write. The Menu's other controls open at once while this read runs. A failed read has Retry on its row.
- Keep Report for later, as the owner asks. Add no new rule for the current game and no new account store.

### Check checkpoint

- Part 18-a code commit: `c9e7a8ed`. Typecheck and the commit gates pass.
- The focused local test run waits for the clone's shared test lock. The lock has another test process. This step does not bypass the lock or stop that process.
- The M1 identity matches the project record. Browser checks will use this lane's folder and the shared browser lock.

### First full test result

- Full `npm test` at `4b968359`: 2,556 pass, 8 skip and 7 fail in 167 files (147.84 seconds). Both new block tests and the three-state online test pass.
- Five failures need changes in this step: two old toggle-count checks still expect three checkboxes; the tool count still expects 25; the owner-answer document test still expects the old ticket words; and the Find test leaves an open table that a later expiry test joins. Update the counts and text checks. Abort the Find test's table after its assertion.
- The other two failures match the earlier ticket: the card and Abort target sizes, and the report-delete permission test. Neither path changes in this step. Keep the limits and record the repeat result.
