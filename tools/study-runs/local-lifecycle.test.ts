import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fake = vi.hoisted(() => ({ setup: vi.fn(), tick: vi.fn(), storage: vi.fn(), mkdir: vi.fn() }));
vi.mock('./coordinator', () => ({ createCoordinator: fake.setup }));
vi.mock('./bundle', () => ({ freezeRun: vi.fn(), loadBundle: vi.fn(), verifyBundle: vi.fn() }));
vi.mock('./backup', () => ({ backupRun: vi.fn() }));
vi.mock('./transports', () => ({ createTransports: vi.fn(() => ({})), execute: vi.fn() }));
vi.mock('../lib/results-root.mjs', () => ({ resultsRoot: fake.storage }));
vi.mock('node:child_process', () => ({ execFileSync: () => `${process.cwd()}/.git` }));
vi.mock('node:fs', async original => {
  const fs = await original<typeof import('node:fs')>();
  return { ...fs, mkdirSync: fake.mkdir, realpathSync: (path: string) => path,
    existsSync: (path: string) => path.endsWith('.maintenance.lock') ? false : true,
    readFileSync: (path: string, ...args: unknown[]) => path.endsWith('results.json') ? JSON.stringify({ root: '/card/results' }) : (fs.readFileSync as Function)(path, ...args),
  };
});
import { localStudio } from './local';
const settle = async () => { await vi.dynamicImportSettled(); for (let i = 0; i < 30; i++) await Promise.resolve(); };
let studio: ReturnType<typeof localStudio> | undefined;
beforeEach(() => {
  vi.useFakeTimers(); vi.stubEnv('KING_DOWN_RESULTS_DIR', '');
  fake.setup.mockReset().mockResolvedValue({ tick: fake.tick }); fake.tick.mockReset().mockResolvedValue(undefined);
  fake.storage.mockReset().mockReturnValue('/card/results'); fake.mkdir.mockClear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { studio?.close(); studio = undefined; vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it('checks saved runs without a browser request and checks once each minute', async () => {
  studio = localStudio(); await settle();
  expect(fake.setup).toHaveBeenCalledOnce(); expect(fake.tick).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(60000); expect(fake.tick).toHaveBeenCalledTimes(2);
});
it('retries failed startup no faster than one minute, including browser requests', async () => {
  fake.storage.mockImplementationOnce(() => { throw new Error('Card unavailable'); });
  studio = localStudio(); await settle(); expect(fake.storage).toHaveBeenCalledOnce();
  await expect(studio.getCoordinator()).rejects.toThrow('Card unavailable');
  await vi.advanceTimersByTimeAsync(59999); expect(fake.storage).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(1); await settle(); expect(fake.setup).toHaveBeenCalledOnce(); expect(fake.tick).toHaveBeenCalledOnce();
});
it('close prevents a late startup from checking or creating another timer', async () => {
  let resolve!: (coordinator: { tick: typeof fake.tick }) => void;
  fake.setup.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  studio = localStudio(); await settle(); studio.close();
  resolve({ tick: fake.tick }); await settle(); await vi.advanceTimersByTimeAsync(120000);
  expect(fake.tick).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  await expect(studio.getCoordinator()).rejects.toThrow('closed');
});
it('checks other saved runs while an earlier reconciliation is pending', async () => {
  let resolve!: () => void;
  fake.tick.mockImplementationOnce(() => new Promise<void>(done => { resolve = done; }));
  studio = localStudio(); await settle(); await vi.advanceTimersByTimeAsync(120000);
  expect(fake.tick).toHaveBeenCalledTimes(3); resolve(); await settle();
  await vi.advanceTimersByTimeAsync(60000); expect(fake.tick).toHaveBeenCalledTimes(4);
});
