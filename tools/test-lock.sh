#!/bin/bash
# test-lock: one local heavy command per user, plus one test run per clone.
# Separate repository copies share the machine lease. CI keeps only the clone test lock.
# Bash 3.2 and BSD tools.
#
#   tools/test-lock.sh <command> [args]     (package.json "test" wraps "test:unlocked" with it)
#   tools/test-lock.sh --machine <command> [args]   (browser checks and deploy)
#
# The lock is a file in the git common dir, so every worktree of the clone shares it: a session's
# worktree and the deploy worktree. Local commands first take $HOME/.cache/kingdown/machine.lock.
# Perl takes flock(2) on each file and then becomes
# the command, with the file still open: the command and each process it starts hold the lock until
# the last of them ends, so a run that loses its parent cannot overlap the next run. A process that a
# run leaves behind (a stray server) holds it too. A local machine lease requires Perl. The clone
# lock keeps its fallback outside git or without Perl. A run prints one line for each lock it waits
# for. KINGDOWN_TEST_LOCK_WAIT is the limit in seconds for each wait (default 7200); timeout exits 75.
# Child commands reuse KINGDOWN_MACHINE_LEASED and KINGDOWN_TEST_LOCKED, so they cannot wait on
# themselves. Only test mode sets KINGDOWN_TEST_LOCKED for the vitest guard.
test_lock=''
if [ "${1:-}" = --machine ]; then
  shift
else
  if [ -z "${KINGDOWN_TEST_LOCKED:-}" ]; then
    dir=$(git rev-parse --git-common-dir 2>/dev/null) && test_lock="$dir/kingdown-test.lock"
  fi
  export KINGDOWN_TEST_LOCKED=1
fi
machine_lock=''
if [ -z "${CI:-}" ] && [ -z "${KINGDOWN_MACHINE_LEASED:-}" ]; then
  command -v perl >/dev/null || { echo 'test-lock: Perl is required for the machine lease' >&2; exit 2; }
  mkdir -p "${HOME:?}/.cache/kingdown" || exit 2
  machine_lock="$HOME/.cache/kingdown/machine.lock"
fi
[ -n "$machine_lock$test_lock" ] || exec "$@"
command -v perl >/dev/null || exec "$@"
exec perl -MFcntl=:flock -MTime::HiRes=time,sleep -e '
  my ($machine, $test, $wait) = (shift, shift, shift);
  $^F = 255; # keep the lock file open across exec
  my @files;
  for my $entry ([$machine, "machine lease"], [$test, "test lock"]) {
    my ($lock, $name) = @$entry;
    next unless length $lock;
    open(my $f, ">>", $lock) or die "test-lock: cannot open $lock: $!\n";
    unless (flock($f, LOCK_EX | LOCK_NB)) {
      print STDERR "test-lock: waiting for the $name ($lock)\n";
      my $end = time + $wait;
      until (flock($f, LOCK_EX | LOCK_NB)) { exit 75 if time >= $end; sleep 1; }
    }
    push @files, $f;
  }
  $ENV{KINGDOWN_MACHINE_LEASED} = 1 if length $machine;
  exec { $ARGV[0] } @ARGV or die "test-lock: cannot run $ARGV[0]: $!\n";
' "$machine_lock" "$test_lock" "${KINGDOWN_TEST_LOCK_WAIT:-7200}" "$@"
