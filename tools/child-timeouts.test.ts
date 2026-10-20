import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000 });

function timeouts(file: string) {
  const source = ts.createSourceFile(file, readFileSync(new URL(file, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
  const limits: number[] = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'execFileSync') {
      const options = node.arguments[2];
      const timeout = options && ts.isObjectLiteralExpression(options)
        ? options.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(source) === 'timeout')
        : undefined;
      limits.push(timeout && ts.isPropertyAssignment(timeout) ? Number(timeout.initializer.getText(source).replaceAll('_', '')) : NaN);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return limits;
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
