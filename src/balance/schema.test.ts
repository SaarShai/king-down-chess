import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALL_CARDS, BUILT, DEFAULT_RULES, POWERS_BALANCED } from '../rules/rules';
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
  it('keeps the Oct9 defaults and Morph limits in the typed records', () => {
    expect(RULE_DIMENSIONS.guardNextToKing.default).toBe(true);
    expect(RULE_DIMENSIONS.archerShots.default).toBe('far2');
    expect(RULE_DIMENSIONS.archerShots.allowed).toEqual(sourceContract(baseline.rulesSource).choices.archerShots);
    expect(RULE_DIMENSIONS.guardReserve.allowed).toContain('any');
    expect(POWERS_BALANCED.deathTouchReachForwardBack).toBe(true);
    expect(SHIPPED_ELEMENTS.find(e => e.name === 'Paladin')?.shipped).toBe(true);
    const morph = SHIPPED_ELEMENTS.find(e => e.kind === 'card' && e.name === 'Morph')!;
    if (morph.kind !== 'card') throw new Error('missing Morph');
    expect(morph.dimensions.resultTypes).toContain('L');
    expect(morph.dimensions.excludedResults).toContain('secondGuard');
  });
  it('records copied values and mark renewal without null placeholders', () => {
    for (const name of ['Mirror', 'MirrorB']) {
      const e = SHIPPED_ELEMENTS.find(e => e.kind === 'card' && e.name === name)!;
      expect(e.dimensions).toMatchObject({ turnCost: 'inherited', captures: 'inherited', targets: 'inherited', duration: 'inherited', targetKind: 'card' });
      const wrong = structuredClone(e);
      if (wrong.kind !== 'card') throw new Error('missing copy card');
      wrong.dimensions.duration = 'instant';
      expect(validateElement(wrong)).toContain(`${wrong.id}: duration inherits only for a copy effect`);
    }
    expect(SHIPPED_ELEMENTS.find(e => e.kind === 'card' && e.name === 'Rescue')?.dimensions).toMatchObject({ duration: 'renewOpponentTurn', targetKind: 'mark' });
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
  it('has no source findings after the approved corrections', () => {
    expect(auditDesign(baseline)).toEqual([]);
  });
  it.each([
    ['MATRIX_MORPH_READING_GAP', 'second Guard for the side', 'guard for the side'],
    ['MATRIX_CONDITION_GAP', 'a piece lost · a card played · material behind · own last mark', 'a card played'],
    ['MATRIX_NULL_TURN_COST_GAP', 'none (always-on) · ', ''],
    ['MATRIX_COPY_GAP', 'inherited from the copied card', 'unspecified'],
    ['MATRIX_CAPTURE_STAGE_GAP', '| Second capture | same as Captures · may · must · never |', '| Second capture | same as Captures |'],
    ['MATRIX_TARGET_DOMAIN_GAP', 'piece · pawn · empty square · pile · prior mark · card', 'piece · pawn · card'],
    ['MATRIX_DURATION_GAP', 'renew an earlier mark for one more opponent turn', 'next turn'],
    ['FLIGHT_ABILITY_CONFLICT', '**1b Special move — friendly half only**', '**1b Arriving — friendly half only**'],
  ])('reports %s only when its source fact is absent', (code, current, stale) => {
    expect(baseline.matrixDoc).toContain(current);
    expect(codes(baseline)).not.toContain(code);
    expect(codes({ ...baseline, matrixDoc: baseline.matrixDoc.replace(current, stale) })).toContain(code);
  });
  it('rejects the old blanket movement ban while retaining approved powers', () => {
    const approved = 'When adjusting a king power for balance, do not add changes to how';
    expect(baseline.rulesDoc).toContain(approved);
    expect(readFileSync(new URL('../../AGENTS.md', import.meta.url), 'utf8')).toContain(approved);
    expect(codes({ ...baseline, rulesDoc: `${baseline.rulesDoc}\nNo king-power reading changes how other pieces move.` })).toContain('KING_MOVEMENT_RULE_CONFLICT');
  });
  it('fails if a matrix dimension is removed', () => {
    const input = { ...baseline, matrixDoc: baseline.matrixDoc.replace(/^\| Captures \|[^\n]*\n/m, '') };
    expect(codes(input)).toContain('MATRIX_DIMENSIONS_DRIFT');
    expect(codes(input)).toContain('DOCUMENT_DRIFT');
  });
  it('fails if allowed values change while all old words remain', () => {
    const input = { ...baseline, matrixDoc: baseline.matrixDoc.replace('| Captures | may · must · never · inherited from the copied card |', '| Captures | may · must · never · always · inherited from the copied card |') };
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
    expect(actual.choices.guardReserve).toEqual(['off', 'rank1', 'rank12', 'any']);
    const removed = baseline.rulesSource.replace('  archerChecks: boolean;', '  // archerChecks: boolean;');
    expect(sourceContract(removed).types.archerChecks).toBeUndefined();
  });
});

