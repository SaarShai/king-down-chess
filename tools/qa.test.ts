import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';

// Run the QA report code with fixed case results. This needs no browser.
const qa = readFileSync(new URL('./qa.mjs', import.meta.url), 'utf8');
const report = qa.slice(qa.indexOf('const results = [];'), qa.indexOf('const CODE ='));
const finish = qa.split('await browser.close();')[1];

it.each([true, false])('fails the QA run when a case fails: pass=%s', ok => {
  const log = vi.fn(), exit = vi.fn();
  runInNewContext(`${report}\npass('one', true, 'first');\npass('two', ${ok}, 'second');\n${finish}`, { console: { log }, process: { exit } });
  expect(exit).toHaveBeenCalledWith(ok ? 0 : 1);
  expect(log.mock.calls.map(([line]) => line)).toEqual([
    'PASS one — first', `${ok ? 'PASS' : 'FAIL'} two — second`,
    `\nPASS one\n${ok ? 'PASS' : 'FAIL'} two`, `qa: ${ok ? 2 : 1} PASS, ${ok ? 0 : 1} FAIL`,
  ]);
});
