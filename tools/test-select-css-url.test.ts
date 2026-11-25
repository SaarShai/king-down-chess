// Guard (guards-b): CSS @import url(...) without quotes. Only the second branch of importForm in
// tools/lib/test-select.mjs matches this form; the quoted form also matches the first branch.
import { expect, it } from 'vitest';
import { selectTests } from './lib/test-select.mjs';

const tree: Record<string, string> = {
  'src/a.test.ts': "import './a.css';",
  'src/a.css': '@import url(./base.css);',
  'src/b.test.ts': "import './b.css';",
  'src/b.css': '@import url( "./theme.css" ) screen;',
  'src/base.css': '',
  'src/theme.css': '',
};
const select = (...changed: string[]) => selectTests(changed, { files: Object.keys(tree), read: (file: string) => tree[file] });

it('follows a CSS @import url(...) with and without quotes (rule c)', () => {
  const message = 'tools/lib/test-select.mjs importForm: the @import url(...) branch must find the CSS file, so its test is selected';
  expect(select('src/base.css'), message).toMatchObject({ mode: 'selected', tests: ['src/a.test.ts'] });
  expect(select('src/theme.css'), message).toMatchObject({ mode: 'selected', tests: ['src/b.test.ts'] });
});
