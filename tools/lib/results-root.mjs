import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Machines without a card configuration (M1 and Kaggle) keep a local spool.
export function resultsRoot(configFile = join(homedir(), '.config/king-down/results.json')) {
  if (process.env.KING_DOWN_RESULTS_DIR) return process.env.KING_DOWN_RESULTS_DIR;
  const file = configFile;
  if (!existsSync(file)) return 'sim/out';
  const config = JSON.parse(readFileSync(file, 'utf8'));
  try {
    const info = execFileSync('/usr/sbin/diskutil', ['info', '-plist', config.volume]);
    const uuid = execFileSync('/usr/bin/plutil', ['-extract', 'VolumeUUID', 'raw', '-o', '-', '-'], { input: info, encoding: 'utf8' }).trim();
    if (uuid !== config.uuid || !existsSync(config.root)) throw new Error('wrong or missing card');
  } catch {
    throw new Error('Connect card disk for King Down results; no local fallback');
  }
  return config.root;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(resultsRoot());
