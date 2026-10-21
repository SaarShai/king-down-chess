import { AUTH_KEY } from '../account/session';
import { configureRuntime } from '../account-game/host';
import { onlineClient } from './client';
import { createBrowserRuntime } from './runtime';
import { beginAccountSignIn, consumeSignInReturn, type SignInHost } from './sign-in';
import { accountPath, parseAccountRoute } from './routes';
import { readWebAccountAccess } from './account-access';
import template from '../plugin/index.html?raw';
import './page-host.css';

const route = parseAccountRoute(new URL(location.href));
const target = route ? accountPath(route) : '/play/';
document.title = 'King Down';
document.body.replaceChildren();
function message(words: string, providers: readonly ('google' | 'github')[] = [], retry = false) {
  document.body.replaceChildren();
  const main = document.createElement('main'); main.className = 'account-entry';
  const title = document.createElement('h1'); title.textContent = 'King Down';
  const line = document.createElement('p'); line.textContent = words; line.setAttribute('role', 'status'); main.append(title, line);
  for (const provider of providers) {
    const button = document.createElement('button'); button.textContent = `Continue with ${provider === 'google' ? 'Google' : 'GitHub'}`;
    button.onclick = async () => {
      main.querySelectorAll('button').forEach(button => { button.disabled = true; });
      try { await beginAccountSignIn(provider, target, signInHost); }
      catch (error) { line.textContent = error instanceof Error ? error.message : String(error); main.querySelectorAll('button').forEach(button => { button.disabled = false; }); }
    };
    main.append(button);
  }
  if (retry) {
    const button = document.createElement('button'); button.textContent = 'Try again'; button.onclick = () => location.reload(); main.append(button);
  }
  const local = document.createElement('a'); local.href = '/'; local.textContent = 'Play on this device'; main.append(local);
  document.body.append(main);
}
message('Loading your games…');
let client: Promise<import('../account/client').Client> | undefined;
const getClient = () => client ??= import('../account/client').then(({ connect }) => connect(AUTH_KEY, { manualCallback: true }));
const signInHost: SignInHost = { location, history, storage: sessionStorage, now: Date.now, client: getClient };
async function signInMessage(words: string) {
  message('Checking sign-in options…');
  try {
    const providers = (await (await getClient()).providers()).filter(provider => provider !== 'facebook');
    message(providers.length ? words : 'Sign-in is temporarily unavailable. Try again later.', providers, !providers.length);
  } catch { message('Sign-in options could not load. Check your connection and try again.', [], true); }
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
      const host = createBrowserRuntime(api, session.userId); configureRuntime(host);
      await import('../account-game/runtime');
      auth.onSession(current => {
        if (current?.user.id === session.userId) return;
        host.dispose?.();
        void signInMessage('Sign in to play with your account.');
      });
    }
  }
} catch (error) { message(error instanceof Error ? error.message : 'Account play could not load.', [], true); }
