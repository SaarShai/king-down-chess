import { afterEach, expect, it, vi } from 'vitest';
import setup from './test-lock-guard';

afterEach(() => { vi.unstubAllEnvs(); });

it('stops a run with no lock mark and no docs mark, and names npm test', () => {
  vi.stubEnv('KINGDOWN_TEST_LOCKED', '');
  vi.stubEnv('KINGDOWN_TEST_DOCS', '');
  expect(setup).toThrow('run npm test');
});

it('lets a run through tools/test-lock.sh or npm run test:docs start', () => {
  vi.stubEnv('KINGDOWN_TEST_DOCS', '');
  vi.stubEnv('KINGDOWN_TEST_LOCKED', '1');
  expect(setup).not.toThrow();
  vi.stubEnv('KINGDOWN_TEST_LOCKED', '');
  vi.stubEnv('KINGDOWN_TEST_DOCS', '1');
  expect(setup).not.toThrow();
});
