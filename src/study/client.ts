import type { StudyRequest, StudyResult } from './browser-service';
export function createStudyClient(): { request(request: StudyRequest): Promise<StudyResult>; close(): void } {
  let worker: Worker | undefined, next = 0, closed = false;
  const pending = new Map<number, { resolve(result: StudyResult): void; reject(error: Error): void }>();
  function stop(message: string): void {
    closed = true; worker?.terminate(); worker = undefined;
    for (const call of pending.values()) call.reject(new Error(message));
    pending.clear();
  }
  return {
    request(request) {
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
          const id = ++next; pending.set(id, { resolve, reject });
          try { worker.postMessage({ id, request }); } catch (error) { pending.delete(id); reject(error); }
        } catch (error) { reject(error); }
      });
    },
    close() { stop('Study worker is closed.'); },
  };
}
