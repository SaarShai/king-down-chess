/**
 * The one saved solo game of the new page: the old page's `Save` in `kingdown.save`, read and written only through
 * screen/save.ts, so a game that starts on one page continues on the other. No DOM: play/main.ts calls it.
 */
import type { SkillName } from '../../ai/skill';
import type { Game } from '../../game';
import { GameRules } from '../../game-rules';
import { stamp } from '../../account/sync';
import { canon, canWriteLocal, gameTime, localAccess, KEPT_KEY, OFFERED_KEY } from '../../account/local';
import { gameJSON, readSave, savedGame, storedSettings, writeSave, SAVE_KEY, type Save } from '../../screen/save';
import { finishLinkedTurn, stagedPlies, turnEnded } from '../../turn';
import { POWERS_BALANCED, type Rules } from '../../rules/rules';
import { KINGS, colorOf, typeOf, type Color } from '../../rules/engine';
import { RELEASED_CARDS } from '../../content/cards';
import { POWER_NAME } from '../../powers-ui';
import { toFen } from '../../rules/setup';
import type { Pace } from '../../render/PaintedView';
import { DraftTurn } from './turn';
import { savedArrangement } from './arrange';
import { pieces, text } from './texts';

export type Level = 'casual' | 'clever' | 'club';
/** The four games: the base game (Pieces) with or without king powers and with or without cards (owner playtest 2026-11-15). */
export type GameType = 'pieces' | 'powers' | 'cards' | 'both';
export const hasPowers = (type: GameType) => type === 'powers' || type === 'both';
export const hasCards = (type: GameType) => type === 'cards' || type === 'both';
export const typeOfFlags = (powers: boolean, cards: boolean): GameType => powers ? cards ? 'both' : 'powers' : cards ? 'cards' : 'pieces';
/** The page's levels and the engine's skills (docs/DECISIONS.md). */
export const SKILLS: Record<Level, SkillName> = { casual: 'beginner', clever: 'casual', club: 'club' };
/** Strong, no skill and any other value show and play as Club. */
export const levelOf = (skill: unknown): Level => skill === 'beginner' ? 'casual' : skill === 'casual' ? 'clever' : 'club';
export const gameType = (rules: Pick<Rules, 'kings' | 'hands'>): GameType =>
  typeOfFlags(!!(rules.kings[0] || rules.kings[1]), rules.hands.some(hand => hand.length));
/** The rules this page builds for a game type, its kings and its hands. */
export const rulesOf = (type: GameType, kings: Rules['kings'], hands: Rules['hands']): Partial<Rules> =>
  type === 'pieces' ? { kings: [null, null], hands: [[], []] } : { ...POWERS_BALANCED, kings: hasPowers(type) ? kings : [null, null], hands: hasCards(type) ? hands : [[], []] };

/** A stored choice of this page: the first value is the default. Private mode keeps the choice for this page only. */
/** The short name of each game, as Play and the game list show it. */
export const typeName: Record<GameType, string> = { pieces: text.pieces, powers: text.withPowers, cards: text.withCards, both: text.withBoth };

export const storedChoice = (key: string, values: readonly string[]): string => {
  try { const v = localStorage.getItem(key); return v && values.includes(v) ? v : values[0]; } catch { return values[0]; }
};
export const storeChoice = (key: string, value: string): void => { try { localStorage.setItem(key, value); } catch { /* private mode */ } };
/** The stored game type of the next game (owner playtest section 2). A value of the earlier three types maps to the four: that "cards" had powers. */
export const GAME_KEY = 'kingdown.game-type';
export const storedGameType = (): GameType => (storedChoice(GAME_KEY, ['', 'pieces', 'powers', 'cards', 'both']) ||
  ({ pieces: 'pieces', powers: 'powers', cards: 'both' } as const)[storedChoice('kingdown.setup', ['pieces', 'powers', 'cards']) as 'pieces' | 'powers' | 'cards']) as GameType;

