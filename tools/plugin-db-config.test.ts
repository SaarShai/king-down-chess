import { X509Certificate } from 'node:crypto';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { pluginDatabaseConfig, testDatabase } from './plugin-db-config.mjs';

const url = 'postgresql://kingdown_plugin_runtime.project:p%40ss%2Fword@pooler.supabase.com:6543/postgres';

describe('plugin database TLS', () => {
  it('keeps the official CA and host checks in the actual pg connection settings', () => {
    const config = pluginDatabaseConfig(new URL(`${url}?sslmode=require`));
    expect(config).not.toHaveProperty('connectionString');
    const client = new pg.Client(config);
    expect(client.connectionParameters).toMatchObject({
      host: 'pooler.supabase.com', port: 6543, user: 'kingdown_plugin_runtime.project', password: 'p@ss/word', database: 'postgres',
      ssl: { ca: config.ssl.ca, rejectUnauthorized: true, servername: 'pooler.supabase.com' },
    });
    expect(client.connectionParameters.ssl.checkServerIdentity).toBeUndefined();
    const ca = new X509Certificate(client.connectionParameters.ssl.ca);
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
      expect(client.connectionParameters).toMatchObject({ host, port: 55432, database: 'kingdown_plugin_test', ssl: false });
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
    expect(() => testDatabase('postgresql://user:private-value@db.example/kingdown_test')).toThrow(/^Browser checks require a disposable loopback database ending in _test$/);
  });
});
