import { expect, it } from 'vitest';
import { stagingConfig, STAGING_ORIGIN, STAGING_SUPABASE_URL, STAGING_SUPABASE_REF } from './staging-config.mjs';
const env = { KINGDOWN_STAGE: 'staging', SUPABASE_URL: STAGING_SUPABASE_URL };
const direct = `postgresql://postgres:fake@db.${STAGING_SUPABASE_REF}.supabase.co/postgres?sslmode=require`;
const check = (changes = {}, publicOrigin = STAGING_ORIGIN, db = direct) => stagingConfig({ ...env, ...changes }, { publicOrigin, database: new URL(db) });
it('opens only the explicit stage with its fixed origin and database', () => {
  expect(check()).toBe(true);
  expect(check({}, STAGING_ORIGIN, `postgresql://postgres.${STAGING_SUPABASE_REF}:fake@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require`)).toBe(true);
  expect(check({ KINGDOWN_STAGE: undefined })).toBe(false);
});
it.each(['production', 'preview', 'Staging'])('rejects unknown stage %s', KINGDOWN_STAGE => expect(() => check({ KINGDOWN_STAGE })).toThrow('KINGDOWN_STAGE'));
it.each(['https://kingdown.dev', 'https://kingdown.vercel.app', 'https://kingdown-plugin.vercel.app', 'https://other.vercel.app', 'http://127.0.0.1:3100'])('refuses other origin %s', origin => expect(() => check({}, origin)).toThrow(/production project|preview origin/));
it('rejects another Supabase project and database before any connection', () => {
  expect(() => check({ SUPABASE_URL: 'https://utqzovjmclfyojedmwok.supabase.co' })).toThrow('production project');
  for (const db of ['postgresql://postgres:fake@db.utqzovjmclfyojedmwok.supabase.co/postgres?sslmode=require', 'postgresql://postgres.utqzovjmclfyojedmwok:fake@aws-0-us-west-2.pooler.supabase.com/postgres?sslmode=require', direct.replace('/postgres?', '/other?')]) expect(() => check({}, STAGING_ORIGIN, db)).toThrow(/production project|isolated Supabase database/);
  for (const db of [direct.replace('?sslmode=require', ''), `${direct}&sslrootcert=bad`, `${direct}#fragment`]) expect(() => check({}, STAGING_ORIGIN, db)).toThrow('sslmode=require');
});

it('blocks known production targets even without the stage flag', () => {
  for (const SUPABASE_URL of ['https://utqzovjmclfyojedmwok.supabase.co', 'https://utqzovjmclfyojedmwok.supabase.co/']) expect(() => check({ KINGDOWN_STAGE: undefined, SUPABASE_URL })).toThrow('production project');
});
