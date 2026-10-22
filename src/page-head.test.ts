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


it('roots every authored public resource so deep game routes use the same files', () => {
  const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]).filter(url => !url.startsWith('#') && !url.startsWith('data:'));
  expect(urls.length).toBeGreaterThan(30);
  for (const url of urls) {
    expect(url.startsWith('/'), url).toBe(true);
    for (const path of ['/play/', '/g/game-id']) expect(new URL(url, `https://kingdown.test${path}`).href).toBe(new URL(url, 'https://kingdown.test/').href);
  }
  expect(html).toContain('href="#i-settings"');
});
