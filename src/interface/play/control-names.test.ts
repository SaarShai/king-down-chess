import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { guideEntries } from './guide';
import { text } from './texts';

// The turn controls (ui/turn-controls.ts): Undo, End turn against the computer, Send online.
const controls = [text.undo, text.finish, text.send].filter(Boolean);
const help = join(__dirname, 'help');
const files = [join(__dirname, 'guide.ts'), ...readdirSync(help).filter(f => f.endsWith('.ts') && !f.includes('.test.') && !f.endsWith('.d.ts')).map(f => join(help, f))];
/** The string literals of a source file; a template keeps its words and drops each `${…}`. */
const literals = (source: string) => [...source.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '')
  .matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map(m => (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, ' '));

it('the Guide and the help text take each control name from the catalog', () => {
  const typed = files.flatMap(file => literals(readFileSync(file, 'utf8')).filter(literal => controls.some(name => new RegExp(`\\b${name}\\b`).test(literal))).map(literal => `${file.slice(__dirname.length + 1)}: ${literal}`));
  expect(typed).toEqual([]);
});

it('the Guide names the finish control of solo and online play at each mention', () => {
  for (const { short, full } of guideEntries('How a turn works')) for (const line of [short, full]) {
    for (const at of line.matchAll(new RegExp(text.finish, 'g'))) expect(line.slice(at.index), line).toMatch(new RegExp(`^${text.finish} or ${text.send}\\b`));
    expect(line).not.toMatch(/computer then plays/);
  }
});
