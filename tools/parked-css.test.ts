// The park (docs/PARKED.md) removes the markup of each parked feature. Its rules must leave the shipped
// CSS with it, so that the main stylesheet holds no rule for an element that the build no longer makes.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

// Ids and classes that only parked features made (Workshop, lessons, tricks, Today's army, the Extra page, badges).
const PARKED = ['#design', '#design-line', '#copy', '#army-note', '#other-armies', '#share-result', '.army-design',
  '#title-workshop', '#title-learn', '#workshop-btn', '#lesson-shelf', '#lesson-progress', '#next-lesson',
  '#menu-seal-dot', '#extra-seal-dot', '#tricks-seal-dot', '#tricks-list', '#home-today',
  '#learn', '.badges', '.badge-sheet', '.new-badge'];

it('the shipped stylesheets hold no rule for a parked element', () => {
  const found: Record<string, string[]> = {};
  for (const file of ['src/style.css', 'src/ui/table.css', 'src/ceremony.css', 'src/plugin/screens/profile.css', 'src/plugin/screens/end.css']) {
    const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = css.replace(/\{[^{}]*\}/g, '{}');
    const names = PARKED.filter(name => new RegExp(`${name.replace('.', '\\.')}(?![\\w-])`).test(selectors));
    if (names.length) found[file] = names;
  }
  expect(found).toEqual({});
});
