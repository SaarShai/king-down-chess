import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';

const css = readFileSync('src/style.css', 'utf8');
const token = (name: string) => css.match(new RegExp(`--${name}: (#[0-9a-f]{6})`))![1];
const light = (hex: string) => hex.slice(1).match(/../g)!.map(s => parseInt(s, 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
const contrast = (a: string, b: string) => (Math.max(light(a), light(b)) + .05) / (Math.min(light(a), light(b)) + .05);

it('defines the agreed focus colours once, in the shared root', () => {
  const root = css.match(/:root\s*\{([^}]+)\}/s)![1];
  expect(root).toContain('--focus: #2b2621;');
  expect(root).toContain('--focus-gold: #e9c071;');
  for (const folder of ['src', 'public']) {
    for (const file of readdirSync(folder, { recursive: true }).filter(file => String(file).endsWith('.css'))) {
      const path = `${folder}/${file}`, source = readFileSync(path, 'utf8');
      expect(source.match(/--focus(?:-gold)?\s*:/g) ?? [], path).toHaveLength(path === 'src/style.css' ? 2 : 0);
    }
  }
});

it('keeps focus contrast above the old blue on parchment and above 4.5 on dark stone', () => {
  expect(contrast(token('focus'), token('parchment'))).toBeGreaterThanOrEqual(contrast('#1c5bb0', token('parchment')));
  expect(contrast(token('focus-gold'), token('stone-700'))).toBeGreaterThanOrEqual(4.5);
  expect(contrast(token('focus'), token('focus-gold'))).toBeGreaterThanOrEqual(7);
});
