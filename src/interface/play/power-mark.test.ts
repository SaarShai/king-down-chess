import { readdirSync, readFileSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseSync, transformSync } from 'rolldown/utils';
import { expect, it, vi } from 'vitest';
import { KINGS, type PowerName } from '../../rules/engine';
import { POWER_NAME } from '../../powers-ui';
import { powerMark } from './power-mark';
import type { ReaderModel } from './reader';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');
const art = new URL('../../../public/ui/powers/', import.meta.url), powers = Object.keys(POWER_NAME) as PowerName[];

it('each power has its own mark, so the two powers of a king differ, and no file is spare', () => {
  expect(new Set(powers.map(powerMark)).size).toBe(12);
  for (const pair of Object.values(KINGS)) expect(powerMark(pair[0])).not.toBe(powerMark(pair[1]));
  expect(powers.map(id => powerMark(id).replace('/ui/powers/', '')).sort()).toEqual(readdirSync(art).sort());
  expect(readdirSync(art).reduce((sum, file) => sum + statSync(new URL(file, art)).size, 0)).toBeLessThan(400_000);
});

it.each([
  ['Freeze', 'freeze'], ['IceWall', 'ice-wall'], ['Strike', 'strike'], ['Haste', 'haste'], ['Flight', 'flight'], ['Sacrifice', 'sacrifice'],
  ['March', 'march'], ['Leap', 'leap'], ['HolyLight', 'holy-light'], ['Mercy', 'mercy'], ['DeathTouch', 'death-touch'], ['Darkness', 'darkness'],
] as const)('the mark of %s is %s.webp', (power, file) => { expect(powerMark(power)).toBe(`/ui/powers/${file}.webp`); });

it.each([0, 1])('the hand coin of side %i shows the mark of its power', side => {
  const main = read('./main.ts'), page = transformSync('main.ts', parseSync('main.ts', main).program.body
    .filter(node => node.type === 'FunctionDeclaration' && node.id?.name === 'addPower').map(node => main.slice(node.start, node.end)).join('\n')).code;
  const el = () => ({ children: [] as unknown[], append(...nodes: unknown[]) { this.children.push(...nodes); }, setAttribute() {}, classList: { add() {} }, querySelector: () => el() });
  const decorativeImage = vi.fn((image: unknown, _src: string) => image), control = el();
  const scope: Record<string, unknown> = { game: { context: { rules: { kings: [{ king: 'Frost', power: 'IceWall' }, { king: 'Shadow', power: 'Darkness' }] } } },
    usesAllowed: () => 2, POWER_TAG: {}, POWER_NAME, powerLines: {}, powerMark, resources: [], button: () => control, el, decorativeImage };
  runInNewContext(page, scope);
  (scope.addPower as (side: number, parent: unknown) => void)(side, el());
  expect(decorativeImage.mock.calls.map(call => call[1])).toEqual([['/ui/powers/ice-wall.webp', '/ui/powers/darkness.webp'][side]]);
});

it('the mark is the whole coin: no second ring, and a spent mark is grey', () => {
  const css = read('./reading-b.css'), rule = (selector: string) => css.match(new RegExp(`^${selector.replace(/[.[\]()]/g, '\\$&')} \\{([^}]*)\\}`, 'm'))?.[1] ?? '';
  expect(rule('.play-power-coin')).toMatch(/width: 38px; height: 38px/);
  expect(rule('.play-power-coin')).not.toMatch(/background|box-shadow/);
  expect(rule('.play-opp .play-power-coin')).toBe(' width: 28px; height: 28px; ');
  expect(rule('.play-power-coin img')).toMatch(/width: 100%; height: 100%;.*scale: 1.04/);
  expect(css).not.toContain("[data-coin='always'] .play-power-coin");
  expect(css).toMatch(/\[data-spent='true'\] \.play-power-coin img \{ filter: grayscale\(1\)/);
});

it('a check or a win colours the ring of a coin: no ring rule of the mark is stronger or later', () => {
  const css = read('./reading-b.css'), at = (text: string) => css.indexOf(text);
  const own = [...css.matchAll(/^\.play-seat-ring\S*:has\(> \.play-power-coin\)\S* \{[^}]*border-color[^}]*\}/gm)];
  expect(own).toHaveLength(1);
  for (const { 0: rule, index } of own) {
    expect((rule.replace(/:where\(.*?\)+ /, ' ').match(/(\.[\w-]+|\[[^\]]+\])(?=.*\{)/g) ?? []).length).toBe(2); // as strong as [data-check]
    for (const state of [".play-seat-ring[data-check='true'] {", ".play-seat-ring[data-outcome='win'] {"]) expect(at(state)).toBeGreaterThan(index);
  }
});

