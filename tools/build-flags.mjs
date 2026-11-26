// The build flags and environment variables of the game: each VITE_* or KINGDOWN_* name that a file in src/ or tools/
// (or vite.config.ts, package.json) reads. tools/build-flags.test.ts compares this list with a scan of the source text.
// When you add a name, also look at each place that must know it:
// - a non-VITE_ name that a file reads from import.meta.env: a define in the build() call of each bundle in BUNDLES that
//   holds the file (else the bundle reads undefined); a new bundle: an entry in BUNDLES;
// - a stage or site name: tools/deploy.sh (production refusal, site_env), tools/deploy-staging.mjs, tools/ios-sync.sh,
//   tools/release/release.sh and tools/release/live.sh (unset lists), tools/online-local.mjs, CHECK_SITE_ENV in
//   tools/lib/checks.mjs;
// - a KINGDOWN_TEST_* name: the clear list of run(['test'], ...) in tools/ci-plan.mjs.
import { existsSync, globSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

export const FLAG_NAMES = [
  'KINGDOWN_ADMIN_DATABASE_URL', 'KINGDOWN_ANIM_MIN_FREE_GIB', 'KINGDOWN_ANIM_OUT',
  'KINGDOWN_ANIM_PYTHON', 'KINGDOWN_BANK_GEOMETRY', 'KINGDOWN_BANK_INFER',
  'KINGDOWN_BANK_PREVIEW', 'KINGDOWN_CATALOG', 'KINGDOWN_CHATGPT',
  'KINGDOWN_CI_BROWSER_CHECKS', 'KINGDOWN_CI_WAIT_MINUTES', 'KINGDOWN_COMPARISON_BASE_DIST',
  'KINGDOWN_COMPARISON_STAGE_DIST', 'KINGDOWN_ENGINES_DATABASE_URL', 'KINGDOWN_ERROR_RECORDER',
  'KINGDOWN_FRAME_CHECKS_HISTORY', 'KINGDOWN_FRAME_CHECKS_RECORD', 'KINGDOWN_HOSTED_SIGNIN_ORIGIN',
  'KINGDOWN_INTERNAL_SECRET', 'KINGDOWN_LOCAL_API_ORIGIN', 'KINGDOWN_LOCAL_ONLINE',
  'KINGDOWN_LOCAL_ONLINE_AUTH_STANDIN', 'KINGDOWN_LOCAL_PAGE_PORT', 'KINGDOWN_LOCAL_PAGE_URL',
  'KINGDOWN_M1_RIFE_PYTHON', 'KINGDOWN_M1_RIFE_RUNTIME', 'KINGDOWN_M1_SSH',
  'KINGDOWN_MACHINE_LEASED', 'KINGDOWN_MACHINE_LEASE_FD', 'KINGDOWN_MACHINE_LEASE_ID',
  'KINGDOWN_MAIL_FROM', 'KINGDOWN_MUSE', 'KINGDOWN_PICK_PYTHON',
  'KINGDOWN_PLUGIN_DATABASE_URL', 'KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS', 'KINGDOWN_PLUGIN_OAUTH_READY',
  'KINGDOWN_PLUGIN_ORIGIN', 'KINGDOWN_PLUGIN_UI_PART', 'KINGDOWN_PREVIEW_PYTHON',
  'KINGDOWN_PUBLISH_PYTHON', 'KINGDOWN_RELEASE_COMMIT', 'KINGDOWN_RELEASE_EVIDENCE',
  'KINGDOWN_RELEASE_FAIL_STAGE', 'KINGDOWN_RELEASE_LOG', 'KINGDOWN_RELEASE_SITE_ROOT',
  'KINGDOWN_RELEASE_WORKTREE', 'KINGDOWN_REVIEW', 'KINGDOWN_REVIEW_EMAIL',
  'KINGDOWN_REVIEW_OPPONENT_EMAIL', 'KINGDOWN_RIFE_PYTHON', 'KINGDOWN_RIFE_RUNTIME',
  'KINGDOWN_RUNTIME_MANIFEST', 'KINGDOWN_SECRETS_ENV', 'KINGDOWN_SMOKE_DIR',
  'KINGDOWN_STAGE', 'KINGDOWN_TEST_BASE',
  'KINGDOWN_TEST_DOCS', 'KINGDOWN_TEST_FILE', 'KINGDOWN_TEST_LOCKED',
  'KINGDOWN_TEST_LOCK_WAIT', 'KINGDOWN_TEST_NAME', 'KINGDOWN_TEST_NO_TYPECHECK',
  'KINGDOWN_TEST_OUT', 'KINGDOWN_TEST_PAGES', 'KINGDOWN_TEST_SKIP',
  'KINGDOWN_TEST_WHY', 'KINGDOWN_WEB_RECOVERY_OUTPUT', 'VITE_KINGDOWN_APPLE_SIGN_IN',
  'VITE_KINGDOWN_STAGE', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_URL',
];

// A read (import.meta.env.X, import.meta.env['X'], process.env.X, env.X, $X, ${X}, a quoted key) or a shell assignment (X=value).
const READ = /(?:import\.meta\.env(?:\??\.|(?:\?\.)?\[['"])|process\.env\.|env\.|\$\{?|['"]|(?<=^|\s)(?=[A-Z0-9_]+=))((?:VITE_)?KINGDOWN_[A-Z0-9_]+|VITE_[A-Z0-9_]+)/g;
const SOURCE = /\.(?:[cm]?[jt]sx?|sh|py)$/, TEST = /\.test\.[cm]?[jt]sx?$/;
const SELF = 'tools/build-flags.mjs';

/**
 * Each read of a name in the sources: the name, its place (file:line) and whether it is an import.meta.env read.
 * A source that ends in / is a folder; the scan reads each .ts, .mts, .js, .mjs (and .cts, .cjs, .tsx, .jsx), .sh and .py
 * file below it, except tests.
 */
export function scanFlags(root, sources) {
  const files = sources.filter(source => !source.endsWith('/'));
  const walk = dir => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(path); }
      else if (SOURCE.test(entry.name) && !TEST.test(entry.name) && path !== SELF) files.push(path);
    }
  };
  for (const source of sources) if (source.endsWith('/')) walk(source.slice(0, -1));
  const reads = [];
  for (const file of files) {
    const lines = readFileSync(join(root, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const match of line.matchAll(READ)) reads.push({ name: match[1], place: `${file}:${i + 1}`, client: match[0].startsWith('import.meta.env') });
    });
  }
  return reads;
}

/**
 * Each bundle that Vite builds from the source: its build file, a text that is only in its build() call (null: the file
 * has one define block, as vite.config.ts) and its entry files. tools/build-flags.test.ts follows the imports from the
 * entries and asks for a define in that call of each non-VITE_ name that a file of the bundle reads from import.meta.env.
 * Limit: each source file that reads a non-VITE_ name from import.meta.env must be in a bundle here, also a file that
 * only Vitest loads (none today).
 */
export const BUNDLES = [
  { name: 'web', build: 'vite.config.ts', call: null, entries: ['src/entry.ts', 'src/interface/entry.ts', 'src/interface/people/screens/demo.ts', 'src/interface/moments/demo.ts', 'src/interface/play/scenes.ts'] },
  { name: 'consent', build: 'tools/plugin-server-build.mjs', call: "'src/plugin/consent.ts'", entries: ['src/plugin/consent.ts'] },
  // The isolated-match-runtime plugin of that build points src/match/index.ts at the external runtime/index.mjs.
  { name: 'plugin server', build: 'tools/plugin-server-build.mjs', call: "'tools/plugin-server.mjs'", entries: ['tools/plugin-server.mjs'], external: ['src/match/index.ts'] },
  { name: 'plugin board', build: 'tools/plugin-ui-build.mjs', call: "root: resolve('src/plugin')", entries: ['src/plugin/app.ts'] },
  { name: 'match worker', build: 'tools/plugin-runtime-build.mjs', call: "'src/match/worker.ts'", entries: ['src/match/worker.ts'] },
  { name: 'search worker', build: 'tools/plugin-runtime-build.mjs', call: "'src/match/search-worker.ts'", entries: ['src/match/search-worker.ts'] },
  { name: 'match runtime', build: 'tools/plugin-runtime-build.mjs', call: "'src/match/index.ts'", entries: ['src/match/index.ts'] },
  { name: 'staging operator', build: 'tools/mod-build.mjs', call: "'tools/mod.ts'", entries: ['tools/mod.ts'] },
];

// A relative import that stays in the JavaScript: import or export ... from, import(), import '...', new URL('...').
// Vite removes `import { type A, type B } from` (each specifier is a type), so the graph does not follow it.
const IMPORT = /(?:\b(?:import|export)\s+(?!type\s)(?:(?<clause>[^'";]*?)\sfrom\s*)?|\bimport\s*\(\s*|new\s+URL\(\s*)['"](?<spec>\.{1,2}\/[^'"?]+)/g;
const typesOnly = clause => {
  const inner = /^\{([^}]*)\}$/.exec(clause?.trim() ?? '')?.[1];
  const specifiers = inner?.split(',').map(part => part.trim()).filter(Boolean) ?? [];
  return specifiers.length > 0 && specifiers.every(part => /^type\s/.test(part));
};
const CODE = /\.[cm]?[jt]sx?$/;
// An import.meta.glob of code files, as the recipes of src/plugin/card-motion/runtime.ts.
const GLOB = /\bimport\.meta\.glob(?:<[^>]*>)?\(\s*['"](\.{1,2}\/[^'"]+\.[cm]?[jt]sx?)['"]/g;

/** The files that the entries import, directly or through other files: relative imports and import.meta.glob of code
 *  files, not type imports. The graph does not go into a file in `external` (the build keeps that import outside the
 *  bundle). */
export function importGraph(root, entries, external = []) {
  const isFile = path => existsSync(join(root, path)) && statSync(join(root, path)).isFile();
  const target = (from, spec) => {
    const base = normalize(join(dirname(from), spec));
    return [base, base.replace(/\.js$/, '.ts'), base.replace(/\.mjs$/, '.mts'), ...['.ts', '.mts', '.js', '.mjs', '/index.ts', '/index.mjs'].map(end => base + end)].find(isFile);
  };
  const files = new Set(), open = [...entries];
  while (open.length) {
    const file = open.pop();
    if (files.has(file)) continue;
    files.add(file);
    if (!CODE.test(file)) continue;
    const code = readFileSync(join(root, file), 'utf8');
    for (const match of code.matchAll(IMPORT)) {
      if (typesOnly(match.groups.clause)) continue;
      const next = target(file, match.groups.spec);
      if (next && !external.includes(next)) open.push(next);
    }
    for (const match of code.matchAll(GLOB)) open.push(...globSync(normalize(join(dirname(file), match[1])), { cwd: root }));
  }
  return files;
}

/** The define block of the build() call in `text` that holds `call` (null: the first define block of the text), or undefined. */
export function defineBlock(text, call) {
  const calls = call === null ? [text] : text.split(/\bbuild\(\s*(?=\{)/).slice(1).filter(part => part.includes(call));
  if (calls.length !== 1) return undefined;
  const start = calls[0].search(/\bdefine:\s*\{/);
  if (start < 0) return '';
  let depth = 0;
  for (let i = calls[0].indexOf('{', start); i < calls[0].length; i++) {
    if (calls[0][i] === '{') depth++;
    else if (calls[0][i] === '}' && --depth === 0) return calls[0].slice(start, i + 1);
  }
  return undefined;
}
