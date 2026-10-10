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
/** Each service's own mark, as its sign-in branding rules ask (Google's sits on white). */
const LOGO: Record<Provider, string> = {
  google: '<svg class="logo logo-google" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
  github: '<svg class="logo" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',
  facebook: '<svg class="logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="#0866FF" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/></svg>',
};
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
        .map(([p, name]) => `<button type="button" data-provider="${p}">${LOGO[p]}<span>Continue with ${name}</span></button>`).join('')
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

/** The game saved something (screen/play.ts save; main.ts once at load): note what changed, and send it soon when signed in. */
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
