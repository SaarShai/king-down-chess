import { z } from 'zod';
import { ALL_CARDS } from '../rules/rules';
import { parseStudy, type Study } from './model';
import { parseTest, type StudyTest } from './check';

const count = z.number().int().min(1).max(10000);
const hold = z.record(z.string().min(1), z.number().finite());
const requestSchema = z.strictObject({
  recipe: z.enum(['worth', 'activity', 'field', 'four-cell', 'cross-play']),
  start: z.enum(['population', 'saved-state']),
  seed: z.number().int().min(0).max(0xffffffff), pairs: count,
  depth: z.number().int().min(1).max(20),
  pool: z.string().regex(/^[NBRQALGMSOCVT]{7,100}$/),
  pieces: z.string().max(13).regex(/^[NBRQALGMSOCVT]+$/).optional(),
  vs: z.enum(['N', 'B', 'R', 'Q']).optional(),
  factors: z.tuple([z.discriminatedUnion('kind', [z.strictObject({ kind: z.literal('piece'), piece: z.string().regex(/^[ABRNGMLSO]$/), replacement: z.string().regex(/^[BNR]$/) }), z.strictObject({ kind: z.literal('card'), card: z.enum(ALL_CARDS) })]), z.discriminatedUnion('kind', [z.strictObject({ kind: z.literal('piece'), piece: z.string().regex(/^[ABRNGMLSO]$/), replacement: z.string().regex(/^[BNR]$/) }), z.strictObject({ kind: z.literal('card'), card: z.enum(ALL_CARDS) })])]).optional(),
  cardPool: z.array(z.enum(ALL_CARDS)).min(1).optional(),
  entrants: z.array(z.string().min(1)).min(2).max(30).optional(),
  maxPlies: z.number().int().min(1).max(1000).default(300),
  openingRandomPlies: z.number().int().min(0).max(100).default(4),
  powerPlies: z.number().int().min(0).max(20).optional(),
  values: z.record(z.string().regex(/^[PNBRQKALGMSOCVT]$/), z.number().finite()).default({}),
  powerHold: hold.default({}), powerHoldSides: z.tuple([hold, hold]).optional(),
  adjudicate: z.union([z.literal(false), z.strictObject({
    resignCp: z.number().min(0), resignPlies: count, drawCp: z.number().min(0),
    drawPlies: count, drawAfterPly: z.number().int().min(0),
  })]).default(false),
});
export type MeasurementRequest = z.input<typeof requestSchema>;
export interface MeasurementPlan {
  schema: 'kingdown-measurement-plan/1';
  input: Study | StudyTest;
  request: z.output<typeof requestSchema>;
}
export interface MeasurementPreview {
  games: number; blocks: number; seed: number; depth: number;
  policy: unknown; measures: string[]; limits: string[]; missingResults: number;
}
// Keep previews small enough to inspect without allocating a campaign in memory.
export const MAX_PREVIEW_GAMES = 10000;
export const MEASUREMENT_RECIPES = {
  worth: 'Piece swaps and pawn calibration with the existing value experiment.',
  activity: 'Fresh armies with the saved full rules.',
  'cross-play': 'Power entrants on fresh armies, with both colours.',
  field: 'Declared named power entrants on fresh population armies.',
  'four-cell': 'Paired four-cell blocks for two named piece or card factors. Custom T is unsupported.',
} as const;
export function canonicalMeasurementJSON(value: unknown): string {
  return JSON.stringify(value, (_key, v) => v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
}
export function freezeMeasurement<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freezeMeasurement); Object.freeze(value); }
  return value;
}
/** A campaign uses the rules and design. It does not replay the saved board or history. */
export function createMeasurementPlan(input: unknown, request: MeasurementRequest): MeasurementPlan {
  const parsed = input && typeof input === 'object' && 'schema' in input && input.schema === 'kingdown-test/1'
    ? parseTest(input) : parseStudy(input);
  const r = requestSchema.parse(request);
  if (r.start !== 'population') throw new Error('Unsupported saved-state start: jobs cannot preserve full PositionData and history');
  if (r.recipe === 'worth' ? !r.pieces || !!r.entrants : !!r.pieces || !!r.vs) throw new Error('Recipe inputs do not match');
  if ((r.recipe === 'cross-play' || r.recipe === 'field') ? !r.entrants : !!r.entrants) throw new Error('Cross-play requires entrants only');
  if (r.entrants && new Set(r.entrants).size !== r.entrants.length) throw new Error('Duplicate entrant');
  if (r.recipe === 'four-cell' ? !r.factors || !r.cardPool : !!r.factors || !!r.cardPool) throw new Error('Four-cell requires factors and cardPool only');
  if (r.pieces && new Set(r.pieces).size !== r.pieces.length) throw new Error('Duplicate worth piece');
  const games = r.pairs * (r.recipe === 'four-cell' ? 12 : r.recipe === 'worth' ? 2 * (r.pieces!.length + 3) : r.entrants ? r.entrants.length * (r.entrants.length - 1) : 2);
  if (games > MAX_PREVIEW_GAMES) throw new Error(`Preview exceeds ${MAX_PREVIEW_GAMES} games`);
  const study = 'study' in parsed ? parsed.study : parsed;
  if ((r.pool.includes('T') || r.pieces?.includes('T')) && !study.rules.design) throw new Error('Custom T requires a saved design');
  if (r.recipe === 'four-cell') {
    if (new Set(r.cardPool).size !== r.cardPool!.length || new Set(r.factors!.map(f => f.kind === 'piece' ? f.piece : f.card)).size !== 2 || r.factors!.some(f => f.kind === 'piece' ? f.piece === f.replacement || !r.pool.includes(f.piece) : !r.cardPool!.includes(f.card))) throw new Error('Invalid four-cell factors or card pool');
    if (r.pool.includes('T') || study.rules.design) throw new Error('Four-cell does not support custom T');
    if (r.depth > 4 || r.pairs > 1000 || r.maxPlies < 2 || r.maxPlies > 500 || r.openingRandomPlies !== 4 || r.powerPlies !== undefined && r.powerPlies !== 2 || r.adjudicate !== false || Object.keys(r.values).length || Object.keys(r.powerHold).length || r.powerHoldSides) throw new Error('Unsupported four-cell search context');
    if (study.rules.kings.some(Boolean) || study.rules.hands.some(h => h.length) || study.rules.piles.some(h => h.length)) throw new Error('Four-cell requires plain kings and empty saved hands and piles');
  }
  return freezeMeasurement({ schema: 'kingdown-measurement-plan/1', input: parsed, request: r });
}

export function parseMeasurementPlan(input: unknown): MeasurementPlan {
  const p = z.strictObject({ schema: z.literal('kingdown-measurement-plan/1'), input: z.unknown(), request: z.unknown() }).parse(input);
  return createMeasurementPlan(p.input, requestSchema.parse(p.request));
}
