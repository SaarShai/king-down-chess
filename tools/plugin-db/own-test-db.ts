/** A test file's own disposable database: the name of PLUGIN_TEST_DATABASE_URL with `_<suffix>` before `_test`, made if
 * absent, then given every migration (bootstrap-test.mjs). Test files run at the same time on the shared database, so a
 * test that ends every due game (a sweep), sets a deadline in the past, or changes the schema (also grants and role
 * drops) uses its own copy. */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

export async function ownTestDatabase(suffix: string, shared = process.env.PLUGIN_TEST_DATABASE_URL ?? ''): Promise<URL> {
 const url = new URL(shared);
 if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !/^\/[a-z0-9_]+_test$/.test(url.pathname) || !/^[a-z0-9]+$/.test(suffix)) throw new Error('Database tests require a disposable loopback database ending in _test');
 const own = new URL(url.href), name = url.pathname.slice(1).replace(/_test$/, `_${suffix}_test`); own.pathname = `/${name}`;
 const server = new URL(url.href); server.pathname = '/postgres';
 const client = new pg.Client({ connectionString: server.href }); await client.connect();
 try { if (!(await client.query('select from pg_database where datname=$1', [name])).rowCount) await client.query(`create database ${name}`); }
 finally { await client.end(); }
 execFileSync(process.execPath, [fileURLToPath(new URL('./bootstrap-test.mjs', import.meta.url))], { env: { ...process.env, PLUGIN_TEST_DATABASE_URL: own.href } });
 return own;
}
