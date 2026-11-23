# Reuse release checks and run independent stages together

Type: task
Status: claimed

Reuse a passing CI run on the exact commit. Reuse local frame-time evidence for the same tree. Run staging and frame-time checks together once PR CI passes. Run the engine check while main CI runs on the merge commit. Require both before publish. Keep the review record and the release gates.

## PR 456 repair

Stop active jobs and their child processes before you remove the release lock. Stop the pending check if main CI or the engine check fails. Release tests cover frame failure, Ctrl-C, TERM, and failure of each main check.
