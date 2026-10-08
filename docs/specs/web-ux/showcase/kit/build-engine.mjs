// Bundle the real rules engine and computer player into kit/kd-engine.js (sets globalThis.KD).
// Run from anywhere: node docs/specs/web-ux/showcase/kit/build-engine.mjs
// The output is an IIFE: load it with <script src=".../kit/kd-engine.js">, or import kit/kd.js in a module.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const kit = fileURLToPath(new URL('./', import.meta.url));
const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const require = createRequire(root + 'package.json');
const esbuild = require('esbuild');

const result = await esbuild.build({
  entryPoints: [kit + 'engine-entry.ts'],
  outfile: kit + 'kd-engine.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2022'],
  // Short code, readable names: a stack trace in a demo names the engine function.
  minifySyntax: true,
  minifyWhitespace: false,
  minifyIdentifiers: false,
  keepNames: true,
  sourcemap: false,
  legalComments: 'none',
  // vite's import.meta.env does not exist here; the engine modules do not read it.
  define: { 'import.meta.env.BASE_URL': '"/"' },
  banner: { js: '/* King Down rules engine and computer player for the showcase. Built by kit/build-engine.mjs from src/. Do not edit. */' },
  logLevel: 'warning',
  metafile: true,
});
const bytes = Object.values(result.metafile.outputs)[0].bytes;
console.log(`kit/kd-engine.js: ${(bytes / 1024).toFixed(0)} KB`);
