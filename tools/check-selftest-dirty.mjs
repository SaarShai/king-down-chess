// Planned faults for the browser-check runner's self-test (checks-and-hooks/06). Run them by name only:
//   npm run check:browser selftest-dirty   writes a scratch file into the checkout; the run must fail and name it.
//                                           The file stays, so that you can see it; delete it after the test.
//   npm run check:browser selftest-fail    prints a fault line and exits 1; the run must fail and show the line.
//   npm run check:browser selftest-hang    starts a child process and the browser, and never ends; the runner must
//                                           stop all of them at the time limit. The child's process id is in
//                                           hang.pid in PLAYABLE_OUT.
//   npm run check:browser selftest-hold    prints the time, sleeps 15 s and prints the time again; start it in two
//                                           worktrees at once to see two runs share the machine (after-redesign/01).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, launch } from './lib/checks.mjs';

const mode = process.argv[2] ?? 'dirty';
if (mode === 'dirty') {
  const scratch = join(dirname(fileURLToPath(import.meta.url)), '..', 'check-selftest-dirty.scratch');
  writeFileSync(scratch, `Written by tools/check-selftest-dirty.mjs at ${new Date().toISOString()}. Delete this file.\n`);
  console.log(`wrote ${scratch}`);
} else if (mode === 'fail') {
  console.log('selftest-fail: a log line before the fault');
  console.error('Error: selftest-fail: the planned fault');
  process.exit(1);
} else if (mode === 'hang') {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  mkdirSync(env('PLAYABLE_OUT'), { recursive: true });
  writeFileSync(join(env('PLAYABLE_OUT'), 'hang.pid'), `${child.pid}\n`);
  await launch();
  console.log(`selftest-hang: child ${child.pid} and the browser started; waiting for the runner to stop them`);
  setInterval(() => {}, 1000);
} else if (mode === 'hold') {
  console.log(`selftest-hold: start ${new Date().toISOString()}`);
  await new Promise(resolve => setTimeout(resolve, 15000));
  console.log(`selftest-hold: end ${new Date().toISOString()}`);
} else {
  console.error(`check-selftest-dirty: unknown mode ${mode}; known: dirty, fail, hang, hold`);
  process.exit(2);
}
