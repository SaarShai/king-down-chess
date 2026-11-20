import { afterEach, expect, it, vi } from 'vitest';
import { loadConfigFromFile } from 'vite';
import { fileURLToPath } from 'node:url';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it.each([undefined, '0', '1'])('includes the test pages only with KINGDOWN_TEST_PAGES=1 (%s)', async value => {
  vi.stubEnv('KINGDOWN_TEST_PAGES', value); vi.resetModules();
  const { config } = (await loadConfigFromFile({ command: 'build', mode: 'production' }, fileURLToPath(new URL('../../../../vite.config.ts', import.meta.url))))!;
  expect(Object.keys(config.build!.rollupOptions!.input!)).toEqual(value === '1' ? ['index', 'next', 'people', 'moments', 'play-scenes'] : ['index', 'next']);
});
