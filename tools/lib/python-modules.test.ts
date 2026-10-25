import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { pythonModules } from './python-modules';

// Each case puts its fake modules on PYTHONPATH. Python with only its standard library runs these cases.
let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'kd-python-modules-'));
  writeFileSync(join(dir, 'kd_broken_dep.py'), 'import kd_absent_dependency\n');
  writeFileSync(join(dir, 'kd_raises.py'), 'raise ValueError("bad build")\n');
  writeFileSync(join(dir, 'kd_slow.py'), 'import time\ntime.sleep(30)\n');
  vi.stubEnv('PYTHONPATH', dir);
});
afterAll(() => { vi.unstubAllEnvs(); rmSync(dir, { recursive: true, force: true }); });

it('gives true when each module imports', () => {
  expect(pythonModules('json', 'math')).toBe(true);
});

it('gives false when a required module is missing', () => {
  expect(pythonModules('json', 'kd_absent_module')).toBe(false);
});

it('fails when a required module imports a missing module (a broken install)', () => {
  expect(() => pythonModules('kd_broken_dep')).toThrow(/cannot import kd_broken_dep: .*kd_absent_dependency/s);
});

it('fails when a required module raises on import', () => {
  expect(() => pythonModules('kd_raises')).toThrow(/cannot import kd_raises: .*bad build/s);
});

it('fails with the measured time when the import passes the limit', () => {
  expect(() => pythonModules('kd_slow')).toThrow(/did not import kd_slow in \d+ ms \(limit 4000 ms\)/);
}, 15_000);
