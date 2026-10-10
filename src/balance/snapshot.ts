import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, sep } from 'node:path';

interface Snapshot { snapshotDate: string; files: { source: string; bytes: number; sha256: string }[] }
/** Verify the saved read-only copy. This function never contacts the source machine. */
export async function checkM1Snapshot(root: string, sources: { path: string; alias: string }[]) {
  const path = join(root, 'docs/balance/m1-snapshot.json');
  if (!existsSync(path)) return { checked: 0, errors: ['No M1 copy manifest. Remote source coverage is unknown.'] };
  const snapshot = JSON.parse(readFileSync(path, 'utf8')) as Snapshot;
  const errors: string[] = []; let checked = 0;
  for (const file of snapshot.files) {
    const source = sources.find(s => file.source.startsWith(s.alias + '/'));
    if (!source) { errors.push(`No selected source for ${file.source}.`); continue; }
    const base = resolve(source.path), local = resolve(base, file.source.slice(source.alias.length + 1));
    if (!local.startsWith(base + sep)) throw new Error('Snapshot path escapes its source.');
    if (!existsSync(local)) { errors.push(`Missing M1 copy: ${file.source}.`); continue; }
    const digest = createHash('sha256'); let bytes = 0;
    for await (const chunk of createReadStream(local)) { digest.update(chunk); bytes += chunk.length; }
    if (bytes !== file.bytes || digest.digest('hex') !== file.sha256) errors.push(`Changed M1 copy: ${file.source}.`);
    else checked++;
  }
  return { checked, errors };
}
