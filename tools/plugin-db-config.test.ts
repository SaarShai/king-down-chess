import { X509Certificate } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { pluginDatabaseConfig, testDatabase } from './plugin-db-config.mjs';

// pg keeps the resolved settings in `connectionParameters`, which its types leave out.
const params = (client: pg.Client) => (client as pg.Client & { connectionParameters: any }).connectionParameters;

const url = 'postgresql://kingdown_plugin_runtime.project:p%40ss%2Fword@pooler.supabase.com:6543/postgres';

describe('plugin database TLS', () => {
  it.each(['5432', '6543', ''])('uses transaction pooling for a serverless Supabase connection (port %s)', port => {
    const db = new URL(`postgresql://kingdown_plugin_runtime.project:fake@aws-0-eu-west-1.pooler.supabase.com${port ? ':' + port : ''}/postgres?sslmode=require`);
    const serverless = new pg.Client(pluginDatabaseConfig(db, { serverless: true }));
    expect(params(serverless).port).toBe(6543);
    expect(params(serverless)).toMatchObject({ host: db.hostname, user: 'kingdown_plugin_runtime.project', ssl: { rejectUnauthorized: true, servername: db.hostname } });
    expect(db.port).toBe(port);
    expect(pluginDatabaseConfig(db).port).toBe(Number(port || 5432));
  });

  it('keeps direct and local database ports outside the Supabase transaction endpoint', () => {
    expect(pluginDatabaseConfig(new URL('postgresql://runtime:fake@db.project.supabase.co:5432/postgres?sslmode=require'), { serverless: true }).port).toBe(5432);
    expect(pluginDatabaseConfig(new URL('postgresql://runtime@localhost:55447/game_test'), { localDev: true, serverless: true }).port).toBe(55447);
  });

  it('keeps the official CA and host checks in the actual pg connection settings', () => {
    const config = pluginDatabaseConfig(new URL(`${url}?sslmode=require`));
    expect(config).not.toHaveProperty('connectionString');
    const client = new pg.Client(config);
    expect(params(client)).toMatchObject({
      host: 'pooler.supabase.com', port: 6543, user: 'kingdown_plugin_runtime.project', password: 'p@ss/word', database: 'postgres',
      ssl: { ca: config.ssl.ca, rejectUnauthorized: true, servername: 'pooler.supabase.com' },
    });
    expect(params(client).ssl.checkServerIdentity).toBeUndefined();
    const ca = new X509Certificate(params(client).ssl.ca);
    expect(ca.ca).toBe(true);
    expect(ca.verify(ca.publicKey)).toBe(true);
    expect(ca.fingerprint256.replaceAll(':', '')).toBe('807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA');
  });

  it('rejects query options that could replace TLS, credentials or the host', () => {
    for (const query of ['', '?sslmode=disable', '?sslmode=no-verify', '?ssl=true', '?sslmode=require&sslmode=disable', '?sslmode=require&uselibpqcompat=true', '?sslmode=require&sslrootcert=other.crt', '?sslmode=require&host=other.example', '?sslmode=require&user=postgres', '?sslmode=require#fragment']) {
      expect(() => pluginDatabaseConfig(new URL(url + query)), query).toThrow('Database URL');
    }
  });

  it('keeps loopback development without TLS and supports IPv6', () => {
    for (const [hostname, host] of [['127.0.0.1', '127.0.0.1'], ['[::1]', '::1']]) {
      const db = new URL(`postgresql://kingdown_test@${hostname}:55432/kingdown_plugin_test`);
      const client = new pg.Client(pluginDatabaseConfig(db, { localDev: true }));
      expect(params(client)).toMatchObject({ host, port: 55432, database: 'kingdown_plugin_test', ssl: false });
      db.search = '?sslmode=require';
      expect(() => pluginDatabaseConfig(db, { localDev: true })).toThrow('Database URL');
    }
  });
});

describe('browser check database guard', () => {
  it.each(['127.0.0.1', 'localhost', '[::1]'])('accepts a disposable database on %s', host => {
    const url = `postgresql://user:password@${host}/kingdown_test`;
    expect(testDatabase(url)).toBe(url);
    expect(testDatabase(url.replace('postgresql:', 'postgres:'))).toBe(url.replace('postgresql:', 'postgres:'));
  });

  it.each([
    undefined, '', 'bad-url', 'https://localhost/kingdown_test',
    'postgresql://db.example/kingdown_test', 'postgresql://localhost/kingdown',
    'postgresql://localhost/kingdown_test?host=db.example',
    'postgresql://localhost/kingdown_test?dbname=live',
    'postgresql://localhost/kingdown_test#fragment',
  ])('rejects an unsafe setting (%s)', value => {
    expect(() => testDatabase(value)).toThrow();
  });

  it('keeps a bad connection value out of the error', () => {
    expect(() => testDatabase('private-value')).toThrow(/^Expected a PostgreSQL connection URL$/);
    expect(() => testDatabase('postgresql://user:private-value@db.example/kingdown_test')).toThrow(/^Source tools and checks require a disposable loopback database ending in _test$/);
  });
});

describe('source operator entry guards', () => {
  const spy = fileURLToPath(new URL('./fixtures/operator-pool-guard.mjs', import.meta.url));
  for (const entry of ['tools/mod.ts', 'tools/plugin-db/seed-review.ts']) {
    for (const loader of ['tsx', 'import']) {
      it.each([
        'postgresql://user:private-target@db.example/kingdown_test',
        'postgresql://user:private-target@127.0.0.1/kingdown',
        'postgresql://user:private-target@127.0.0.1/kingdown_test?host=db.example',
        'postgresql://postgres:private-target@db.puhspsyjyzaghmgtkzqd.supabase.co/postgres?sslmode=require',
      ])(`refuses ${entry} through ${loader} before pool construction (%s)`, target => {
        const args = loader === 'tsx' ? ['node_modules/tsx/dist/cli.mjs'] : ['--import', 'tsx'];
        const run = spawnSync(process.execPath, [...args, '--import', spy, entry], {
          encoding: 'utf8', timeout: 15000,
          env: { PATH: process.env.PATH, PLUGIN_DATABASE_URL: target, KINGDOWN_ADMIN_DATABASE_URL: target, __KINGDOWN_STAGING_OPERATOR__: 'true',
            KINGDOWN_REVIEW_EMAIL: 'review@example.test', KINGDOWN_REVIEW_OPPONENT_EMAIL: 'friend@example.test' },
        });
        expect(run.error).toBeUndefined();
        expect(run.status).toBe(1);
        expect(run.stderr).toMatch(/disposable loopback database|no query or fragment/);
        expect(run.stderr).not.toMatch(/POOL_CONSTRUCTED|private-target|db\.example/);
        expect(run.stdout).toBe('');
      });
    }
  }
});
