import type { GameRules } from '../../game-rules';
import { stable } from '../../balance/measurements';
import { G, K, colorOf, findKing, typeOf, type Color, type Position } from '../../rules/engine';
import { SIGNAL_DURATION_MS } from './indications';
import { CHECK_WITHDRAW_MS } from './check';
import { FREEZE_RELEASE_MS } from './freeze-release';

export type StateKind = 'freeze' | 'ward' | 'firewall' | 'holy-light' | 'mercy';
export interface BoardState {
  key: string;
  owner: number;
  kind: StateKind;
  sq: number;
  code: number;
  source?: number;
  turns: number;
  exception?: 'pawn';
}
export interface StateFrame extends BoardState { since: number; clear?: number }

/** Read the same mark slots, power and rule switches that the engine uses. */
export function boardStates(context: GameRules, pos: Position): BoardState[] {
  const out: BoardState[] = [];
  const add = (kind: StateKind, sq: number, owner: number, turns = 0, source?: number, exception?: BoardState['exception']) => {
    out.push({ key: `${kind}:${owner}:${sq}:${pos.board[sq]}:${source ?? ''}`, kind, owner, sq, code: pos.board[sq], turns, source, exception });
  };
  for (const by of [0, 1] as const) {
    const mark = pos.marks?.[by], turns = mark?.left ?? 1;
    if (!mark || mark.sq < 0 || turns <= 0) continue;
    const kind = context.markKind((by ^ 1) as Color, by, mark.ward);
    if (kind === 'warded') {
      if (mark.all) pos.board.forEach((v, sq) => { if (v && colorOf(v) === by) add('firewall', sq, by, turns); });
      else if (pos.board[mark.sq] && colorOf(pos.board[mark.sq]) === by) add('ward', mark.sq, by, turns);
    } else if (kind === 'frozen' && !mark.all && pos.board[mark.sq] && colorOf(pos.board[mark.sq]) !== by) add('freeze', mark.sq, by, turns);
  }
  pos.board.forEach((v, sq) => {
    if (!v) return;
    const side = colorOf(v), rules = context.rules, power = rules.kings[side]?.power;
    if (typeOf(v) === K) return;
    const holy = power === 'HolyLight' && rules.holyLightShelter;
    const mercy = power === 'Mercy' && rules.mercyAura;
    // The reviewed Mercy mantle shows the pawn exception. Do not mislabel a pawn-only lab shelter.
    if (!holy && (!mercy || rules.mercyAuraPawns)) return;
    const king = findKing(pos.board, side);
    if (king < 0) return;
    const dx = Math.abs((king % 8) - (sq % 8)), dy = Math.abs((king >> 3) - (sq >> 3));
    const ortho = holy ? rules.holyLightShelterOrtho : rules.mercyAuraOrtho;
    if (Math.max(dx, dy) === 1 && (!ortho || dx + dy === 1)) add(holy ? 'holy-light' : 'mercy', sq, side, 0, king,
      mercy && rules.mercyAuraPawnsTake && !(typeOf(v) === G && rules.guardImmune) ? 'pawn' : undefined);
  });
  for (const state of out) {
    const same = out.filter(other => other.sq === state.sq && other.kind !== 'freeze');
    if (same.some(other => ['ward', 'firewall', 'holy-light'].includes(other.kind))) state.exception = undefined;
  }
  return out;
}

/** One bounded onset per observed forward ply. Resync, reload and rewind use quiet holds. */
export class StateEffects {
  frames: StateFrame[] = [];
  rate = 1;
  private previous?: { rulesKey: string; signature: string; ply: number };
  private seen = new WeakSet<Position>();
  forward = false;
  /** A check that a live move just ended: its wash withdraws from the king's old square (check.ts). */
  withdrawn?: { king: number; since: number };
  /** The king of a check that a highlight ended while the board still shows its position: the move has yet to play. */
  private ending?: number;
  private signals = new Map<string, { key: string; since: number }>();

  sync(context: GameRules, pos: Position, now: number, motion: boolean): void {
    const states = boardStates(context, pos);
    // Online views rebuild GameRules. Equivalent rule values keep the same effect history.
    const rulesKey = stable(context.rules);
    const signature = `${Array.from(pos.board)}|${pos.turn}|${pos.ply}|${JSON.stringify(pos.marks)}`;
    if (this.previous?.rulesKey === rulesKey && this.previous.signature === signature) { this.seen.add(pos); return; }
    if (this.previous?.rulesKey !== rulesKey) this.seen = new WeakSet<Position>();
    const forward = motion && this.previous?.rulesKey === rulesKey && pos.ply === this.previous.ply + 1 && !this.seen.has(pos);
    this.forward = forward;
    // Only a live move ends a check with a withdrawal. A review, rewind or resync removes it at once, whichever of the
    // highlight and the sync comes first. A live move with no playback (a drop) starts it here.
    if (!forward) this.withdrawn = undefined;
    else if (this.ending != null) this.withdrawn = { king: this.ending, since: now };
    this.ending = undefined;
    this.seen.add(pos);
    const prior = new Map(this.frames.filter(s => s.clear == null).map(s => [s.key, s]));
    const frames: StateFrame[] = states.map(s => {
      const held = prior.get(s.key) ?? (s.kind === 'firewall' ? [...prior.values()].find(p => p.kind === s.kind && p.owner === s.owner) : undefined);
      return { ...s, since: forward ? held?.since ?? now : -Infinity };
    });
    if (forward) for (const old of prior.values()) {
      if (old.kind !== 'freeze' && old.kind !== 'ward' && old.kind !== 'firewall') continue;
      if (!frames.some(s => s.key === old.key) && pos.board[old.sq] === old.code
        && !frames.some(s => s.sq === old.sq && ['freeze', 'ward', 'firewall'].includes(s.kind))) frames.push({ ...old, turns: 0, clear: now });
    }
    this.frames = frames;
    this.previous = { rulesKey, signature, ply: pos.ply };
    // A position change cancels indication onsets. The next highlight supplies the live marks.
    this.signals.clear();
  }

