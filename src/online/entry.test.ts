import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readWebAccountAccess } from './account-access';
import { connect } from '../account/client';

vi.mock('./account-access', () => ({ readWebAccountAccess: vi.fn() }));
vi.mock('../account/client', () => ({ connect: vi.fn(() => ({ readSession: vi.fn(async () => null) })) }));

class Element {
  children: Element[] = [];
  textContent = '';
  className = '';
  onclick?: () => void;
  constructor(readonly tag: string) {}
  append(...nodes: Element[]) { this.children.push(...nodes); }
  replaceChildren(...nodes: Element[]) { this.children = nodes; }
  setAttribute() {}
  querySelectorAll(tag: string): Element[] { return this.children.flatMap(node => [...(node.tag === tag ? [node] : []), ...node.querySelectorAll(tag)]); }
}
let body: Element, reload: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  body = new Element('body'); reload = vi.fn();
  vi.stubGlobal('document', { title: '', body, createElement: (tag: string) => new Element(tag) });
  vi.stubGlobal('location', { href: 'https://kingdown.test/play/', reload });
  vi.stubGlobal('history', {}); vi.stubGlobal('sessionStorage', {});
});
afterEach(() => vi.unstubAllGlobals());

it('offers a fresh page retry after a failed cache/access check without starting sign-in', async () => {
  vi.mocked(readWebAccountAccess).mockResolvedValue({ enabled: false, expiresAt: 0 });
  await import('./entry');
  const buttons = body.querySelectorAll('button');
  expect(buttons.map(button => button.textContent)).toEqual(['Try again']);
  expect(connect).not.toHaveBeenCalled();
  buttons[0].onclick!(); expect(reload).toHaveBeenCalledOnce();
});

it('shows provider buttons after a fresh access proof succeeds', async () => {
  vi.mocked(readWebAccountAccess).mockResolvedValue({ enabled: true, expiresAt: 5000 });
  await import('./entry');
  expect(body.querySelectorAll('button').map(button => button.textContent)).toEqual(['Continue with Google', 'Continue with GitHub']);
  expect(reload).not.toHaveBeenCalled();
});
