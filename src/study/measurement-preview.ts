import { comboSchedule, comboGameSpec, type ComboSpec } from '../sim/combination-plan';
import { createMeasurementPlan, canonicalMeasurementJSON, freezeMeasurement, type MeasurementRequest } from './measurement-plan';
import { withRules } from './model';
import { buildJobs, type Job, type RunSpec } from '../sim/spec-plan';
import { valueSpecs } from '../sim/value-plan';
import { ALL_POWERS, scheduleJobs, gameSpec, type Entrant, type TournamentSpec } from '../sim/tournament-plan';
import { stampParts, specKeyParts, type Stamp } from '../sim/stamp-plan';
import { evalParams } from '../ai/eval';

export interface PlannedGame { spec: RunSpec; job: Job }
/** Read-only adapter. No runner, worker, output file, or approval is created. */
export function prepareStudyMeasurements(input: unknown, request: MeasurementRequest, source: string) {
  const plan = createMeasurementPlan(input, request), r = plan.request;
  const study = 'study' in plan.input ? plan.input.study : plan.input;
  const evaluation = structuredClone(evalParams());
  const base: RunSpec = {
    id: `study-${study.id}-${study.version}`, games: r.pairs * 2, seed: r.seed,
    ai: { depth: r.depth, ...(r.powerPlies === undefined ? {} : { powerPlies: r.powerPlies }) },
    rules: structuredClone(study.rules), pairs: true,
    backRanks: { sample: r.pairs, pool: r.pool }, values: r.values,
    maxPlies: r.maxPlies, openingRandomPlies: r.openingRandomPlies,
    powerHold: r.powerHold, ...(r.powerHoldSides ? { powerHoldSides: r.powerHoldSides } : {}), adjudicate: r.adjudicate,
  };
  let jobs: PlannedGame[];
  if (r.recipe === 'four-cell') {
    const combo: ComboSpec = { id: 'study-preview', source, approval: { date: 'preview-only', quote: 'Preview only. No run approval.' }, rules: structuredClone(study.rules), pool: r.pool, cardPool: r.cardPool!, depth: r.depth, blocks: r.pairs, seed: r.seed, maxPlies: r.maxPlies, candidates: [{ id: 'declared-factors', factors: r.factors!, reason: study.question }] };
    jobs = withRules(study.rules, () => comboSchedule(combo).map(job => ({ spec: { ...comboGameSpec(combo, job), backRanks: { sample: r.pairs, pool: r.pool } }, job })));
  } else if (r.recipe === 'cross-play' || r.recipe === 'field') {
    if (r.entrants!.some(e => e !== 'none' && !ALL_POWERS.includes(e as typeof ALL_POWERS[number]))) throw new Error('Unsupported entrant: use a named power or none');
    const t: TournamentSpec = { id: base.id, entrants: r.entrants as Entrant[], pairs: r.pairs,
      armies: 'perPair', depth: r.depth, seed: r.seed, pool: r.pool, guardNextToKing: true,
      rules: structuredClone(study.rules), mirror: false, maxPlies: r.maxPlies,
      openingRandomPlies: r.openingRandomPlies, powerHold: r.powerHold, powerPlies: r.powerPlies };
    jobs = withRules(study.rules, () => scheduleJobs(t).map(j => ({
      spec: { ...base, ...gameSpec(t, j), values: r.values, adjudicate: r.adjudicate,
        ...(r.powerHoldSides ? { powerHoldSides: r.powerHoldSides } : {}) },
      job: { gameId: j.gameId, pairId: j.pairId, colourSwapped: j.white !== j.a,
        configId: `${j.a} vs ${j.b}`, seed: j.seed, backRankWhite: j.backRank, backRankBlack: j.backRank },
    })));
  } else {
    const specs = r.recipe === 'worth' ? valueSpecs(base, r.vs ?? 'N', r.pieces!, true) : [base];
    jobs = withRules(study.rules, () => specs.flatMap(spec => buildJobs(spec).map(job => ({ spec, job }))));
  }
  const unique = new Map(jobs.map(g => [canonicalMeasurementJSON(g.spec), g.spec]));
  return { plan, source, evaluation, jobs, specs: [...unique.values()] };
}

export function assembleStudyMeasurements(prepared: ReturnType<typeof prepareStudyMeasurements>, contexts: Stamp[], fingerprint: string) {
  const { plan, source, evaluation, jobs, specs } = prepared, r = plan.request;
  const execution = { sourceId: source, contexts };
  const context = { plan, source, evaluation, execution, jobs };
  const blocks = r.recipe === 'four-cell' ? r.pairs : new Set(jobs.map(g => `${g.spec.id}|${g.job.pairId}`)).size;
  return freezeMeasurement({ ...context, fingerprint, preview: {
    games: jobs.length, blocks, seed: r.seed, depth: r.depth,
    policy: { evaluation, contexts: specs.map(spec => ({ ai: spec.ai, values: spec.values ?? {}, adjudicate: spec.adjudicate, powerHold: spec.powerHold ?? {}, powerHoldSides: spec.powerHoldSides ?? null, openingRandomPlies: spec.openingRandomPlies, maxPlies: spec.maxPlies })) },
    measures: r.recipe === 'four-cell' ? ['four-cell score interaction', 'strategy sensitivity', 'block variation'] : r.recipe === 'worth' ? ['paired score', 'pawn-calibrated worth'] : r.recipe === 'activity'
      ? ['piece activity', 'conditions', 'interactions'] : ['paired score by power', 'army variation'],
    limits: ['Population games do not replay the saved board or history.', ...(r.recipe === 'worth' ? ['Worth uses classic piece-swap armies and pawn-odds calibration, not random armies from the requested pool.'] : []), 'No results exist. No balance, strategy, or fun claim is approved.'],
    missingResults: jobs.length,
  } });
}

export function measurementContext(p: ReturnType<typeof prepareStudyMeasurements>, contexts: Stamp[]) {
  const { plan, source, evaluation, jobs } = p;
  return { plan, source, evaluation, execution: { sourceId: source, contexts }, jobs };
}
async function digest(algorithm: string, value: string): Promise<string> {
  const hash = await crypto.subtle.digest(algorithm, new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, '0')).join('');
}
export async function previewStudyMeasurements(input: unknown, request: MeasurementRequest, source: string) {
  const p = prepareStudyMeasurements(input, request, source);
  const contexts = await Promise.all(p.specs.map(async spec => {
    if (spec.evalParams) throw new Error('Browser preview cannot read evaluator files');
    const { rules, keyed, pool } = stampParts(spec);
    return { rules, pool, rulesKey: (await digest('SHA-1', JSON.stringify(keyed))).slice(0, 8),
      specKey: (await digest('SHA-1', JSON.stringify(specKeyParts(spec)))).slice(0, 12), specKeyVersion: 2, src: source };
  }));
  return assembleStudyMeasurements(p, contexts, await digest('SHA-256', canonicalMeasurementJSON(measurementContext(p, contexts))));
}
export function savedPlanOf(p: ReturnType<typeof assembleStudyMeasurements>) {
  return { definition: p.plan, fingerprint: p.fingerprint, source: p.source, games: p.preview.games, blocks: p.preview.blocks,
    measures: p.preview.measures, limits: p.preview.limits,
    contexts: p.execution.contexts.map(c => ({ sourceHash: c.src, specKey: c.specKey, specKeyVersion: c.specKeyVersion, rules: c.rules, pool: c.pool })) };
}