  signal(name: string, key: string, now: number, motion: boolean, onset = true): void {
    // A check that shows again (a closed promotion picker) has no move to withdraw for.
    if (name === 'check' && key) this.ending = undefined;
    if (this.signals.get(name)?.key === key) return;
    this.signals.set(name, { key, since: key && motion && onset ? now : -Infinity });
  }

  /** A highlight ended the check on `king`. Only a live move shows the withdrawal; any other end removes check at once. */
  endCheck(king: number, now: number, motion: boolean): void {
    // The check mark still belongs to the shown board (no sync came since), so the move has yet to play: its playback
    // (release) or its forward sync starts the withdrawal. A web page that only hides the mark (a modal picker, the
    // game-end ceremony) plays no move, so nothing shows.
    if (this.signals.get('check')?.key) this.ending = king;
    // The board already shows the move (its sync came first): only a forward step withdraws.
    else this.withdrawn = motion && this.forward ? { king, since: now } : undefined;
  }

  /** A move starts to play: a check that its highlight ended withdraws now. */
  release(now: number, motion: boolean): void {
    if (this.ending != null && motion) this.withdrawn = { king: this.ending, since: now };
    this.ending = undefined;
  }

  /** The withdrawal's progress (0..1), or undefined when none shows. */
  withdrawal(now: number, motion: boolean): { king: number; progress: number } | undefined {
    const w = this.withdrawn, progress = w && motion ? (now - w.since) * this.rate / CHECK_WITHDRAW_MS : 1;
    if (!w || progress >= 1) { this.withdrawn = undefined; return; }
    return { king: w.king, progress: Math.max(0, progress) };
  }

  /** Milliseconds of a signal's onset at this pace; Infinity when it holds (no motion, resync). */
  age(name: string, now: number, motion: boolean): number {
    const since = this.signals.get(name)?.since ?? -Infinity;
    return motion && since > -Infinity ? Math.max(0, (now - since) * this.rate) : Infinity;
  }

  elapsed(since: number, now: number, motion: boolean): number {
    return motion ? Math.min(1, (now - since) * this.rate / SIGNAL_DURATION_MS) : 1;
  }

  progress(name: string, now: number, motion: boolean): number {
    return this.elapsed(this.signals.get(name)?.since ?? -Infinity, now, motion);
  }

  materialProgress(state: StateFrame, now: number, motion: boolean): number {
    if (state.clear != null) return motion ? Math.min(1, .72 + this.elapsed(state.clear, now, motion)) : 1;
    return motion ? Math.min(.42, this.elapsed(state.since, now, motion)) : .42;
  }

  freezeRelease(state: StateFrame, now: number, motion: boolean): number {
    return motion && state.clear != null ? Math.max(0, Math.min(1, (now - state.clear) * this.rate / FREEZE_RELEASE_MS)) : 1;
  }

  remaining(now: number): number {
    const duration = SIGNAL_DURATION_MS / this.rate;
    const release = (s: StateFrame) => s.kind === 'freeze' ? FREEZE_RELEASE_MS / this.rate : duration * 28 / 100;
    this.frames = this.frames.filter(s => s.clear == null || now - s.clear < release(s));
    const ends = this.frames.map(s => s.clear == null ? s.since + (['freeze', 'ward', 'firewall'].includes(s.kind) ? .42 : .7) * duration : s.clear + release(s));
    for (const s of this.signals.values()) ends.push(s.since + .75 * duration);
    if (this.withdrawn) ends.push(this.withdrawn.since + CHECK_WITHDRAW_MS / this.rate);
    return Math.max(0, ...ends.map(end => end - now));
  }

  /** A completed card has already formed this owner's new freeze or ward. */
  settleMark(owner: number): void {
    for (const state of this.frames) if (state.owner === owner && state.clear == null && ['freeze', 'ward', 'firewall'].includes(state.kind)) state.since = -Infinity;
  }

  settle(): void {
    this.frames = this.frames.filter(s => s.clear == null).map(s => ({ ...s, since: -Infinity }));
    for (const s of this.signals.values()) s.since = -Infinity;
    this.withdrawn = undefined;
  }

  dispose(): void { this.frames = []; this.signals.clear(); this.previous = undefined; this.seen = new WeakSet<Position>(); this.forward = false; this.withdrawn = this.ending = undefined; }
}
