/** Produce a dependency/source-free Node server or unlinked Vercel Build Output API tree. With `site` (the
 *  built website), the tree is the whole of kingdown.dev: the static site plus the one function. */
import { build } from 'vite';
import { builtinModules } from 'node:module';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { cp, mkdir, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRuntime } from './plugin-runtime-build.mjs';
import { sourceErrorForms } from './lib/error-forms.mjs';
import { ART_HEADERS, ART_TYPES } from './plugin-art-headers.mjs';
import { STAGING_ORIGIN, STAGING_PROJECT_ID, STAGING_SUPABASE_URL } from './staging-config.mjs';

/** Site routes keep the domain challenge separate from the plugin function. */
export function vercelRoutes(site) {
  const routes = Object.entries(ART_TYPES).map(([type, contentType]) => ({ src: `^/plugin-art/[\\w-]+\\.${type}$`, headers: { ...ART_HEADERS, 'Content-Type': contentType }, continue: true }));
  if (site) {
    const challenge = resolve(site, '.well-known/openai-apps-challenge');
    if (existsSync(challenge)) {
      const token = readFileSync(challenge, 'utf8');
      if (!token || /\s/.test(token)) throw new Error('openai-apps-challenge must contain only the token, with no white space or final newline');
      routes.push({ src: '^/\\.well-known/openai-apps-challenge$', headers: { 'Content-Type': 'text/plain' }, continue: true });
    }
    routes.push({ src: '^/internal/.+$', dest: '/internal' });
    routes.push({ src: '^/api(?:/.*)?$', dest: '/mcp' });
    routes.push({ src: '^/(?:play(?:/.*)?|g/[^/]+/?|j/?)$', dest: '/index.html' });
  }
  return routes;
}

/** Only emitted site JavaScript paths can enter browser frames. */
export async function siteErrorAssets(site) {
  if (!site) return [];
  return (await readdir(resolve(site, 'assets'), { recursive: true, withFileTypes: true }))
    .filter(file => file.isFile() && file.name.endsWith('.js'))
    .map(file => '/assets/' + resolve(file.parentPath, file.name).slice(resolve(site, 'assets').length + 1)).sort();
}

export async function buildPluginServer(outDir = resolve('plugin-server-dist'), { vercel = false, site } = {}) {
  vercel ||= Boolean(site);
  const routes = vercel ? vercelRoutes(site) : [];
  const staging = process.env.KINGDOWN_STAGE === 'staging';
  if (staging && (!site || process.env.VITE_KINGDOWN_STAGE !== 'staging' || process.env.VITE_SUPABASE_URL !== STAGING_SUPABASE_URL || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''))) throw new Error('Staging build requires explicit isolated browser settings and the combined site');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const output = vercel ? resolve(outDir, '.vercel/output') : outDir;
  const functionDir = vercel ? resolve(output, 'functions/mcp.func') : output;
  await rm(output, { recursive: true, force: true });
  await mkdir(functionDir, { recursive: true });
  const boardDir = resolve(output, '.board-build');
  try {
    await promisify(execFile)(process.execPath, [resolve(root, 'tools/plugin-ui-build.mjs'), boardDir], { cwd: root, timeout: 60000, maxBuffer: 1_000_000 });
    await cp(resolve(boardDir, 'board.html'), resolve(functionDir, 'board.html'));
    // The board art: a static file on Vercel, beside server.mjs for the standalone server (tools/plugin-server.mjs serves it).
    await cp(resolve(boardDir, 'plugin-art'), resolve(vercel ? resolve(output, 'static') : functionDir, 'plugin-art'), { recursive: true });
  } finally { await rm(boardDir, { recursive: true, force: true }); }
  await cp(resolve(root, 'src/plugin/consent.html'), resolve(functionDir, 'consent.html'));
  await cp(resolve(root, 'tools/supabase-ca.crt'), resolve(functionDir, 'supabase-ca.crt'));
  await build({ configFile: false, root, publicDir: false, logLevel: 'warn', build: { target: 'es2022', outDir: functionDir, emptyOutDir: false, minify: true, lib: { entry: resolve(root, 'src/plugin/consent.ts'), formats: ['es'], fileName: () => 'consent.mjs' }, rollupOptions: { output: { entryFileNames: 'consent.mjs', codeSplitting: false } } } });
  await buildRuntime(resolve(functionDir, 'runtime'));
  await build({
    configFile: false, root, publicDir: false, logLevel: 'warn', ssr: { noExternal: true },
    define: { __KINGDOWN_ERROR_FORMS__: JSON.stringify(sourceErrorForms(resolve(root, 'src'))), __KINGDOWN_ERROR_ASSETS__: JSON.stringify(await siteErrorAssets(site)), __KINGDOWN_BUILD__: JSON.stringify(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()) },
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
    if (site) {
      await cp(site, resolve(output, 'static'), { recursive: true });
      // The function entry (tools/plugin-server.mjs) dispatches these paths; Vercel keeps the request path.
      await symlink('mcp.func', resolve(output, 'functions/internal.func'));
    }
    await writeFile(resolve(output, 'config.json'), JSON.stringify({ version: 3, routes }) + '\n');
    if (staging) {
      await writeFile(resolve(output, 'staging.json'), JSON.stringify({ stage: 'staging', supabaseUrl: STAGING_SUPABASE_URL, publicOrigin: STAGING_ORIGIN, projectId: STAGING_PROJECT_ID }) + '\n');
    }
  }
  return output;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // --site takes the website from dist/ (npm run build:vercel builds it first).
  const args = process.argv.slice(2), site = args.includes('--site') ? resolve('dist') : undefined, vercel = args.includes('--vercel');
  if (args.filter(arg => !arg.startsWith('--')).length > 1 || args.some(arg => arg.startsWith('--') && !['--vercel', '--site'].includes(arg))) throw new Error('Usage: node tools/plugin-server-build.mjs [output] [--vercel | --site]');
  const path = args.find(arg => !arg.startsWith('--'));
  console.log(await buildPluginServer(path ? resolve(path) : resolve(site ? 'kingdown-deploy' : vercel ? 'plugin-deploy' : 'plugin-server-dist'), { vercel, site }));
}
