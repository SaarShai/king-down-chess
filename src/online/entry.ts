import { AUTH_KEY } from '../account/session';
import { stagingTestEmail } from '../account/public-config';
import { configureRuntime } from '../account-game/host';
import { onlineClient } from './client';
import { createBrowserRuntime } from './runtime';
import { beginAccountSignIn, consumeSignInReturn, type SignInHost } from './sign-in';
import { accountPath, parseAccountRoute } from './routes';
import { readWebAccountAccess } from './account-access';
import template from '../plugin/index.html?raw';
import './page-host.css';

document.title = 'King Down';
document.body.replaceChildren();
function message(words: string, providers: readonly ('google' | 'github')[] = [], retry = false, testSignIn = false) {
  document.body.replaceChildren();
  const main = document.createElement('main'); main.className = 'account-entry';
  const title = document.createElement('h1'); title.textContent = 'King Down';
  const line = document.createElement('p'); line.textContent = words; line.setAttribute('role', 'status'); main.append(title, line);
  for (const provider of providers) {
    const button = document.createElement('button'); button.textContent = `Continue with ${provider === 'google' ? 'Google' : 'GitHub'}`;
    button.onclick = async () => {
      main.querySelectorAll('button').forEach(button => { button.disabled = true; });
      try {
        const route = parseAccountRoute(new URL(location.href));
        await beginAccountSignIn(provider, route ? accountPath(route) : '/play/', signInHost);
      }
      catch (error) { line.textContent = error instanceof Error ? error.message : String(error); main.querySelectorAll('button').forEach(button => { button.disabled = false; }); }
    };
    main.append(button);
  }
  if (retry) {
    const button = document.createElement('button'); button.textContent = 'Try again'; button.onclick = () => location.reload(); main.append(button);
  }
  const testEmail = testSignIn && stagingTestEmail(import.meta.env);
  if (testEmail) {
    const form = document.createElement('form'); form.className = 'staging-sign-in';
    const heading = document.createElement('h2'); heading.textContent = 'Staging test account';
    const emailLabel = document.createElement('label'); emailLabel.textContent = 'Email';
    const email = document.createElement('input'); email.type = 'email'; email.name = 'username'; email.autocomplete = 'username'; email.value = testEmail; email.readOnly = true; emailLabel.append(email);
    const passwordLabel = document.createElement('label'); passwordLabel.textContent = 'Password';
    const password = document.createElement('input'); password.type = 'password'; password.name = 'password'; password.autocomplete = 'current-password'; password.required = true; passwordLabel.append(password);
    const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Sign in to test account';
    let pending = false;
    form.onsubmit = async event => {
      event.preventDefault(); if (pending) return; pending = true;
      main.querySelectorAll('button, input').forEach(control => { (control as HTMLInputElement).disabled = true; });
      line.textContent = 'Signing in…';
      const secret = password.value; password.value = '';
      try {
        await (await getClient()).signInTestAccount(secret);
        const route = parseAccountRoute(new URL(location.href));
        location.assign(route ? accountPath(route) : '/play/');
      } catch {
        line.textContent = 'Sign-in failed. Check the password and try again.';
        main.querySelectorAll('button, input').forEach(control => { (control as HTMLInputElement).disabled = false; });
        pending = false; password.focus();
      }
    };
    form.append(heading, emailLabel, passwordLabel, submit); main.append(form);
  }
  const local = document.createElement('a'); local.href = '/'; local.textContent = 'Play on this device'; main.append(local);
  document.body.append(main);
  return main;
}
message('Loading your games…');
let client: Promise<import('../account/client').Client> | undefined;
const getClient = () => client ??= import('../account/client').then(({ connect }) => connect(AUTH_KEY, { manualCallback: true }));
const signInHost: SignInHost = { location, history, storage: sessionStorage, now: Date.now, client: getClient };
async function signInMessage(words: string) {
  message('Checking sign-in options…');
  try {
    const providers = (await (await getClient()).providers()).filter(provider => provider !== 'facebook');
    message(providers.length ? words : 'Provider sign-in is temporarily unavailable. Try again later.', providers, !providers.length, true);
  } catch { message('Sign-in options could not load. Check your connection and try again.', [], true, true); }
}
try {
  const access = await readWebAccountAccess();
  if (!access.enabled) message('Account play is temporarily unavailable. Try again later.', [], true);
  else {
    const returned = await consumeSignInReturn(signInHost), auth = await getClient();
    const session = returned.status === 'signed-in' ? returned.session : await auth.readSession();
    if (returned.status === 'retry' || !session) await signInMessage(returned.status === 'retry' ? 'Sign-in did not finish. Please try again.' : 'Sign in to play with your account.');
    else {
      const parsed = new DOMParser().parseFromString(template, 'text/html'); parsed.querySelectorAll('script').forEach(script => script.remove());
      document.body.replaceChildren(...Array.from(parsed.body.childNodes));
      const api = onlineClient({ token: async () => { const current = await auth.readSession(); return current?.userId === session.userId ? current.accessToken : null; } });
      const host = createBrowserRuntime(api, session.userId);
      host.onAccessLost = () => {
        const main = message('This game is not available to this account. You can open your own games.');
        const games = document.createElement('a'); games.href = '/play/'; games.textContent = 'Open your games'; main.append(games);
      };
      configureRuntime(host);
      await import('../account-game/runtime');
      auth.onSession(current => {
        if (current?.user.id === session.userId) return;
        host.dispose?.();
        void signInMessage('Sign in to play with your account.');
      });
    }
  }
} catch (error) { message(error instanceof Error ? error.message : 'Account play could not load.', [], true); }
