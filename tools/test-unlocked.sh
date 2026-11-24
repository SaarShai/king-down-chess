#!/bin/bash
# test-unlocked: the steps of `npm test`, with no npm process between them and tools/test-lock.sh.
# Perl in test-lock.sh becomes this shell with the lock files open, and each step inherits them. npm
# (a Node process) would close them, so a kill above the active step would free the locks.
# `npm run test:changed` (tools/ci-plan.mjs tests) runs `npm test` with KINGDOWN_TEST_FILE set to the files a change can break.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$root"
PATH="$root/node_modules/.bin:$PATH"
# The package.json "typecheck" commands, one per line; tools/machine-lease.test.ts checks that they match.
if [ "${KINGDOWN_TEST_NO_TYPECHECK:-}" != 1 ]; then
tsc --noEmit
tsc --noEmit -p tsconfig.tools.json
fi
node_tests=()
while IFS= read -r file; do
  node_tests+=("$file")
done < <(node --input-type=module <<'NODE'
import { globSync } from 'node:fs';
const pattern = process.env.KINGDOWN_TEST_FILE || '{docs/2d-first-pieces,src/render/painted}/**/*.test.mjs';
for (const file of globSync(pattern)) if (file.endsWith('.test.mjs')) console.log(file);
NODE
)
if [ -n "${KINGDOWN_TEST_FILE:-}" ] && [ "${#node_tests[@]}" -gt 0 ]; then set -- --passWithNoTests "$@"; fi
vitest run "$@"
if [ "${#node_tests[@]}" -gt 0 ]; then KINGDOWN_TEST_FILE= node --test "${node_tests[@]}"; fi
