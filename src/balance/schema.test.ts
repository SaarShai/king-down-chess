import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALL_CARDS, BUILT, DEFAULT_RULES } from '../rules/rules';
import { auditDesign, mapWorkbookVersions, parseWorkbook, SHIPPED_ELEMENTS, sourceContract } from './design';
import type { AuditInput, Workbook } from './design';
import { DIMENSIONS, RULE_DIMENSIONS, validateElement } from './schema';
import type { DesignElement } from './schema';

const baseline: AuditInput = {
  matrixDoc: readFileSync(new URL('../../docs/MATRIX.md', import.meta.url), 'utf8'),
  rulesDoc: readFileSync(new URL('../../docs/RULES.md', import.meta.url), 'utf8'),
  rulesSource: readFileSync(new URL('../rules/rules.ts', import.meta.url), 'utf8'),
};
const codes = (input: AuditInput) => auditDesign(input).map(f => f.code);
const piece = () => structuredClone(SHIPPED_ELEMENTS.find(e => e.kind === 'piece' && e.name === 'Archer')!);
function workbook(sheet: string, values: Record<string, string>): Workbook {
  return { source: 'fixture.xlsx', sha256: 'fixture', sheets: [{ name: sheet, cells: Object.entries(values).map(([cell, value]) => ({ cell, value })) }] };
}

describe('design schema', () => {
  it('covers each engine rule and each built piece, power and card', () => {
    expect(Object.keys(RULE_DIMENSIONS).sort()).toEqual(Object.keys(DEFAULT_RULES).sort());
    expect(SHIPPED_ELEMENTS.filter(e => e.kind === 'piece')).toHaveLength(15);
    expect(SHIPPED_ELEMENTS.filter(e => e.kind === 'kingPower').map(e => e.name).sort()).toEqual([...BUILT].sort());
    expect(SHIPPED_ELEMENTS.filter(e => e.kind === 'card').map(e => e.name).sort()).toEqual([...ALL_CARDS].sort());
    expect(SHIPPED_ELEMENTS.flatMap(validateElement)).toEqual([]);
  });
  it('rejects unknown values, dimensions and incomplete records', () => {
    const e = piece();
    const d = e.dimensions as unknown as Record<string, unknown>;
    d.movement = 'teleport'; d.extra = 'new'; delete d.shield;
    const errors = validateElement(e);
    expect(errors.some(e => e.includes('movement=teleport'))).toBe(true);
    expect(errors.some(e => e.includes('unknown dimension extra'))).toBe(true);
    expect(errors.some(e => e.includes('missing shield'))).toBe(true);
  });
  it('rejects a bad rule patch and a move gate on an always-on power', () => {
    const e = structuredClone(SHIPPED_ELEMENTS.find(e => e.kind === 'kingPower' && e.name === 'March')!) as Extract<DesignElement, { kind: 'kingPower' | 'card' }>;
    e.dimensions.fromMove = 10;
    e.rules = { guardStep: 3 } as unknown as typeof e.rules;
    expect(validateElement(e).some(e => e.includes('always-on power'))).toBe(true);
    expect(validateElement(e).some(e => e.includes('guardStep=3'))).toBe(true);
  });
  it('keeps conditions and stage capture separate from worth', () => {
    expect(DIMENSIONS.conditions).toContain('pieceLost');
    const rage = SHIPPED_ELEMENTS.find(e => e.kind === 'card' && e.name === 'RageB')!;
    if (rage.kind !== 'card') throw new Error('missing RageB card');
    expect(rage.dimensions.captures).toBe('may');
    expect(rage.dimensions.secondCapture).toBe('must');
  });
});

