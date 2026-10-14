import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createCoordinator, type CoordinatorBundle } from './coordinator';
import { freezeRun, loadBundle, verifyBundle } from './bundle';
import { backupRun } from './backup';
import { createTransports, execute } from './transports';

/** Resolve the main checkout from Git, never from browser input. */
export function mainCheckout(sourceRoot: string): string {
  const common = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: sourceRoot, encoding: 'utf8' }).trim();
  const root = dirname(realpathSync(resolve(sourceRoot, common)));
  if (!existsSync(join(root, 'tools/lib/results-root.mjs'))) throw new Error('Main checkout is missing.');
  return root;
}
export async function studioStorage(mainRoot: string) {
  if (process.env.KING_DOWN_RESULTS_DIR) throw new Error('The local studio does not accept a results override.');
  const configPath = join(homedir(), '.config/king-down/results.json');
  if (!existsSync(configPath)) throw new Error('Configure and connect the King Down results card. No local fallback.');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  if (typeof config.root !== 'string' || !isAbsolute(config.root)) throw new Error('Invalid card results root.');
  const { resultsRoot } = await import(pathToFileURL(join(mainRoot, 'tools/lib/results-root.mjs')).href);
  const root = realpathSync(resultsRoot());
  if (root !== realpathSync(config.root)) throw new Error('Card results root differs from configuration.');
  const card = dirname(root), work = join(card, 'work/study-runs');
  const assertStorage = (): void => {
    if (process.env.KING_DOWN_RESULTS_DIR || realpathSync(resultsRoot()) !== root) throw new Error('Results card changed.');
    if (existsSync(join(card, '.maintenance.lock'))) throw new Error('Card maintenance is active. Wait for it to end.');
  };
  assertStorage();
  return { root, work, assertStorage };
}
const runtimeSetup = `import importlib.util,pathlib,sys,time
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('supervisor',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
root=pathlib.Path(sys.argv[2]);root.mkdir(parents=True,exist_ok=True)
node=m.ensure_runtime(root,sys.argv[3],time.monotonic()+600)
source=pathlib.Path(sys.argv[4]);m.unpack(pathlib.Path(sys.argv[5]),source)
print(node)
`;
export function localStudio(sourceRoot = process.cwd()) {
  let service: ReturnType<typeof createCoordinator> | undefined, timer: ReturnType<typeof setInterval> | undefined;
  async function start() {
    const mainRoot = mainCheckout(sourceRoot), storage = await studioStorage(mainRoot);
    storage.assertStorage(); mkdirSync(storage.work, { recursive: true });
    const coordinator = await createCoordinator({
      mainRoot, stateRoot: join(dirname(storage.root), 'state/study-runs'), resultsRoot: join(storage.root, 'study-runs'), assertStorage: storage.assertStorage,
      freeze: (document, target, id, directory) => freezeRun(document, target, id, sourceRoot, directory),
      verify: async (bundle, directory) => { const frozen = loadBundle(join(directory, 'bundle.json')); if (frozen.hash !== bundle.hash || frozen.id !== bundle.id) throw new Error('Frozen run differs from its receipt.'); },
      transports: createTransports(mainRoot), backup: (runId, directory) => backupRun({ runId, directory, mainRoot }),
      validate: async (bundle: CoordinatorBundle, _directories, directory) => {
        storage.assertStorage();
        const frozen = loadBundle(join(directory, 'bundle.json'));
        if (frozen.hash !== bundle.hash) throw new Error('Frozen run differs before validation.');
        const work = mkdtempSync(join(storage.work, 'report-')), source = join(work, 'source'); mkdirSync(source);
        try {
          const node = (await execute('python3', ['-c', runtimeSetup, join(sourceRoot, 'tools/study-runs/supervisor.py'), join(work, 'runtime'), frozen.nodeVersion, source, join(directory, 'source.tar.gz')], { timeout: 660000, maxBytes: 1024 * 1024 })).trim();
          if (!isAbsolute(node) || !node.startsWith(work + '/')) throw new Error('Runtime path is outside report work.');
          verifyBundle(frozen, source);
          const env = { ...process.env, PATH: `${dirname(node)}:${process.env.PATH ?? ''}` };
          await execute(node, [join(dirname(node), '../lib/node_modules/npm/bin/npm-cli.js'), 'ci', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: source, env, timeout: 600000, maxBytes: 1024 * 1024 });
          storage.assertStorage(); mkdirSync(join(directory, 'parts'), { recursive: true });
          const output = await execute(node, ['--import', 'tsx', 'src/sim/study-runner.ts', '--bundle', join(directory, 'bundle.json'), '--parts-directory', join(directory, 'parts'), '--out', directory], { cwd: source, env, timeout: 600000, maxBytes: 4 * 1024 * 1024 });
          const report = JSON.parse(output);
          if (!['passed', 'failed', 'incomplete'].includes(report.state) || !Number.isSafeInteger(report.games) || !Number.isSafeInteger(report.legalReplays) || !Number.isSafeInteger(report.illegalControls) || typeof report.message !== 'string') throw new Error('Invalid frozen report reply.');
          return report;
        } finally { rmSync(work, { recursive: true, force: true }); }
      },
    });
    timer = setInterval(() => { void coordinator.tick().catch(() => { console.warn('Local studio check stopped. Check the card and saved run state.'); }); }, 60000);
    timer.unref(); return coordinator;
  }
  return {
    getCoordinator() { if (!service) { service = start().catch(error => { service = undefined; throw error; }); } return service; },
    close() { if (timer) clearInterval(timer); },
  };
}
