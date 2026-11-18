import { ALWAYS_ON, DEFAULT_OPTIONS, RANKED_OPTIONS, DEAL_CARDS, DOUBLE_KINDS, POOL_KINDS, validate, type Options, type SetupAdmission } from '../../match/setup';
import { KINGS, type CardName, type KingChoice, type KingName } from '../../rules/rules';
import type { CreationMode, View } from '../../match/protocol';

export type SetupState = { mode: CreationMode; kind: 'solo' | 'friend' | 'random'; options: Options; colour: 'white' | 'black' | 'random'; level: 'beginner' | 'casual' | 'club' | 'strong'; king: KingChoice | null };
export function readSetup(value: unknown): SetupState {
  const state: SetupState = { mode: 'casual', kind: 'solo', options: { ...DEFAULT_OPTIONS, pool: [...DEFAULT_OPTIONS.pool], cardPool: [...DEFAULT_OPTIONS.cardPool] }, colour: 'white', level: 'club', king: null };
  if (!value || typeof value !== 'object') return state;
  const saved = value as Partial<SetupState>, o = saved.options;
  if (saved.kind && ['solo', 'friend', 'random'].includes(saved.kind)) state.kind = saved.kind;
  if (saved.colour && ['white', 'black'].includes(saved.colour)) state.colour = saved.colour;
  if (saved.level && ['beginner', 'casual', 'club', 'strong'].includes(saved.level)) state.level = saved.level;
  if (o && ['fairy', 'arrangement', 'classic', 'cards', 'kingPowers'].every(key => typeof o[key as keyof Options] === 'boolean') && Array.isArray(o.pool) && Array.isArray(o.cardPool)) {
    const { single, ...rest } = o;
    const options = { ...rest, pool: o.pool.filter(k => POOL_KINDS.includes(k)), cardPool: o.cardPool.filter(c => DEAL_CARDS.includes(c)) };
    if (Array.isArray(single) && single.length && !validate({ ...options, single })) state.options = { ...options, single: [...single] };
    else if (!validate(options)) state.options = options;
  }
  const pick = saved.king;
  if (pick && Object.hasOwn(KINGS, pick.king) && KINGS[pick.king as KingName].includes(pick.power)) state.king = { king: pick.king, power: pick.power };
  state.mode = state.kind === 'random' && saved.mode === 'ranked' ? 'ranked' : 'casual';
  return withMode(state, state.mode);
}

export function gameSetup(view: View): SetupState {
  return readSetup({ kind: view.kind, options: view.options, colour: view.seat === 1 ? 'black' : 'white', level: view.level, king: view.choices?.[view.seat]?.king ?? view.kings?.[view.seat] ?? view.rules?.kings[view.seat] });
}

