# 29 Keep browser installs off the slow package mirror

Status: done (local checks pass; PR CI still needs a run after the push)
Branch: staging/ci-install-retry
Base: 5b125424

## Fault and evidence

[Run 40309040858](https://github.com/SaarShai/king-down-chess/actions/runs/40309040858)
fails in `verify` and `browser-web`. The full logs show that APT finishes the
package-list update in about four seconds. It then downloads 24.9 MB of Ubuntu
packages from `azure.archive.ubuntu.com` at about 40 kB/s. For example, the
5,656 kB font takes about 138 s. Both jobs reach the 10-minute install limit.
There is no lock or signature error. The Microsoft list is not the last output.
The `arm64` line names a Microsoft package index, not the runner CPU.
The workflow label is `ubuntu-latest`; the log names Ubuntu 26.04.1 and
`amd64v3` Ubuntu package indexes.

[Run 40307940113](https://github.com/SaarShai/king-down-chess/actions/runs/40307940113)
now has a successful attempt. Its WebKit UI job downloads 140 MB from Azure in
four seconds. The source fault is intermittent.

The 30 s APT timeout measures a connection or data wait. It does not stop a
transfer that keeps sending data slowly. The first fix does not address this.

## Plan and pass criteria

1. Check the source list in the exact runner image. Remove the slow Azure
   mirror from all eight install steps. Keep the standard Ubuntu sources.
2. Make the workflow test check all eight install steps, their order and limits.
   Keep job limits, test steps, database services, matrix entries and check names.
3. Run the selected workflow tests, docs tests and a YAML parse. Compare the
   parsed workflow with HEAD and the local main ref. Review the diff and make
   one commit with the hooks unchanged. Do not push, rebase, merge or deploy.

## Choice

Use option 2 for the source that the full logs identify: the Azure Ubuntu
mirror. The exact [runner image script](https://github.com/actions/runner-images/blob/ubuntu26/20261012.163/images/ubuntu/scripts/build/configure-apt-sources.sh)
puts Azure first in `/etc/apt/apt-mirrors.txt`. The next sources are
`https://archive.ubuntu.com/ubuntu/` and `https://security.ubuntu.com/ubuntu/`.
Remove only the Azure line before Playwright starts. Keep the 30 s APT timeouts,
two download retries and 10-minute step limit. Do not remove the Microsoft repo;
the logs show that its update completes.

Option 1 adds process control and package-state repair to retry the same slow
source. It does not fix the low transfer rate. A timeout outside `sudo` also
needs care: sudo can use a new session with a pseudo-terminal, and the caller
cannot kill root-owned APT children. No new retry process is needed with option 2.
Option 3 adds a cache or container and more upkeep. The source-list change is
smaller and keeps the current database service and browser setup.

## Checks

- Regression check: before the workflow edit, the new mirror check fails.
  The other 22 workflow tests pass.
- `KINGDOWN_TEST_FILE=tools/workflow.lint.test.ts npm test`: type checks,
  23 workflow tests and 67 artwork tests pass. This is a selected test file;
  the full suite is not run.
- `npm run test:docs`: 15 files and 178 tests pass.
- YAML parse: passes. After removal of the eight new commands, the parsed
  workflow equals `5b125424`. Outside install steps, it equals the staging base.
  Job limits, test steps, database services, matrix entries and check names stay.
  The local main ref has one older job; staging has eight jobs before this fix.
- `bash -n`: all eight install blocks pass. No new script or retry loop is added,
  so a fake slow-command test does not apply. A local source-list dry run removes
  only Azure, keeps both Ubuntu sources and priorities, and passes a second run
  with no change.
- Diff review: one source-removal command per install step fixes the source
  shown in the logs. No new dependency or process-control code is needed.
- PR CI is not run here. It must confirm that the other Ubuntu sources are fast.
  A different source fault can still reach the 10-minute step limit.
- No push, rebase, merge or deploy is made. The commit hooks run unchanged.
