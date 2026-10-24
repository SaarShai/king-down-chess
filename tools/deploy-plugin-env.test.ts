import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { PRODUCTION_SUPABASE_REF, PRODUCTION_SUPABASE_URL, STAGING_ORIGIN, STAGING_SUPABASE_REF, STAGING_SUPABASE_URL } from './staging-config.mjs';

const script = join(__dirname, 'deploy-plugin-env.mjs');
const root = mkdtempSync(join(tmpdir(), 'kd-plugin-env-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const password = 'fake-db-password-9f2c';
const secret = 'fake-internal-secret-0123456789abcdefghij';
const publishable = 'sb_publishable_test';
const legacyClient = 'a6478e14-9e9a-43a7-a4b7-b888aed30791';
const siteClient = '11111111-2222-4333-8444-555555555555';
const pooler = 'aws-0-us-east-2.pooler.supabase.com';
const database = (user: string, host = pooler) => `postgresql://${user}:${password}@${host}:6543/postgres?sslmode=require`;
const productionDatabase = database(`kingdown_plugin_runtime.${PRODUCTION_SUPABASE_REF}`);
const production = (target: string): Record<string, string> => ({
  KINGDOWN_PLUGIN_ORIGIN: target === 'website' ? 'https://kingdown.dev' : 'https://kingdown-plugin.vercel.app',
  SUPABASE_URL: PRODUCTION_SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: publishable,
  KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: target === 'website' ? siteClient : legacyClient,
  KINGDOWN_PLUGIN_DATABASE_URL: productionDatabase,
  KINGDOWN_PLUGIN_OAUTH_READY: '1',
  KINGDOWN_INTERNAL_SECRET: secret,
});

let count = 0;
function run(text: string, { mode = 0o600, target = 'plugin' } = {}) {
  const dir = join(root, `case-${count++}`);
  const file = `${dir}.env`;
  const out = `${dir}.out`;
  writeFileSync(file, text, { mode });
  // The create mode is lowered by the umask, so set it again.
  chmodSync(file, mode);
  const result = spawnSync(process.execPath, [script, file, out, target], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  return { ...result, out, output: `${result.stdout}${result.stderr}` };
}
const lines = (values: Record<string, string>) => Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n';

function refused(text: string, hidden: string[], options?: { mode?: number; target?: string }) {
  const result = run(text, options);
  expect(result.status).toBe(1);
  expect(existsSync(result.out)).toBe(false);
  expect(result.stdout).toBe('');
  expect(result.stderr).toMatch(/^deploy: /);
  for (const value of hidden) expect(result.output).not.toContain(value);
}

describe('deploy-plugin-env.mjs', () => {
  for (const target of ['plugin', 'website']) {
    it(`accepts the production values for target ${target}, stages one private file per key and prints no value`, () => {
      const values = production(target);
      const result = run(lines(values), { target });
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('7 server environment values validated; values withheld');
      expect(result.output).not.toContain(secret);
      expect(result.output).not.toContain(password);
      expect(result.output).not.toContain(publishable);
      expect(statSync(result.out).mode & 0o777).toBe(0o700);
      expect(readdirSync(result.out).sort()).toEqual(Object.keys(values).sort());
      for (const [key, value] of Object.entries(values)) {
        expect(statSync(join(result.out, key)).mode & 0o777).toBe(0o600);
        expect(readFileSync(join(result.out, key), 'utf8')).toBe(value);
      }
    });

    it(`refuses the staging origin for target ${target}`, () => {
      refused(lines({ ...production(target), KINGDOWN_PLUGIN_ORIGIN: STAGING_ORIGIN }), [STAGING_ORIGIN, secret, password], { target });
    });
  }

  it('refuses the staging Supabase URL', () => {
    refused(lines({ ...production('plugin'), SUPABASE_URL: STAGING_SUPABASE_URL }), [STAGING_SUPABASE_URL, STAGING_SUPABASE_REF, secret, password]);
  });

  it('refuses a staging database URL', () => {
    const urls = [
      database(`kingdown_plugin_runtime.${STAGING_SUPABASE_REF}`),
      database('kingdown_plugin_runtime', `db.${STAGING_SUPABASE_REF}.supabase.co`),
      database(`kingdown_plugin_runtime.${STAGING_SUPABASE_REF}`, `db.${STAGING_SUPABASE_REF}.supabase.co`),
      database('kingdown_plugin_runtime', `db.${PRODUCTION_SUPABASE_REF}.supabase.co`),
    ];
    for (const url of urls) refused(lines({ ...production('plugin'), KINGDOWN_PLUGIN_DATABASE_URL: url }), [url, STAGING_SUPABASE_REF, secret, password]);
  });

  it('refuses a file mode other than 600', () => {
    for (const mode of [0o644, 0o640, 0o700, 0o400]) refused(lines(production('plugin')), [secret, password], { mode });
  });

  it('refuses an unknown key, a duplicate key, and a missing key', () => {
    const base = production('plugin');
    refused(lines(base) + 'UNKNOWN_KEY=fake-unknown-value\n', ['fake-unknown-value', secret, password]);
    refused(lines(base) + `KINGDOWN_INTERNAL_SECRET=${secret}-second\n`, [`${secret}-second`, secret, password]);
    const { KINGDOWN_INTERNAL_SECRET: _omitted, ...missing } = base;
    refused(lines(missing), [password]);
  });

  it('refuses mail keys', () => {
    for (const key of ['RESEND_API_KEY', 'KINGDOWN_MAIL_FROM']) {
      const value = 'fake-mail-value-123';
      refused(lines(production('plugin')) + `${key}=${value}\n`, [value, secret, password]);
    }
  });

  it('refuses a short internal secret and a wrong client id', () => {
    refused(lines({ ...production('plugin'), KINGDOWN_INTERNAL_SECRET: 'fake-short-secret' }), ['fake-short-secret', password]);
    refused(lines({ ...production('plugin'), KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: siteClient }), [siteClient, secret, password]);
  });
});