describe('document and source drift', () => {
  it('has no unreviewed baseline drift while it reports the existing gaps', () => {
    const findings = auditDesign(baseline);
    expect(findings.filter(f => /DRIFT|SECTION_(ADDED|REMOVED)|ELEMENT_DOES_NOT_FIT/.test(f.code))).toEqual([]);
    expect(findings.some(f => f.code === 'RULE_ABSENT_FROM_MATRIX' && f.source.includes('guardReserve'))).toBe(true);
    expect(findings.some(f => f.code === 'STALE_MATRIX_STATUS')).toBe(true);
    expect(findings.every(f => f.source && f.approval && f.message)).toBe(true);
  });
  it('fails if a matrix dimension is removed', () => {
    const input = { ...baseline, matrixDoc: baseline.matrixDoc.replace(/^\| Captures \| may · must · never \|\n/m, '') };
    expect(codes(input)).toContain('MATRIX_DIMENSIONS_DRIFT');
    expect(codes(input)).toContain('DOCUMENT_DRIFT');
  });
  it('fails if allowed values change while all old words remain', () => {
    const input = { ...baseline, matrixDoc: baseline.matrixDoc.replace('| Captures | may · must · never |', '| Captures | may · must · never · always |') };
    expect(codes(input)).toContain('DOCUMENT_DRIFT');
  });
  it('fails on changed behavior while the names remain', () => {
    const input = { ...baseline, matrixDoc: baseline.matrixDoc.replace('may, on either move', 'never, on either move') };
    expect(codes(input)).toContain('DOCUMENT_DRIFT');
  });
  it('fails on removed and added sections, and accepts whitespace in a section', () => {
    expect(codes({ ...baseline, matrixDoc: baseline.matrixDoc.replace('### C.1 Schema:', '### C.9 Schema:') })).toContain('DOCUMENT_SECTION_REMOVED');
    expect(codes({ ...baseline, matrixDoc: `${baseline.matrixDoc}\n### E. New axis\nA new rule.\n` })).toContain('DOCUMENT_SECTION_ADDED');
    const spaced = baseline.matrixDoc.replace('may · must · never', 'may   ·   must   ·   never');
    expect(codes({ ...baseline, matrixDoc: spaced })).not.toContain('DOCUMENT_DRIFT');
  });
  it('fails on a changed source type alias and CLI choice', () => {
    const alias = baseline.rulesSource.replace("type GuardCaptures = 'none' | 'pawns' | 'any'", "type GuardCaptures = 'none' | 'pawns'");
    expect(codes({ ...baseline, rulesSource: alias })).toContain('RULE_ALIAS_TYPE_DRIFT');
    const choices = baseline.rulesSource.replace("guardCaptures: ['none', 'pawns', 'any']", "guardCaptures: ['none', 'pawns']");
    expect(codes({ ...baseline, rulesSource: choices })).toContain('RULE_CHOICE_DRIFT');
  });
  it('fails on added and removed source fields and on changed default values', () => {
    expect(codes({ ...baseline, rulesSource: baseline.rulesSource.replace('export interface Rules {', 'export interface Rules {\n  newRule: boolean;') })).toContain('RULE_NOT_IN_SCHEMA');
    expect(codes({ ...baseline, rulesSource: baseline.rulesSource.replace('  archerChecks: boolean;', '') })).toContain('RULE_TYPE_DRIFT');
    expect(codes({ ...baseline, defaults: { ...DEFAULT_RULES, guardStep: 2 } })).toContain('RULE_DEFAULT_DRIFT');
    expect(codes({ ...baseline, balanced: {} })).toContain('BALANCED_READING_DRIFT');
  });
  it('reads declarations rather than comments that mention a flag', () => {
    const actual = sourceContract(baseline.rulesSource);
    expect(Object.keys(actual.types).sort()).toEqual(Object.keys(DEFAULT_RULES).sort());
    expect(actual.types.guardReserve).toBe('GuardReserve');
    expect(actual.choices.guardReserve).toEqual(['off', 'rank1', 'rank12']);
    const removed = baseline.rulesSource.replace('  archerChecks: boolean;', '  // archerChecks: boolean;');
    expect(sourceContract(removed).types.archerChecks).toBeUndefined();
  });
});

describe('recorded versions', () => {
  it('rejects malformed workbook data at the input boundary', () => {
    expect(() => parseWorkbook({ source: 'file.xlsx', sha256: 'a'.repeat(64), sheets: [{ name: 'Pieces', cells: [{ cell: 'A0', value: {} }] }] })).toThrow();
    expect(parseWorkbook({ source: 'file.xlsx', sha256: 'a'.repeat(64), sheets: [] }).source).toBe('file.xlsx');
  });
  it('keeps approved targets separate from what ships', () => {
    const w = workbook('Pieces', { A1: 'Name', A8: 'Archer', C8: 'Far2', D8: 'Approved', E8: 'Farther shots', F8: '3.39 ± 0.27 pawns', W8: 'owner choice' });
    const versions = mapWorkbookVersions(w);
    expect(versions).toHaveLength(1);
    const element = versions[0].element!;
    expect(element.approval).toBe('approved');
    expect(element.shipped).toBe(false);
    expect(element.tested).toBe(true);
    expect(element.sources).toContain('workbook:Pieces!C8');
    expect(validateElement(element)).toEqual([]);
    expect(codes({ ...baseline, workbook: w })).toContain('VERSION_ABSENT_FROM_MATRIX');
  });
  it('splits combined tested versions with a separate patch for each', () => {
    const w = workbook('Pieces', { A1: 'Name', A8: 'Archer', G8: 'PlusDiagFwd2Clear, fwd2NoBack, fwd2NoSide', H8: 'Testing', I8: 'Three shot sets' });
    const versions = mapWorkbookVersions(w);
    expect(versions.map(v => v.version)).toEqual(['plusDiagFwd2Clear', 'fwd2NoBack', 'fwd2NoSide']);
    expect(versions.every(v => !v.element?.shipped)).toBe(true);
    expect(versions.flatMap(v => validateElement(v.element!))).toEqual([]);
  });
  it('keeps the selected Death Touch T2 patch and the old version separate', () => {
    const w = workbook('King powers', { B12: 'Death Touch', D12: 'T2 (no sideways reach)', E12: 'Approved', F12: 'Forward and back', G12: '49.3% depth 3', AF12: 'As released', AG12: 'Dropped', AH12: 'Sideways too' });
    const versions = mapWorkbookVersions(w);
    const t2 = versions[0].element!, released = versions[1].element!;
    expect(t2.kind).toBe('kingPower');
    if (!('rules' in t2) || !('rules' in released)) throw new Error('missing power rules');
    expect(t2.rules.deathTouchReachForwardBack).toBe(true);
    expect(t2.shipped).toBe(false);
    expect(released.approval).toBe('dropped');
    expect(released.rules.deathTouchReachForwardBack).not.toBe(true);
  });
  it('reports a missing mapping and leaves unknown status unresolved', () => {
    const w = workbook('Pieces', { A17: 'Squire', C17: 'Base', D17: 'Unknown', E17: 'No source movement text' });
    expect(mapWorkbookVersions(w)[0].element).toBeNull();
    const finding = auditDesign({ ...baseline, workbook: w }).find(f => f.code === 'VERSION_NOT_MAPPED')!;
    expect(finding.source).toBe('workbook:Pieces!C17');
    expect(finding.approval).toBe('unresolved');
  });
});
