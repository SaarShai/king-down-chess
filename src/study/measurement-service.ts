import { measurementSchema, parseEvidence, parseSavedPlan, type MeasurementEvidence, type SavedMeasurementPlan } from './evidence';
import { canonicalMeasurementJSON, type MeasurementPreview, type MeasurementRequest } from './measurement-plan';
import { previewStudyMeasurements, savedPlanOf } from './measurement-preview';

export interface MeasurementPlanResult { plan: SavedMeasurementPlan; preview: MeasurementPreview }
export async function planMeasurements(input: unknown, request: MeasurementRequest, source: string): Promise<MeasurementPlanResult> {
  const result = await previewStudyMeasurements(input, request, source);
  return { plan: parseSavedPlan(savedPlanOf(result)), preview: result.preview };
}
export async function verifyMeasurementPlan(input: unknown, source: string): Promise<MeasurementPlanResult> {
  const saved = parseSavedPlan(input);
  const result = await planMeasurements(saved.definition.input, saved.definition.request, source);
  if (canonicalMeasurementJSON(result.plan) !== canonicalMeasurementJSON(saved)) throw new Error('Plan source, settings or metadata changed. Create a new plan.');
  return result;
}
export const MAX_RESULT_BYTES = 64 * 1024 * 1024;
export interface ResultRun { run: string; count: number }
export interface ResultPageQuery { offset?: number; limit?: number }
/** Run and element filters use exact names. */
export interface ResultRowsQuery extends ResultPageQuery { run: string; element?: string }
export interface ResultRunPage { total: number; offset: number; runs: ResultRun[] }
export interface ResultRowPage { total: number; offset: number; rows: MeasurementEvidence['measurements'] }
export interface ResultCatalogue {
  token: string; source: MeasurementEvidence['source']; total: number; runCount: number; runs: ResultRun[];
}
function page(query: ResultPageQuery): { offset: number; limit: number } {
  const { offset = 0, limit = 100 } = query;
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Use an offset of zero or more and a page size from 1 to 100.');
  return { offset, limit };
}
/** The worker owns one file. A token prevents a late selection from using a new file. */
export function createResultImporter() {
  let generation = 0;
  let current: { token: string; source: MeasurementEvidence['source']; rows: MeasurementEvidence['measurements']; ids: Map<string, number>; runs: ResultRun[] } | undefined;
  function dataset(token: string) {
    if (!current || token !== current.token) throw new Error('Result file is closed or changed. Open it again.');
    return current;
  }
  return {
    async open(file: Blob, filename?: string): Promise<ResultCatalogue> {
      const attempt = ++generation;
      if (!(file instanceof Blob) || file.size > MAX_RESULT_BYTES) throw new Error('Result file must be a Blob of at most 64 MiB.');
      const path = filename ?? ('name' in file && typeof file.name === 'string' ? file.name : 'measurements.json');
      if (!path.length || path.length > 10000) throw new Error('Result filename is empty or too long.');
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength > MAX_RESULT_BYTES) throw new Error('Result file exceeds 64 MiB.');
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      const source = { path, sha256: Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('') };
      const raw: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      if (!raw || typeof raw !== 'object' || !('measurements' in raw) || !Array.isArray(raw.measurements)) throw new Error('Result file has no measurements.');
      if (!('schemaVersion' in raw && raw.schemaVersion === 1) && !('schema' in raw && raw.schema === 'kingdown-evidence/1')) throw new Error('Unsupported result schema.');
      if ('schema' in raw && raw.schema === 'kingdown-evidence/1') parseEvidence(raw);
      const rows: MeasurementEvidence['measurements'] = [];
      const ids = new Map<string, number>(), counts = new Map<string, number>();
      for (const value of raw.measurements) {
        const row = measurementSchema.parse(value);
        if (ids.has(row.id)) throw new Error('Duplicate measurement ID.');
        ids.set(row.id, rows.length); rows.push(row);
        counts.set(row.run, (counts.get(row.run) ?? 0) + 1);
      }
      if (attempt !== generation) throw new Error('Result file open was replaced or cleared.');
      const runs = Array.from(counts, ([run, count]) => ({ run, count }));
      current = { token: String(attempt), source, rows, ids, runs };
      return { token: current.token, source: { ...source }, total: rows.length, runCount: runs.length, runs: structuredClone(runs.slice(0, 100)) };
    },
    runs(token: string, query: ResultPageQuery = {}): ResultRunPage {
      const data = dataset(token), { offset, limit } = page(query);
      return { total: data.runs.length, offset, runs: structuredClone(data.runs.slice(offset, offset + limit)) };
    },
    rows(token: string, query: ResultRowsQuery): ResultRowPage {
      const data = dataset(token), { offset, limit } = page(query);
      const rows: MeasurementEvidence['measurements'] = [];
      let total = 0;
      for (const row of data.rows) {
        if (row.run !== query.run || query.element !== undefined && row.element !== query.element) continue;
        if (total >= offset && rows.length < limit) rows.push(row);
        total++;
      }
      return { total, offset, rows: structuredClone(rows) };
    },
    select(token: string, selected: string[]): MeasurementEvidence {
      const data = dataset(token);
      if (!Array.isArray(selected) || selected.length < 1 || selected.length > 500) throw new Error('Select from 1 to 500 measurements.');
      const measurements = selected.map(id => {
        const index = data.ids.get(id);
        if (index === undefined) throw new Error('Selected measurement does not exist in this file.');
        return data.rows[index];
      });
      return parseEvidence({ schema: 'kingdown-evidence/1', source: data.source, measurements, verification: 'measurement-export', approval: 'not-reviewed' });
    },
    clear(): void { generation++; current = undefined; },
  };
}
export type MeasurementWorkerRequest =
  | { type: 'plan'; input: unknown; request: MeasurementRequest }
  | { type: 'verifyPlan'; plan: unknown }
  | { type: 'openResults'; file: Blob; filename?: string }
  | { type: 'resultRuns'; token: string; query?: ResultPageQuery }
  | { type: 'resultRows'; token: string; query: ResultRowsQuery }
  | { type: 'selectResults'; token: string; ids: string[] }
  | { type: 'clearResults' };
export function createMeasurementService(source: string) {
  const importer = createResultImporter();
  return (request: MeasurementWorkerRequest) => {
    switch (request.type) {
      case 'plan': return planMeasurements(request.input, request.request, source);
      case 'verifyPlan': return verifyMeasurementPlan(request.plan, source);
      case 'openResults': return importer.open(request.file, request.filename);
      case 'resultRuns': return importer.runs(request.token, request.query);
      case 'resultRows': return importer.rows(request.token, request.query);
      case 'selectResults': return importer.select(request.token, request.ids);
      case 'clearResults': return importer.clear();
      default: throw new Error('Unknown measurement request.');
    }
  };
}
