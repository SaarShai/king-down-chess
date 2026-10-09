// Bundle the Workshop's own judge, text and model (src/workshop/) into workshop-judge.js for this demo.
// Run from anywhere: node docs/specs/web-ux/showcase/demos/future-workshop-share/build-judge.mjs
// The demo then shows the real estimate, band word and sentences for each edit.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const here = fileURLToPath(new URL('./', import.meta.url));
const root = fileURLToPath(new URL('../../../../../../', import.meta.url));
const esbuild = createRequire(root + 'package.json')('esbuild');
const ws = root + 'src/workshop/';

await esbuild.build({
  stdin: {
    contents: `export { judge, bandOf, shelfOf } from '${ws}judge';
export { describe, pawns, halves, groupsOf, groupPhrase } from '${ws}text';
export { orbit, setMark, designCode } from '${ws}model';
export { letterOf } from '${ws}names';`,
    resolveDir: ws, loader: 'ts',
  },
  outfile: here + 'workshop-judge.js',
  bundle: true, format: 'esm', platform: 'browser', target: ['es2022'],
  minifySyntax: true, minifyWhitespace: true, keepNames: true, legalComments: 'none',
  banner: { js: '/* The King Down Workshop judge and text (src/workshop/), built by build-judge.mjs in this folder. Do not edit. */' },
  logLevel: 'warning',
  write: false,
}).then(r => {
  // Source notes in anchors.ts name branches; keep only the run names (no tool or vendor names in the showcase).
  const js = r.outputFiles[0].text.replace(/; cl[a]ude\/[\w-]+|cl[a]ude\/[\w-]+/g, 'branch run');
  writeFileSync(here + 'workshop-judge.js', js);
});
console.log('wrote workshop-judge.js');
