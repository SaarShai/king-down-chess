import { expect, it } from 'vitest';
import { productionDatabase, stagingConfig, PRODUCTION_ORIGINS, STAGING_ORIGIN, STAGING_SUPABASE_URL, STAGING_SUPABASE_REF } from './staging-config.mjs';
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

const caseAndDot = (ref: string) => [
  ['SUPABASE_URL', `https://${ref.toUpperCase()}.SUPABASE.CO`], ['SUPABASE_URL', `https://${ref}.supabase.co.`],
  ['db', `postgresql://postgres:fake@DB.${ref.toUpperCase()}.SUPABASE.CO/postgres?sslmode=require`], ['db', `postgresql://postgres:fake@db.${ref}.supabase.co./postgres?sslmode=require`],
  ['db', `postgresql://postgres:fake@db.${ref}%2Esupabase.co/postgres?sslmode=require`], ['db', `postgresql://postgres.${ref.toUpperCase()}:fake@aws-0-us-west-2.pooler.supabase.com/postgres?sslmode=require`],
  ['db', `postgresql://postgres%2E${ref}:fake@aws-0-us-west-2.pooler.supabase.com/postgres?sslmode=require`], ['db', `postgresql://postgres.${ref}:fake@AWS-0-US-WEST-2.POOLER.SUPABASE.COM./postgres?sslmode=require`],
] as const;
it.each(caseAndDot(STAGING_SUPABASE_REF))('production refuses the staging target %s=%s in any case, with a trailing dot or percent-encoded', (key, value) => {
  expect(() => key === 'db' ? production({}, 'https://kingdown.dev', value) : production({ [key]: value })).toThrow('Production refuses the staging project');
});
it.each(caseAndDot('utqzovjmclfyojedmwok'))('staging refuses the production target %s=%s in any case, with a trailing dot or percent-encoded', (key, value) => {
  expect(() => key === 'db' ? check({}, STAGING_ORIGIN, value) : check({ [key]: value })).toThrow('Staging refuses the production project');
});
it('production accepts its own targets in any case or with a trailing dot', () => {
  for (const [key, value] of caseAndDot('utqzovjmclfyojedmwok')) expect(key === 'db' ? production({}, 'https://kingdown.dev', value) : production({ [key]: value })).toBe(false);
  expect(production({}, 'https://KINGDOWN.DEV.')).toBe(false);
  expect(() => production({}, 'https://KINGDOWN-STAGING.VERCEL.APP.')).toThrow('Production refuses the staging project');
});
it('production requires its own Supabase project, origin and database', () => {
  for (const SUPABASE_URL of [undefined, '', 'https://another.supabase.co', 'http://utqzovjmclfyojedmwok.supabase.co', 'https://utqzovjmclfyojedmwok.supabase.co/path', 'https://utqzovjmclfyojedmwok.supabase.co..']) expect(() => production({ SUPABASE_URL })).toThrow('Production requires its Supabase project');
  for (const origin of ['https://other.vercel.app', 'http://127.0.0.1:3100']) expect(() => production({}, origin)).toThrow('Production requires a production origin');
  for (const db of ['postgresql://postgres:fake@db.another.supabase.co/postgres', 'postgresql://postgres:fake@db.example.com/postgres', 'postgresql://postgres.utqzovjmclfyojedmwok:fake@example.com/postgres', 'postgresql://postgres:fake@aws-0-us-west-2.pooler.supabase.com/postgres', 'postgresql://postgres.another:fake@aws-0-us-west-2.pooler.supabase.com/postgres', 'postgresql://postgres:fake@127.0.0.1/kingdown_test']) expect(() => production({}, 'https://kingdown.dev', db)).toThrow('Production requires its Supabase database');
});
it('local development skips only the production targets', () => {
  const local = (SUPABASE_URL: string | undefined, db: string) => stagingConfig({ SUPABASE_URL }, { publicOrigin: 'http://127.0.0.1:3100', database: new URL(db), localDev: true });
  expect(local(undefined, 'postgresql://postgres:fake@127.0.0.1/kingdown_test')).toBe(false);
  expect(() => local(STAGING_SUPABASE_URL.toUpperCase(), 'postgresql://postgres:fake@127.0.0.1/kingdown_test')).toThrow('Production refuses the staging project');
});
it('the publish database check accepts only the production project and refuses staging and loopback targets', () => {
  for (const [, value] of caseAndDot('utqzovjmclfyojedmwok').filter(([key]) => key === 'db')) expect(() => productionDatabase(new URL(value))).not.toThrow();
  expect(() => productionDatabase(new URL(productionPooler))).not.toThrow();
  for (const db of [direct, `postgresql://kingdown_plugin_runtime.${STAGING_SUPABASE_REF}:fake@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require`,
    'postgresql://kingdown_test@127.0.0.1:55432/kingdown_test', 'postgresql://postgres@localhost/postgres', 'postgresql://postgres@[::1]/postgres',
    'postgresql://postgres.utqzovjmclfyojedmwok:fake@127.0.0.1/postgres', 'postgresql://postgres.utqzovjmclfyojedmwok:fake@db.example/postgres']) expect(() => productionDatabase(new URL(db))).toThrow('Production requires its Supabase database');
});
