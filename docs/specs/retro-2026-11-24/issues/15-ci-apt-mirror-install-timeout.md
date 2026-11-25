# Keep the browser install step off the slow regional APT mirror

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

On 2026-11-18 the WebKit jobs stopped in the install step. The step then had the name `Run sudo sed -i '/azure\.archive\.ubuntu\.com/d' /etc/apt/apt-mirrors.txt`. It downloaded the WebKit packages for `npx playwright install --with-deps webkit` from `http://us-east-2.ec2.archive.ubuntu.com/ubuntu` at about 13.5 MB in 5 s or more for each package, and passed its 10 minute limit.

Failing line (exact):

```
##[error]The action 'Run sudo sed -i '/azure\.archive\.ubuntu\.com/d' /etc/apt/apt-mirrors.txt' has timed out after 10 minutes.
```

Runs (attempt 1 red, attempt 2 green unless noted):
- 44269579913 browser-webkit-board (drafts)
- 44257071745 browser-webkit-board (drafts)
- 44252613742 browser-webkit-board (drafts) and browser-webkit
- 44243336087 browser-webkit and browser-webkit-board (drafts)
- 44278837637 browser-webkit-board (drafts); attempt 2 cancelled, not proven

The step now is .github/workflows/plugin-checks.yml:160-165 (and :95-99): it writes `archive.ubuntu.com` and `security.ubuntu.com` as the only mirrors, sets a 30 s APT timeout with 2 retries, and keeps the 10 minute limit.

## Change

No code change is necessary now. Cheapest guard if the fault comes back: cache the APT packages of `--with-deps` (the step caches only `~/.cache/ms-playwright`), or a lint line in tools/workflow.lint.test.ts that each `playwright install --with-deps` step writes the mirror list first. Both files are in the file list of lane seam-ci this week.

## Proof

The red came from download speed of one mirror, not from the code. A forced order: in a scratch workflow on a branch, set the mirror list to one slow host (or `Acquire::http::Dl-Limit "200";`) with `timeout-minutes: 2`. Red with `has timed out after 2 minutes`. With the current mirror list and no limit: green.

## Known limits

The current mirror list depends on `archive.ubuntu.com`. A slow day there gives the same red with a new step name.

## Work record

Repaired in the workflow after 2026-11-18 (the step text is now different). No failure of this step after 2026-11-18 09:45 UTC in the runs up to 2026-11-25.
