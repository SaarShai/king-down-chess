// Fix-table lint (workshop-finish/09). The review of 2026-10-06 lists 29 fixes. Its column "Checked by"
// tells, for each fix, where its check runs, or why none runs. Each cell holds one or more entries,
// separated by "; ". An entry is one of these, with an optional note in parentheses after it:
//   - `workshop` `<group>`: a group of the browser check `workshop` (tools/verify-workshop.mjs). The check
//     must define the group as a function and call it;
//   - `<file>.test.ts` `<title>`: a test of that Workshop test file (src/workshop), by its full title;
//   - superseded: the redesign removed what the fix changed;
//   - not checked: <reason>.
// The lint fails on a row with an empty cell, on text that is not an entry, and on a group, a file or a
// title that does not exist. It runs in `npm test` and in `npm run test:docs`.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '../..');
const REVIEW = 'docs/visual-design/workshop/REVIEW-2026-10-06.md';
const CHECK = 'tools/verify-workshop.mjs';
const HEAD = ['Severity', 'Area', 'Status', 'Commit', 'Checked by'];
const FIXES = 29;

/** The sources that the entries name: the browser check and the Workshop test files by file name. */
type Sources = { check: string; tests: Record<string, string> };
type Row = { fix: number; area: string; cell: string };
type Entry = { kind: 'group' | 'test' | 'superseded' | 'not checked'; file?: string; name?: string; note?: string };

const readSources = (): Sources => ({
  check: readFileSync(join(root, CHECK), 'utf8'),
  tests: Object.fromEntries(readdirSync(join(root, 'src/workshop')).filter(f => f.endsWith('.test.ts'))
    .map(f => [f, readFileSync(join(root, 'src/workshop', f), 'utf8')])),
});

/** The rows of the fix table: the table whose head is HEAD. Fix numbers count from 1 in table order. */
function fixRows(markdown: string): Row[] {
  const lines = markdown.split('\n');
  const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  const at = lines.findIndex(line => line.startsWith('|') && cells(line).join('|') === HEAD.join('|'));
  if (at < 0) return [];
  const rows: Row[] = [];
  for (const line of lines.slice(at + 2)) {
    if (!line.startsWith('|')) break;
    const c = cells(line);
    rows.push({ fix: rows.length + 1, area: c[1] ?? '', cell: c[4] ?? '' });
  }
  return rows;
}

