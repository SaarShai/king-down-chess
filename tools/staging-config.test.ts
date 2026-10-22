import { expect, it } from 'vitest';
import { stagingConfig, PRODUCTION_ORIGINS, STAGING_ORIGIN, STAGING_SUPABASE_URL, STAGING_SUPABASE_REF } from './staging-config.mjs';
const env = { KINGDOWN_STAGE: 'staging', SUPABASE_URL: STAGING_SUPABASE_URL };
const direct = `postgresql://kingdown_plugin_runtime:fake@db.${STAGING_SUPABASE_REF}.supabase.co/postgres?sslmode=require`;
const check = (changes = {}, publicOrigin = STAGING_ORIGIN, db = direct) => stagingConfig({ ...env, ...changes }, { publicOrigin, database: new URL(db) });
it('opens only the explicit stage with its fixed origin and database', () => {
  expect(check()).toBe(true);
  expect(check({}, STAGING_ORIGIN, `postgresql://kingdown_plugin_runtime.${STAGING_SUPABASE_REF}:fake@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require`)).toBe(true);
  expect(() => check({ KINGDOWN_STAGE: undefined })).toThrow('Production refuses the staging project');
});
it.each(['production', 'preview', 'Staging'])('rejects unknown stage %s', KINGDOWN_STAGE => expect(() => check({ KINGDOWN_STAGE })).toThrow('KINGDOWN_STAGE'));
it.each(['https://kingdown.dev', 'https://kingdown.vercel.app', 'https://kingdown-plugin.vercel.app', 'https://other.vercel.app', 'http://127.0.0.1:3100'])('refuses other origin %s', origin => expect(() => check({}, origin)).toThrow(/production project|preview origin/));
it('rejects another Supabase project and database before any connection', () => {
  expect(() => check({ SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co' })).toThrow('production project');
  for (const db of ['postgresql://postgres:fake@db.utqzovjmclfyojedmwok.supabase.co/postgres?sslmode=require', 'postgresql://postgres.utqzovjmclfyojedmwok:fake@aws-0-us-west-2.pooler.supabase.com/postgres?sslmode=require', direct.replace('/postgres?', '/other?')]) expect(() => check({}, STAGING_ORIGIN, db)).toThrow(/production project|isolated Supabase database/);
  for (const db of [direct.replace('?sslmode=require', ''), `${direct}&sslrootcert=bad`, `${direct}#fragment`]) expect(() => check({}, STAGING_ORIGIN, db)).toThrow('sslmode=require');
});

const productionPooler = 'postgresql://kingdown_plugin_runtime.utqzovjmclfyojedmwok:fake@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require';
const production = (changes = {}, publicOrigin = 'https://kingdown.dev', db = productionPooler) => stagingConfig({ SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co', ...changes }, { publicOrigin, database: new URL(db) });
it.each([undefined, ''])('opens the production profile with KINGDOWN_STAGE=%s', KINGDOWN_STAGE => {
  for (const origin of PRODUCTION_ORIGINS) expect(production({ KINGDOWN_STAGE }, origin)).toBe(false);
  expect(production({ KINGDOWN_STAGE }, 'https://kingdown.dev', 'postgresql://postgres:fake@db.utqzovjmclfyojedmwok.supabase.co/postgres?sslmode=require')).toBe(false);
});
it('production refuses every staging target', () => {
  for (const SUPABASE_URL of [STAGING_SUPABASE_URL, `${STAGING_SUPABASE_URL}/`]) expect(() => production({ SUPABASE_URL })).toThrow('Production refuses the staging project');
  expect(() => production({}, STAGING_ORIGIN)).toThrow('Production refuses the staging project');
  for (const db of [direct, `postgresql://kingdown_plugin_runtime.${STAGING_SUPABASE_REF}:fake@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require`]) expect(() => production({}, 'https://kingdown.dev', db)).toThrow('Production refuses the staging project');
});
it('staging refuses every production target', () => {
  expect(() => check({}, STAGING_ORIGIN, productionPooler)).toThrow('Staging refuses the production project');
  for (const SUPABASE_URL of ['https://utqzovjmclfyojedmwok.supabase.co', 'https://utqzovjmclfyojedmwok.supabase.co/']) expect(() => check({ SUPABASE_URL })).toThrow('Staging refuses the production project');
  for (const origin of PRODUCTION_ORIGINS) expect(() => check({}, origin)).toThrow('Staging refuses the production project');
});

it('refuses administrator and other database roles for both connection routes', () => {
  for (const db of [direct.replace('kingdown_plugin_runtime:', 'postgres:'), direct.replace('kingdown_plugin_runtime:', 'other:'), `postgresql://postgres.${STAGING_SUPABASE_REF}:fake@aws-0-us-west-2.pooler.supabase.com/postgres?sslmode=require`, `postgresql://other.${STAGING_SUPABASE_REF}:fake@aws-0-us-west-2.pooler.supabase.com/postgres?sslmode=require`]) expect(() => check({}, STAGING_ORIGIN, db)).toThrow('restricted runtime user');
});
