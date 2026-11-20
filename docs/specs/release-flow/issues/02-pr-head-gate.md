# Accept green PR checks in the release command

Status: claimed

PR 405 has a green pull-request run. The release waits for a push or dispatch
run on that head. It also waits before it detects that main has moved.

- Use the merge helper's check rule for PR CI and for staging of that head.
- Before the first stage, require a reconcile note if main has moved past
  the PR's merge base and this run still includes the merge.
- Record `CI skipped` when a forced restart skips PR CI.

## Acceptance checks

- Replay the PR 405 API responses. PR CI passes and exact-commit CI remains pending.
- Check that the reconcile note check runs before CI and refuses a moved base.
- Check that the release record shows `CI skipped` after a forced restart.
