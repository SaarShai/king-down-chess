import { comboSchedule, comboGameSpec, type ComboSpec } from '../../src/sim/combinations';
import { createHash } from 'node:crypto';
import { createMeasurementPlan, canonicalMeasurementJSON, freezeMeasurement, type MeasurementRequest } from '../../src/study/measurement-plan';
import { withRules } from '../../src/study/model';
import { buildJobs, type Job, type RunSpec } from '../../src/sim/spec';
import { valueSpecs } from '../../src/sim/experiments';
import { ALL_POWERS, schedule, gameSpec, type Entrant, type TournamentSpec } from '../../src/sim/tournament';
import { stampOf } from '../../src/sim/run';
import { sourceId } from '../../src/sim/identity';
import { evalParams } from '../../src/ai/eval';

export interface PlannedGame { spec: RunSpec; job: Job }
/** Read-only adapter. No runner, worker, output file, or approval is created. */
export function previewStudyMeasurements(input: unknown, request: MeasurementRequest) {
  const plan = createMeasurementPlan(input, request), r = plan.request;
  const study = 'study' in plan.input ? plan.input.study : plan.input;
  const source = sourceId(), evaluation = structuredClone(evalParams());
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
    jobs = withRules(study.rules, () => comboSchedule(combo).map(job => ({ spec: comboGameSpec(combo, job), job })));
  } else if (r.recipe === 'cross-play' || r.recipe === 'field') {
    if (r.entrants!.some(e => e !== 'none' && !ALL_POWERS.includes(e as typeof ALL_POWERS[number]))) throw new Error('Unsupported entrant: use a named power or none');
    const t: TournamentSpec = { id: base.id, entrants: r.entrants as Entrant[], pairs: r.pairs,
      armies: 'perPair', depth: r.depth, seed: r.seed, pool: r.pool, guardNextToKing: true,
      rules: structuredClone(study.rules), mirror: false, maxPlies: r.maxPlies,
      openingRandomPlies: r.openingRandomPlies, powerHold: r.powerHold, powerPlies: r.powerPlies };
    jobs = withRules(study.rules, () => schedule(t).map(j => ({
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
  const execution = { sourceId: source, contexts: [...unique.values()].map(spec => stampOf(spec)) };
  const context = { plan, source, evaluation, execution, jobs };
  const fingerprint = createHash('sha256').update(canonicalMeasurementJSON(context)).digest('hex');
  const blocks = r.recipe === 'four-cell' ? r.pairs : new Set(jobs.map(g => `${g.spec.id}|${g.job.pairId}`)).size;
  return freezeMeasurement({ ...context, fingerprint, preview: {
    games: jobs.length, blocks, seed: r.seed, depth: r.depth,
    policy: { evaluation, contexts: [...unique.values()].map(spec => ({ ai: spec.ai, values: spec.values ?? {}, adjudicate: spec.adjudicate, powerHold: spec.powerHold ?? {}, powerHoldSides: spec.powerHoldSides ?? null, openingRandomPlies: spec.openingRandomPlies, maxPlies: spec.maxPlies })) },
    measures: r.recipe === 'four-cell' ? ['four-cell score interaction', 'strategy sensitivity', 'block variation'] : r.recipe === 'worth' ? ['paired score', 'pawn-calibrated worth'] : r.recipe === 'activity'
      ? ['piece activity', 'conditions', 'interactions'] : ['paired score by power', 'army variation'],
    limits: ['Population games do not replay the saved board or history.', 'No results exist. No balance, strategy, or fun claim is approved.'],
    missingResults: jobs.length,
  } });
}
