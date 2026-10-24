# Wait for the saved draft to clear after End turn

Status: resolved

## Scope

The owner asks for the cause and fix of the W7-04 D10 WebKit CI failure.
Keep all assertions. Commit on `staging/w704-flake`. Do not push.

## Plan

1. Read the failed and passed CI logs. Trace the draft writes and clears.
2. Reproduce the failure with a controlled event order. Check the product state and the host state.
3. Fix the cause. Keep the test checks and use a state wait if the test reads too soon.
4. Run the required checks. Record the results and commit the change.

## Checks

- The reproduction fails at the stored draft assertion before the fix.
- The same event order passes after the fix.
- W7-04 passes 10 runs in WebKit and 3 runs in Chromium.
- The full draft test file passes once in each browser.
- `npx tsc --noEmit -p .` passes.
- All tests use `npm test` and the shared test lock.
- Write the full report to `w704.md` in the review folder under `/private/tmp/claude-501/ci87/`.

## Evidence

The three failed CI jobs stop at `tools/plugin-board-drafts.test.ts:85:36`.
The check reads `harnessWidgetState.privateContent.draft` on the host page.
The received value holds `e2-e4` and the old FEN at revision 2.
The earlier server revision, FEN, draw offer and history checks pass.

## Cause

The test waits for `client.state.pending` to clear in the iframe. It then
reads the draft stored on the host page once. The iframe sends widget state
to the host through `postMessage`. The host can still hold the old draft
when that read runs. The command wait does not wait for host storage.

The product clears the draft before it clears the pending command:

1. `src/account-game/runtime.ts` shows the move reply before it clears `pending`.
2. `src/plugin/screens/board.ts` checks the draft against the new view.
3. `draftLans` in `board-model.ts` rejects the old base FEN. `dropDraft` clears it and saves the state.
4. `client.save` calls `setWidgetState`. The frame shim sends the state by `postMessage`.
5. `tools/plugin-ui-host.ts` receives the message and updates `harnessWidgetState`.

The failed assertion reads step 5, but the old wait proves only the iframe state.
No product fix is needed. Preview replies also check the generation, account,
game and revision before they can save a draft.

## Proof

Read all five supplied CI job logs with `gh api`.

| Job | D10 | File result | Failed assertion |
| --- | --- | --- | --- |
| 120836667243 | Fail | 62 pass, 1 fail | Line 85, log line 1665 |
| 120833378951 | Fail | 62 pass, 1 fail | Line 85, log line 1666 |
| 120863758079 | Fail | 62 pass, 1 fail | Line 85, log line 1665 |
| 120834875098 | Pass | 63 pass | None |
| 120828457283 | Pass | 63 pass | None |

A temporary probe holds host state messages after the second End turn press.
The first stored-draft read returns the old value, then releases the messages
in their original order. There is no time delay in this probe.

Both failed local runs show this state before the assertion:

```text
iframe: pending = null, draft = null, inflight = 0
host: draft.lans = ['e2-e4']
held messages: draft present, pending move
               draft present, pending move
               draft null, pending move
               draft null, pending move
               draft null, pending null
```

The old check fails twice with the CI error: `expected { game_tag: ..., ... } to be null`.
The fixed check passes twice with the same probe. This proves a read before
host receipt, with no draft written again after the clear in this event sequence.
The probe is removed before the required checks. Its patches and logs stay
in the output folder named in Checks above.

## Change

At the stored-draft assertion, use `await expect.poll(() => savedDraft(page)).toBeNull()`.
Keep the command wait and all turn, draw, note, history and call checks.
Add one comment at that assertion to explain the host message boundary.
Use the existing poll limit. Add no sleep, test retry, dependency or product change.

## Check results

All tests use this database:
`postgresql://kingdown_test@127.0.0.1:55432/kingdown_firstgame_test`.
The shared test lock stays in use. No lock is removed.

| Check | Runs | Result per run |
| --- | --- | --- |
| Original D10, WebKit | 1 | 1 pass, 62 skip |
| Original D10 with held host messages, WebKit | 2 | 1 expected fail, 62 skip |
| Fixed D10 with held host messages, WebKit | 2 | 1 pass, 62 skip |
| `W7-04`, WebKit | 10 | 7 pass, 56 skip |
| `W7-04`, Chromium, `PLAYABLE_BROWSER` unset | 3 | 7 pass, 56 skip |
| Full draft file, WebKit | 1 | 63 pass |
| Full draft file, Chromium, `PLAYABLE_BROWSER` unset | 1 | 63 pass |
| `npx tsc --noEmit -p .` | 1 | Exit 0 |

Each successful `npm test` run also passes the 55 piece tests that the command
always runs. Each `npm test` run passes its initial type check.
The required browser checks use `KINGDOWN_TEST_FILE=tools/plugin-board-drafts.test.ts`.
The repeated checks use `KINGDOWN_TEST_NAME=W7-04`; the full-file checks leave it unset.

## Review and limits

The change uses the existing state wait at the point that reads host storage.
It changes no shared helper and keeps every expected value. This is the smallest
complete fix for the proved event order.

No Linux CI rerun or full repository test suite is run. The local checks use
macOS WebKit and Chromium. No push, merge or deploy is made.
