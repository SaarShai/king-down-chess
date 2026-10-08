// Validate the private input without shell evaluation. Values never enter command arguments.
import { lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const keys = ['KINGDOWN_PLUGIN_ORIGIN', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS', 'KINGDOWN_PLUGIN_DATABASE_URL', 'KINGDOWN_PLUGIN_OAUTH_READY'];
try {
  const [file, output, ...extra] = process.argv.slice(2);
  if (!file || !output || extra.length) throw new Error('expected a private environment file and output folder');
  const stat = lstatSync(file);
  if (!stat.isFile() || (stat.mode & 0o777) !== 0o600 || stat.uid !== process.getuid()) throw new Error('environment file must be owned by this user with mode 600');
  const values = new Map();
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const entry = /^([A-Z_]+)=(.+)$/.exec(line);
    if (!entry || !keys.includes(entry[1]) || values.has(entry[1])) throw new Error('use each of the six plugin keys once, as unquoted KEY=value lines');
    values.set(entry[1], entry[2]);
  }
  if (values.size !== keys.length) throw new Error('all six plugin keys are required');
  if (values.get(keys[0]) !== 'https://kingdown-plugin.vercel.app' || values.get(keys[1]) !== 'https://utqzovjmclfyojedmwok.supabase.co') throw new Error('plugin and Supabase origins must match the approved projects');
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(values.get(keys[2]))) throw new Error('use the Supabase publishable key');
  if (values.get(keys[3]) !== 'a6478e14-9e9a-43a7-a4b7-b888aed30791') throw new Error('use the registered ChatGPT OAuth client UUID');
  let db;
  try { db = new URL(values.get(keys[4])); } catch { throw new Error('invalid runtime database URL'); }
  if (!['postgres:', 'postgresql:'].includes(db.protocol) || db.username !== 'kingdown_plugin_runtime.utqzovjmclfyojedmwok' || db.hostname !== 'aws-0-us-east-2.pooler.supabase.com' || db.port !== '6543' || db.pathname !== '/postgres' || !db.password) throw new Error('use the approved runtime role and production pooler');
  if (db.hash || db.search !== '?sslmode=require') throw new Error('database URL must use exactly the sslmode=require query option');
  if (!['0', '1'].includes(values.get(keys[5]))) throw new Error('OAuth readiness must be 0 or 1');
  mkdirSync(output, { mode: 0o700 });
  for (const [key, value] of values) writeFileSync(`${output}/${key}`, value, { mode: 0o600, flag: 'wx' });
  console.log('deploy: six plugin environment values validated; values withheld');
} catch (error) {
  console.error(`deploy: ${error.code ? 'cannot read or stage the private environment file' : error.message}`);
  process.exit(1);
}
