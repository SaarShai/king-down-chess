import type { Pool } from 'pg';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWebAccountAccess, WEB_ACCOUNT_ACCESS_TTL_MS } from './account-access';

describe('web account access proof', () => {
 let now: number;
 const query = vi.fn();
 const getter = () => createWebAccountAccess({ query } as unknown as Pool);
 const row = (enabled: boolean) => ({ rows: [{ singleton: true, enabled }] });
 beforeEach(() => {
  now = 100;
  query.mockReset();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
 });
 afterEach(() => { vi.restoreAllMocks(); });

 it.each([false, true])('caches enabled=%s from query start and refreshes at expiry', async enabled => {
  query.mockImplementation(async () => { now += 400; return row(enabled); });
  const access = getter(), expiresAt = now + WEB_ACCOUNT_ACCESS_TTL_MS;
  expect(await access()).toEqual({ enabled, expiresAt });
  now = expiresAt - 1;
  expect(await access()).toEqual({ enabled, expiresAt });
  expect(query).toHaveBeenCalledTimes(1);
  expect(query).toHaveBeenCalledWith('select singleton, enabled from public.web_account_access where singleton = true');
  now = expiresAt;
  expect(await access()).toEqual({ enabled, expiresAt: expiresAt + WEB_ACCOUNT_ACCESS_TTL_MS });
  expect(query).toHaveBeenCalledTimes(2);
 });

 it('shares each refresh and never serves the expired open proof', async () => {
  query.mockResolvedValueOnce(row(true));
  const access = getter();
  await access();
  now += WEB_ACCOUNT_ACCESS_TTL_MS;
  let finish!: (value: ReturnType<typeof row>) => void;
  query.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const first = access(), second = access();
  expect(query).toHaveBeenCalledTimes(2);
  finish(row(false));
  expect(await first).toEqual({ enabled: false, expiresAt: now + WEB_ACCOUNT_ACCESS_TTL_MS });
  expect(await second).toEqual(await first);
 });

 it('shares fresh reads before expiry and gives private calls the new proof', async () => {
  query.mockResolvedValueOnce(row(true));
  const access = getter();
  await access();
  now += WEB_ACCOUNT_ACCESS_TTL_MS - 1;
  let finish!: (value: ReturnType<typeof row>) => void;
  query.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const first = access(true), second = access(true);
  expect(query).toHaveBeenCalledTimes(2);
  finish(row(false));
  const expected = { enabled: false, expiresAt: now + WEB_ACCOUNT_ACCESS_TTL_MS };
  expect(await first).toEqual(expected);
  expect(await second).toEqual(expected);
  expect(await access()).toEqual(expected);
  expect(query).toHaveBeenCalledTimes(2);
 });

 it.each(['error', 'late'])('closes an unexpired proof when its fresh read is %s', async fault => {
  query.mockResolvedValueOnce(row(true));
  const access = getter();
  await access();
  now++;
  query.mockImplementationOnce(async () => {
   if (fault === 'error') throw new Error('Database is unavailable');
   now += WEB_ACCOUNT_ACCESS_TTL_MS;
   return row(true);
  });
  expect(await access(true)).toEqual({ enabled: false, expiresAt: 0 });
  expect(query).toHaveBeenCalledTimes(2);
 });

 it.each([5000, 5001])('refuses a refresh that takes %s ms and then reads a new state', async duration => {
  let finish!: (value: ReturnType<typeof row>) => void;
  query.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const access = getter(), pending = access();
  now += duration;
  const other = access();
  expect(query).toHaveBeenCalledTimes(1);
  finish(row(true));
  expect(await pending).toEqual({ enabled: false, expiresAt: 0 });
  expect(await other).toEqual({ enabled: false, expiresAt: 0 });
  query.mockResolvedValueOnce(row(false));
  expect(await access()).toEqual({ enabled: false, expiresAt: now + WEB_ACCOUNT_ACCESS_TTL_MS });
  expect(query).toHaveBeenCalledTimes(2);
 });

 it.each([
  [], [null], [{}], [{ singleton: false, enabled: true }], [{ singleton: true }],
  [{ singleton: true, enabled: 'true' }], [{ singleton: true, enabled: null }],
  [{ singleton: true, enabled: true }, { singleton: true, enabled: true }],
 ].map(rows => ({ rows })))('closes access for invalid rows: %j', async ({ rows }) => {
  query.mockResolvedValue({ rows });
  expect(await getter()()).toEqual({ enabled: false, expiresAt: 0 });
 });

 it.each(['42P01', '42501', '08006'])('drops an expired open proof after query error %s', async code => {
  query.mockResolvedValueOnce(row(true)).mockRejectedValueOnce(Object.assign(new Error('Query fails'), { code }));
  const access = getter();
  await access();
  now += WEB_ACCOUNT_ACCESS_TTL_MS;
  expect(await access()).toEqual({ enabled: false, expiresAt: 0 });
  query.mockResolvedValueOnce(row(false));
  expect(await access()).toEqual({ enabled: false, expiresAt: now + WEB_ACCOUNT_ACCESS_TTL_MS });
 });

 it('recovers after a query throws before it returns a promise', async () => {
  query.mockImplementationOnce(() => { throw new Error('Pool is closed'); }).mockResolvedValueOnce(row(true));
  const access = getter();
  expect(await access()).toEqual({ enabled: false, expiresAt: 0 });
  expect((await access()).enabled).toBe(true);
  expect(query).toHaveBeenCalledTimes(2);
 });

 it('does not let a caller change the cached proof', async () => {
  query.mockResolvedValue(row(false));
  const access = getter(), result = await access();
  result.enabled = true;
  result.expiresAt = Infinity;
  expect(await access()).toEqual({ enabled: false, expiresAt: now + WEB_ACCOUNT_ACCESS_TTL_MS });
 });
});
