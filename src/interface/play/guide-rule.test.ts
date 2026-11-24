import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('../ui/kit.js', () => ({ button: () => document.createElement('button'), icon: () => document.createElement('i') }));
vi.mock('./learning-panel', () => ({ learningPanel: () => ({ element: document.createElement('section'), dispose() {} }) }));
// A page of plain nodes: the Guide builds its real page and the fx clock runs on this time.
let now = 0, frames: FrameRequestCallback[] = [], wide: { matches: boolean; run: () => void };
const pass = (ms: number) => { now += ms; for (const run of frames.splice(0)) run(now); };
class Node {
  className = ''; textContent = ''; id = ''; tabIndex = 0; children: Node[] = []; dataset: Record<string, string> = {}; isConnected = true; scrollTop = 0; clientHeight = 0; offsetHeight = 0;
  vars = new Map<string, string>(); attributes = new Map<string, string>();
  style = { setProperty: (key: string, value: string) => { this.vars.set(key, value); }, removeProperty: (key: string) => { this.vars.delete(key); } };
  classList = { add: (name: string) => { this.className += ` ${name}`; } };
  append(...nodes: (Node | string)[]) { this.children.push(...nodes.filter((node): node is Node => node instanceof Node)); }
  prepend(...nodes: Node[]) { this.children.unshift(...nodes); } after() {} replaceChildren(...nodes: Node[]) { this.children = nodes; }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); } removeAttribute(key: string) { this.attributes.delete(key); }
  addEventListener() {} contains() { return false; } focus() {} getAnimations() { return []; } getBoundingClientRect() { return { top: 0 }; } querySelector() { return new Node(); }
  find(name: string): Node | undefined { return this.className.split(' ').includes(name) ? this : this.children.map(child => child.find(name)).find(Boolean); }
}
let guide: typeof import('./guide'), fx: typeof import('./fx');
beforeEach(async () => {
  now = 0; frames = []; wide = { matches: true, run: () => {} };
  vi.resetModules();
  vi.stubGlobal('document', { createElement: () => new Node(), createElementNS: () => new Node(), body: new Node() });
  vi.stubGlobal('CSS', { escape: (value: string) => value });
  vi.stubGlobal('matchMedia', () => ({ get matches() { return wide.matches; }, addEventListener: (_: string, run: () => void) => { wide.run = run; }, removeEventListener() {} }));
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) => frames.push(run)); vi.stubGlobal('cancelAnimationFrame', () => {});
  fx = await import('./fx'); guide = await import('./guide');
  fx.setFxMotion('normal', false);
});
afterEach(() => { vi.unstubAllGlobals(); });
const open = (section?: string, entry?: string) => (guide.guidePage(section, entry, () => {}) as unknown as Node).find('guide-entry-title');
const rule = (title?: Node) => title!.vars.get('--rule');

it('draws the rule one time when the entry changes, and leaves it whole', () => {
  open('Pieces');
  const title = open('Pieces', '8');
  expect(rule(title)).toBe('0');
  pass(30); pass(30); pass(30);
  expect(Number(rule(title))).toBeGreaterThan(0); expect(Number(rule(title))).toBeLessThan(1);
  for (let i = 0; i < 10; i++) pass(30);
  expect(rule(title)).toBeUndefined(); // the rest rule of the style sheet
  expect(rule(open('Pieces', '7'))).toBe('0'); // Previous
});
it('moves nothing on the first page (a reload), the same entry again, a section, or a resize', () => {
  const first = open('Pieces', '7');
  expect(rule(first)).toBeUndefined();
  expect(rule(open('Pieces', '7'))).toBeUndefined();
  expect(rule(open('Cards'))).toBeUndefined(); // the wide default entry
  const page = guide.guidePage('Pieces', undefined, () => {}) as unknown as Node;
  wide.matches = false; wide.run(); wide.matches = true; wide.run();
  expect(rule(page.find('guide-entry-title'))).toBeUndefined();
});
it('a wide section that shows an entry already draws nothing when that entry opens; a hidden default entry draws', () => {
  const [first] = guide.guideEntries('Pieces');
  open('Cards'); open('Pieces');
  expect(rule(open('Pieces', first.id))).toBeUndefined();
  expect(rule(open('Pieces', guide.guideEntries('Pieces')[1].id))).toBe('0');
  open('Pieces'); wide.matches = false; wide.run(); // the narrow list alone
  expect(rule(open('Pieces', first.id))).toBe('0');
});
it('reduced motion shows the whole rule at once', () => {
  fx.setFxMotion('normal', true);
  open('Pieces');
  expect(rule(open('Pieces', '7'))).toBeUndefined();
  expect(frames).toHaveLength(0);
});
it('the rule lies out of the text flow and only its own small box scales', () => {
  const css = readFileSync(new URL('./menus.css', import.meta.url), 'utf8');
  const box = css.match(/\.guide-entry-title::after \{([^}]*)\}/)?.[1] ?? '';
  for (const part of ['position: absolute', 'width: 48px', 'height: 2px', 'transform: scaleX(var(--rule, 1))']) expect(box).toContain(part);
  expect(css.match(/\.guide-entry-title[^{]*\{[^}]*(opacity|visibility)/)).toBeNull();
});
