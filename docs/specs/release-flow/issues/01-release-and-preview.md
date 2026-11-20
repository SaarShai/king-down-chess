# Release and preview commands

Status: claimed

Run all release stages from one command. Record each result and allow a restart
at a named stage. Add a separate preview mode and two signed-out browser checks.
Keep deploy, merge and publish operations under the lead's control.

The release and preview command lines, their evidence files, and the browser
check results are the test interfaces.

## Implementation

- Two registered checks share a driver that loads the play text catalog. The
  site check uses a phone and a desktop. The history check uses Chromium and WebKit.
- The release command records nine gates and the exit code. A dry run prints
  all outward commands. A failed stage can resume from the same PR and head.
- Preview uses the staging profile and guard. It assigns only the preview
  alias. The preview API refuses the host, so the check covers signed-out and
  local play flows.
- The staging root matches the built `next.html` when the solo-launch marker
  is present. The former `index.html` comparison fails on that build.

## Evidence

- Dry-run tests cover order, failure, restart, tweak mode, preview isolation and
  the single main CI retry.
- The review of `c738bd889` passes with notes. Repair tests cover the one-time
  staging CI check, restart rules, log entries, published commit and preview test pages.
- The read-only alias proof for `7489e25cd` matches `/`, `/play/` and `/sw.js`.
- The lead opens the PR after the CI lane lands. Independent review and the
  first real run remain operator steps.
