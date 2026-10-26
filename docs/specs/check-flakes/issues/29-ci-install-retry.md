# 29 Limit browser install time and retry package downloads

Status: done (local checks pass; CI is not run)
Branch: staging/ci-install-retry
Base: origin/staging/first-game, fce8c6bc

## Fault and evidence

On 2026-10-26, four WebKit jobs reach the 45-minute job limit during
`npx playwright install --with-deps webkit`. The tests do not start.
Downloads from `azure.archive.ubuntu.com` take 1 to 3 minutes per package.
The owner reports that a new run passes.

The read-only job logs show the install start and cancellation:

| Job | Install start (UTC) | Cancellation (UTC) |
| --- | --- | --- |
| [121458454260](https://api.github.com/repos/SaarShai/king-down-chess/actions/jobs/121458454260/logs) | 07:59:17 | 08:44:09 |
| [121465139395](https://api.github.com/repos/SaarShai/king-down-chess/actions/jobs/121465139395/logs) | 09:00:05 | 09:44:52 |
| [121465651443](https://api.github.com/repos/SaarShai/king-down-chess/actions/jobs/121465651443/logs) | 09:17:54 | 10:02:41 |
| [121480851238](https://api.github.com/repos/SaarShai/king-down-chess/actions/jobs/121480851238/logs) | 09:38:56 | 10:23:42 |

## Plan and pass criteria

1. Set short APT timeouts and two download retries in all eight browser install
   steps. Give each step a 10-minute limit. Keep job limits and test steps.
2. Extend `tools/workflow.lint.test.ts` to check every workflow install step.
   Keep the WebKit sampler order and the time for log uploads.
3. Run the docs check, the workflow test and a YAML parse, one at a time.
   Check the diff and make one commit. Do not push, merge or deploy.

## Fix

Each install step sets the HTTP and HTTPS connection and data timeouts to 30 s.
APT retries each failed download twice. The step fails after 10 minutes if the
install does not end. The settings apply to the APT child process that Playwright
starts with `sudo`. No full-install retry loop is needed.
See the [APT options](https://manpages.debian.org/stable/apt/apt.conf.5.en.html)
and [HTTP timeout](https://manpages.debian.org/stable/apt/apt-transport-http.1.en.html).

## Checks

- `npm run test:docs`: 15 files and 178 tests pass.
- `KINGDOWN_TEST_FILE=tools/workflow.lint.test.ts npm test`: the type check and
  all 23 workflow tests pass. The test command also runs 67 artwork tests; all
  pass. This is a selected test file, not the full suite.
- `node -e`: the YAML parse passes with the YAML parser in Playwright.
  A parsed comparison with `origin/staging/first-game` confirms that only the
  browser install steps change. Job limits, test steps, matrix entries and
  check names stay the same.
- Diff review: APT handles each failed download. The outer step limit also
  stops a slow transfer that does not reach the APT timeout.
- CI is not started or run again. No push, merge or deploy is made.
