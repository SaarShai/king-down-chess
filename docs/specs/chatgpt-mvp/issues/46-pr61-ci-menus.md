# PR 61: seat activity poll check

Status: done

Scope: the seat activity check in `tools/plugin-menus.test.ts`.
Base: `50f8da67`. Do not push.

## Plan and checks

1. Reproduce the failure with the supplied CPU slow-down at rate 4.
2. Trace the clock, poll and reply events. Fix the cause. Keep all time
   limits and the check that activity is sent at most once each 30 seconds.
3. Pass the menus file three times at rate 4 and once at full speed.
   Use `npm test` through `tools/test-lock.sh`.
4. Check the diff, record the evidence and commit the fix.

The temporary config, CPU setup and logs stay local. No secret or
environment file is read.

## Cause and change

The host adds a call to `harnessCalls` when the request starts. The old
check treats a new Get call as a complete poll. It can advance the clock
by 15 seconds while that read is still in flight. This expires the
transport's 10-second call limit. The read fails, no second activity call
is sent, and the final count stays at 1.

The check now waits for `harnessApp.client.inflight` to reach 0 after
the first activity call and after the next Get starts. This waits for
the app to receive its replies before the next clock jump. The test
keeps each clock step, activity count, read count and time limit.
No product fault is shown. No product file changes.

## Failure evidence

The original check passes in the local baseline. A temporary probe
holds the second poll reply. The old check advances the clock while
the reply is held. It logs `Request timed out` and fails with
`expected 1 to be 2`, as in CI. The controlled reply check passes with
the new wait. The probe and its debug logs are removed from the test.

The first supplied CPU setup does not reach the test browser through
its CommonJS import. The local setup imports the same Playwright module
as the test. Its CDP records confirm rate 4 for the verification pages.
Each page gets two rate commands through the browser and context
wrappers. The records therefore have 26 entries per 13-test run.

Logs stay in `node_modules/.cache/ci61-menus/`: `baseline-focus.log`,
`held-reply-red.log`, `held-reply-green.log`, and the final run logs.

## Verification

All four final runs use `KINGDOWN_TEST_FILE=tools/plugin-menus.test.ts
npm test`. The three slow runs also set `KINGDOWN_SWEEP_CPU=4` and use
the temporary config. Each run holds the lock in `tools/test-lock.sh`.
Each run passes the type check. No test is skipped in these final runs.

| Log | CPU rate | Menus tests | Document tests | Exit |
| --- | --- | --- | --- | --- |
| `slow-1.log` | 4 | 13/13 | 51/51 | 0 |
| `slow-2.log` | 4 | 13/13 | 51/51 | 0 |
| `slow-3.log` | 4 | 13/13 | 51/51 | 0 |
| `full-speed.log` | Full speed | 13/13 | 51/51 | 0 |

The final slow run has 78 rate-4 records across all three slow runs.
The full-speed run uses the original project config, with no CPU setup.
The temporary config is removed before the commit.

`npm run test:docs` passes all 160 tests through the shared test lock.
`git diff --check` passes.

## Diff check and limits

The fix adds four lines to one test. It uses the existing app transport
counter. This is the required reply event; a host request count cannot
prove that the reply arrives. No dependency or product API is added.

The full suite, Linux and a native ChatGPT host are not checked here.
No push, merge or deploy occurs.
