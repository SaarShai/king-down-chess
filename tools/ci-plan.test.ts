// KINGDOWN_TEST_WEB_ONLY=1 in `npm run test:changed` (tools/ci-plan.mjs tests): it leaves out the plugin
// test files for a web-only change, and CI refuses it.
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { webOnly } from './ci-plan.mjs';

const tests = ['src/interface/play/texts.test.ts', 'tools/plugin-app.test.ts', 'src/plugin/screens/setup.test.ts',
  'tools/release/release.test.ts', 'tools/plugin/x.test.ts', 'src/render/plugin-like.test.ts'];

it('leaves out only tools/plugin-*.test.ts and the test files under src/plugin/', () => {
  expect(webOnly(tests, { KINGDOWN_TEST_WEB_ONLY: '1' })).toEqual({
    tests: ['src/interface/play/texts.test.ts', 'tools/release/release.test.ts', 'tools/plugin/x.test.ts', 'src/render/plugin-like.test.ts'],
    dropped: ['tools/plugin-app.test.ts', 'src/plugin/screens/setup.test.ts'],
  });
});

it('changes nothing without the variable', () => {
  expect(webOnly(tests, {})).toEqual({ tests, dropped: [] });
  expect(webOnly(tests, { KINGDOWN_TEST_WEB_ONLY: '' })).toEqual({ tests, dropped: [] });
});

it('refuses the variable when CI is set', () => {
  expect(() => webOnly(tests, { KINGDOWN_TEST_WEB_ONLY: '1', CI: 'true' })).toThrow(/refused when CI is set/);
  // The script stops before any git or npm call.
  const result = spawnSync('node', ['tools/ci-plan.mjs', 'tests'], {
    encoding: 'utf8', timeout: 15_000, env: { ...process.env, CI: 'true', KINGDOWN_TEST_WEB_ONLY: '1' },
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('KINGDOWN_TEST_WEB_ONLY is refused when CI is set');
  expect(result.stdout).not.toContain('Run ');
});
