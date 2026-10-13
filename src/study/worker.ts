import { service, type StudyRequest } from './browser-service';
const host = self as unknown as { onmessage: (event: MessageEvent<{ id: number; request: StudyRequest }>) => void; postMessage(value: unknown): void };
host.onmessage = ({ data }) => {
  try { host.postMessage({ id: data.id, result: service(data.request, __STUDY_SOURCE__) }); }
  catch (error) { host.postMessage({ id: data.id, error: error instanceof Error ? error.message : String(error) }); }
};