export { KEPT_KEY, OFFERED_KEY } from '../../account/local';
/**
 * none: no data. empty: a save with no move. resume: Continue opens it. finished: a game over.
 * kept: the page cannot open it (decision 7, and unreadable bytes). blocked: storage refuses, or the data belongs to another account's tab.
 */
export type Kind = 'none' | 'empty' | 'resume' | 'finished' | 'kept' | 'blocked';
export interface Stored {
  kind: Kind;
  save: Save | null;
  /** The stored bytes of a kept save, for its copy. */
  raw?: string;
  /** The readable settings fields. */
  settings: Partial<Save>;
  /** The replayed game, its staged steps and the player's side (kind resume). */
  resume?: { game: Game; draft: DraftTurn; player: Color };
}
/** The player's side of a solo save: Light when the person plays White, Dark when the person plays Black; else null. */
export const playerOf = (save: Pick<Save, 'white' | 'black'>): Color | null =>
  save.white === 'human' && save.black === 'ai' ? 0 : save.white === 'ai' && save.black === 'human' ? 1 : null;

const CARDS = new Set<string>(RELEASED_CARDS.map(card => card.id));
/** A king and its power that this page can name and draw. An older engine can have others. */
const knownKing = (k: Rules['kings'][number]): boolean => k === null || (typeof k === 'object' && !Array.isArray(k) && typeof k.king === 'string' && typeof k.power === 'string' && Object.hasOwn(KINGS, k.king) && Object.hasOwn(POWER_NAME, k.power));
/** The old page's players and modes, the pieces, kings and cards that this page can draw, and the rules that this page builds. */
function opens(save: Save, game: Game): boolean {
  if (playerOf(save) === null || save.link != null || save.daily != null) return false;
  if ((game.history[0]?.pos ?? game.pos).board.some(code => code && !pieces[typeOf(code)])) return false;
  const r = game.rules; // merged with the current defaults, as both pages replay it
  if (!Array.isArray(r.kings) || r.kings.length !== 2 || !r.kings.every(knownKing)) return false;
  if (!Array.isArray(r.hands) || r.hands.length !== 2 || !r.hands.every(hand => Array.isArray(hand) && hand.every(card => CARDS.has(card)))) return false;
  return canon(r) === canon(new GameRules(rulesOf(gameType(r), r.kings, r.hands)).rules);
}

/** Take the staged plies off the replayed game and stage them again, so Undo and End turn work after a reload. */
function restore(game: Game, staged: number, player: Color): DraftTurn {
  const lans = game.history.slice(game.history.length - staged).map(h => h.lan);
  for (let i = 0; i < staged; i++) game.undo();
  if (staged && game.pos.turn !== player) throw new Error('The staged steps are not the player\'s.'); // a foreign save: it is kept
  if (!staged) finishLinkedTurn(game);
  const draft = new DraftTurn(game);
  for (const lan of lans) {
    const move = draft.legal.find(m => game.context.toLan(draft.now, m) === lan);
    if (!move) throw new Error('A staged step is not legal.');
    draft.stage(move);
  }
  return draft;
}

/** Read and sort the stored data. Call it again at each press: another tab can change the data. */
export function readStored(): Stored {
  const read = readSave();
  if (read.failed || (read.unreadable && read.raw === undefined)) return { kind: 'blocked', save: null, settings: {} };
  if (read.unreadable) return { kind: 'kept', save: null, raw: read.raw, settings: storedSettings() ?? {} };
  const save = read.save;
  if (!save) return { kind: 'none', save: null, settings: {} };
  let raw: string | undefined;
  try { raw = read.raw ?? localStorage.getItem(SAVE_KEY) ?? undefined; } catch { /* the copy then fails and blocks */ }
  return sortSave(save, raw, !!read.partial);
}
/**
 * The sort of one readable save. A Dark game with no move resumes: the computer moves first, and a failed first
 * reply stays saved (launch decision 12).
 */
