import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000 });

function timeouts(file: string) {
  // Remove strings first: the Python programs contain their own calls and semicolons.
  const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    .replace(/(['"`])(?:\\.|(?!\1).)*\1/gs, '""');
  const calls = source.match(/\bexecFileSync\([\s\S]*?\);/g) ?? [];
  return calls.map(call => Number(call.match(/\btimeout:\s*([\d_]+)/)?.[1].replaceAll('_', '') ?? NaN));
}

describe('synchronous child limits', () => {
  it.each(['board', 'ios-size', 'motion', 'preview-size', 'real-host', 'ui-style'])('bounds the %s widget build below its hook or test limit', name => {
    const limits = timeouts(`plugin-${name}.test.ts`);
    expect(limits).toHaveLength(1);
    expect(limits[0]).toBeGreaterThan(0);
    expect(limits[0]).toBeLessThan(60_000);
  });

  it('bounds the migration child below the database test limit', () => {
    const limits = timeouts('plugin-db/migrations.db.test.ts');
    expect(limits).toHaveLength(1);
    expect(limits[0]).toBeGreaterThan(0);
    expect(limits[0]).toBeLessThan(120_000);
  });

  it.each(['results-store.test.ts', 'stone-control.test.ts'])('bounds both Python calls in %s below the default test limit', file => {
    const limits = timeouts(file);
    expect(limits).toHaveLength(2);
    for (const limit of limits) {
      expect(limit).toBeGreaterThan(0);
      expect(limit).toBeLessThan(5000);
    }
  });

  it('stops a child that does not end at a configured limit', () => {
    const timeout = timeouts('results-store.test.ts')[0];
    const start = Date.now();
    let failure: unknown;
    try { execFileSync(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeout }); }
    catch (error) { failure = error; }
    expect(failure).toMatchObject({ code: 'ETIMEDOUT', signal: 'SIGTERM' });
    console.log(`Child probe: ETIMEDOUT at ${timeout} ms; elapsed ${Date.now() - start} ms`);
  });
});
