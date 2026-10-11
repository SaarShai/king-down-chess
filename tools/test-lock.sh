#!/bin/bash
# test-lock: run a command while it holds the one test lock of this clone (docs/lessons/agents-and-tools.md:
# two `npm test` runs at once slow each other past the 5 s test limits). Bash 3.2 and BSD tools.
#
#   tools/test-lock.sh <command> [args]     (package.json "test" wraps "test:unlocked" with it)
#
# The lock is a file in the git common dir, so every worktree of the clone shares it: a session's
# worktree, the push-main worktree and the deploy worktree. Perl takes flock(2) on it and then becomes
# the command, with the file still open: the command and each process it starts hold the lock until
# the last of them ends, so a run that loses its parent cannot overlap the next run. A process that a
# run leaves behind (a stray server) holds it too. With no perl, or outside git, the command runs with
# no lock. A run that waits prints one line. KINGDOWN_TEST_LOCK_WAIT: the most seconds to wait (default
# 7200); then it exits 75. A command that already holds the lock (KINGDOWN_TEST_LOCKED) runs at once, so
# a nested run cannot wait on itself.
[ -n "${KINGDOWN_TEST_LOCKED:-}" ] && exec "$@"
dir=$(git rev-parse --git-common-dir 2>/dev/null) || exec "$@"
command -v perl >/dev/null || exec "$@"
export KINGDOWN_TEST_LOCKED=1
exec perl -MFcntl=:flock -MTime::HiRes=time,sleep -e '
  my ($lock, $wait) = (shift, shift);
  $^F = 255; # keep the lock file open across exec
  open(my $f, ">>", $lock) or die "test-lock: cannot open $lock: $!\n";
  unless (flock($f, LOCK_EX | LOCK_NB)) {
    print STDERR "test-lock: waiting for the test lock ($lock)\n";
    my $end = time + $wait;
    until (flock($f, LOCK_EX | LOCK_NB)) { exit 75 if time >= $end; sleep 1; }
  }
  exec { $ARGV[0] } @ARGV or die "test-lock: cannot run $ARGV[0]: $!\n";
' "$dir/kingdown-test.lock" "${KINGDOWN_TEST_LOCK_WAIT:-7200}" "$@"
