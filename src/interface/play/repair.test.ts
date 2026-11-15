import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('removes styles whose old reader and settings markup no longer exists', () => {
  const css = readFileSync(new URL('./play.css', import.meta.url), 'utf8');
  expect(css).not.toMatch(/\.reader-head|\.play-settings|\.play-caption/);
});