function sortSave(save: Save, raw: string | undefined, partial: boolean): Stored {
  const kept: Stored = { kind: 'kept', save, raw, settings: save };
  if (partial) return kept;
  const player = playerOf(save), empty: Stored = { kind: 'empty', save, settings: save };
  const game = savedGame(save);
  if (!save.moves.length && save.back !== '' && player !== 1 && (player === null || !savedArrangement(localStorage, game, player))) return empty;
  const staged = stagedPlies(game, save.staged);
  if (turnEnded(game, game.history.length - staged, save.resigned ?? null)) return { kind: 'finished', save, settings: save };
  if (player === null || !opens(save, game)) return save.moves.length ? kept : empty;
  try { return { kind: 'resume', save, settings: save, resume: { game, draft: restore(game, staged, player), player } }; } catch { return kept; }
}

/** The identity of a game that can continue ('' for none): the New game panel names the game that a start ends. */
export const gameKeyOf = (stored: Stored): string => stored.kind === 'resume' ? gameJSON(stored.save) : '';

/** The kept bytes are an earlier state of this same game: the old page played it on after the copy. */
function playedOn(was: string, raw: string): boolean {
  try {
    const a: Save = JSON.parse(was), b: Save = JSON.parse(raw);
    const ga = savedGame(a), gb = savedGame(b);
    const same = (s: Save, game: Game) => gameJSON({ ...s, rules: game.rules, moves: [], resigned: null, staged: undefined, summary: undefined });
    // Undo can replace staged steps. Only the finalized history identifies progress in the same game.
    const final = (s: Save, game: Game) => s.moves.slice(0, s.moves.length - stagedPlies(game, s.staged));
    const prior = final(a, ga), next = final(b, gb);
    return same(a, ga) === same(b, gb) && prior.every((move, i) => move === next[i]);
  } catch { return false; }
}

/**
 * Copy a save that this page cannot open to `kingdown.save.kept`, once. A later state of the kept game replaces its copy.
 * `full`: the key holds another game. `failed`: storage refuses. Both stop replacement.
 */
export function keepCopy(raw: string | undefined): 'copied' | 'already' | 'full' | 'failed' {
  try {
    if (raw === undefined || !canWriteLocal(localStorage)) return 'failed';
    const owner = localAccess(localStorage).userId ?? 'anonymous';
    const was = localStorage.getItem(KEPT_KEY);
    if (was !== null && (localStorage.getItem(KEPT_KEY + '.owner') ?? 'anonymous') !== owner) return 'full';
    if (was === raw) return 'already';
    if (was !== null && !playedOn(was, raw)) return 'full';
    if (was === null) localStorage.setItem(KEPT_KEY + '.owner', owner);
    localStorage.setItem(KEPT_KEY, raw);
    return 'copied';
  } catch { return 'failed'; }
}

/** The home line of a game that can continue: level, game type, whose turn. */
export function continueLine(draft: DraftTurn, level: Level, player: Color = 0): string {
  const type = typeName[gameType(draft.game.rules)];
  const turn = draft.game.pos.turn !== player ? text.thinking : draft.length ? text.draft : text.ready;
  return `${text[level]} ${text.computer.toLowerCase()} · ${type} · ${turn}`;
}

export function gameFacts(game: Game, playedMs: number): NonNullable<Save['summary']> {
  let moves = 0, captures = 0;
  for (const { pos, move } of game.history) {
    if (!move.pass) moves++;
    captures += move.captures.filter(square => pos.board[square] && colorOf(pos.board[square]) !== pos.turn).length;
  }
  return { moves, captures, playedMs: Math.floor(Math.max(0, playedMs)) };
}

export function savedPlayTime(save: Save | null): number {
  const ms = save?.summary?.playedMs;
  return typeof ms === 'number' && Number.isFinite(ms) && ms >= 0 ? ms : 0;
}

