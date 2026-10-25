/** Apply server-match tables using a privileged connection, not the publishable Supabase key. */
import { readFile } from 'node:fs/promises';
import pg from 'pg';
const connectionString = process.env.PLUGIN_DATABASE_URL;
if (!connectionString) throw new Error('PLUGIN_DATABASE_URL is required');
const pool = new pg.Pool({connectionString,max:1});
try { for (const name of ['0002_matches.sql','0003_plugin_boards.sql','0004_plugin_board_recovery.sql','0005_accounts_v2.sql','0006_games.sql','0007_jobs.sql','0008_accounts_safety.sql','0009_invite_tries.sql', '0010_game_setup.sql', '0011_matchmaking.sql', '0012_results.sql', '0013_player_settings.sql', '0014_plugin_tool_tries.sql', '0015_remove_email.sql', '0016_web_account_access.sql', '0017_setup_admission.sql', '0018_rating_policy.sql', '0019_client_errors.sql']) await pool.query(await readFile(new URL(`../../supabase/migrations/${name}`,import.meta.url),'utf8')); console.log('Server migrations 0002-0019 applied'); }
finally { await pool.end(); }
