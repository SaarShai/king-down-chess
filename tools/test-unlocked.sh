#!/bin/bash
# test-unlocked: the steps of `npm test`, with no npm process between them and tools/test-lock.sh.
# Perl in test-lock.sh becomes this shell with the lock files open, and each step inherits them. npm
# (a Node process) would close them, so a kill above the active step would free the locks.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$root"
PATH="$root/node_modules/.bin:$PATH"
# The package.json "typecheck" commands, one per line; tools/machine-lease.test.ts checks that they match.
tsc --noEmit
tsc --noEmit -p tsconfig.tools.json
vitest run
node --test "docs/2d-first-pieces/**/*.test.mjs"
