// Lint for the safety drafts in docs/safety (accounts-multiplayer ticket 05). A draft is not legal text,
// but each file must carry the same four things, so that the owner and a lawyer can find them:
//   - the DRAFT line first;
//   - a list of the facts that only the owner can supply (one `- [ ]` item or more);
//   - a Sources section with a link to a regulator's own page (and https links only);
//   - no model name, and no relative link to a file that does not exist.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findModelNames } from './lib/model-names.mjs';

const root = join(import.meta.dirname, '..');
const FOLDER = 'docs/safety';
const FIRST_LINE = 'DRAFT — not legal advice; the owner and a lawyer must check it';
const FILES = ['uk-illegal-content-risk-assessment', 'uk-childrens-access-assessment', 'uk-childrens-risk-assessment', 'uk-record-of-measures', 'terms-draft', 'safety-and-reporting-draft', 'contact-draft'].map(name => `${name}.md`);
/** A regulator or the law itself: the pages that the drafts must cite (a platform page can come in addition). */
const REGULATOR = /^https:\/\/(www\.)?(legislation\.gov\.uk|ofcom\.org\.uk|ico\.org\.uk|eur-lex\.europa\.eu|ftc\.gov)\//;
const LINK = /\[[^\]]*\]\((?:<([^>]+)>|([^)\s]+))\)/g;

const read = (file: string) => readFileSync(join(root, FOLDER, file), 'utf8');
/** The lines under one `##` heading, up to the next `##` heading. */
const section = (text: string, heading: string) => {
  const lines = text.split('\n');
  const start = lines.findIndex(line => line === `## ${heading}`);
  if (start < 0) return null;
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return lines.slice(start + 1, end < 0 ? undefined : end);
};
const links = (text: string) => [...text.matchAll(LINK)].map(match => match[1] ?? match[2]);

describe('docs/safety drafts', () => {
  it('holds the seven draft files and no other file', () => {
    expect(readdirSync(join(root, FOLDER)).sort()).toEqual([...FILES].sort());
  });

  for (const file of FILES) {
    describe(file, () => {
      const text = read(file);
      it(`starts with the DRAFT line`, () => expect(text.split('\n')[0]).toBe(FIRST_LINE));
      it('lists the facts that only the owner can supply', () => {
        const lines = section(text, 'Facts only the owner can supply');
        expect(lines, 'section "Facts only the owner can supply"').not.toBeNull();
        expect(lines!.filter(line => line.startsWith('- [ ] ')).length).toBeGreaterThan(0);
      });
      it('cites a regulator in its Sources section, with https links only', () => {
        const lines = section(text, 'Sources');
        expect(lines, 'section "Sources"').not.toBeNull();
        const found = links(lines!.join('\n'));
        expect(found.filter(url => !url.startsWith('https://')), 'non-https links').toEqual([]);
        expect(found.some(url => REGULATOR.test(url)), 'a regulator link').toBe(true);
      });
      it('holds no model name', () => expect(findModelNames(text)).toEqual([]));
      it('holds no broken relative link', () => {
        const relative = links(text).filter(url => !/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(url));
        expect(relative.filter(url => !existsSync(join(root, FOLDER, decodeURI(url.replace(/[#?].*$/, '')))))).toEqual([]);
      });
    });
  }
});
