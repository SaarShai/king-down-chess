# Check the release path before the first full run

Status: claimed

Run each site check in the worktree that supplies the build. Check its commit
and packages before the browser starts. Record the reviewed head and require a
reconcile note if the reviewed head differs or main moves.

Use one PR workflow rule for release CI and merge. Refuse a PR from a different
repository. Stop the deploy before the build if the fresh main commit differs
from the release commit.

Record the release PID and report if it is active when the lock is held. Mark
bypassed stages as skipped. Warn when a stale main checkout can cause extra
package installs. Give passing plugin fixtures time for slow responses. Stub
free disk space in the animation rollback test.

## Evidence

Use dry runs for release order and worktree selection, and local fixtures for
the merge and deploy gates. The first authorized release supplies the real
staging, merge and live receipts.
