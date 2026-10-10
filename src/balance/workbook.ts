import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export interface WorkbookSource {
  source: string;
  sha256: string;
  sheets: {
    name: string;
    cells: { cell: string; value: string }[];
    validations: { range: string; formula: string }[];
  }[];
}

function xmlText(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity: string) => {
    const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (!entity.startsWith('#')) return named[entity];
    return String.fromCodePoint(entity[1] === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
  });
}

function attributes(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([\w:]+)="([^"]*)"/g)].map(m => [m[1], xmlText(m[2])]));
}

function textRuns(xml: string): string {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m => xmlText(m[1])).join('');
}

/** Read saved cell values. Keep formulas and formatting in the source workbook. */
export function parseWorkbook(readEntry: (name: string) => string, source: string, sha256: string): WorkbookSource {
  const rels = new Map([...readEntry('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\s[^>]*\/?\s*>/g)]
    .map(m => { const a = attributes(m[0]); return [a.Id, a.Target]; }));
  let shared: string[] = [];
  const sharedEntry = [...rels.values()].find(p => p.endsWith('sharedStrings.xml'));
  if (sharedEntry) {
    const path = sharedEntry.startsWith('/') ? sharedEntry.slice(1) : `xl/${sharedEntry}`;
    shared = [...readEntry(path).matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(m => textRuns(m[1]));
  }
  const sheets = [...readEntry('xl/workbook.xml').matchAll(/<sheet\s[^>]*\/?\s*>/g)].map(m => {
    const a = attributes(m[0]);
    const target = rels.get(a['r:id']);
    if (!target || target.includes('..') || target.includes('://')) throw new Error(`Invalid sheet target: ${a.name}`);
    const content = readEntry(target.startsWith('/') ? target.slice(1) : `xl/${target}`);
    const cells = [...content.matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].flatMap(c => {
      const attr = attributes(c[1]);
      const body = c[2] ?? '';
      const raw = body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/)?.[1] ?? '';
      const value = attr.t === 's' ? shared[Number(raw)] : attr.t === 'inlineStr' ? textRuns(body) : xmlText(raw);
      if (value === undefined) throw new Error(`Missing shared string: ${a.name}!${attr.r}`);
      return value ? [{ cell: attr.r, value }] : [];
    });
    const validations = [...content.matchAll(/<dataValidation\s([^>]*)>([\s\S]*?)<\/dataValidation>/g)].map(v => ({
      range: attributes(v[1]).sqref,
      formula: xmlText(v[2].match(/<formula1>([\s\S]*?)<\/formula1>/)?.[1] ?? ''),
    }));
    return { name: a.name, cells, validations };
  });
  return { source, sha256, sheets };
}

export function readWorkbook(path: string, source: string): WorkbookSource {
  return parseWorkbook(name => execFileSync('unzip', ['-p', path, name], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }),
    source, createHash('sha256').update(readFileSync(path)).digest('hex'));
}

export function newDesigns(workbook: WorkbookSource) {
  return workbook.sheets.filter(s => ['Piece matrix', 'Card matrix'].includes(s.name)).map(sheet => {
    const cells = new Map(sheet.cells.map(c => [c.cell, c.value]));
    const properties = sheet.cells.filter(c => /^A\d+$/.test(c.cell) && Number(c.cell.slice(1)) > 3)
      .map(c => ({ dimension: c.value, cell: `B${c.cell.slice(1)}`, value: cells.get(`B${c.cell.slice(1)}`) ?? null }));
    return { sheet: sheet.name, properties, specified: properties.filter(p => p.value !== null).length };
  });
}
