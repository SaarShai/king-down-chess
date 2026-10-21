import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readWebAccountAccess } from './account-access';
import { connect } from '../account/client';

vi.mock('./account-access', () => ({ readWebAccountAccess: vi.fn() }));
const { providers, startAccountSignIn } = vi.hoisted(() => ({ providers: vi.fn(), startAccountSignIn: vi.fn() }));
vi.mock('../account/client', () => ({ connect: vi.fn(() => ({ readSession: vi.fn(async () => null), providers, startAccountSignIn })) }));

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
  providers.mockResolvedValue(['google', 'github']);
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
  expect(providers).not.toHaveBeenCalled();
  buttons[0].onclick!(); expect(reload).toHaveBeenCalledOnce();
});

it('omits disabled providers and providers unsupported by account play', async () => {
  vi.mocked(readWebAccountAccess).mockResolvedValue({ enabled: true, expiresAt: 5000 });
  providers.mockResolvedValue(['github', 'facebook']);
  await import('./entry');
  expect(body.querySelectorAll('button').map(button => button.textContent)).toEqual(['Continue with GitHub']);
  expect(body.querySelectorAll('a').map(link => link.textContent)).toEqual(['Play on this device']);
});

it.each(['empty', 'failed'])('keeps retry and local play available when provider settings are %s', async fault => {
  vi.mocked(readWebAccountAccess).mockResolvedValue({ enabled: true, expiresAt: 5000 });
  if (fault === 'empty') providers.mockResolvedValue([]); else providers.mockRejectedValue(new Error('private upstream detail'));
  await import('./entry');
  expect(body.querySelectorAll('button').map(button => button.textContent)).toEqual(['Try again']);
  expect(body.querySelectorAll('a').map(link => link.textContent)).toEqual(['Play on this device']);
  expect(body.querySelectorAll('p').map(p => p.textContent).join(' ')).not.toContain('private upstream');
});

it('shows provider buttons after a fresh access proof succeeds', async () => {
  vi.mocked(readWebAccountAccess).mockResolvedValue({ enabled: true, expiresAt: 5000 });
  await import('./entry');
  expect(body.querySelectorAll('button').map(button => button.textContent)).toEqual(['Continue with Google', 'Continue with GitHub']);
  expect(reload).not.toHaveBeenCalled();
});

it('returns to the game open when sign-in starts, not the list where the page first loaded', async () => {
  vi.mocked(readWebAccountAccess).mockResolvedValue({ enabled: true, expiresAt: 5000 });
  providers.mockResolvedValue(['github']);
  startAccountSignIn.mockResolvedValue({ url: 'https://provider.test/authorize', flowId: 'flow_test_123' });
  const storage = { removeItem: vi.fn(), setItem: vi.fn() }, assign = vi.fn();
  vi.stubGlobal('sessionStorage', storage);
  vi.stubGlobal('location', { href: 'https://kingdown.test/play/', reload, assign });
  await import('./entry');
  // Account play changes the address in place when a game opens.
  location.href = 'https://kingdown.test/g/02207813-587c-867d-99be-7d448c5e30b0';
  await body.querySelectorAll('button')[0].onclick!();
  expect(startAccountSignIn).toHaveBeenCalledWith('github');
  expect(JSON.parse(storage.setItem.mock.calls[0][1])).toMatchObject({
    flow: 'flow_test_123', target: '/g/02207813-587c-867d-99be-7d448c5e30b0',
  });
  expect(assign).toHaveBeenCalledWith('https://provider.test/authorize');
});
