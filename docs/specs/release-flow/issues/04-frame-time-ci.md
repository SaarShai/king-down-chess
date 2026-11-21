# Run frame-time checks before merge

Status: claimed

Run the local frame-time checks on the PR head in the clean live worktree while
GitHub runs PR CI. Wait for both jobs before the release moves to the next stage.
Keep their pass in the release evidence. Use it at publish only when the Git
tree matches. Run the checks at publish when there is no valid match.

## Evidence

Check the release plan in both dry-run modes. Test the CI join, worktree guard
and pass record with local fixtures. Test deploy reuse in check-only mode.
