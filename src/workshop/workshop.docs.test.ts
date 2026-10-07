// Workshop doc lint (workshop-finish/12). docs/WORKSHOP.md tells only the current Workshop. Revision 3 of
// the doc is history: it is word for word in a dated file beside the other Workshop reviews. The lint fails:
//   - when the doc does not have the eight `##` sections (Screens, Layouts, Model, Judge, Motion, Art,
//     Accessibility, Checks), each one time, in this order, and no other `##` section;
//   - when the doc names a removed feature of the deny list or the revision 3 screenshot folder;
//   - when the doc cites a tracker file (TASKS.md, QUEUE.md, LESSONS.md) and not a run id;
//   - when the doc does not name the runner's screenshot folder;
//   - when a Workshop source file cites docs/WORKSHOP.md by a revision 3 section number (§6.7, W10);
//   - when a Workshop source file cites a section number without a doc name and does not name the dated file;
//   - when the dated file is not revision 3 word for word after its first two lines, or its first line does
//     not give its date and say that it is history;
//   - when the anchor table cites a tracker file, or the Archer far2 does not cite its run, pv-A-af2.
// It runs in `npm test` and in `npm run test:docs`.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ANCHOR_DESIGNS, anchorOf } from './anchors';

const root = join(import.meta.dirname, '../..');
const DOC = 'docs/WORKSHOP.md';
const DATED = 'docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md';
/** The git blob id of revision 3 (docs/WORKSHOP.md at 0fba264): the dated file holds it after its first two lines. */
const REVISION_3_BLOB = '23beb9ae9e430f23c823ea7e80e8d414ef833103';
const SECTIONS = ['Screens', 'Layouts', 'Model', 'Judge', 'Motion', 'Art', 'Accessibility', 'Checks'];
/** The runner's output root (tools/lib/checks.mjs): outside every checkout, so git does not track it. */
const RUNNER_FOLDER = 'kingdown-checks';

/** The removed features and the revision 3 screenshot folder: the doc names none of them. */
const DENY: [string, RegExp][] = [
  ['Mix two', /\bmix two\b/i],
  ['the Saved screen', /\b[Ss]aved [Ss]creen\b|\bSAVED\b/],
  ['brushes', /\bbrush(es)?\b/i],
  ['Edit sheets', /\bedit (sheets?|moves|rules|links?)\b/i],
  ['the uncertainty gauge', /\buncertainty\b|\bgauge\b/i],
  ['plinth', /\bplinths?\b/i],
  ['floor', /\bfloors?\b/i],
  ['rim', /\brims?\b/i],
  ['halo', /\bhalos?\b/i],
  ['glow on the model', /\bglow(s|ing)?\b/i],
  ['the placeholder cast', /\bplaceholders?\b/i],
  ['the revision 3 screenshot folder', /dashboard-2026-10-06/],
];
const TRACKER = /\b(TASKS|QUEUE|LESSONS)\.md\b/;

/** Each fault of the Workshop doc, as one line. No faults: an empty list. */
function docFaults(text: string): string[] {
  const faults: string[] = [];
  const headings = [...text.matchAll(/^## (.*)$/gm)].map(m => m[1].trim());
  if (headings.join('|') !== SECTIONS.join('|')) faults.push(`${DOC}: the sections are "${headings.join(', ')}", not "${SECTIONS.join(', ')}"`);
  text.split('\n').forEach((line, i) => {
    for (const [name, re] of DENY) if (re.test(line)) faults.push(`${DOC}:${i + 1}: names ${name} ("${re.exec(line)![0]}")`);
    if (TRACKER.test(line)) faults.push(`${DOC}:${i + 1}: cites a tracker file (${TRACKER.exec(line)![0]}), not a run id`);
  });
  if (!text.includes(RUNNER_FOLDER)) faults.push(`${DOC}: does not name the runner's screenshot folder ${RUNNER_FOLDER}`);
  return faults;
}

/** A citation of docs/WORKSHOP.md by a revision 3 section: "WORKSHOP.md §6.7", "WORKSHOP.md W10". */
const BY_OLD_NAME = /\bWORKSHOP\.md`?\)?[,:;]?\s*(?:§\s*\d|W\d+\b)/;
/** A section number with no doc name just before it ("docs/RULES.md §3" names its doc). */
const BARE = /(?<!\.md`?\)?[,:;]?\s?)§\s*\d/;

/** Each fault of one Workshop source file. */
function sourceFaults(file: string, text: string): string[] {
  const faults: string[] = [];
  text.split('\n').forEach((line, i) => {
    if (BY_OLD_NAME.test(line)) faults.push(`${file}:${i + 1}: cites ${DOC} by a revision 3 section ("${BY_OLD_NAME.exec(line)![0]}"); name ${DATED}`);
  });
  const bare = text.split('\n').findIndex(line => BARE.test(line));
  if (bare >= 0 && !text.includes(DATED)) faults.push(`${file}:${bare + 1}: cites a section number, but the file does not name ${DATED}`);
  return faults;
}