it('the name of a power has no break inside a word, grows with the text size, and makes its column wider than the coin', () => {
  const css = read('./reading-b.css'), at = (text: string) => css.indexOf(text);
  expect(css).toContain(".play-game .play-own .play-power { flex: none; width: min-content; min-width: 58px; }");
  expect(css).toMatch(/\.play-own \.play-power \[data-button-label\] \{ font: 700 \.75rem\/1\.1 [^;]+; overflow-wrap: normal; \}/);
  expect(css.slice(at('min-width: 58px'))).not.toMatch(/\.play-own \.play-power \{ flex-basis/);
  // The wider column leaves each card its whole name.
  expect(css).toMatch(/@media \(max-width: 359px\) \{[^@]*:has\(\.play-hand\) \.play-power \[data-button-label\] \{ font: 700 12px/);
  expect(css).toMatch(/\[data-form='wide'\] \.play-own \.play-card \[data-button-label\] \{ padding-inline: 5px; \}/);
});

it('a resize runs the fit check of the narrator again: the mark goes when the text leaves the reader, and comes back', () => {
  const main = read('./main.ts'), body = parseSync('main.ts', main).program.body;
  const source = (name: string) => { const node = body.find(node => node.type === 'FunctionDeclaration' && node.id?.name === name)!; return main.slice(node.start, node.end); };
  let room = true;
  const art = { src: '/ui/powers/freeze.webp' as string | null, isConnected: true, getAttribute: () => art.src, remove() { art.isConnected = false; } };
  const view = { prepend(node: typeof art) { node.isConnected = true; } };
  const detail = { querySelector: () => view as typeof view | null, get scrollHeight() { return room || !art.isConnected ? 76 : 96; }, clientHeight: 76 };
  const scope: Record<string, unknown> = { detail, nodes: { art } };
  runInNewContext(transformSync('main.ts', source('fitNarrator')).code, scope);
  const fit = () => { (scope.fitNarrator as () => void)(); return art.isConnected; };
  expect(fit()).toBe(true);
  room = false; expect(fit()).toBe(false); // narrower
  expect(fit()).toBe(false);
  room = true; expect(fit()).toBe(true);
  art.isConnected = false; art.src = null; expect(fit()).toBe(false); // the words of a move have no mark
  art.src = '/ui/powers/freeze.webp'; detail.querySelector = () => null; expect(fit()).toBe(false); // no narrator
  expect(source('layout')).toMatch(/else \{ fitResult\(\); fitNarrator\(\); \}/);
  expect(source('renderReader')).toContain('else fitNarrator();');
});

it('the reader shows the mark of a power that the player reads, and no picture for the words of a move', async () => {
  class Node { className = ''; dataset = {}; children: unknown[] = []; attributes = new Map<string, string>(); textContent = '';
    append(...nodes: unknown[]) { this.children.push(...nodes); } getAttribute(key: string) { return this.attributes.get(key) ?? null; } removeAttribute(key: string) { this.attributes.delete(key); }
    set src(value: string) { this.attributes.set('src', value); } animate() {} }
  vi.stubGlobal('document', { createElement: () => new Node(), addEventListener() {}, documentElement: { dataset: { motion: 'reduce' }, style: { setProperty() {} } } });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '' }));
  try {
    const { narratorView, readerNodes } = await import('./reader'), nodes = readerNodes();
    const view = (model: Partial<ReaderModel>) => (narratorView({ state: '', title: 'Freeze', named: true, headTools: [], primary: [], secondary: [], tools: [], summary: null, ...model }, nodes) as unknown as Node).children;
    expect(view({ art: powerMark('Freeze') })).toContain(nodes.art);
    expect(nodes.art.getAttribute('src')).toBe('/ui/powers/freeze.webp');
    expect(view({})).not.toContain(nodes.art);
    expect(view({ art: '/cards/haste.webp', named: false })).not.toContain(nodes.art);
  } finally { vi.unstubAllGlobals(); }
  expect(read('./main.ts')).toContain("subject.kind === 'power' ? { art: powerMark(subject.id) } : {}");
});

it('the Guide shows the mark before each power name, with no name of its own', () => {
  expect(read('./guide.ts')).toContain("querySelector('strong')!.prepend(picture(powerMark(");
  expect(read('./menus.css')).toMatch(/\.king-powers strong img \{[^}]*display: inline-block; width: 24px; height: 24px/);
});
