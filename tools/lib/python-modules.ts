import { execFileSync } from 'node:child_process';

// Python prints this line and exits 3 when a required module itself is missing. A module that a required module imports
// and that is missing is a broken install, not a missing module: Python then exits 1 and the probe fails.
const PROBE = `
import importlib, sys
for name in sys.argv[1:]:
    try:
        importlib.import_module(name)
    except ModuleNotFoundError as error:
        if error.name != name: raise
        print("missing " + name)
        sys.exit(3)
`;

/**
 * Whether python3 imports each module. A missing python3 or a missing module gives false (the caller skips its source
 * checks); any other fault throws, a time-out and a broken import included. Normal import of numpy and Pillow: 120 ms on
 * the M1.
 * shortcut: the 4 s limit is a guess with no measurement under the 16-process load; raise it if a loaded run times out.
 */
export function pythonModules(...modules: string[]): boolean {
  const start = Date.now();
  try {
    execFileSync('python3', ['-c', PROBE, ...modules], { stdio: 'pipe', encoding: 'utf8', timeout: 4000 });
    return true;
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { status: number | null; stdout?: string; stderr?: string };
    const missing = failure.code === 'ENOENT' ? 'python3' : failure.status === 3 ? failure.stdout?.trim().replace(/^missing /, '') : undefined;
    if (missing) {
      console.info(`Skip source export: Python ${missing} is not available. Shipped asset checks still run.`);
      return false;
    }
    if (failure.code === 'ETIMEDOUT') throw new Error(`python3 did not import ${modules.join(', ')} in ${Date.now() - start} ms (limit 4000 ms)`);
    throw new Error(`python3 cannot import ${modules.join(', ')}: ${failure.stderr?.trim() || failure.message}`);
  }
}
