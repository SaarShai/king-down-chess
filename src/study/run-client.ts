import type { ResearchDocument } from './evidence';
import type { RunTarget, StudioSession, StudyRunSummary } from './run-types';

export const MAX_RUN_RESULT_BYTES = 64 * 1024 * 1024;
/** One session token stays in memory. Calls never retry a launch. */
export function createRunClient(fetcher: typeof fetch = fetch) {
  let session: StudioSession | undefined;
  const controller = new AbortController();
  async function request(action: string, fields: object = {}): Promise<Response> {
    const response = await fetcher('/api/study-runs', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
      headers: { 'content-type': 'application/json', ...(session ? { 'x-king-down-studio': session.token } : {}) },
      body: JSON.stringify({ action, ...fields }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(typeof error?.error === 'string' ? error.error : `Local studio request failed (${response.status}).`);
    }
    return response;
  }
  async function json<T>(action: string, fields: object = {}): Promise<T> { return (await request(action, fields)).json(); }
  return {
    async connect(): Promise<StudioSession> {
      const reply = await json<StudioSession>('connect');
      if (!reply || typeof reply.studioId !== 'string' || !reply.studioId || typeof reply.token !== 'string' || !reply.token || reply.transportVerification !== 'unverified') throw new Error('Local studio returned an invalid session.');
      session = reply; return reply;
    },
    prepare: (document: ResearchDocument, target: RunTarget) => json<StudyRunSummary>('prepare', { document, target }),
    approve: (id: string, key: string) => json<StudyRunSummary>('approve', { id, key }),
    list: (studyId: string) => json<StudyRunSummary[]>('list', { studyId }),
    status: (id: string) => json<StudyRunSummary>('status', { id }),
    document: (id: string) => json<ResearchDocument>('document', { id }),
    async result(run: StudyRunSummary): Promise<Blob> {
      if (!run.result) throw new Error('This run has no result export.');
      const response = await request('result', { id: run.id });
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Result download has no body.');
      const chunks: Uint8Array<ArrayBuffer>[] = []; let bytes = 0;
      try {
        const declared = response.headers.get('content-length');
        if (declared && Number(declared) > MAX_RUN_RESULT_BYTES) throw new Error('Result file must be at most 64 MiB.');
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          bytes += value.byteLength;
          if (bytes > MAX_RUN_RESULT_BYTES) throw new Error('Result file must be at most 64 MiB.');
          chunks.push(value as Uint8Array<ArrayBuffer>);
        }
      } catch (error) { await reader.cancel().catch(() => {}); throw error; }
      finally { reader.releaseLock(); }
      if (bytes !== run.result.bytes) throw new Error('Result file size does not match the run receipt.');
      const file = new Blob(chunks, { type: 'application/json' });
      const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (hash !== run.result.sha256) throw new Error('Result file hash does not match the run receipt.');
      return file;
    },
    close() { controller.abort(); session = undefined; },
  };
}
