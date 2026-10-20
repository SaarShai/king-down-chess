import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseWebAccountStatus, readWebAccountAccess } from './account-access';
import { withPrivateCachePolicy } from './cache-policy';

const closed = { enabled: false, expiresAt: 0 };
const json = (value: unknown, status = 200, type = 'application/json') => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': type } });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('account status contract', () => {
 it.each([1, 4999, 5000])('accepts an open lease of %s ms', valid_for_ms => {
  expect(parseWebAccountStatus({ account_access: 'open', valid_for_ms })).toEqual({ account_access: 'open', valid_for_ms });
 });
 it('accepts closed with no lease', () => {
  expect(parseWebAccountStatus({ account_access: 'closed', valid_for_ms: 0 })).toEqual({ account_access: 'closed', valid_for_ms: 0 });
 });
 it.each([undefined, null, [], 'open', {}, { account_access: 'other', valid_for_ms: 0 },
  { account_access: 'open' }, ...[0, -1, 5001, 1.5, NaN, Infinity, '5'].map(valid_for_ms => ({ account_access: 'open', valid_for_ms })),
  { account_access: 'closed', valid_for_ms: 1 }, { account_access: 'closed', valid_for_ms: 0, user_id: 'private' },
 ])('refuses malformed status %j', value => { expect(() => parseWebAccountStatus(value)).toThrow(TypeError); });

 it('sends public status without identity, credentials or referrer and uses request-start time', async () => {
  let now = 100; vi.spyOn(performance, 'now').mockImplementation(() => now);
  const fetch = vi.fn(async () => { now = 400; return json({ account_access: 'open', valid_for_ms: 1000 }); });
  vi.stubGlobal('fetch', fetch);
  expect(await readWebAccountAccess()).toEqual({ enabled: true, expiresAt: 1100 });
  expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/status', { cache: 'no-store', credentials: 'omit', referrer: '', referrerPolicy: 'no-referrer', redirect: 'error' });
 });
 it.each(['closed', 'invalid', 'expired', 'body-expired', 'http', 'missing', 'html', 'json', 'network'])('blocks private sends after %s status', async fault => {
  let now = 100; vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('fetch', vi.fn(async () => {
   if (fault === 'network') throw new TypeError('offline');
   if (fault === 'expired') now = 1100;
   const response = json(fault === 'closed' ? { account_access: 'closed', valid_for_ms: 0 } : fault === 'invalid' ? {} : { account_access: 'open', valid_for_ms: 1000 }, fault === 'http' ? 503 : fault === 'missing' ? 404 : 200, fault === 'html' ? 'text/html' : 'application/json');
   if (fault === 'json') return new Response('{broken', { headers: { 'Content-Type': 'application/json' } });
   if (fault === 'body-expired') response.json = async () => { now = 1100; return { account_access: 'open', valid_for_ms: 1000 }; };
   return response;
  }));
  const privateSend = vi.fn(), access = await readWebAccountAccess();
  if (access.enabled && performance.now() < access.expiresAt) privateSend();
  expect(access).toEqual(closed); expect(privateSend).not.toHaveBeenCalled();
 });
 it('starts the lease after worker proof and refuses a lease that ends during final proof', async () => {
  let now = 100; vi.spyOn(performance, 'now').mockImplementation(() => now);
  let reply!: () => void;
  const controller = Object.assign(new EventTarget(), { state: 'activated', postMessage: vi.fn((request, ports) => { reply = () => ports[0].postMessage({ ...request, policy: 'public-build-v1', version: 'test' }); }) });
  vi.stubGlobal('window', {});
  vi.stubGlobal('navigator', { serviceWorker: Object.assign(new EventTarget(), { controller, register: async () => ({ update: async () => {} }) }) });
  const fetch = vi.fn(async () => json({ account_access: 'open', valid_for_ms: 1000 })); vi.stubGlobal('fetch', fetch);
  const reading = readWebAccountAccess();
  await vi.waitFor(() => expect(controller.postMessage).toHaveBeenCalledOnce());
  now = 2000; reply();
  const access = await reading;
  expect(access).toEqual({ enabled: true, expiresAt: 3000 });
  const privateSend = vi.fn();
  const sending = withPrivateCachePolicy(() => { if (access.enabled && performance.now() < access.expiresAt) privateSend(); });
  await vi.waitFor(() => expect(controller.postMessage).toHaveBeenCalledTimes(2));
  now = 3000; reply(); await sending;
  expect(privateSend).not.toHaveBeenCalled(); expect(fetch).toHaveBeenCalledOnce();
 });
 it.each([true, false])('requires fresh proof after a controller change (safe replacement: %s)', async safe => {
  let reply!: () => void;
  const old = Object.assign(new EventTarget(), { state: 'activated', postMessage: vi.fn((request, ports) => { reply = () => ports[0].postMessage({ ...request, policy: 'public-build-v1', version: 'old' }); }) });
  const replacement = Object.assign(new EventTarget(), { state: 'activated', postMessage: vi.fn((request, ports) => ports[0].postMessage({ ...request, policy: safe ? 'public-build-v1' : 'unsafe', version: 'new' })) });
  const workers = Object.assign(new EventTarget(), { controller: old, register: async () => ({ update: async () => {} }) });
  vi.stubGlobal('window', {}); vi.stubGlobal('navigator', { serviceWorker: workers });
  const fetch = vi.fn(async () => json({ account_access: 'open', valid_for_ms: 1000 })); vi.stubGlobal('fetch', fetch);
  const reading = readWebAccountAccess();
  await vi.waitFor(() => expect(old.postMessage).toHaveBeenCalledOnce());
  workers.controller = replacement; workers.dispatchEvent(new Event('controllerchange')); reply();
  const access = await reading;
  expect(access.enabled).toBe(safe); if (!safe) expect(access).toEqual(closed);
  expect(replacement.postMessage).toHaveBeenCalledOnce(); expect(fetch).toHaveBeenCalledTimes(safe ? 1 : 0);
 });
});
