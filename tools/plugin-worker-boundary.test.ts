import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

it('keeps exact worker bytes for card label and art edits, but changes them for mechanics', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const copy = await mkdtemp(join(tmpdir(), 'kingdown-worker-boundary-'));
  try {
    await mkdir(join(copy, 'tools'));
    await Promise.all([
      cp(join(root, 'src'), join(copy, 'src'), { recursive: true }),
      cp(join(root, 'tools/plugin-runtime-build.mjs'), join(copy, 'tools/plugin-runtime-build.mjs')),
      cp(join(root, 'package.json'), join(copy, 'package.json')),
      symlink(join(root, 'node_modules'), join(copy, 'node_modules'), 'dir'),
    ]);
    await writeFile(join(copy, 'probe.mjs'), `
import { writeFile } from 'node:fs/promises';
import { buildWorker } from './tools/plugin-runtime-build.mjs';
const { source, engine } = await buildWorker();
await writeFile(process.argv[2] + '.mjs', source);
await writeFile(process.argv[2] + '.json', JSON.stringify({ engine }));
`);
    const build = async (name: string) => {
      await promisify(execFile)(process.execPath, ['probe.mjs', name], { cwd: copy, timeout: 30_000, maxBuffer: 1_000_000 });
      return { source: await readFile(join(copy, name + '.mjs'), 'utf8'), engine: JSON.parse(await readFile(join(copy, name + '.json'), 'utf8')).engine as string };
    };
    const baseline = await build('baseline');
    const catalog = join(copy, 'src/content/cards.ts'), original = await readFile(catalog, 'utf8');
    const cosmetic = original.replace("name: 'Freeze',", "name: 'Cold Touch',").replace("art: 'ui/cards/freeze.webp'", "art: 'ui/cards/freeze-cosmetic-proof.webp'");
    expect(cosmetic).not.toBe(original);
    expect(cosmetic).toContain("name: 'Cold Touch'");
    expect(cosmetic).toContain("art: 'ui/cards/freeze-cosmetic-proof.webp'");
    await writeFile(catalog, cosmetic);
    const renamed = await build('cosmetic');
    expect({ sameBytes: renamed.source === baseline.source, engine: renamed.engine }).toEqual({ sameBytes: true, engine: baseline.engine });
    expect(baseline.source).not.toContain('ui/cards/freeze.webp');
    expect(baseline.source).not.toContain('card-freeze');

    const mechanics = join(copy, 'src/rules/engine.ts'), engine = await readFile(mechanics, 'utf8');
    const changed = engine.replace('export const HAND_MAX = 8;', 'export const HAND_MAX = 7;');
    expect(changed).not.toBe(engine);
    await writeFile(mechanics, changed);
    const enforcing = await build('mechanics');
    expect(enforcing.engine).not.toBe(renamed.engine);
    expect(enforcing.source === renamed.source).toBe(false);
  } finally { await rm(copy, { recursive: true, force: true }); }
}, 90_000);
