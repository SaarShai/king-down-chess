// selectTests(): the test files that a change can break, for `npm run test:changed` (tools/ci-plan.mjs tests).
// The selector reads the repository into one graph and walks it back from each changed file to the tests.
// Edges: "imports" (import, export from, import(), require(), new URL, CSS @import, HTML src and href);
// "names" (a path in the text of a test, of a file under tools/ or of a git hook, outside comments, or in a
// package.json script that such a file names); "matches" (a glob in such a file, or an import.meta.glob);
// "holds" (a folder that a test names) and "lists" (a file in a data list). The walk stops at a test, and a
// "holds" or "lists" edge counts only from the changed file itself. A "holds" edge adds tests but does not place
// a file. A wide file, a tools/ file of the test config, a deleted file, or a file that no other edge connects
// to a test gives the full suite.
import { posix } from 'node:path';
import { testGlobs } from '../ci-shards.mjs';
import { pathPlan } from './ci-paths.mjs';

const { dirname, join, matchesGlob, normalize } = posix;
const wide = /^(?:package(?:-lock)?\.json|vite\.config\.ts|tsconfig[\w.-]*\.json|tools\/test-[\w-]+\.sh|tools\/test-lock-guard\.ts)$/;
const configs = ['vite.config.ts', 'tools/test-lock-guard.ts']; // every run loads them and the tools/ files that they import
const code = /\.(?:[cm]?[jt]s|tsx|css|html)$/;
const text = /(?:^|\/)[\w-]+$|\.(?:[cm]?[jt]s|tsx|css|html|sh|py|json|ya?ml|txt|sql)$/;
const extensions = ['', '.ts', '.mts', '.mjs', '.js', '.tsx', '/index.ts', '/index.mjs', '/index.js'];
const importForm = /\b(?:from|import|require)\s*\(?\s*['"]([^'"\n]+)['"]|@import\s+(?:url\()?\s*['"]?([^'")\s;]+)|new URL\(\s*['"]([^'"\n]+)['"]\s*,\s*import\.meta\.url/g;
const htmlForm = /\b(?:src|href)\s*=\s*['"]([^'"\n]+)['"]/g;
const quoted = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const pathToken = /[\w.@-]*\/[\w.@/-]*[\w@-]|[\w@-]+\.[a-z]{1,5}\b/g;
const scriptRun = /\brun\s+([\w:.-]+)/g;
const viteApi = /\bfrom\s+['"]vite['"]/; // Vite's build() and createServer() load vite.config.ts, unless configFile is false
const viteCall = /\b(?:build|createServer|preview)\(/g, noConfig = /configFile:\s*false/g;

// Entries that a build tool hides from the rules above, in the style of localChecks in tools/lib/ci-paths.mjs.
const extraNames = [
  { file: 'tools/plugin-ui-build.mjs', names: ['src/plugin/index.html'] }, // its Vite root is src/plugin, and index.html is the page entry
];
// Lists that name scripts as data: a test reads the list, so a listed file selects it, but what the listed file names does not.
const dataLists = [
  'tools/lib/registry.mjs', // the browser checks; tools/check.test.ts replaces each listed script with a stub
  'tools/deploy.test.ts', // its strings name stub files in a temporary repository; the scripts under test come in by new URL
  'tools/deploy.sh', // tools/deploy.test.ts runs it with stub node, npm and npx, so the scripts that it names do not run
];

// Files over 15 s in the full run of 2026-11-24, in seconds. Only the report uses them.
export const slowTests = new Map([
  ['tools/deploy.test.ts', 235], ['tools/plugin-app.test.ts', 217], ['tools/plugin-board.test.ts', 133],
  ['tools/plugin-board-drafts.test.ts', 104], ['tools/plugin-board-input.test.ts', 80], ['tools/plugin-motion.test.ts', 80],
  ['src/ai/search.test.ts', 78], ['tools/plugin-races.test.ts', 74], ['tools/plugin-ios-size.test.ts', 65],
  ['src/interface/people/screens/pages.test.ts', 64], ['tools/plugin-lobby.test.ts', 61], ['tools/gate.test.ts', 48],
  ['.claude/hooks/tool-gate.test.ts', 35], ['tools/painted-attack-package.test.ts', 30], ['src/account/account-controls.test.ts', 28],
  ['tools/git-hooks/pre-push.test.ts', 27], ['tools/git-hooks/commit-msg.test.ts', 25], ['tools/plugin-setup-owner.test.ts', 24],
  ['tools/plugin-motion-observer.test.ts', 23], ['tools/plugin-profile.test.ts', 22], ['tools/plugin-real-host.test.ts', 21],
  ['tools/check.test.ts', 20], ['tools/plugin-join-review.test.ts', 20], ['tools/plugin-motion-concepts.test.ts', 20],
  ['tools/plugin-screen-lifecycle.test.ts', 20], ['src/match/match.test.ts', 19], ['tools/machine-lease.test.ts', 17],
  ['tools/plugin-menus.test.ts', 17],
]);

const isTest = file => testGlobs.some(glob => matchesGlob(file, glob));

// A glob as a regular expression: path.matchesGlob is too slow for some hundred globs on each file.
function globPattern(glob) {
  let depth = 0;
  const parts = { '**/': '(?:.*/)?', '**': '.*', '*': '[^/]*', '{': '(?:', '}': ')' };
  return new RegExp(`^${glob.replace(/[.+^$()|[\]\\]/g, '\\$&').replace(/\*\*\/|\*\*|\*|[{},]/g, token => {
    if (token === '{') depth++;
    if (token === '}') depth--;
    return token === ',' ? depth > 0 ? '|' : ',' : parts[token];
  })}$`);
}

/** The graph of the repository: `files` lists every file, `read(file)` gives its text. */
function testGraph({ files, read }) {
  const has = new Set(files), dirs = new Set();
  for (const file of files) for (let dir = dirname(file); dir !== '.'; dir = dirname(dir)) dirs.add(dir);
  const back = new Map(), imports = new Map(), globs = new Map(), tests = new Set(files.filter(isTest));
  const edge = (to, from, kind) => back.get(to)?.push([from, kind]) ?? back.set(to, [[from, kind]]);
  const resolve = (spec, from, rootToo) => {
    const path = spec.replace(/[?#].*$/, '');
    if (/^[./]*$/.test(path)) return; // "", "." and "/" name no file
    // A path from the root needs a "/" ('src/x.ts'), except in a test: a test runs in the root and reads 'index.html'.
    const root = rootToo && !path.startsWith('.') && (path.includes('/') || tests.has(from));
    const bases = path.startsWith('/') ? [path.slice(1)] : root ? [join(dirname(from), path), path] : [join(dirname(from), path)];
    for (const base of bases.map(normalize)) {
      if (base === '.' || base.startsWith('..')) continue;
      // A bare word ('check') is a file only with its extension; an import or a relative path also gets the module forms.
      const forms = rootToo && !/^\.{0,2}\//.test(spec) ? [base] : [...extensions.map(ext => base + ext), base.replace(/\.js$/, '.ts')];
      const found = forms.find(file => has.has(file));
      if (found) return { file: found };
      if (dirs.has(base.replace(/\/$/, ''))) return { dir: base.replace(/\/$/, '') };
    }
  };
  let scripts = {};
  try { scripts = JSON.parse(read('package.json') ?? '{}').scripts ?? {}; } catch {}
  for (const file of files) {
    const names = tests.has(file) || /^(?:tools|\.githooks|\.claude\/hooks)\//.test(file);
    if (!code.test(file) && !(names && text.test(file))) continue;
    // A comment names no dependency. Only a comment after a space or at a line start counts, so 'https://' and 'src/**/*.ts' stay.
    const source = (read(file) ?? '').replace(code.test(file) ? /(^|\s)(?:\/\/.*|\/\*[\s\S]*?\*\/)/g : /(^|\s)#.*$/gm, '$1');
    if (code.test(file)) {
      const found = new Set();
      for (const match of [...source.matchAll(importForm), ...file.endsWith('.html') ? source.matchAll(htmlForm) : []]) {
        const spec = match[1] ?? match[2] ?? match[3];
        const target = (spec.startsWith('.') || spec.startsWith('/')) && resolve(spec, file, false);
        if (target?.file) found.add(target.file);
      }
      imports.set(file, found);
      for (const to of found) edge(to, file, 'imports');
    }
    const strings = [...source.matchAll(quoted)].map(match => match[2]);
    // A glob in a test or a tools file, or an import.meta.glob anywhere.
    const globStrings = names ? strings : [...source.matchAll(/import\.meta\.glob[^)]*/g)].flatMap(match => [...match[0].matchAll(quoted)].map(part => part[2]));
    for (const glob of globStrings.filter(string => /^!?[\w./{},@-]*\*[\w./*{},@-]*$/.test(string) && /[/.]/.test(string))) {
      const pattern = glob.replace(/^!/, '');
      for (const base of pattern.startsWith('.') ? [join(dirname(file), pattern)] : [join(dirname(file), pattern), pattern]) {
        const key = normalize(base);
        if (!key.startsWith('..')) globs.get(key)?.add(file) ?? globs.set(key, new Set([file]));
      }
    }
    if (!names) continue;
    const run = new Set([...strings, ...[...source.matchAll(scriptRun)].map(match => match[1])].filter(name => Object.hasOwn(scripts, name)));
    const tokens = [...strings, ...source.match(pathToken) ?? [], ...extraNames.filter(row => row.file === file).flatMap(row => row.names)].map(token => [token, file]);
    // Each Vite call without configFile: false loads the config; a file with more calls than such options names it.
    if (viteApi.test(source) && (source.match(viteCall) ?? []).length > (source.match(noConfig) ?? []).length) tokens.push(['vite.config.ts', 'package.json']);
    for (const name of run) {
      const command = scripts[name];
      for (const token of command.match(pathToken) ?? []) tokens.push([token, 'package.json']);
      for (const match of command.matchAll(scriptRun)) if (Object.hasOwn(scripts, match[1])) run.add(match[1]);
    }
    const seen = new Set();
    for (const [token, from] of tokens) {
      const target = resolve(token, from, true);
      // A folder counts only for a test; a bare word ('src', as in getAttribute('src')) only if the test lists or copies folders.
      const lists = tests.has(file) && (token.includes('/') || /\b(?:readdir|glob|walk|cp)(?:Sync)?\(/.test(source));
      const key = target?.file ?? (target?.dir && lists && `${target.dir}/`);
      if (!key || key === file || seen.has(key) || imports.get(file)?.has(key)) continue;
      seen.add(key);
      edge(key, file, !target.file ? 'holds' : dataLists.includes(file) ? 'lists' : 'names');
    }
  }
  return { has, back, imports, tests, globs: [...globs].map(([glob, from]) => [globPattern(glob), [...from]]) };
}

// Walk back from `start`; give each node the step that reached it first, so the shortest reason wins.
function reach(graph, start, folders) {
  const steps = new Map([[start, null]]), queue = [start];
  for (const node of queue) {
    if (node !== start && graph.tests.has(node)) continue; // a test that names a test reads it; it does not run it
    // A folder or list edge ends after one step: the reader reads the listed file, not what it imports or names.
    const next = (graph.back.get(node) ?? []).filter(([, kind]) => kind !== 'lists' || node === start);
    for (const [glob, from] of graph.globs) if (glob.test(node)) next.push(...from.map(file => [file, 'matches']));
    if (folders && node === start) for (let dir = dirname(node); dir !== '.'; dir = dirname(dir)) next.push(...(graph.back.get(`${dir}/`) ?? []).map(([from]) => [from, 'holds']));
    for (const [from, kind] of next) if (!steps.has(from)) { steps.set(from, [node, kind]); queue.push(from); }
  }
  return steps;
}

function reason(steps, test) {
  const parts = [test];
  for (let node = test, step; (step = steps.get(node)); node = step[0]) parts.push(`${step[1]} ${step[0]}`);
  return parts.length > 1 ? `${parts[0]} ${parts.slice(1).join(', ')}` : `${test} changed`;
}

/** The plan for a list of changed files: { mode: 'full', reason } or { mode: 'docs' | 'selected', tests, why }. */
export function selectTests(changed, repo) {
  if (!changed.length) return { mode: 'full', reason: 'no file changed' };
  const graph = testGraph(repo);
  const docsLints = repo.files.filter(file => file.endsWith('.docs.test.ts'));
  const why = new Map(), add = (test, line) => why.has(test) || why.set(test, line);
  let docsOnly = true;
  const closure = new Set(configs);
  // Only the tools/ part: the HTML inputs of vite.config.ts (index.html and the game) are build inputs.
  for (const file of closure) for (const next of graph.imports.get(file) ?? []) if (next.startsWith('tools/')) closure.add(next);
  for (const file of changed) {
    const docs = pathPlan([{ path: file }], true);
    if (docs.mode === 'docs') {
      for (const test of [...docsLints, ...docs.tests ?? []]) add(test, `${test} checks the docs file ${file}`);
      continue;
    }
    docsOnly = false;
    if (wide.test(file)) return { mode: 'full', reason: `${file} is a wide file` };
    if (closure.has(file)) return { mode: 'full', reason: `${file} is in the import graph of ${configs.join(' or ')}` };
    if (!graph.has.has(file)) {
      if (isTest(file)) continue;
      return { mode: 'full', reason: `${file} is deleted` };
    }
    if (![...reach(graph, file, false).keys()].some(node => graph.tests.has(node))) return { mode: 'full', reason: `no import, name or glob connects ${file} to a test` };
    const steps = reach(graph, file, true);
    for (const node of steps.keys()) if (graph.tests.has(node)) add(node, reason(steps, node));
  }
  return { mode: docsOnly ? 'docs' : 'selected', tests: [...why.keys()].sort(), why };
}
