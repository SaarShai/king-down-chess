import { createHash } from 'node:crypto';
import { prepareStudyMeasurements, assembleStudyMeasurements, measurementContext } from '../../src/study/measurement-preview';
import { canonicalMeasurementJSON, type MeasurementRequest } from '../../src/study/measurement-plan';
import { stampOf } from '../../src/sim/run';
import { sourceId } from '../../src/sim/identity';
export { savedPlanOf, type PlannedGame } from '../../src/study/measurement-preview';
export function previewStudyMeasurements(input: unknown, request: MeasurementRequest) {
  const source = sourceId(), prepared = prepareStudyMeasurements(input, request, source);
  const contexts = prepared.specs.map(spec => stampOf(spec, source));
  const fingerprint = createHash('sha256').update(canonicalMeasurementJSON(measurementContext(prepared, contexts))).digest('hex');
  return assembleStudyMeasurements(prepared, contexts, fingerprint);
}
