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

it('keeps the Daylight focus ring visible on both paper surfaces', () => {
  const daylight = readFileSync('src/interface/ui/tokens.css', 'utf8');
  const fill = /--focus-ring: var\(--([\w-]+)\);/.exec(daylight)![1];
  const colour = (name: string) => daylight.match(new RegExp(`--${name}: (#[0-9a-f]{6});`))![1];
  for (const surface of ['paper-50', 'paper-0']) expect(contrast(colour(fill), colour(surface))).toBeGreaterThanOrEqual(3);
});

it('keeps text on the brass plate, the vellum card, the stone slot and the wax stamp at 4.5:1 or more', () => {
  const daylight = readFileSync('src/interface/ui/tokens.css', 'utf8');
  const colour = (name: string) => daylight.match(new RegExp(`--${name}: (#[0-9a-f]{6});`))![1];
  for (const [ink, ground] of [['ink-900', 'brass'], ['ink-900', 'stock'], ['sage-700', 'stone'], ['paper-0', 'wax']]) {
    expect(contrast(colour(ink), colour(ground)), `${ink} on ${ground}`).toBeGreaterThanOrEqual(4.5);
  }
});

it('keeps each switch, pool box and spent pip state at 3:1 or more against what is next to it', () => {
  const daylight = readFileSync('src/interface/ui/tokens.css', 'utf8'), components = readFileSync('src/interface/ui/components.css', 'utf8');
  const colour = (name: string) => daylight.match(new RegExp(`--${name}: (#[0-9a-f]{6});`))![1];
  const offKnob = /\.kd-switch-knob \{[^}]*radial-gradient\(circle at 35% 30%, (#[0-9a-f]{6}), var\(--main-edge\)/.exec(components)![1];
  const onTrack = /\.kd-switch\[aria-checked='true'\] \.kd-switch-track \{ background: linear-gradient\((#[0-9a-f]{6}), (#[0-9a-f]{6})\)/.exec(components)!.slice(1);
  expect(components).toMatch(/\.kd-switch\[aria-checked='true'\] \.kd-switch-knob \{ background: radial-gradient\([^;]*var\(--paper-0\)/);
  const pairs = [[offKnob, colour('stone')], [colour('main-edge'), colour('stone')], ...onTrack.map(track => [colour('paper-0'), track]),
    [colour('sage-500'), colour('paper-0')], [colour('ink-900'), colour('paper-0')]];
  for (const [a, b] of pairs) expect(contrast(a, b), `${a} next to ${b}`).toBeGreaterThanOrEqual(3);
  expect(readFileSync('src/interface/play/menus.css', 'utf8')).toMatch(/\.pool-check \{[^}]*border: 1px solid var\(--border\)/);
  expect(readFileSync('src/interface/play/reading-b.css', 'utf8')).toMatch(/\.play-power-notch\[data-used='true'\] \{[^}]*0 0 0 1px var\(--text\)/);
});

it('keeps the armed mark and the board edge in forced colours, a focused card undimmed and the Rematch ring whole', () => {
  const css = readFileSync('src/interface/play/reading-b.css', 'utf8');
  const forced = css.slice(css.indexOf('@media (forced-colors: active)'));
  expect(forced).toMatch(/\.play-card\[aria-pressed='true'\]::before \{ border: 3px solid CanvasText; \}/);
  expect(forced).toMatch(/\.play-power\[aria-pressed='true'\] \.play-power-coin \{ outline: 3px solid CanvasText;/);
  expect(forced).toMatch(/\.play-board \{ outline: 1px solid CanvasText; \}/);
  expect(css).toMatch(/\.play-card:not\(\[aria-pressed='true'\], :focus-visible\) \{ opacity: \.6; \}/);
  expect(css).toMatch(/\.play-result-actions \.kd-button\[data-kind='main'\] \{[^}]*margin-inline: calc\(var\(--focus-width\) \+ var\(--focus-offset\)\)/);
});