/** Play now uses Beginner and an automatic army, and keeps the saved setup. */
export function quickSetup(saved: unknown): SetupState {
  const state = readSetup(saved);
  return { ...state, kind: 'solo', mode: 'casual', colour: state.colour === 'black' ? 'black' : 'white', level: 'beginner', options: { ...state.options, arrangement: false } };
}
/** Ranked is offered only in the staging build (plan D2; ticket 67); the server refuses it in production. */
export const rankedOffered = () => import.meta.env?.VITE_KINGDOWN_STAGE === 'staging';
/** Ranked choices are fixed before the start or a saved draft is used. */
export function withMode(state: SetupState, mode: CreationMode): SetupState {
  if (state.kind !== 'random' || mode !== 'ranked' || !rankedOffered()) return { ...state, mode: 'casual', colour: state.colour === 'random' ? 'white' : state.colour, king: cleanKing(state.options, state.king, state.colour) };
  const options = { ...RANKED_OPTIONS, pool: [...RANKED_OPTIONS.pool], cardPool: [...RANKED_OPTIONS.cardPool] };
  return { ...state, mode, options, colour: 'random', king: cleanKing(options, state.king, 'random') };
}
export const setupOptions = ({ single, ...o }: Options): Options => ({
  ...o, arrangement: o.fairy && o.arrangement, classic: !o.fairy && o.classic,
  ...(o.fairy && single?.length ? { single } : {}),
});
export function withToggle(state: SetupState, key: 'fairy' | 'arrangement' | 'classic' | 'cards' | 'kingPowers', on: boolean): SetupState {
  const options = { ...state.options, [key]: on };
  if (key === 'fairy' && on && validate({ ...setupOptions(options), cards: false })) {
    options.pool = [...DEFAULT_OPTIONS.pool];
    delete options.single;
  }
  if (key === 'cards' && on && options.cardPool.length < 4) options.cardPool = [...DEFAULT_OPTIONS.cardPool];
  return { ...state, options, king: cleanKing(options, state.king, state.colour) };
}
export const hasCopy = (o: Options, letter: string, second = false) => o.pool.includes(letter) && (!second || !o.single?.includes(letter));
function editCopy(o: Options, letter: string, on: boolean, second: boolean): Options {
  const { single = [], ...options } = o;
  const pool = on ? [...new Set([...o.pool, letter])] : second ? o.pool : o.pool.filter(k => k !== letter);
  const reduced = single.filter(k => k !== letter);
  if (on && !second && DOUBLE_KINDS.includes(letter) || !on && second) reduced.push(letter);
  return { ...options, pool, ...(reduced.length ? { single: reduced } : {}) };
}
export function pieceLocked(o: Options, letter: string, second = false): boolean {
  return hasCopy(o, letter, second) && validate({ ...editCopy(o, letter, false, second), fairy: true, classic: false }) === 'Keep at least 7 pieces in the pool.';
}
export function withPiece(state: SetupState, letter: string, on: boolean, second = false): SetupState {
  const o = state.options;
  if (!(second ? DOUBLE_KINDS : POOL_KINDS).includes(letter) || on === hasCopy(o, letter, second) || !on && pieceLocked(o, letter, second)) return state;
  return { ...state, options: editCopy(o, letter, on, second) };
}
export function withCard(state: SetupState, card: CardName, on: boolean, pickFour = false): SetupState {
  if (!DEAL_CARDS.includes(card) || on === state.options.cardPool.includes(card) || on && pickFour && state.options.cardPool.length >= 4) return state;
  return { ...state, options: { ...state.options, cardPool: on ? [...state.options.cardPool, card] : state.options.cardPool.filter(c => c !== card) } };
}
export function createArguments(state: SetupState) {
  const setup = withMode(state, state.mode);
  return { mode: setup.mode, options: setupOptions(setup.options), colour: setup.colour, ...(state.kind === 'solo' ? { level: state.level } : {}) };
}
const defaultKing = (colour: SetupState['colour']): KingChoice => colour === 'black' ? { king: 'Shadow', power: 'Darkness' } : { king: 'Spirit', power: 'Mercy' };
export const availablePowers = (o: Options, king: KingName, admission?: SetupAdmission) => admission ? admission.kings.filter(pick => pick.king === king).map(pick => pick.power) : KINGS[king].filter(power => !o.cards || ALWAYS_ON.includes(power));
export function cleanKing(o: Options, pick: KingChoice | null, colour: SetupState['colour'] = 'white', admission?: SetupAdmission): KingChoice | null {
  if (admission) {
    if (pick && availablePowers(o, pick.king, admission).includes(pick.power)) return { ...pick };
    const cleaned = cleanKing(o, pick, colour);
    return cleaned && availablePowers(o, cleaned.king, admission).includes(cleaned.power) ? cleaned : null;
  }
  if (!pick || !Object.hasOwn(KINGS, pick.king) || !KINGS[pick.king].includes(pick.power)) return null;
  if (!o.cards || ALWAYS_ON.includes(pick.power)) return { ...pick };
  const [power] = availablePowers(o, pick.king);
  return power ? { king: pick.king, power } : defaultKing(colour);
}
export const shownKing = (state: Pick<SetupState, 'king' | 'colour'>): KingChoice => state.king ?? defaultKing(state.colour);
export function soloChoice(view: View, pick: KingChoice | null) {
  const o = view.options;
  if (view.kind !== 'solo' || view.status !== 'setup' || !o?.kingPowers || !view.draw || view.ready?.[view.seat] || o.arrangement && !pick) return null;
  const king = cleanKing(o, pick, view.seat === 1 ? 'black' : 'white', view.setup_admission) ?? view.choices?.[view.seat]?.king;
  if (!king) return null;
  return { game_id: view.game_id, expected_revision: view.revision, king, order: view.draw, ready: !o.arrangement };
}
