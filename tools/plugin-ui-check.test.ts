import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const source = readFileSync(new URL('./plugin-ui-check.mjs', import.meta.url), 'utf8');

it('sets, waits for and releases the Home hold in the check, but skips the terminal mount', () => {
  let previous = -1;
  for (const step of [
    'await page.addInitScript(() => {',
    "if (!new URLSearchParams(location.search).has('terminal')) window.holdBeforeNext = 'kingdown_settings';",
    'await page.goto(base);',
    "await page.waitForFunction(() => typeof window.releaseBefore === 'function');",
    "assert(await frame.locator('#home-play').isDisabled(),",
    'await page.evaluate(() => window.releaseBefore());',
    "await frame.locator('#home-play:not(:disabled)').waitFor();",
  ]) {
    const at = source.indexOf(step);
    expect(at, step).toBeGreaterThan(previous);
    previous = at;
  }
});

it('measures the table bar in the check without an ambiguous navigation selector', () => {
  expect(source.match(/\.locator\((['"])nav\1\)/)).toBeNull();
  expect(source.includes("const lower = await frame.locator('#table-bar').evaluate(el=>el.getBoundingClientRect().bottom);")).toBe(true);
});
