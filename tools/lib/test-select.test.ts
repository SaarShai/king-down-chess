import { expect, it } from 'vitest';
import { selectTests } from './test-select.mjs';

// A small repository: each key is a file, each value is its text.
const tree: Record<string, string> = {
  'package.json': JSON.stringify({ scripts: { 'plugin:build': 'node tools/plugin-build.mjs --fast' } }),
  'vite.config.ts': "import { guard } from './tools/lib/config-part.mjs';\nconst input = new URL('./index.html', import.meta.url);",
  'tools/lib/config-part.mjs': 'export const guard = 1;',
  'TASKS.md': '# Tasks',
  'ios/App/App.swift': '',
  'src/a.ts': "export const a = 1;",
  'src/b.ts': "import { a } from './a.js';\nimport './lint-me/one';\nexport { a };",
  'src/b.test.ts': "import { a } from './b';",
  'src/lone.test.ts': "import './style.css';",
  'src/style.css': "@import './base.css';",
  'src/base.css': '',
  'src/dead.ts': 'export const dead = 1;',
  'src/x.docs.test.ts': "it('reads the tasks', () => readFileSync('TASKS.md'));",
  'src/text.test.ts': "readFileSync(new URL('./view.ts', import.meta.url), 'utf8'); readFileSync('src/data.json');",
  'src/view.ts': '',
  'src/data.json': '{}',
  'src/recipes/one.ts': '',
  'src/runtime.ts': "const all = import.meta.glob('./recipes/*.ts');",
  'src/runtime.test.ts': "import './runtime';",
  'src/rules/engine.ts': '',
  'src/plugin/index.html': '<script type="module" src="./app.ts"></script>',
  'src/plugin/app.ts': "import '../rules/engine.ts';",
  'tools/plugin-ui-harness.ts': "const html = await readFile('src/plugin/index.html');",
  'tools/plugin-app.test.ts': "import { start } from './plugin-ui-harness';",
  'tools/ship.sh': 'node tools/ship-check.mjs "$out"',
  'tools/ship-check.mjs': '',
  'tools/ship.test.ts': "spawnSync('bash', ['tools/ship.sh']);",
  'tools/plugin-build.mjs': "await build({ entry: resolve(root, 'src/plugin/entry.ts') });",
  'src/plugin/entry.ts': '',
  'tools/build.test.ts': "run('npm', ['run', 'plugin:build']);",
  'tools/lint.test.ts': "for (const file of readdirSync('src/lint-me')) check(file);",
  'src/lint-me/one.ts': '',
  'src/lint-me/two.webp': '',
  'public/ui/art.webp': '',
  'tools/lib/registry.mjs': "export const checks = [{ script: 'tools/verify-a.mjs' }, { script: 'tools/verify-b.mjs' }];",
  'tools/verify-b.mjs': '',
  'tools/verify.lint.test.ts': "for (const file of globSync('tools/verify-b*.mjs')) lint(file);",
  'tools/route.test.ts': "await page.route('**/*', route => route.continue());",
  '.githooks/pre-push.mjs': '',
  'tools/hooks.test.ts': "run('node', ['.githooks/pre-push.mjs']);",
  'tools/registry.test.ts': "import { checks } from './lib/registry.mjs';",
  'tools/verify-a.mjs': "import '../src/rules/engine.ts'; // see src/view.ts",
  'tools/site-build.test.ts': "import { build } from 'vite'; await build();",
  'index.html': '<script type="module" src="/src/main.ts"></script>',
  'src/main.ts': '',
  'src/copy.test.ts': "await cp('lint-me', copy, { recursive: true });",
  'tools/page.test.ts': "expect(await image.getAttribute('src')).toContain('x');",
};
const select = (...changed: string[]) => selectTests(changed, { files: Object.keys(tree), read: (file: string) => tree[file] });

