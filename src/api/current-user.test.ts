import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationError, AuthenticationUnavailable } from '../plugin/auth';
import { createCurrentUserCheck } from './current-user';

const actor = 'abcdef01-1111-4111-8111-111111111111', token = 'private-test-token';
const config = { supabaseUrl: 'https://project.supabase.co', publishableKey: 'sb_publishable_test' };
const request = vi.fn<typeof fetch>();
beforeEach(() => { request.mockReset(); request.mockResolvedValue(Response.json({ id: actor })); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('current provider user', () => {
 it('checks the matching user at the fixed origin with a bounded request and no redirects', async () => {
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  await expect(createCurrentUserCheck(config, request)(token, actor)).resolves.toBeUndefined();
  expect(timeout).toHaveBeenCalledExactlyOnceWith(5000);
  expect(request).toHaveBeenCalledExactlyOnceWith('https://project.supabase.co/auth/v1/user', {
   headers: { apikey: config.publishableKey, Authorization: `Bearer ${token}` },
   signal: expect.any(AbortSignal), redirect: 'error',
  });
 });

 it('accepts a provider ID with upper-case letters and uses fetch by default', async () => {
  request.mockResolvedValueOnce(Response.json({ id: actor.toUpperCase() }));
  vi.stubGlobal('fetch', request);
  await expect(createCurrentUserCheck(config)(token, actor)).resolves.toBeUndefined();
  expect(request).toHaveBeenCalledTimes(1);
 });

 it.each([null, [], {}, { id: null }, { id: 12 }, { id: '' }, { id: '22222222-2222-4222-8222-222222222222' }])('refuses a missing, malformed or different user: %j', async user => {
  request.mockResolvedValueOnce(Response.json(user));
  await expect(createCurrentUserCheck(config, request)(token, actor)).rejects.toBeInstanceOf(AuthenticationError);
 });

 it.each([401, 403])('refuses a revoked or forbidden session (%s) without reading the provider body', async status => {
  const response = new Response(token, { status }), json = vi.spyOn(response, 'json');
  request.mockResolvedValueOnce(response);
  const error = await createCurrentUserCheck(config, request)(token, actor).catch(error => error);
  expect(error).toBeInstanceOf(AuthenticationError);
  expect(String(error)).not.toContain(token);
  expect(json).not.toHaveBeenCalled();
 });

 it.each([302, 307, 400, 408, 429, 500, 503])('gives a temporary failure for provider status %s', async status => {
  request.mockResolvedValueOnce(new Response(token, { status, headers: { Location: 'https://other.example/' } }));
  const error = await createCurrentUserCheck(config, request)(token, actor).catch(error => error);
  expect(error).toBeInstanceOf(AuthenticationUnavailable);
  expect(String(error)).not.toContain(token);
 });

 it('gives a temporary failure for a network or redirect error without its details', async () => {
  request.mockRejectedValueOnce(new TypeError(`Request failed: ${token}`));
  const error = await createCurrentUserCheck(config, request)(token, actor).catch(error => error);
  expect(error).toBeInstanceOf(AuthenticationUnavailable);
  expect(String(error)).not.toContain(token);
  expect(error.cause).toBeUndefined();
 });

 it('gives a temporary failure for malformed JSON without its contents', async () => {
  request.mockResolvedValueOnce(new Response(token));
  const error = await createCurrentUserCheck(config, request)(token, actor).catch(error => error);
  expect(error).toBeInstanceOf(AuthenticationUnavailable);
  expect(String(error)).not.toContain(token);
  expect(error.cause).toBeUndefined();
 });

 it('gives a temporary failure when the five-second signal ends the request', async () => {
  const controller = new AbortController();
  const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
  request.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => {
   options!.signal!.addEventListener('abort', () => reject(options!.signal!.reason), { once: true });
  }));
  const pending = createCurrentUserCheck(config, request)(token, actor);
  controller.abort(new DOMException(token, 'TimeoutError'));
  const error = await pending.catch(error => error);
  expect(timeout).toHaveBeenCalledExactlyOnceWith(5000);
  expect(error).toBeInstanceOf(AuthenticationUnavailable);
  expect(String(error)).not.toContain(token);
 });

 it.each([
  'http://project.supabase.co', 'http://127.0.0.1:54321', 'https://user:pass@project.supabase.co',
  'https://project.supabase.co/auth/v1', 'https://project.supabase.co?target=other',
  'https://project.supabase.co#other', 'not a URL',
 ])('refuses a provider URL outside the fixed HTTPS origin rule: %s', supabaseUrl => {
  expect(() => createCurrentUserCheck({ ...config, supabaseUrl }, request)).toThrow();
  expect(request).not.toHaveBeenCalled();
 });

 it('requires a publishable key before it makes a request', () => {
  expect(() => createCurrentUserCheck({ ...config, publishableKey: '' }, request)).toThrow('publishable key is required');
  expect(request).not.toHaveBeenCalled();
 });
});