describe('recorded versions', () => {
  it.each([
    ['Rules', 'C18', 'Four starting cards per side.', 'Six cards a side.', 'WORKBOOK_HAND_SIZE_CONFLICT'],
    ['Cards', 'E2', 'Each side starts with the same four random one-use cards from the deal.', 'Each side gets the same six random one-use cards from the deal.', 'WORKBOOK_HAND_SIZE_CONFLICT'],
    ['Rules', 'C5', 'Each army starts with at most one Beast. Morph cannot create a Beast while that side has one. Salvation or Sacrifice may return a captured Beast even if that gives the side a second Beast.', 'An army never has two beasts, custom armies included.', 'WORKBOOK_BEAST_LIMIT_CONFLICT'],
  ])('detects stale text in %s!%s', (sheet, cell, current, stale, code) => {
    expect(codes({ ...baseline, workbook: workbook(sheet, { [cell]: current }) })).not.toContain(code);
    expect(codes({ ...baseline, workbook: workbook(sheet, { [cell]: stale }) })).toContain(code);
  });
  it('maps the Beast limit to the starting army and keeps the Morph exclusion', () => {
    const w = workbook('Rules', { A5: 'One beast per army', B5: 'Approved', C5: 'Each army starts with at most one Beast.' });
    expect(mapWorkbookVersions(w)[0].element).toMatchObject({ kind: 'globalRule', axis: 'beastLimit', dimensions: { value: 'oneInArmy' } });
    const morph = SHIPPED_ELEMENTS.find(e => e.kind === 'card' && e.name === 'Morph')!;
    if (morph.kind !== 'card') throw new Error('missing Morph');
    expect(morph.dimensions.excludedResults).toContain('secondBeast');
  });
  it('maps both current hand records to four starting cards', () => {
    for (const w of [workbook('Rules', { A18: 'Hand size', B18: 'Approved', C18: 'Four starting cards per side.' }), workbook('Cards', { A2: 'Card mode', C2: 'Base', D2: 'Testing', E2: 'Each side starts with four cards.' })]) {
      expect(mapWorkbookVersions(w)[0].element).toMatchObject({ kind: 'globalRule', axis: 'handSize', dimensions: { value: 4 } });
    }
  });
  it('rejects malformed workbook data at the input boundary', () => {
    expect(() => parseWorkbook({ source: 'file.xlsx', sha256: 'a'.repeat(64), sheets: [{ name: 'Pieces', cells: [{ cell: 'A0', value: {} }] }] })).toThrow();
    expect(parseWorkbook({ source: 'file.xlsx', sha256: 'a'.repeat(64), sheets: [] }).source).toBe('file.xlsx');
  });
  it('maps the approved far2 target to the current default', () => {
    const w = workbook('Pieces', { A1: 'Name', A8: 'Archer', C8: 'Far2', D8: 'Approved', E8: 'Farther shots', F8: '3.39 ± 0.27 pawns', W8: 'owner choice' });
    const versions = mapWorkbookVersions(w);
    expect(versions).toHaveLength(1);
    const element = versions[0].element!;
    expect(element.approval).toBe('approved');
    expect(element.shipped).toBe(true);
    expect(element.tested).toBe(true);
    expect(element.sources).toContain('workbook:Pieces!C8');
    expect(validateElement(element)).toEqual([]);
    expect(codes({ ...baseline, workbook: w })).not.toContain('VERSION_ABSENT_FROM_MATRIX');
  });
  it.each(['Over2', 'Over23'])('finds the documented historical %s reading', version => {
    const w = workbook('Pieces', { A8: 'Archer', C8: version, D8: 'Rejected' });
    expect(codes({ ...baseline, workbook: w })).not.toContain('VERSION_ABSENT_FROM_MATRIX');
    const without = baseline.matrixDoc.replace(new RegExp(`\\b${version.toLowerCase()}\\b`, 'g'), 'removedReading');
    expect(codes({ ...baseline, workbook: w, matrixDoc: without })).toContain('VERSION_ABSENT_FROM_MATRIX');
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
    expect(t2.shipped).toBe(true);
    expect(released.approval).toBe('dropped');
    expect(released.rules.deathTouchReachForwardBack).toBe(false);
  });
  it('maps the Guard start flag and keeps the reserve reading in the lab', () => {
    const w = workbook('Pieces', { A9: 'Guard', G9: 'Starts next to the king', H9: 'Approved', O9: 'Drop on any empty square', P9: 'Testing' });
    const [start, reserve] = mapWorkbookVersions(w).map(v => v.element!);
    expect(start).toMatchObject({ kind: 'rule', flag: 'guardNextToKing', dimensions: { value: true }, shipped: true });
    expect(reserve).toMatchObject({ kind: 'rule', flag: 'guardReserve', dimensions: { value: 'any' }, shipped: false });
    expect(codes({ ...baseline, workbook: w })).not.toContain('DECLARED_TARGET_NOT_SHIPPED');
    expect(codes({ ...baseline, workbook: w })).not.toContain('WORKBOOK_HAND_SIZE_CONFLICT');
    expect(codes(baseline)).not.toContain('RULE_ABSENT_FROM_MATRIX');
  });
  it('keeps old Archer and Death Touch readings separate from new defaults', () => {
    const archer = mapWorkbookVersions(workbook('Pieces', { A8: 'Archer', K8: 'PlusDiagFwd2', L8: 'Rejected' }))[0].element!;
    expect(archer.shipped).toBe(false);
    expect(archer).toMatchObject({ dimensions: { shotPattern: 'plusDiagFwd2' }, rules: { archerShots: 'plusDiagFwd2' } });
    const variants = ['Never backward', 'Never backward + takes pieces only', 'T3 (reach takes pieces only)', 'Next to it only (T5)', 'Next to it + takes by moving (T5m)', 'Diagonal reach'];
    for (const version of variants) {
      const e = mapWorkbookVersions(workbook('King powers', { B12: 'Death Touch', D12: version, E12: 'Rejected' }))[0].element!;
      expect(e).toMatchObject({ shipped: false, rules: { deathTouchReachForwardBack: false } });
      expect(validateElement(e)).toEqual([]);
    }
  });
  it('maps only the original archived Squire Base version', () => {
    const w = workbook('Pieces', { A17: 'Squire', C17: 'Base', D17: 'Dropped', E17: 'Reserve piece from the recovered Cursor experiment.', F17: 'Archived. Not in src/.', W17: 'docs/MATRIX.md' });
    const e = mapWorkbookVersions(w)[0].element!;
    expect(e).toMatchObject({ kind: 'piece', letter: 'E', approval: 'dropped', shipped: false, tested: true, dimensions: { movement: 'step1', capturePattern: 'same', deployment: 'reserveOnceAnyEmptySquare' }, rules: {} });
    expect(e.sources).toContain('docs/research/squire-drop-2026-09-24.md');
    expect(validateElement(e)).toEqual([]);
    expect(codes({ ...baseline, workbook: w })).not.toContain('VERSION_NOT_MAPPED');
    expect(mapWorkbookVersions(workbook('Pieces', { A17: 'Squire', C17: 'Unspecified shape', D17: 'Dropped' }))[0].element).toBeNull();
  });
  it('reports a missing mapping and leaves unknown status unresolved', () => {
    const w = workbook('Pieces', { A17: 'Squire', C17: 'Unspecified shape', D17: 'Unknown', E17: 'No source movement text' });
    expect(mapWorkbookVersions(w)[0].element).toBeNull();
    const finding = auditDesign({ ...baseline, workbook: w }).find(f => f.code === 'VERSION_NOT_MAPPED')!;
    expect(finding.source).toBe('workbook:Pieces!C17');
    expect(finding.approval).toBe('unresolved');
  });
});
