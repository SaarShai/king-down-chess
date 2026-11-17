// Muse connector ticket 16, step 2: the committed tool documentation is the one that the tool listing gives.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { TOOL_DOCS, toolDocs } from './muse-tool-docs';

test('the Muse tool documentation agrees with the tool listing (after a tool change, run npm run muse:docs)', async () => {
  expect(readFileSync(TOOL_DOCS, 'utf8')).toBe(await toolDocs());
});
