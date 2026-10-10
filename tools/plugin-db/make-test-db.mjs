// Usage: node tools/plugin-db/make-test-db.mjs <name ending _test> — makes a disposable loopback test database if absent.
import pg from 'pg';
const name = process.argv[2];
if (!/^[a-z0-9_]+_test$/.test(name)) throw new Error('name must match ^[a-z0-9_]+_test$');
const c = new pg.Client({ host: '127.0.0.1', port: 55432, user: 'kingdown_test', database: 'postgres' });
await c.connect();
const { rowCount } = await c.query('select 1 from pg_database where datname=$1', [name]);
if (!rowCount) await c.query(`create database ${name}`);
console.log(rowCount ? 'exists' : 'created', name);
await c.end();
