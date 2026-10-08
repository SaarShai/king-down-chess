/** Apply server-match tables using a privileged connection, not the publishable Supabase key. */
import { readFile } from 'node:fs/promises';
import pg from 'pg';
const connectionString = process.env.PLUGIN_DATABASE_URL;
if (!connectionString) throw new Error('PLUGIN_DATABASE_URL is required');
const pool = new pg.Pool({connectionString,max:1});
try { await pool.query(await readFile(new URL('../../supabase/migrations/0002_matches.sql',import.meta.url),'utf8')); console.log('Server match migration applied'); }
finally { await pool.end(); }