/** The Workshop source files: the module, its styles and tests, the Workshop tools and the motion preview. */
function sourceFiles(): string[] {
  const inFolder = (folder: string, keep: (name: string) => boolean) =>
    readdirSync(join(root, folder)).filter(keep).sort().map(name => `${folder}/${name}`);
  return [
    ...inFolder('src/workshop', name => !name.endsWith('.docs.test.ts')),
    ...inFolder('tools', name => /workshop/.test(name)),
    ...inFolder('docs/visual-design/workshop', name => /\.(js|html)$/.test(name)),
  ];
}

const read = (file: string): string => readFileSync(join(root, file), 'utf8');
const blobId = (text: string): string => createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0${text}`).digest('hex');

describe('the Workshop doc', () => {
  it('has the eight sections, names no removed feature, cites no tracker and names the runner folder', () => {
    expect(docFaults(read(DOC))).toEqual([]);
  });

  it('keeps revision 3 word for word in the dated file, under a first line that gives the date and says history', () => {
    expect(existsSync(join(root, DATED))).toBe(true);
    const [first, blank, ...rest] = read(DATED).split('\n');
    expect(first).toMatch(/\bhistory\b/i);
    expect(first).toContain('2026-10-07');
    expect(blank).toBe('');
    expect(blobId(rest.join('\n'))).toBe(REVISION_3_BLOB);
  });

  it('no Workshop source file cites the doc by a revision 3 section, and each bare section names the dated file', () => {
    expect(sourceFiles().flatMap(file => sourceFaults(file, read(file)))).toEqual([]);
  });

  it('the anchor table cites no tracker file, and the Archer far2 cites its run pv-A-af2', () => {
    const sources = ANCHOR_DESIGNS.map(({ name, design }) => [name, anchorOf(design)!.source] as const);
    expect(sources.filter(([, source]) => TRACKER.test(source))).toEqual([]);
    expect(Object.fromEntries(sources)['Archer far2']).toBe('pv-A-af2');
  });
});

describe('the Workshop doc lint', () => {
  const good = ['# Workshop', '', 'Screens go to kingdown-checks.', ...SECTIONS.flatMap(s => [`## ${s}`, '', 'Text.'])].join('\n');
  const with_ = (line: string) => good.replace('Text.', line);

  it('passes a doc with the eight sections and the runner folder', () => {
    expect(docFaults(good)).toEqual([]);
  });

  it('fails on each removed feature of the deny list and on the revision 3 screenshot folder', () => {
    const lines: [string, string][] = [
      ['Mix two', 'Mix two of your pieces.'], ['the Saved screen', 'The SAVED screen shows it.'], ['brushes', 'Two brushes paint.'],
      ['Edit sheets', 'An Edit sheet opens.'], ['the uncertainty gauge', 'The gauge shows the pill.'], ['plinth', 'A gold plinth.'],
      ['floor', 'The floor marks.'], ['rim', 'A gold rim.'], ['halo', 'A halo.'], ['glow on the model', 'A king glow.'],
      ['the placeholder cast', 'A placeholder cast.'], ['the revision 3 screenshot folder', 'See dashboard-2026-10-06/.'],
    ];
    for (const [name, line] of lines) expect(docFaults(with_(line)), name).toEqual([expect.stringMatching(new RegExp(`:6: names ${name} `))]);
  });

  it('passes words that only hold a denied word, such as "trims" and "primary"', () => {
    expect(docFaults(with_('The art script trims each half. The primary button is Saved on this device.'))).toEqual([]);
  });

  it('fails on a missing, a repeated, a moved or an extra section', () => {
    expect(docFaults(good.replace('## Motion', '## Movement'))).toHaveLength(1);
    expect(docFaults(`${good}\n## Checks`)).toHaveLength(1);
    expect(docFaults(good.replace('## Art', '## Tmp').replace('## Judge', '## Art').replace('## Tmp', '## Judge'))).toHaveLength(1);
    expect(docFaults(`${good}\n## History`)).toHaveLength(1);
  });

  it('fails on a tracker citation and on a doc that does not name the runner folder', () => {
    expect(docFaults(with_('Measured: TASKS.md:9.'))).toEqual([`${DOC}:6: cites a tracker file (TASKS.md), not a run id`]);
    expect(docFaults(good.replace('kingdown-checks', 'the temp folder'))).toEqual([`${DOC}: does not name the runner's screenshot folder ${RUNNER_FOLDER}`]);
  });

  it('fails on a source file that cites the doc by a revision 3 section, and on a bare section without the dated file', () => {
    expect(sourceFaults('a.ts', '/** The judge (docs/WORKSHOP.md §6). */')).toHaveLength(1);
    expect(sourceFaults('a.ts', '/** Try it (docs/WORKSHOP.md W10). */')).toHaveLength(1);
    expect(sourceFaults('a.ts', '// see `docs/WORKSHOP.md`, §5.5')).toHaveLength(1);
    expect(sourceFaults('a.ts', "describe('presets (§8.4.1)', () => {});")).toEqual([`a.ts:1: cites a section number, but the file does not name ${DATED}`]);
    expect(sourceFaults('a.ts', `/** Text (${DATED} §4.10). */\ndescribe('presets (§8.4.1)', () => {});`)).toEqual([]);
    expect(sourceFaults('a.ts', "/** The Workshop (docs/WORKSHOP.md). */ evidence: 'docs/RULES.md §3'")).toEqual([]);
  });
});
