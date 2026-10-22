import { expect, it } from 'vitest';
import { stagingOperatorDatabase } from './mod-config.mjs';
import { STAGING_SUPABASE_REF } from './staging-config.mjs';

it('uses verified TLS and the exact staging administrator identity', () => {
  for (const authority of [`postgres@db.${STAGING_SUPABASE_REF}.supabase.co:5432`, `postgres.${STAGING_SUPABASE_REF}@aws-0-us-west-2.pooler.supabase.com:6543`]) {
    const config = stagingOperatorDatabase(`postgresql://${authority}/postgres?sslmode=require`);
    expect(config).toMatchObject({ database: 'postgres', ssl: { rejectUnauthorized: true, servername: config.host } });
    expect(config.ssl.ca).toContain('BEGIN CERTIFICATE');
    expect(config).not.toHaveProperty('connectionString');
  }
});

it('keeps disposable loopback checks available without admitting a local live database', () => {
  const url = 'postgresql://tester@127.0.0.1:55432/operator_test';
  expect(stagingOperatorDatabase(url)).toEqual({ connectionString: url });
  expect(() => stagingOperatorDatabase(url.replace('operator_test', 'postgres'))).toThrow(/disposable loopback/);
});

it.each([
  'not a URL',
  'postgresql://postgres:private-value@db.utqzovjmclfyojedmwok.supabase.co/postgres?sslmode=require',
  'postgresql://postgres.utqzovjmclfyojedmwok:private-value@aws-0-us-west-2.pooler.supabase.com/postgres?sslmode=require',
  `postgresql://postgres:private-value@db.${STAGING_SUPABASE_REF}.supabase.co.evil.test/postgres?sslmode=require`,
  `postgresql://kingdown_plugin_runtime:private-value@db.${STAGING_SUPABASE_REF}.supabase.co/postgres?sslmode=require`,
  `postgresql://postgres:private-value@db.${STAGING_SUPABASE_REF}.supabase.co/other?sslmode=require`,
  `postgresql://postgres:private-value@db.${STAGING_SUPABASE_REF}.supabase.co/postgres`,
  `postgresql://postgres:private-value@db.${STAGING_SUPABASE_REF}.supabase.co/postgres?sslmode=require&host=evil.test`,
  `postgresql://postgres:private-value@db.${STAGING_SUPABASE_REF}.supabase.co/postgres?sslmode=require#fragment`,
  `https://postgres:private-value@db.${STAGING_SUPABASE_REF}.supabase.co/postgres?sslmode=require`,
  `postgresql://postgres:private-value@db.${STAGING_SUPABASE_REF}.supabase.co:1234/postgres?sslmode=require`,
])('refuses another database or connection override without leaking its URL (%#)', value => {
  let failure: unknown;
  try { stagingOperatorDatabase(value); } catch (error) { failure = error; }
  expect(failure).toBeInstanceOf(Error);
  expect(String(failure)).not.toMatch(/private-value|evil\.test|utqzov/);
});
