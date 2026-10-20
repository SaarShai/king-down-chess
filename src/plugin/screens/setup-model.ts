import { ALWAYS_ON, DEFAULT_OPTIONS, DEAL_CARDS, POOL_KINDS, validate, type Options, type SetupAdmission } from '../../match/setup';
import { KINGS, type CardName, type KingChoice, type KingName } from '../../rules/rules';
import type { View } from '../../match/protocol';

export type SetupState = { kind: 'solo' | 'friend' | 'random'; options: Options; colour: 'white' | 'black' | 'random'; level: 'beginner' | 'casual' | 'club' | 'strong'; king: KingChoice | null };
export function readSetup(value: unknown): SetupState {
  const state: SetupState = { kind: 'solo', options: { ...DEFAULT_OPTIONS, pool: [...DEFAULT_OPTIONS.pool], cardPool: [...DEFAULT_OPTIONS.cardPool] }, colour: 'white', level: 'club', king: null };
  if (!value || typeof value !== 'object') return state;
  const saved = value as Partial<SetupState>, o = saved.options;
  if (saved.kind && ['solo', 'friend', 'random'].includes(saved.kind)) state.kind = saved.kind;
  if (saved.colour && ['white', 'black', 'random'].includes(saved.colour)) state.colour = saved.colour;
  if (saved.level && ['beginner', 'casual', 'club', 'strong'].includes(saved.level)) state.level = saved.level;
  if (o && ['fairy', 'arrangement', 'classic', 'cards', 'kingPowers'].every(key => typeof o[key as keyof Options] === 'boolean') && Array.isArray(o.pool) && Array.isArray(o.cardPool)) {
    const options = { ...o, pool: o.pool.filter(k => POOL_KINDS.includes(k)), cardPool: o.cardPool.filter(c => DEAL_CARDS.includes(c)) };
    if (!validate(options)) state.options = options;
  }
  const pick = saved.king;
  if (pick && Object.hasOwn(KINGS, pick.king) && KINGS[pick.king as KingName].includes(pick.power)) state.king = { king: pick.king, power: pick.power };
  state.king = cleanKing(state.options, state.king, state.colour);
  return state;
}

export function gameSetup(view: View): SetupState {
  return readSetup({ kind: view.kind, options: view.options, colour: view.seat === 1 ? 'black' : 'white', level: view.level, king: view.choices?.[view.seat]?.king ?? view.kings?.[view.seat] ?? view.rules?.kings[view.seat] });
}

/** Play now uses Beginner and an automatic army, and keeps the saved setup. */
export function quickSetup(saved: unknown): SetupState {
  const state = readSetup(saved);
  return { ...state, kind: 'solo', level: 'beginner', options: { ...state.options, arrangement: false } };
}
export const setupOptions = (o: Options): Options => ({ ...o, arrangement: o.fairy && o.arrangement, classic: !o.fairy && o.classic });
export function withToggle(state: SetupState, key: 'fairy' | 'arrangement' | 'classic' | 'cards' | 'kingPowers', on: boolean): SetupState {
  const options = { ...state.options, [key]: on };
  if (key === 'fairy' && on && validate({ ...setupOptions(options), cards: false })) options.pool = [...DEFAULT_OPTIONS.pool];
  if (key === 'cards' && on && options.cardPool.length < 4) options.cardPool = [...DEFAULT_OPTIONS.cardPool];
  return { ...state, options, king: cleanKing(options, state.king, state.colour) };
}
export function pieceLocked(o: Options, letter: string): boolean {
  return o.pool.includes(letter) && validate({ ...o, fairy: true, classic: false, pool: o.pool.filter(k => k !== letter) }) === 'Keep at least 7 pieces in the pool.';
}
export function withPiece(state: SetupState, letter: string, on: boolean): SetupState {
  if (!POOL_KINDS.includes(letter) || on === state.options.pool.includes(letter) || !on && pieceLocked(state.options, letter)) return state;
  return { ...state, options: { ...state.options, pool: on ? [...state.options.pool, letter] : state.options.pool.filter(k => k !== letter) } };
}
export function withCard(state: SetupState, card: CardName, on: boolean, pickFour = false): SetupState {
  if (!DEAL_CARDS.includes(card) || on === state.options.cardPool.includes(card) || on && pickFour && state.options.cardPool.length >= 4) return state;
  return { ...state, options: { ...state.options, cardPool: on ? [...state.options.cardPool, card] : state.options.cardPool.filter(c => c !== card) } };
}
export function createArguments(state: SetupState) {
  return { options: setupOptions(state.options), colour: state.colour, ...(state.kind === 'solo' ? { level: state.level } : {}) };
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
