import { service, type StudyRequest } from './browser-service';
import { createMeasurementService, type MeasurementWorkerRequest } from './measurement-service';
const measurements = createMeasurementService(__SIM_SOURCE__);
const host = self as unknown as { onmessage: (event: MessageEvent<{ id: number; request: StudyRequest | MeasurementWorkerRequest }>) => void; postMessage(value: unknown): void };
host.onmessage = async ({ data }) => {
  try {
    const request = data.request;
    const result = 'document' in request
      ? service(request, __STUDY_SOURCE__) : await measurements(request);
    host.postMessage({ id: data.id, result });
  } catch (error) { host.postMessage({ id: data.id, error: error instanceof Error ? error.message : String(error) }); }
};