const ENTRY = /(?:`([^`]+)` `([^`]+)`|(superseded)|not checked: ([^;()]*[^;()\s]))(?: \(([^()]+)\))?(?:; |$)/y;

/** The entries of one cell, or null when a part of the cell is not an entry. */
function entries(cell: string): Entry[] | null {
  const found: Entry[] = [];
  ENTRY.lastIndex = 0;
  while (ENTRY.lastIndex < cell.length) {
    const start = ENTRY.lastIndex;
    const m = ENTRY.exec(cell);
    if (!m || ENTRY.lastIndex === start) return null;
    const [, file, name, superseded, reason, note] = m;
    if (file) found.push({ kind: file === 'workshop' ? 'group' : 'test', file, name, note });
    else if (superseded) found.push({ kind: 'superseded', note });
    else found.push({ kind: 'not checked', note: reason });
  }
  return found.length ? found : null;
}

/** The full titles of the tests (`it` and `test`) in one test file, with their escapes removed. */
const titles = (source: string): string[] =>
  [...source.matchAll(/\b(?:it|test)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)].map(m => m[2].replace(/\\(.)/g, '$1'));

/** A group of the browser check exists when the check defines it as a function and calls it. */
const isGroup = (check: string, name: string): boolean =>
  /^\w+$/.test(name) && new RegExp(`function ${name}\\(`).test(check) && new RegExp(`await ${name}\\(`).test(check);

/** Each fault of the fix table, as one line that names the fix. No faults: an empty list. */
function tableFaults(markdown: string, sources: Sources): string[] {
  const rows = fixRows(markdown);
  if (!rows.length) return [`${REVIEW}: no fix table with the head "${HEAD.join(' | ')}"`];
  const faults = rows.length === FIXES ? [] : [`${REVIEW}: the fix table has a row count of ${rows.length}, not ${FIXES}`];
  for (const { fix, area, cell } of rows) {
    const where = `fix ${fix} (${area})`;
    if (!cell) { faults.push(`${where}: "Checked by" is empty`); continue; }
    const found = entries(cell);
    if (!found) { faults.push(`${where}: "${cell}" is not a list of entries`); continue; }
    for (const e of found) {
      if (e.kind === 'group' && !isGroup(sources.check, e.name!)) faults.push(`${where}: the check workshop has no group ${e.name}`);
      if (e.kind === 'test' && !(e.file! in sources.tests)) faults.push(`${where}: src/workshop has no test file ${e.file}`);
      else if (e.kind === 'test' && !titles(sources.tests[e.file!]).includes(e.name!)) faults.push(`${where}: ${e.file} has no test "${e.name}"`);
    }
  }
  return faults;
}

describe('the fix table of the 2026-10-06 review', () => {
  const markdown = readFileSync(join(root, REVIEW), 'utf8');
  const sources = readSources();

  it('names a check, "superseded" or "not checked: <reason>" for each of the 29 fixes, and each name exists', () => {
    expect(tableFaults(markdown, sources)).toEqual([]);
  });

  it('gives fix 25 no check, and fix 26 the motion group and "superseded" for its gradients and seams', () => {
    const rows = fixRows(markdown);
    expect(rows[24].cell).toBe('not checked: preview page outside the build');
    expect(entries(rows[25].cell)).toEqual([
      { kind: 'group', file: 'workshop', name: 'motionSetA', note: expect.any(String) },
      { kind: 'superseded', note: 'gradients and seams' },
    ]);
  });
});

describe('the fix-table lint', () => {
  const sources: Sources = {
    check: 'async function fix4Keys(browser) {}\nawait fix4Keys(browser);\nasync function unused() {}',
    tests: { 'judge.test.ts': "it('names the band in Why? (review fix 28): the verdict\\'s band', () => {});" },
  };
  const table = (...cells: string[]) => [
    `| ${HEAD.join(' | ')} |`, '|---|---|---|---|---|',
    ...cells.map((c, i) => `| Major | Area ${i + 1} | Fixed | \`abc\` | ${c} |`),
  ].join('\n');
  const faults = (...cells: string[]) => tableFaults(table(...cells), sources).filter(f => !f.includes('row count'));

  it('passes a group, a test title with escapes, "superseded" and "not checked: <reason>", each with a note', () => {
    expect(faults(
      '`workshop` `fix4Keys` (the keys)',
      "`judge.test.ts` `names the band in Why? (review fix 28): the verdict's band`; superseded (no Saved screen)",
      'not checked: preview page outside the build',
    )).toEqual([]);
  });

  it('fails on an empty cell and on text that is not an entry', () => {
    expect(faults('', 'checked by hand', '`workshop` `fix4Keys` and more')).toEqual([
      'fix 1 (Area 1): "Checked by" is empty',
      'fix 2 (Area 2): "checked by hand" is not a list of entries',
      'fix 3 (Area 3): "`workshop` `fix4Keys` and more" is not a list of entries',
    ]);
  });

  it('fails on a group the check does not run, a missing test file and a missing test title', () => {
    expect(faults('`workshop` `fix9Gone`', '`workshop` `unused`', '`gone.test.ts` `a title`', '`judge.test.ts` `names the band`')).toEqual([
      'fix 1 (Area 1): the check workshop has no group fix9Gone',
      'fix 2 (Area 2): the check workshop has no group unused',
      'fix 3 (Area 3): src/workshop has no test file gone.test.ts',
      'fix 4 (Area 4): judge.test.ts has no test "names the band"',
    ]);
  });

  it('fails when the table has no "Checked by" column or not 29 rows', () => {
    expect(tableFaults('| Severity | Area | Status | Commit |\n|---|---|---|---|', sources)).toEqual([`${REVIEW}: no fix table with the head "${HEAD.join(' | ')}"`]);
    expect(tableFaults(table('superseded'), sources)).toEqual([`${REVIEW}: the fix table has a row count of 1, not 29`]);
  });
});
