/** Standalone consent UI; the signed-in Supabase SDK performs authorization, not the MCP bearer. */
import { createClient } from '@supabase/supabase-js';
import type { ConsentConfig } from './consent-config';
import { availableProviders } from '../account/providers';
const config: ConsentConfig = JSON.parse(document.getElementById('kingdown-consent-config')!.textContent!);
const authorizationId = new URL(location.href).searchParams.get('authorization_id');
const status = document.getElementById('status')!, signin = document.getElementById('signin')!, consent = document.getElementById('consent')!;
const accountChoice = document.getElementById('choose-account')!;
const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')];
/** The OpenAI review account (approval D8 a) signed in here with a password. It is off while the ChatGPT plugin is
 *  parked (tools/chatgpt-plugin.mjs, 2026-10-28): the form stays hidden and sends nothing. The Supabase hook and
 *  kingdown_auth.password_accounts are outside the app (docs/HOSTING.md, "Parked: the ChatGPT plugin"). */
const REVIEW_PASSWORD_SIGNIN = false;
function busy(on: boolean): void { buttons.forEach(button => { button.disabled = on; }); }
function say(message: string): void { status.textContent = message; }
function redirect(value: string): void {
  const url = new URL(value);
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw new Error('Invalid authorization redirect');
  location.assign(url.href);
}
async function main(): Promise<void> {
  if (!authorizationId || !/^[A-Za-z0-9_-]{1,200}$/.test(authorizationId)) throw new Error('Open King Down from your application to start a new authorization request.');
  const sb = createClient(config.supabaseUrl, config.publishableKey, { auth: { flowType: 'pkce', storageKey: 'kingdown-plugin-consent', persistSession: true } });
  const session = await sb.auth.getSession(); if (session.error) throw session.error;
  if (!session.data.session || session.data.session.user.is_anonymous) {
    signin.hidden = false;
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-provider]')) button.onclick = async () => {
      busy(true); say('Opening sign-in…');
      try {
        const redirectTo = new URL('/authorize', location.origin); redirectTo.searchParams.set('authorization_id', authorizationId);
        const { error } = await sb.auth.signInWithOAuth({ provider: button.dataset.provider as 'google' | 'github' | 'facebook', options: { redirectTo: redirectTo.href } });
        if (error) throw error;
      } catch { busy(false); say('Sign-in could not start. Try again.'); }
    };
    // The one review account (approval D8 a). The before-user-created hook refuses every other password sign-up.
    const email = document.getElementById('password-email') as HTMLInputElement, password = document.getElementById('password-value') as HTMLInputElement;
    document.getElementById('password-signin')!.hidden = !REVIEW_PASSWORD_SIGNIN;
    document.getElementById('password-form')!.onsubmit = async event => {
      event.preventDefault();
      if (!REVIEW_PASSWORD_SIGNIN) return;
      busy(true); say('Signing in…');
      const { error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
      if (error) { busy(false); password.value = ''; say(error.status === 400 ? 'The email or the password is not correct. Try again.' : 'Sign-in could not start. Try again.'); return; }
      location.reload();
    };
    const orEmail = REVIEW_PASSWORD_SIGNIN ? ' or use email' : '';
    const retry = document.getElementById('signin-retry') as HTMLButtonElement;
    async function loadProviders(): Promise<void> {
      busy(true); retry.hidden = true; say('Checking sign-in options…');
      const social = [...document.querySelectorAll<HTMLButtonElement>('[data-provider]')];
      social.forEach(button => { button.hidden = true; });
      try {
        const providers = await availableProviders(config.supabaseUrl, config.publishableKey);
        social.forEach(button => { button.hidden = !providers.includes(button.dataset.provider as 'google' | 'github'); });
        const available = social.some(button => !button.hidden);
        retry.hidden = available;
        say(available ? 'Sign in to continue.' : `Social sign-in is unavailable. Try again${orEmail}.`);
      } catch { retry.hidden = false; say(`Sign-in options could not load. Check your connection and try again${orEmail ? `,${orEmail}` : ''}.`); }
      finally { busy(false); }
    }
    retry.onclick = () => { void loadProviders(); };
    await loadProviders();
    return;
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-signout]')) button.onclick = async () => {
    const disabled = buttons.map(button => button.disabled);
    busy(true); const { error } = await sb.auth.signOut({ scope: 'local' });
    if (error) { buttons.forEach((button, index) => { button.disabled = disabled[index]; }); say('Could not sign out. Try again.'); } else location.reload();
  };
  document.getElementById('signed-in-account')!.textContent = session.data.session.user.email || 'Your signed-in account';
  accountChoice.hidden = false; say('Choose the account to connect.');
  // Existing grants can redirect at the details request, before the consent controls appear.
  await new Promise<void>(resolve => { document.getElementById('continue')!.onclick = () => resolve(); });
  accountChoice.hidden = true; say('Checking this authorization request…');
  const { data, error } = await sb.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error || !data) throw error ?? new Error('Authorization request unavailable');
  if ('redirect_url' in data) { redirect(data.redirect_url); return; }
  if (data.authorization_id !== authorizationId) throw new Error('Authorization request does not match this page.');
  if (data.user.id !== session.data.session.user.id) throw new Error('Authorization account mismatch');
  const enabled = config.clientIds.includes(data.client.id.toLowerCase()) && data.scope.split(/\s+/).includes('openid');
  document.getElementById('client-name')!.textContent = data.client.name;
  document.getElementById('account')!.textContent = data.user.email || 'Your signed-in account';
  document.getElementById('redirect')!.textContent = data.redirect_uri;
  consent.hidden = false; say(enabled ? 'Review this application before connecting.' : 'This application is not enabled for King Down. You can deny the request.');
  const approve = document.getElementById('approve') as HTMLButtonElement; approve.disabled = !enabled;
  async function decide(allow: boolean): Promise<void> {
    busy(true); say(allow ? 'Connecting…' : 'Denying access…');
    try {
      const result = allow ? await sb.auth.oauth.approveAuthorization(authorizationId!, { skipBrowserRedirect: true }) : await sb.auth.oauth.denyAuthorization(authorizationId!, { skipBrowserRedirect: true });
      if (result.error || !result.data) throw result.error ?? new Error('No authorization response');
      redirect(result.data.redirect_url);
    } catch { busy(false); approve.disabled = !enabled; say('The authorization request failed. Try again or restart from your application.'); }
  }
  approve.onclick = () => { if (enabled) void decide(true); };
  document.getElementById('deny')!.onclick = () => { void decide(false); };
}
void main().catch(() => { signin.hidden = true; consent.hidden = true; accountChoice.hidden = true; say('This authorization request is unavailable or expired. Restart the connection from your application.'); });
