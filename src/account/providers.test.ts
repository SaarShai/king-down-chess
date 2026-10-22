import { afterEach, expect, it, vi } from 'vitest';
import { availableProviders } from './providers';

const url = 'https://project.supabase.co', key = 'sb_publishable_test';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it('reads current public settings without a player token, cookies or cached values', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ external: { google: false, github: true, facebook: false } }))
    .mockResolvedValueOnce(Response.json({ external: { google: true, github: false, facebook: true, unknown: true } }));
  vi.stubGlobal('fetch', fetcher);
  expect(await availableProviders(url, key)).toEqual(['github']);
  expect(await availableProviders(url, key)).toEqual(['google', 'facebook']);
  expect(fetcher).toHaveBeenCalledWith(url + '/auth/v1/settings', { headers: { apikey: key }, credentials: 'omit', cache: 'no-store', redirect: 'error', signal: expect.any(AbortSignal) });
});

it('does not turn missing, false or truthy non-boolean settings into enabled providers', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ external: { google: 'true', github: 1, facebook: false, email: true } })));
  expect(await availableProviders(url, key)).toEqual([]);
});

it.each([null, {}, { external: null }, { external: [] }, { external: 'github' }])('rejects an invalid settings response: %j', async value => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(value)));
  await expect(availableProviders(url, key)).rejects.toThrow('Sign-in options could not load');
});

it.each(['http', 'network', 'json'] as const)('offers a safe retry after %s failure instead of returning a guessed provider', async fault => {
  vi.stubGlobal('fetch', fault === 'network' ? vi.fn().mockRejectedValue(new Error('private upstream detail'))
    : vi.fn().mockResolvedValue(new Response(fault === 'json' ? 'not-json' : 'private upstream detail', { status: fault === 'http' ? 503 : 200 })));
  await expect(availableProviders(url, key)).rejects.toThrow('Sign-in options could not load. Check your connection and try again.');
});

it('bounds a stalled provider request to five seconds', async () => {
  const signal = new AbortController().signal, timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(signal);
  vi.stubGlobal('fetch', vi.fn().mockImplementation((_url, options) => { expect(options.signal).toBe(signal); return Promise.reject(new DOMException('Timed out', 'TimeoutError')); }));
  await expect(availableProviders(url, key)).rejects.toThrow('Sign-in options could not load');
  expect(timeout).toHaveBeenCalledWith(5000); timeout.mockRestore();
});
