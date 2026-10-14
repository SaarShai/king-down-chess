import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { checkM1Snapshot } from './snapshot';

it('checks the local copy and reports changed or missing evidence without a network call', async () => {
  const root = mkdtempSync(join(tmpdir(), 'balance-snapshot-'));
  try {
    mkdirSync(join(root, 'docs/balance'), { recursive: true });
    const content = 'one game\n';
    writeFileSync(join(root, 'run.jsonl'), content);
    writeFileSync(join(root, 'docs/balance/m1-snapshot.json'), JSON.stringify({ snapshotDate: 'test', files: [{ source: 'out/run.jsonl', bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex') }] }));
    expect(await checkM1Snapshot(root, [{ alias: 'out', path: root }])).toEqual({ checked: 1, errors: [] });
    writeFileSync(join(root, 'run.jsonl'), 'changed');
    expect((await checkM1Snapshot(root, [{ alias: 'out', path: root }])).errors).toHaveLength(1);
    rmSync(join(root, 'run.jsonl'));
    expect((await checkM1Snapshot(root, [{ alias: 'out', path: root }])).errors[0]).toContain('Missing M1 copy');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
