import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it.each(['index.html', 'src/plugin/index.html'])('%s states the Undo turn limit', path => {
  const html = readFileSync(path, 'utf8');
  const title = /<button id="undo"[^>]*title="([^"]+)"/.exec(html)?.[1];
  expect(title).toBe('Undo a move in this turn (Z)');
});
