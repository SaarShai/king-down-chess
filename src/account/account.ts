/**
 * Settings → Account: sign in with Google or GitHub (Facebook only with `?facebook=1`, until Meta
 * verifies the business), sign out, delete the account; and the cloud save while signed in.
 * main.ts loads this after the board is drawn; the Supabase client loads only for a sign-in or a
 * saved session. Without a network, or without an account, the game plays exactly as before.
 */
import { Sync, stamp, type Section } from './sync';
import type { Client, Provider } from './client';

/** Where the Supabase client keeps the session in localStorage. */
export const AUTH_KEY = 'kingdown.auth';
export type User = { name: string; avatar: string | null; provider: string };
type AuthUser = { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> };

const PROVIDERS: [Provider, string][] = [['google', 'Google'], ['github', 'GitHub'], ['facebook', 'Facebook']];
const esc = (s: string): string => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Name, picture and provider from what the sign-in service sent. */
export function userOf(u: AuthUser | null | undefined): User | null {
  if (!u) return null;
  const m = u.user_metadata ?? {}, avatar = text(m.avatar_url) ?? text(m.picture);
  return {
    name: text(m.full_name) ?? text(m.name) ?? text(m.user_name) ?? 'Player',
    avatar: avatar && /^https:\/\//.test(avatar) ? avatar : null,
    provider: String(u.app_metadata?.provider ?? ''),
  };
}

/** The Account section's content. The name and picture come from outside the game, so both are escaped. */
export function accountHtml(user: User | null, facebook: boolean): string {
  const links = '<p class="account-links"><a href="./privacy.html" target="_blank" rel="noopener">Privacy</a>'
    + '<a href="./terms.html" target="_blank" rel="noopener">Terms</a></p>';
  if (!user) {
    return '<p>Sign in to save your games on every device.</p>'
      + PROVIDERS.filter(([p]) => facebook || p !== 'facebook')
        .map(([p, name]) => `<button type="button" data-provider="${p}">Continue with ${name}</button>`).join('')
      + '<small>We get only your name, picture, email address and an account number. Other players never see your email.</small>'
      + links;
  }
  const via = PROVIDERS.find(([p]) => p === user.provider)?.[1];
  return '<div class="account-who">'
    + (user.avatar ? `<img src="${esc(user.avatar)}" alt="" width="44" height="44" referrerpolicy="no-referrer" />` : '')
    + `<div><b>${esc(user.name)}</b>${via ? `<small>Signed in with ${via}</small>` : ''}</div></div>`
    + '<small>Your settings, lessons and saved game are kept with your account.</small>'
    + '<button type="button" data-act="sign-out">Sign out</button>'
    + '<button type="button" class="quiet" data-act="delete">Delete my account</button>'
    + links;
}

let sync: Sync | null = null;

/** main.ts saved something: note what changed, and send it soon when signed in. */
export function changed(): void {
  try { if (sync) sync.changed(); else stamp(localStorage); } catch { /* storage blocked: nothing to sync */ }
}

/** Draws the Account section and starts the cloud save; `onApply` gets the sections the account had newer. */
export function startAccount(onApply: (down: Section[]) => void): void {
  const $ = (id: string) => document.getElementById(id)!;
  const body = $('account-body'), note = $('account-note'), ask = $('delete-account') as HTMLDialogElement;
  const params = new URLSearchParams(location.search);
  const facebook = params.get('facebook') === '1';
  let client: Promise<Client> | null = null, user: User | null = null, userId = '', lastPull = 0;
  const say = (t: string): void => { note.textContent = t; };
  const render = (): void => {
    const hadFocus = body.contains(document.activeElement);
    body.innerHTML = accountHtml(user, facebook);
    body.querySelector('img')?.addEventListener('error', e => (e.target as HTMLElement).remove());
    if (hadFocus) body.querySelector('button')?.focus();
  };
  const load = (): Promise<Client> => client ??= import('./client').then(m => {
    const c = m.connect(AUTH_KEY);
    c.onSession(s => {
      user = userOf(s?.user);
      render();
      if ((s?.user.id ?? '') === userId) return;
      sync?.stop();
      sync = null;
      userId = s?.user.id ?? '';
      if (s) { sync = new Sync(localStorage, c.remote(s.user.id), onApply); lastPull = Date.now(); void sync.pull(); }
    });
    return c;
  }, e => { client = null; throw e; }); // offline before this part was cached: a later tap tries again

  // Back from the sign-in page. A refusal or a cancel leaves error fields in the address: clear them.
  if (params.has('error') || location.hash.includes('error')) {
    say('Sign-in did not finish. Please try again.');
    const url = new URL(location.href);
    for (const k of ['error', 'error_code', 'error_description', 'sb_flow_id']) url.searchParams.delete(k);
    if (url.hash.includes('error')) url.hash = '';
    history.replaceState(history.state, '', url.href);
  }
  let stored: unknown = null;
  try { stored = JSON.parse(localStorage.getItem(AUTH_KEY) ?? 'null'); } catch { /* none */ }
  user = userOf((stored as { user?: AuthUser } | null)?.user);
  render();
  $('account').hidden = false;
  if (user || params.has('code')) void load().catch(() => {});

  body.addEventListener('click', async e => {
    const b = (e.target as Element).closest('button');
    if (!b) return;
    const provider = b.dataset.provider as Provider | undefined;
    if (provider) {
      say(`Opening ${PROVIDERS.find(([p]) => p === provider)?.[1]}…`);
      try { await (await load()).signIn(provider); } catch { say('Could not reach the sign-in service. Check your connection and try again.'); }
    } else if (b.dataset.act === 'sign-out') {
      // The last changes go up first (waiting 3 s at most), so the account's copy has them.
      await Promise.race([sync?.flush(), new Promise(r => setTimeout(r, 3000))]);
      try { await (await load()).signOut(); } catch { try { localStorage.removeItem(AUTH_KEY); } catch { /* blocked */ } }
      sync?.stop(); sync = null; userId = ''; user = null;
      render();
      say('Signed out. Your games stay on this device.');
    } else if (b.dataset.act === 'delete') {
      // Inside another site's frame, a click may not be the player's own (clickjacking).
      if (window.top !== window.self) return say('Open King Down in its own tab to delete your account.');
      ask.returnValue = '';
      ask.showModal();
    }
  });
  ask.addEventListener('close', async () => {
    if (ask.returnValue !== 'delete') return;
    say('Deleting your account…');
    try {
      await (await load()).deleteAccount();
      sync?.stop(); sync = null; userId = ''; user = null;
      render();
      say('Your account is deleted. Your games stay on this device.');
    } catch { say('Could not delete your account. Check your connection and try again.'); }
  });
  addEventListener('online', () => { if (sync) void sync.flush(); else if (user) void load().catch(() => {}); });
  document.addEventListener('visibilitychange', () => {
    if (!sync) return;
    if (document.visibilityState === 'hidden') void sync.flush();
    else if (Date.now() - lastPull > 30_000) { lastPull = Date.now(); void sync.pull(); } // played on another device meanwhile?
  });
}
