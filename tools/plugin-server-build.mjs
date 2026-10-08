/** Produce a dependency/source-free Node server or unlinked Vercel Build Output API tree. */
import { build } from 'vite';
import { builtinModules } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRuntime } from './plugin-runtime-build.mjs';

export async function buildPluginServer(outDir = resolve('plugin-server-dist'), { vercel = false } = {}) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const output = vercel ? resolve(outDir, '.vercel/output') : outDir;
  const functionDir = vercel ? resolve(output, 'functions/mcp.func') : output;
  await rm(output, { recursive: true, force: true });
  await mkdir(functionDir, { recursive: true });
  const boardDir = resolve(output, '.board-build');
  try {
    await promisify(execFile)(process.execPath, [resolve(root, 'tools/plugin-ui-build.mjs'), boardDir], { cwd: root, timeout: 60000, maxBuffer: 1_000_000 });
    await cp(resolve(boardDir, 'board.html'), resolve(functionDir, 'board.html'));
  } finally { await rm(boardDir, { recursive: true, force: true }); }
  await cp(resolve(root, 'src/plugin/consent.html'), resolve(functionDir, 'consent.html'));
  await build({ configFile: false, root, publicDir: false, logLevel: 'warn', build: { target: 'es2022', outDir: functionDir, emptyOutDir: false, minify: true, lib: { entry: resolve(root, 'src/plugin/consent.ts'), formats: ['es'], fileName: () => 'consent.mjs' }, rollupOptions: { output: { entryFileNames: 'consent.mjs', codeSplitting: false } } } });
  await buildRuntime(resolve(functionDir, 'runtime'));
  await build({
    configFile: false, root, publicDir: false, logLevel: 'warn', ssr: { noExternal: true },
    plugins: [{ name: 'isolated-match-runtime', enforce: 'pre', resolveId(source, importer) {
      if (!importer || !source.startsWith('.')) return;
      const path = resolve(dirname(importer), source);
      if ([resolve(root, 'src/match/index'), resolve(root, 'src/match/index.ts'), resolve(root, 'src/match')].includes(path)) return { id: './runtime/index.mjs', external: true };
    } }],
    build: {
      ssr: resolve(root, 'tools/plugin-server.mjs'), target: 'node20', outDir: functionDir, emptyOutDir: false, minify: true,
      rollupOptions: { external: [...builtinModules, ...builtinModules.map(name => `node:${name}`), 'pg-native'], output: { entryFileNames: 'server.mjs', codeSplitting: false } },
    },
  });
  await writeFile(resolve(functionDir, 'package.json'), JSON.stringify({ private: true, type: 'module', engines: { node: '>=20' } }) + '\n');
  if (vercel) {
    await writeFile(resolve(functionDir, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs24.x', handler: 'server.mjs', launcherType: 'Nodejs', maxDuration: 30, shouldAddHelpers: false }) + '\n');
    // Native function paths preserve metadata request targets without a catch-all rewrite.
    const discovery = resolve(output, 'functions/.well-known');
    await mkdir(resolve(discovery, 'oauth-protected-resource'), { recursive: true });
    await symlink('mcp.func', resolve(output, 'functions/authorize.func'));
    await symlink('mcp.func', resolve(output, 'functions/consent.mjs.func'));
    await symlink('../mcp.func', resolve(discovery, 'oauth-protected-resource.func'));
    await symlink('../../mcp.func', resolve(discovery, 'oauth-protected-resource/mcp.func'));
    await writeFile(resolve(output, 'config.json'), JSON.stringify({ version: 3 }) + '\n');
  }
  return output;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), vercel = args.includes('--vercel');
  if (args.filter(arg => !arg.startsWith('--')).length > 1 || args.some(arg => arg.startsWith('--') && arg !== '--vercel')) throw new Error('Usage: node tools/plugin-server-build.mjs [output] [--vercel]');
  const path = args.find(arg => !arg.startsWith('--'));
  console.log(await buildPluginServer(path ? resolve(path) : resolve(vercel ? 'plugin-deploy' : 'plugin-server-dist'), { vercel }));
}
