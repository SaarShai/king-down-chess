import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('downloads Node 24 with the published checksum before it starts a Kaggle simulation', () => {
  const source = readFileSync(new URL('./kaggle-tournament.mjs', import.meta.url), 'utf8');
  expect(source).toContain("base = 'https://nodejs.org/dist/latest-v24.x/'");
  expect(source).toContain("base + 'SHASUMS256.txt'");
  expect(source).toContain('if hashlib.sha256(data).hexdigest() != digest:');
  expect(source.indexOf('if hashlib.sha256(data).hexdigest() != digest:')).toBeLessThan(source.indexOf("sh('mkdir -p /tmp/node"));
});