/** The game fields of the old page's snapshot() (screen/play.ts), in its order. The staged steps follow the handed-over plies. */
export function snapshot(draft: DraftTurn, resigned: Color | null = null, player: Color = 0, playedMs?: number): Save {
  const game = draft.game, staged = draft.steps.map(step => game.context.toLan(step.before, step.move));
  return {
    back: game.backRank, fen: toFen(game.history[0]?.pos ?? game.pos), moves: [...game.history.map(h => h.lan), ...staged],
    white: player ? 'ai' : 'human', black: player ? 'human' : 'ai', coords: true, link: null, daily: null, resigned,
    ...(staged.length > 0 && { staged: staged.length }),
    rules: { ...game.rules },
    ...(playedMs !== undefined && { summary: gameFacts(game, playedMs) }),
  };
}

/** The four settings that this page owns. */
export interface Prefs { skill: SkillName; coords: boolean; sound: boolean; pace: Pace }
/** The settings fields in the old order (screen/settings.ts settingsOf). Queen, threats and labels stay as stored. */
const settingsOf = (p: Prefs, stored: Partial<Save>): Partial<Save> => ({
  skill: p.skill, coords: p.coords, sound: p.sound,
  ...(typeof stored.queen === 'boolean' && { queen: stored.queen }),
  pace: p.pace,
  ...(typeof stored.threats === 'boolean' && { threats: stored.threats }),
  ...(stored.labels === true && { labels: true as const }),
});

/** The write rules: the game time, the old page's check for another tab, and one notice when the device cannot save. */
export class SaveWriter {
  /** The game JSON that this page last read or wrote; another value in storage means another tab changed it. */
  private seen = gameJSON(null);
  private live = gameJSON(null);
  private gameAt = 0;
  /** A player step on this page set the time. Until then a computer reply keeps the loaded time. */
  private playerTime = false;
  private fresh = false;
  private warned = false;
  /** No write until the player starts a new game. */
  blocked = false;
  /** The last game write did not reach storage: only memory holds the game. */
  lost = false;
  /** A write fault stays visible until recovery or a successful write. */
  warning = '';
  constructor(private readonly warn: (line: string) => void) {}

  /** The page now plays this stored game (Continue). */
  load(save: Save | null): void {
    this.seen = this.live = gameJSON(save); this.gameAt = gameTime(save); this.playerTime = false; this.fresh = false; this.blocked = false; this.lost = false; this.warning = '';
  }
  /** The next game write starts a new game: it replaces the stored data with no check for another tab. */
  replace(): void { this.fresh = true; this.blocked = false; this.warning = ''; }
  block(line: string): void { this.warning = line; this.blocked = true; this.fresh = false; if (line === text.cannotSave) this.fail(); else { this.lost = true; this.warn(line); } }

  /** Write the live game. `player`: a player step made this change. */
  game(save: Save, prefs: Prefs, player = false): boolean {
    if (this.blocked) { this.lost = true; return false; }
    const fresh = this.fresh, stored = readSave();
    if (stored.failed || (stored.unreadable && stored.raw === undefined)) return this.fail();
    if (!fresh && (stored.unreadable || gameJSON(stored.save) !== this.seen)) { this.block(text.otherTab); return false; }
    const json = gameJSON(save), was = gameTime(stored.save);
    if (fresh || (json !== this.live && (player || this.playerTime))) {
      this.gameAt = Math.max(Date.now(), this.gameAt + 1, was + 1); this.playerTime = true;
    } else this.gameAt = Math.max(this.gameAt, was);
    const next: Save = { ...save, ...settingsOf(prefs, stored.save ?? storedSettings() ?? {}), gameAt: this.gameAt };
    if (!fresh && stored.save?.recovery !== undefined && this.gameAt === was) next.recovery = stored.save.recovery;
    this.live = json; this.fresh = false;
    if (!writeSave(next)) return this.fail();
    this.seen = json; this.lost = false; this.warning = ''; this.stamp(); return true;
  }

