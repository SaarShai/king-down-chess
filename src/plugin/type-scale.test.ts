import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Fault F25: the Play screen uses one type scale. Every font-size is a --fs-* token (src/style.css), never a
// raw pixel value, so Play cannot grow a second, off-scale list of text sizes. The rating badge keeps its
// 20 px box; only its text follows the scale.
const pluginCss = ['app.css', 'screens/board.css', 'screens/seat.css', 'screens/setup.css', 'screens/end.css', 'screens/profile.css'];
const css = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');
const rule = (file: string, selector: string) => css(file).match(new RegExp(`\\${selector} \\{[^}]*\\}`))![0];

describe('the Play type scale', () => {
  it.each(pluginCss)('%s sets every font-size with a --fs-* token', file => {
    expect(css(file).match(/font-size:\s*[0-9.]+px/g)).toBeNull();
  });

  it('keeps the 20 px rating badge box and sizes its text with the scale', () => {
    for (const file of ['screens/end.css', 'screens/profile.css']) {
      const badge = rule(file, '.q');
      expect(badge).toContain('width: 20px');
      expect(badge).toContain('height: 20px');
      expect(badge).toContain('font-size: var(--fs-xs)');
    }
  });
});