it('keeps the docs and iOS plans (rule a)', () => {
  expect(select('TASKS.md')).toMatchObject({ mode: 'docs', tests: ['src/x.docs.test.ts'] });
  expect(select('ios/App/App.swift')).toMatchObject({ mode: 'docs', tests: expect.arrayContaining(['tools/ios-app.test.ts']) });
});

it('gives the full suite for a wide file, an unplaced file, a deleted file or no change (rule b)', () => {
  expect(select('package.json')).toMatchObject({ mode: 'full', reason: expect.stringContaining('package.json') });
  expect(select('tools/lib/config-part.mjs')).toMatchObject({ mode: 'full', reason: expect.stringContaining('vite.config.ts') });
  expect(select('src/a.ts', 'src/dead.ts')).toMatchObject({ mode: 'full', reason: expect.stringContaining('src/dead.ts') });
  expect(select('public/ui/art.webp')).toMatchObject({ mode: 'full' });
  // A file outside src/ and tools/ gives the full suite, also when a test names it: tests load a hook through a built path.
  expect(select('.githooks/pre-push.mjs')).toMatchObject({ mode: 'full', reason: expect.stringContaining('outside src/ and tools/') });
  expect(select('src/gone.ts')).toMatchObject({ mode: 'full', reason: expect.stringContaining('src/gone.ts') });
  expect(select()).toMatchObject({ mode: 'full' });
});

it('follows imports, CSS imports and import.meta.glob, and selects a changed test (rule c)', () => {
  expect(select('src/a.ts')).toMatchObject({ mode: 'selected', tests: ['src/b.test.ts'] });
  expect(select('src/base.css').tests).toEqual(['src/lone.test.ts']);
  expect(select('src/recipes/one.ts').tests).toEqual(['src/runtime.test.ts']);
  expect(select('src/lone.test.ts', 'TASKS.md').tests).toEqual(['src/lone.test.ts', 'src/x.docs.test.ts']);
});

it('follows the files that a test names, a script names and a folder holds (rule d)', () => {
  expect(select('src/view.ts').tests).toEqual(['src/text.test.ts']);
  expect(select('src/data.json').tests).toEqual(['src/text.test.ts']);
  expect(select('tools/ship-check.mjs').tests).toEqual(['tools/ship.test.ts']);
  expect(select('src/plugin/entry.ts').tests).toEqual(['tools/build.test.ts']);
  expect(select('src/lint-me/one.ts').tests).toEqual(['src/b.test.ts', 'src/copy.test.ts', 'tools/lint.test.ts']);
  // A bare folder word counts only in a test that lists or copies folders: not getAttribute('src').
  expect(select('src/a.ts').tests).toEqual(['src/b.test.ts']);
  // A data list selects the test for a listed file, not for the files that the listed file uses. It does not place the file.
  expect(select('tools/verify-b.mjs').tests).toEqual(['tools/registry.test.ts', 'tools/verify.lint.test.ts']);
  expect(select('tools/verify-a.mjs')).toMatchObject({ mode: 'full' });
  expect(select('src/rules/engine.ts').tests).not.toContain('tools/registry.test.ts');
  // A comment names no file; Vite's build() loads vite.config.ts, and its HTML inputs.
  expect(select('src/view.ts').tests).toEqual(['src/text.test.ts']);
  expect(select('src/main.ts').tests).toEqual(['tools/site-build.test.ts']);
  // A folder name adds its test, but does not place a file that nothing else connects.
  expect(select('src/lint-me/two.webp')).toMatchObject({ mode: 'full' });
});

it('continues through a named page entry (rule e)', () => {
  const plan = select('src/rules/engine.ts');
  expect(plan.tests).toEqual(['tools/plugin-app.test.ts']);
  expect(plan.why.get('tools/plugin-app.test.ts')).toBe('tools/plugin-app.test.ts imports tools/plugin-ui-harness.ts, names src/plugin/index.html, imports src/plugin/app.ts, imports src/rules/engine.ts');
});
