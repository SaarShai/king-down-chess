/** Apply server-match tables using a privileged connection, not the publishable Supabase key. */
import { readFile } from 'node:fs/promises';
import pg from 'pg';
const connectionString = process.env.PLUGIN_DATABASE_URL;
if (!connectionString) throw new Error('PLUGIN_DATABASE_URL is required');
const pool = new pg.Pool({connectionString,max:1});
try { for (const name of ['0002_matches.sql','0003_plugin_boards.sql','0004_plugin_board_recovery.sql']) await pool.query(await readFile(new URL(`../../supabase/migrations/${name}`,import.meta.url),'utf8')); console.log('Server match migration applied'); }
finally { await pool.end(); }
