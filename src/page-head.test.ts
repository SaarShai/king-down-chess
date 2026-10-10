import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The Quiet Table (web redesign ticket 01): the page is light only, also when the device is in dark mode,
// and the browser bar and the installed app take the parchment colour. The CSS color-scheme has its own
// browser probe (visual-design); these tags and the manifest are read here.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const meta = (name: string) => [...html.matchAll(/<meta\s+name="([^"]+)"\s+content="([^"]*)"/g)].filter(m => m[1] === name).map(m => m[2]);
const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8')) as { theme_color?: string };

describe('the page head: one light look', () => {
  it('declares the page light only', () => {
    expect(meta('color-scheme')).toEqual(['only light']);
  });
  it('gives the browser bar and the installed app the parchment colour', () => {
    expect(meta('theme-color')).toEqual(['#f3ead7']);
    expect(manifest.theme_color).toBe('#f3ead7');
  });
});
