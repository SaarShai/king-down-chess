// Unit test for the model-name matcher (checks-and-hooks/03). The names come from the module, so
// this file holds no model name.
import { describe, expect, it } from 'vitest';
import { findModelNames, MODEL_NAMES } from './model-names.mjs';

const mixed = (word: string) => [...word].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join('');
const tags = ['', ' 5', ' 5.5', '-5', '-4.1', '5.1', '-6-x', ' v2'];

describe('findModelNames', () => {
  it('holds a list of names in lower case', () => {
    expect(MODEL_NAMES.length).toBeGreaterThan(0);
    for (const name of MODEL_NAMES) expect(name).toMatch(/^[a-z]+$/);
  });

  for (const name of MODEL_NAMES) {
    it(`finds "${name}" as a whole word in each case, with and without a version tag`, () => {
      for (const word of [name, name.toUpperCase(), mixed(name)]) {
        for (const tag of tags) {
          const found = findModelNames(`Fix the board (${word}${tag}), then test.`);
          expect(found.map(f => f.word), `${word}${tag}`).toEqual([`${word}${tag.replace(/-x$/, '')}`]);
          expect(found[0].line).toBe(1);
        }
        expect(findModelNames(`Co-Authored-By: Tool-${word} <a@b.c>`).map(f => f.word)).toEqual([word]);
      }
    });

    it(`does not find the letters of "${name}" inside a longer word`, () => {
      for (const text of [`pre${name}`, `${name}ish`, `x${name}y`, `${name.toUpperCase()}S rule`]) expect(findModelNames(text), text).toEqual([]);
    });
  }

  it('gives the line of each find, in order', () => {
    const [a, b] = MODEL_NAMES;
    expect(findModelNames(`Subject\n\nBody with ${a} 5.5.\nAnd ${b}.\n`)).toEqual([
      { word: `${a} 5.5`, line: 3 },
      { word: b, line: 4 },
    ]);
  });

  it('gives no find for a clean message', () => {
    const clean = 'Pre-push: refuse a push to main that touches src/\n\nThe knight on o3 and e4 stays.\n\nCo-Authored-By: Claude Code <noreply@anthropic.com>\nCo-Authored-By: Codex <noreply@openai.com>\n';
    expect(findModelNames(clean)).toEqual([]);
  });
});
