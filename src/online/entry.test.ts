import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readWebAccountAccess } from './account-access';
import { connect } from '../account/client';

vi.mock('./account-access', () => ({ readWebAccountAccess: vi.fn() }));
const { providers, startAccountSignIn, signInWithPassword } = vi.hoisted(() => ({ providers: vi.fn(), startAccountSignIn: vi.fn(), signInWithPassword: vi.fn() }));
vi.mock('../account/client', () => ({ connect: vi.fn(() => ({ readSession: vi.fn(async () => null), providers, startAccountSignIn, signInWithPassword })) }));

class Element {
  children: Element[] = [];
  textContent = '';
  className = '';
  onclick?: () => void;
  onsubmit?: (event: { preventDefault(): void }) => Promise<void>;
  value = '';
  type = '';
  required = false;
  disabled = false;
  readOnly = false;
  focus = vi.fn();
  constructor(readonly tag: string) {}
  append(...nodes: Element[]) { this.children.push(...nodes); }
  replaceChildren(...nodes: Element[]) { this.children = nodes; }
  setAttribute() {}
  querySelectorAll(tag: string): Element[] { return this.children.flatMap(node => [...(tag.split(', ').includes(node.tag) ? [node] : []), ...node.querySelectorAll(tag)]); }
}
let body: Element, reload: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubEnv('VITE_KINGDOWN_STAGE', '');
  providers.mockResolvedValue(['google', 'github']);
  signInWithPassword.mockReset().mockResolvedValue(undefined);
  body = new Element('body'); reload = vi.fn();
  vi.stubGlobal('document', { title: '', body, createElement: (tag: string) => new Element(tag) });
  vi.stubGlobal('location', { href: 'https://kingdown.test/play/', reload });
  vi.stubGlobal('history', {}); vi.stubGlobal('sessionStorage', {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

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
  expect(body.querySelectorAll('form')).toHaveLength(0);
});

it('signs in the entered staging account once, clears the password and returns to the current game', async () => {
  vi.stubEnv('VITE_KINGDOWN_STAGE', 'staging');
  vi.stubEnv('VITE_SUPABASE_URL', 'https://puhspsyjyzaghmgtkzqd.supabase.co');
  vi.mocked(readWebAccountAccess).mockResolvedValue({ enabled: true, expiresAt: 5000 });
  let finish!: () => void;
  signInWithPassword.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  const assign = vi.fn(); vi.stubGlobal('location', { href: 'https://kingdown.test/play/', assign });
  await import('./entry');
  const form = body.querySelectorAll('form')[0], [email, password] = form.querySelectorAll('input');
  expect(email.value).toBe(''); expect(email.readOnly).toBe(false);
  expect(email.type).toBe('email'); expect(email.required).toBe(true); expect(password.required).toBe(true);
  email.value = 'player-two@kingdown.example'; password.value = 'fixture-password';
  location.href = 'https://kingdown.test/g/02207813-587c-867d-99be-7d448c5e30b0';
  const attempt = form.onsubmit!({ preventDefault() {} });
  await form.onsubmit!({ preventDefault() {} });
  expect(password.value).toBe(''); expect(password.disabled).toBe(true);
  expect(email.disabled).toBe(true);
  expect(signInWithPassword).toHaveBeenCalledExactlyOnceWith('player-two@kingdown.example', 'fixture-password');
  finish(); await attempt;
  expect(assign).toHaveBeenCalledExactlyOnceWith('/g/02207813-587c-867d-99be-7d448c5e30b0');
});

it('keeps staging password sign-in usable after a failed attempt without showing upstream details', async () => {
  vi.stubEnv('VITE_KINGDOWN_STAGE', 'staging');
  vi.stubEnv('VITE_SUPABASE_URL', 'https://puhspsyjyzaghmgtkzqd.supabase.co');
  vi.mocked(readWebAccountAccess).mockResolvedValue({ enabled: true, expiresAt: 5000 });
  providers.mockRejectedValue(new Error('private provider detail'));
  signInWithPassword.mockRejectedValueOnce(new Error('private auth detail'));
  const assign = vi.fn(); vi.stubGlobal('location', { href: 'https://kingdown.test/play/', assign });
  await import('./entry');
  const form = body.querySelectorAll('form')[0], [email, password] = form.querySelectorAll('input');
  email.value = 'privacy-check@kingdown.example'; password.value = 'wrong-password'; await form.onsubmit!({ preventDefault() {} });
  expect(password.value).toBe(''); expect(password.disabled).toBe(false); expect(email.disabled).toBe(false);
  expect(password.focus).toHaveBeenCalledOnce(); expect(assign).not.toHaveBeenCalled();
  expect(body.querySelectorAll('p')[0].textContent).toBe('Sign-in failed. Check the email and password and try again.');
  expect(body.querySelectorAll('a').map(link => link.textContent)).toEqual(['Play on this device']);
  email.value = 'player-three@kingdown.example'; password.value = 'fixture-password'; await form.onsubmit!({ preventDefault() {} });
  expect(signInWithPassword.mock.calls).toEqual([['privacy-check@kingdown.example', 'wrong-password'], ['player-three@kingdown.example', 'fixture-password']]);
  expect(password.value).toBe(''); expect(assign).toHaveBeenCalledExactlyOnceWith('/play/');
});

it.each([
  ['production', 'https://puhspsyjyzaghmgtkzqd.supabase.co'],
  ['preview', 'https://puhspsyjyzaghmgtkzqd.supabase.co'],
  ['staging', 'https://another.supabase.co'],
])('omits password sign-in for %s with account project %s', async (stage, url) => {
  vi.stubEnv('VITE_KINGDOWN_STAGE', stage); vi.stubEnv('VITE_SUPABASE_URL', url);
  vi.mocked(readWebAccountAccess).mockResolvedValue({ enabled: true, expiresAt: 5000 });
  await import('./entry');
  expect(body.querySelectorAll('form')).toHaveLength(0); expect(signInWithPassword).not.toHaveBeenCalled();
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
