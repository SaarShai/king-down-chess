import type { StudyRequest, StudyResult } from './browser-service';
import type { MeasurementEvidence } from './evidence';
import type { MeasurementRequest } from './measurement-plan';
import type { MeasurementPlanResult, MeasurementWorkerRequest, ResultCatalogue, ResultPageQuery, ResultRowsQuery, ResultRunPage, ResultRowPage } from './measurement-service';
export interface StudyClient {
  request(request: StudyRequest): Promise<StudyResult>;
  plan(input: unknown, request: MeasurementRequest): Promise<MeasurementPlanResult>;
  verifyPlan(plan: unknown): Promise<MeasurementPlanResult>;
  openResults(file: Blob, filename?: string): Promise<ResultCatalogue>;
  resultRuns(token: string, query?: ResultPageQuery): Promise<ResultRunPage>;
  resultRows(token: string, query: ResultRowsQuery): Promise<ResultRowPage>;
  selectResults(token: string, ids: string[]): Promise<MeasurementEvidence>;
  clearResults(): Promise<void>;
  close(): void;
}
export function createStudyClient(): StudyClient {
  let worker: Worker | undefined, next = 0, closed = false;
  const pending = new Map<number, { resolve(result: unknown): void; reject(error: Error): void }>();
  function stop(message: string): void {
    closed = true; worker?.terminate(); worker = undefined;
    for (const call of pending.values()) call.reject(new Error(message));
    pending.clear();
  }
  function call<T>(request: StudyRequest | MeasurementWorkerRequest): Promise<T> {
    if (closed) return Promise.reject(new Error('Study worker is closed.'));
    return new Promise((resolve, reject) => {
      try {
        if (!worker) {
          worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
          worker.onmessage = ({ data }) => {
            const call = pending.get(data.id); if (!call) return;
            pending.delete(data.id);
            if (data.error !== undefined) call.reject(new Error(String(data.error))); else call.resolve(data.result);
          };
          worker.onerror = () => stop('Study worker failed.');
          worker.onmessageerror = () => stop('Study worker reply could not be read.');
        }
        const id = ++next; pending.set(id, { resolve: result => resolve(result as T), reject });
        try { worker.postMessage({ id, request }); } catch (error) { pending.delete(id); reject(error); }
      } catch (error) { reject(error); }
    });
  }
  return {
    request: request => call(request),
    plan: (input, request) => call({ type: 'plan', input, request }),
    verifyPlan: plan => call({ type: 'verifyPlan', plan }),
    openResults: (file, filename) => call({ type: 'openResults', file, filename }),
    resultRuns: (token, query) => call({ type: 'resultRuns', token, query }),
    resultRows: (token, query) => call({ type: 'resultRows', token, query }),
    selectResults: (token, ids) => call({ type: 'selectResults', token, ids }),
    clearResults: () => call({ type: 'clearResults' }),
    close() { stop('Study worker is closed.'); },
  };
}
