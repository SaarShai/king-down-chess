import { ALL_CARDS, DEFAULT_RULES, KINGS, RULES, parseRule, setRules, type Rules } from '../rules/rules';
import { G, K, SPENT, T, colorOf, typeOf, inCheck, type Mark, type Position } from '../rules/engine';
import { parseDesign, specOf } from '../workshop/model';

export type PositionData = Omit<Position, 'board' | 'marks' | 'last'> & {
  board: number[];
  marks?: readonly [Mark | null, Mark | null];
  last?: readonly [typeof ALL_CARDS[number] | null, typeof ALL_CARDS[number] | null];
};
export interface Study {
  schema: 'kingdown-study/1'; id: string; version: number; parentVersion: number | null;
  title: string; question: string; engine: string; design?: { code: string; version: number };
  rules: Rules; start: PositionData; prefix: string[]; actions: string[]; origin: 'constructed' | 'game';
}
export const MAX_ACTIONS = 1000;
export function object(input: unknown, keys: readonly string[]): Record<string, any> {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !keys.includes(k))) throw new Error('Malformed study object');
  return input as Record<string, any>;
}
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
function integer(n: unknown, max = 1_000_000): n is number { return Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) <= max; }
function text(s: unknown, max = 500): s is string { return typeof s === 'string' && s.length > 0 && s.length <= max; }
export function withRules<T>(rules: Rules, fn: () => T): T {
  const previous = structuredClone(RULES);
  try { setRules(structuredClone(rules)); return fn(); }
  finally { Object.assign(RULES, previous); }
}
export function positionData(p: Position): PositionData {
  return structuredClone({ ...p, board: Array.from(p.board), ...(p.marks ? { marks: p.marks.map(m => m ?? null) } : {}), ...(p.last ? { last: p.last.map(c => c ?? null) } : {}) }) as PositionData;
}
export function positionOf(p: PositionData): Position {
  return { ...structuredClone(p), board: new Uint8Array(p.board), ...(p.marks ? { marks: [p.marks[0] ?? undefined, p.marks[1] ?? undefined] as Position['marks'] } : {}), ...(p.last ? { last: [p.last[0] ?? undefined, p.last[1] ?? undefined] as Position['last'] } : {}) } as Position;
}
function sorted(value: any): any { return Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, sorted(value[k])])) : value; }
function rulesOf(input: unknown): Rules {
  const r = object(input, Object.keys(DEFAULT_RULES));
  check(Object.keys(r).length === Object.keys(DEFAULT_RULES).length, 'Full rules required');
  for (const [key, def] of Object.entries(DEFAULT_RULES)) {
    const v = r[key];
    if (['kings', 'hands', 'piles', 'fromMove', 'design'].includes(key)) continue;
    check(typeof v === typeof def && parseRule(`${key}=${v}`)[key as keyof Rules] === v, `Bad rule ${key}`);
  }
  check(Array.isArray(r.kings) && r.kings.length === 2, 'Bad kings');
  for (const king of r.kings) if (king !== null) {
    const k = object(king, ['king', 'power']);
    check(typeof k.king === 'string' && Object.hasOwn(KINGS, k.king) && KINGS[k.king as keyof typeof KINGS].includes(k.power), 'Bad king power');
  }
  for (const key of ['hands', 'piles']) {
    check(Array.isArray(r[key]) && r[key].length === 2, `Bad ${key}`);
    for (const cards of r[key]) check(Array.isArray(cards) && cards.length <= (key === 'hands' ? 8 : 100) && cards.every(c => ALL_CARDS.includes(c)), `Bad ${key}`);
  }
  const from = object(r.fromMove, ALL_CARDS);
  check(Object.values(from).every(n => integer(n) && n > 0), 'Bad fromMove');
  if (r.design !== null) {
    const d = object(r.design, ['squares', 'lines', 'rules', 'like', 'code']);
    check(text(d.code, 16000), 'Design share code required');
    const parsed = parseDesign(d.code);
    check(parsed && JSON.stringify(sorted({ ...specOf(parsed), code: d.code })) === JSON.stringify(sorted(d)), 'Design and share code differ');
  }
  return withRules(r as Rules, () => structuredClone(r as Rules));
}
function validatePosition(input: unknown, rules: Rules): PositionData {
  const p = object(input, ['board', 'turn', 'halfmove', 'ply', 'move', 'used', 'marks', 'free', 'haste', 'rage', 'last', 'drawn', 'lost', 'waiting', 'castle', 'ep']);
  check(Array.isArray(p.board) && p.board.length === 64 && p.board.every(v => integer(v, 63) && (v === 0 || typeOf(v) > 0 && (!(v & SPENT) || typeOf(v) === G || typeOf(v) === T && !!rules.design))), 'Bad board bytes');
  check([0, 1].includes(p.turn) && integer(p.halfmove) && integer(p.ply), 'Bad turn counters');
  for (const c of [0, 1]) check(p.board.filter((v: number) => v && typeOf(v) === K && colorOf(v) === c).length === 1, 'One king per side required');
  if (p.move !== undefined) check(integer(p.move) && p.move > 0, 'Bad move number');
  for (const key of ['used', 'drawn', 'waiting']) if (p[key] !== undefined) check(Array.isArray(p[key]) && p[key].length === 2 && p[key].every((n: unknown) => integer(n, 10000)), `Bad ${key}`);
  if (p.lost !== undefined) check(Array.isArray(p.lost) && p.lost.length === 32 && p.lost.every((n: unknown) => integer(n, 10000)), 'Bad lost reserve');
  if (p.marks !== undefined) {
    check(Array.isArray(p.marks) && p.marks.length === 2, 'Bad marks');
    for (const mark of p.marks) if (mark !== null) {
      const m = object(mark, ['sq', 'left', 'ward', 'all']);
      check(integer(m.sq, 63) && (m.left === undefined || integer(m.left, 2)) && ['ward', 'all'].every(k => m[k] === undefined || typeof m[k] === 'boolean') && (!m.all || m.ward), 'Bad mark');
    }
  }
  if (p.last !== undefined) check(Array.isArray(p.last) && p.last.length === 2 && p.last.every((c: any) => c === null || ALL_CARDS.includes(c)), 'Bad last cards');
  if (p.free !== undefined) check(typeof p.free === 'boolean' && (!p.free || rules.markFree), 'Bad free action');
  if (p.haste !== undefined) check(integer(p.haste, 63) && p.board[p.haste] && colorOf(p.board[p.haste]) === p.turn, 'Bad extra action');
  if (p.rage !== undefined) check([1, 2, 3].includes(p.rage) && p.haste !== undefined, 'Bad rage');
  if (p.castle !== undefined) check(rules.classicChess && integer(p.castle, 15), 'Bad castling rights');
  if (p.ep !== undefined) check(rules.classicChess && integer(p.ep, 63) && (p.ep >> 3) === (p.turn === 0 ? 5 : 2) && !p.board[p.ep], 'Bad en passant');
  for (const c of [0, 1]) if (p.drawn) check(p.drawn[c] <= rules.piles[c].length, 'Draw count exceeds pile');
  const data = structuredClone(p) as PositionData;
  withRules(rules, () => {
    const pos = positionOf(data);
    check(!inCheck({ ...pos, turn: (1 - pos.turn) as 0 | 1 }), 'Side that just moved is in check');
  });
  return data;
}
export function parseStudy(input: unknown): Study {
  check(JSON.stringify(input)?.length <= 1_000_000, 'Study size limit');
  const s = object(input, ['schema', 'id', 'version', 'parentVersion', 'title', 'question', 'engine', 'design', 'rules', 'start', 'prefix', 'actions', 'origin']);
  check(s.schema === 'kingdown-study/1', 'Unsupported study schema');
  check(text(s.id) && text(s.title) && text(s.question, 10000) && text(s.engine), 'Bad study text or engine source');
  check(integer(s.version) && s.version > 0 && (s.parentVersion === null || integer(s.parentVersion) && s.parentVersion > 0 && s.parentVersion < s.version), 'Bad study version');
  check(['constructed', 'game'].includes(s.origin), 'Bad study origin');
  check(s.origin === 'constructed', 'Real-game provenance is unsupported in study version 1');
  for (const key of ['prefix', 'actions']) check(Array.isArray(s[key]) && s[key].length <= MAX_ACTIONS && s[key].every((v: unknown) => text(v, 1024)), 'Bad study history');
  const rules = rulesOf(s.rules), start = validatePosition(s.start, rules);
  if (s.design !== undefined) {
    const d = object(s.design, ['code', 'version']);
    check(text(d.code, 16000) && integer(d.version) && d.version > 0 && d.code === rules.design?.code, 'Bad design reference');
  }
  check(!!s.design === !!rules.design, 'Design reference required');
  return { ...structuredClone(s), rules, start } as Study;
}
export function createStudy(input: Omit<Study, 'schema'>): Study { return parseStudy({ ...input, schema: 'kingdown-study/1' }); }
