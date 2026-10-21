/** Build the existing moderation commands for the isolated staging project. No connection or deployment. */
import { build } from 'vite';
import { builtinModules } from 'node:module';
import { createHash } from 'node:crypto';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGING_SUPABASE_REF } from './staging-config.mjs';

export async function buildStagingOperator(outDir) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  await build({ configFile: false, root, publicDir: false, logLevel: 'warn', ssr: { noExternal: true },
    define: { __KINGDOWN_STAGING_OPERATOR__: 'true' },
    build: { ssr: resolve(root, 'tools/mod.ts'), target: 'node20', outDir, emptyOutDir: true, minify: false,
      rollupOptions: { external: [...builtinModules, ...builtinModules.map(name => `node:${name}`), 'pg-native'],
        output: { entryFileNames: 'mod.mjs', codeSplitting: false } } } });
  await copyFile(resolve(root, 'tools/supabase-ca.crt'), resolve(outDir, 'supabase-ca.crt'));
  const hashes = {};
  for (const file of ['mod.mjs', 'supabase-ca.crt']) hashes[file] = createHash('sha256').update(await readFile(resolve(outDir, file))).digest('hex');
  await writeFile(resolve(outDir, 'manifest.json'), JSON.stringify({ stage: 'staging', project: STAGING_SUPABASE_REF, hashes }, null, 2) + '\n');
  return resolve(outDir, 'mod.mjs');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) throw new Error('Usage: node tools/mod-build.mjs [output]');
  console.log(await buildStagingOperator(resolve(process.argv[2] ?? 'moderation-dist')));
}