  /** A setting change: the stored game and its time stay. With no stored data it writes the live game, as the old page does. */
  settings(prefs: Prefs, current: () => Save): boolean {
    if (this.blocked) return false;
    const stored = readSave();
    if (stored.failed || stored.unreadable) return false; // the setting lasts for this page load
    if (!stored.save) return this.game(current(), prefs);
    if (!writeSave({ ...stored.save, ...settingsOf(prefs, stored.save) })) return this.fail();
    this.stamp(); return true;
  }

  /** The line shows once per page load. */
  private fail(): false { this.warning = text.cannotSave; this.lost = true; if (!this.warned) { this.warned = true; this.warn(text.cannotSave); } return false; }
  /** The old page's account step after each write (account.ts changed()): the settings get their local time now, not at the next visit. */
  private stamp(): void { try { if (canWriteLocal(localStorage)) stamp(localStorage); } catch { /* storage refuses: nothing to stamp */ } }
}

/** Before every new game: keep a copy of a save that this page cannot open. A failed copy blocks the writes (decision 7). */
export function beforeNewGame(writer: SaveWriter): void {
  const stored = readStored();
  if (stored.kind === 'kept') {
    const copy = keepCopy(stored.raw);
    if (copy === 'full' || copy === 'failed') { writer.block(copy === 'full' ? text.keptFull : text.cannotSave); return; }
  }
  writer.replace();
}

/** The answer to the kept-game offer. It is kept for this page load when storage refuses it. */
let answeredHere: { raw: string; owner: string } | null = null;
export interface KeptOffer { raw: string; save: Save; resume: { game: Game; draft: DraftTurn; player: Color } }
/**
 * A kept copy that this page can open now (a Dark game that an earlier version kept), offered once for each kept
 * state (launch decision 10). Open or Not now is the answer. No offer while the current save is the same game, or a
 * game that this page cannot open (its copy must stay possible), or while storage refuses.
 */
export function keptOffer(current: Stored): KeptOffer | null {
  if (current.kind === 'kept' || current.kind === 'blocked') return null;
  let raw: string | null, answered: string | null, now: string | null, owner: string, answeredOwner: string;
  try {
    owner = localAccess(localStorage).userId ?? 'anonymous';
    if (!canWriteLocal(localStorage) || (localStorage.getItem(KEPT_KEY + '.owner') ?? 'anonymous') !== owner) return null;
  } catch { return null; }
  try { raw = localStorage.getItem(KEPT_KEY); answered = localStorage.getItem(OFFERED_KEY); answeredOwner = localStorage.getItem(OFFERED_KEY + '.owner') ?? 'anonymous'; now = localStorage.getItem(SAVE_KEY); } catch { return null; }
  if (raw === null || (raw === answered && owner === answeredOwner) || (raw === answeredHere?.raw && owner === answeredHere.owner) || raw === now) return null;
  if (now !== null && (playedOn(raw, now) || playedOn(now, raw))) return null;
  try {
    const save: Save = JSON.parse(raw), sorted = sortSave(save, raw, savedGame(save).history.length < save.moves.length);
    return sorted.kind === 'resume' ? { raw, save, resume: sorted.resume! } : null;
  } catch { return null; }
}
/** Record the answer. The kept copy stays as it is. */
export function answerOffer(raw: string): void {
  let owner = 'anonymous';
  try {
    if (!canWriteLocal(localStorage) || localStorage.getItem(KEPT_KEY) !== raw) return;
    owner = localStorage.getItem(KEPT_KEY + '.owner') ?? 'anonymous';
    if (owner !== (localAccess(localStorage).userId ?? 'anonymous')) return;
    if (localStorage.getItem(OFFERED_KEY) !== null && (localStorage.getItem(OFFERED_KEY + '.owner') ?? 'anonymous') !== owner) { answeredHere = { raw, owner }; return; }
    localStorage.setItem(OFFERED_KEY + '.owner', owner);
    localStorage.setItem(OFFERED_KEY, raw);
  } catch { answeredHere = { raw, owner }; /* the answer lasts for this page load */ }
}
