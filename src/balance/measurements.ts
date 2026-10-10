/** Historic measurements keep their own rules. An empty diff never names current rules. */
export type Validity = 'valid' | 'pending' | 'incomplete' | 'void' | 'conflict' | 'unverified';
export type Measure = 'whiteScore' | 'score' | 'drawRate' | 'meanPlies' | 'meanTurns' | 'relativeLengthChange' | 'pawnWorth' | 'elo' | 'activity';
export interface MeasurementContext {
  flags: Record<string, unknown> | null;
  flagsKind: 'full' | 'diff' | 'unknown';
  commit: string | null;
  sourceHash: string | null;
  specKey: string | null;
  pool: string | null;
  depth: number | null;
  machine: string | null;
  settings: Record<string, unknown> | null;
  variantScope: 'none' | 'matchup' | 'mixed' | 'unknown';
  population: 'run' | 'field' | 'mirror' | 'report';
}
export interface Measurement {
  id: string;
  run: string;
  element: string;
  version: string | null;
  context: MeasurementContext;
  measure: Measure;
  value: number | null;
  error: number | null;
  errorKind: string | null;
  sample: number | null;
  sampleUnit: 'games' | 'pairs' | 'unknown';
  unit: string;
  validity: Validity;
  reasons: string[];
  sources: string[];
  method: string;
  /** A report may give a bound instead of a point estimate. */
  bound?: 'lessThan' | 'greaterThan';
  reference?: string;
  calibration?: { eloPerPawn: number; relativeError: number | null };
}
export interface Moments { n: number; sum: number; squares: number }
export const moments = (): Moments => ({ n: 0, sum: 0, squares: 0 });
export function addMoment(m: Moments, value: number): void { m.n++; m.sum += value; m.squares += value * value; }
export function estimate(m: Moments): { value: number | null; error: number | null } {
  if (!m.n) return { value: null, error: null };
  const value = m.sum / m.n;
  return { value, error: m.n < 2 ? null : 1.96 * Math.sqrt(Math.max(0, m.squares - m.sum * value) / (m.n - 1) / m.n) };
}
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export const unknownContext = (): MeasurementContext => ({ flags: null, flagsKind: 'unknown', commit: null, sourceHash: null, specKey: null, pool: null, depth: null, machine: null, settings: null, variantScope: 'unknown', population: 'run' });

export interface ReportCell { value: number | null; error: number | null; bound?: 'lessThan' | 'greaterThan' }
export function numericCell(cell: string): ReportCell {
  const text = cell.replace(/\*|`|,/g, '').replace(/−/g, '-').trim();
  const m = /^([<>])?\s*([+-]?\d+(?:\.\d+)?)\s*(?:%?\s*±\s*([\d.]+))?/.exec(text);
  if (!m) return { value: null, error: null };
  return { value: Number(m[2]), error: m[3] === undefined ? null : Number(m[3]), ...(m[1] ? { bound: m[1] === '<' ? 'lessThan' as const : 'greaterThan' as const } : {}) };
}
export interface MarkdownTable { heading: string; headers: string[]; rows: string[][] }
export function markdownTables(text: string): MarkdownTable[] {
  const tables: MarkdownTable[] = [];
  let heading = '', table: MarkdownTable | null = null;
  for (const line of text.split('\n')) {
    if (/^#+ /.test(line)) heading = line.replace(/^#+ /, '');
    if (!line.trim().startsWith('|')) { table = null; continue; }
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map(x => x.trim());
    if (cells.every(x => /^:?-+:?$/.test(x))) continue;
    if (!table) { table = { heading, headers: cells, rows: [] }; tables.push(table); }
    else table.rows.push(cells);
  }
  return tables;
}
