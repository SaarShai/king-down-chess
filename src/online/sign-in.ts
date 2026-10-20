import type { Client } from '../account/client';
import type { AccountSession } from '../account/session';
import { accountPath, parseAccountRoute, type AccountEntryRoute } from './routes';

const FLOW_KEY = 'kingdown.account-signin';
const MAX_AGE_MS = 600_000;
const FLOW = /^[A-Za-z0-9_-]{8,64}$/;
const CALLBACK_FIELDS = ['code', 'sb_flow_id', 'error', 'error_code', 'error_description', 'state', 'access_token', 'refresh_token', 'provider_token', 'provider_refresh_token', 'expires_in', 'expires_at', 'token_type', 'type'];

export type SignInHost = {
  location: Pick<Location, 'href' | 'assign'>;
  history: Pick<History, 'state' | 'replaceState'>;
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  now: () => number;
  client: () => Promise<Pick<Client, 'startAccountSignIn' | 'finishAccountSignIn'>>;
};

function targetRoute(target: unknown, origin: string): AccountEntryRoute | undefined {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || target.length > 400 || /[\\\s]/.test(target)) return;
  const path = target.split(/[?#]/)[0];
  // Check the raw path before URL removes dot segments.
  if (/%/.test(path) || /(?:^|\/)\.{1,2}(?:\/|$)/.test(path)) return;
  const url = new URL(target, origin);
  if (url.origin !== origin || url.username || url.password) return;
  return parseAccountRoute(url);
}

export async function beginAccountSignIn(provider: 'google' | 'github', target: string, host: SignInHost): Promise<void> {
  const route = targetRoute(target, new URL(host.location.href).origin);
  if (!route || (provider !== 'google' && provider !== 'github')) throw new TypeError('Invalid sign-in target');
  host.storage.removeItem(FLOW_KEY);
  const { url, flowId } = await (await host.client()).startAccountSignIn(provider);
  const created = host.now();
  if (!FLOW.test(flowId) || !Number.isFinite(created)) throw new TypeError('Sign-in did not start');
  host.storage.setItem(FLOW_KEY, JSON.stringify({ flow: flowId, target: accountPath(route), created }));
  host.location.assign(url);
}

export type SignInReturn =
  | { status: 'none' }
  | { status: 'retry'; reason?: 'expired' }
  | { status: 'signed-in'; session: AccountSession; route: AccountEntryRoute };

export async function consumeSignInReturn(host: SignInHost): Promise<SignInReturn> {
  const url = new URL(host.location.href), query = url.searchParams, fragment = new URLSearchParams(url.hash.slice(1));
  if (!CALLBACK_FIELDS.some(key => query.has(key) || fragment.has(key))) return { status: 'none' };
  const retry = { status: 'retry' } as const;
  let stored: string | null = null, cleared = true;
  // Clear the address and consume the tab record before the SDK starts.
  try { host.history.replaceState(host.history.state, '', '/play/'); }
  catch { cleared = false; }
  try { stored = host.storage.getItem(FLOW_KEY); } catch { cleared = false; }
  try { host.storage.removeItem(FLOW_KEY); } catch { cleared = false; }
  if (!cleared || !stored || url.pathname !== '/play/' || url.username || url.password) return retry;
  try {
    const record = JSON.parse(stored);
    if (!record || typeof record !== 'object' || Array.isArray(record) || Object.keys(record).length !== 3
      || typeof record.flow !== 'string' || !FLOW.test(record.flow) || typeof record.created !== 'number') return retry;
    const age = host.now() - record.created, route = targetRoute(record.target, url.origin);
    if (!Number.isFinite(age) || age < 0 || !route) return retry;
    if (query.getAll('code').length !== 1 || !query.get('code') || query.getAll('sb_flow_id').length !== 1
      || query.get('sb_flow_id') !== record.flow || CALLBACK_FIELDS.some(key => fragment.has(key))
      || CALLBACK_FIELDS.some(key => key !== 'code' && key !== 'sb_flow_id' && query.has(key))) return retry;
    if (age > MAX_AGE_MS) return { status: 'retry', reason: 'expired' };
    const session = await (await host.client()).finishAccountSignIn(query.get('code')!, record.flow);
    host.history.replaceState(host.history.state, '', accountPath(route));
    return { status: 'signed-in', session, route };
  } catch { return retry; }
}
