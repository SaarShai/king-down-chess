/** The back-rank draft. A swap can break a rule until the player selects Ready. */
import { LETTERS, type Color, type Position } from '../../rules/engine';
import { DEFAULT_OPTIONS, setupAdmission, validateChoice, type SetupAdmission } from '../../match/setup';
import { seatIndex, swapOrder } from '../../plugin/screens/seat-model';
import { emptyMarks, PLAIN, type PlainMarks } from '../../render/plain-marks';
import { toFen } from '../../rules/setup';
import type { Game } from '../../game';

export const ARRANGE_KEY = 'kingdown.arrangement';
const options = { ...DEFAULT_OPTIONS, kingPowers: false };
export class Arrangement {
  selected: number | null = null;
  constructor(readonly army: string, readonly side: Color, public order = army, readonly admission: SetupAdmission = setupAdmission(options)) {}
  get error(): string | null {
    const check = (limits: Partial<SetupAdmission>) => validateChoice(options, { army: this.army, hand: [] }, { king: null, order: this.order }, { ...this.admission, ...limits, kings: [] });
    return [...new Set([check({ guardAdjacent: false }), check({ bishopsOpposite: false })].filter(Boolean))].join(' ') || null;
  }
  get canReady(): boolean { return !this.error; }
  get faults(): number[] {
    if (!this.error) return [];
    const bishops = [...this.order].flatMap((p, i) => p === 'B' ? [i] : []), guard = this.order.indexOf('G'), king = this.order.indexOf('K');
    const bad = this.admission.bishopsOpposite && bishops.length === 2 && (bishops[0] + bishops[1]) % 2 === 0 ? bishops : [];
    if (this.admission.guardAdjacent && guard >= 0 && Math.abs(guard - king) !== 1) bad.push(guard, king);
    return [...new Set(bad.length ? bad : [...this.order].map((_, i) => i))].map(i => this.side * 56 + i);
  }
  pick(square: number): boolean {
    const index = seatIndex(this.side, square); if (index === null) return false;
    if (this.selected === null) this.selected = square;
    else { this.order = swapOrder(this.order, this.selected % 8, index); this.selected = null; }
    return true;
  }
  position(base: Position): Position {
    const board = base.board.slice();
    [...this.order].forEach((letter, i) => { board[this.side * 56 + i] = LETTERS.indexOf(letter) | this.side << 4; });
    return { ...base, board };
  }
  marks(): PlainMarks {
    const marks = emptyMarks();
    for (let i = 0; i < 8; i++) marks.rings.push({ square: this.side * 56 + i, color: PLAIN.move, role: 'target', width: .9, size: 1.12 });
    for (const square of this.faults) marks.rings.push({ square, color: PLAIN.enemy, role: 'state', width: 1.25, size: 1.12 });
    if (this.selected !== null) marks.rings.push({ square: this.selected, color: PLAIN.actor, role: 'actor', width: 1.1, size: 1.12 });
    return marks;
  }
}

/** An unfinished solo setup restarts from its saved deal. No illegal draft enters the shared game save. */
export function pendingArrangement(storage: Pick<Storage, 'getItem'>, game: Game, side: Color): Arrangement | undefined {
  if (game.history.length) return;
  try {
    const saved = JSON.parse(storage.getItem(ARRANGE_KEY) ?? 'null');
    if (saved?.side === side && saved.fen === toFen(game.pos) && typeof saved.army === 'string' && saved.army.length === 8) {
      const draft = new Arrangement(saved.army, side);
      if (draft.canReady && toFen(draft.position(game.pos)) === saved.fen) return draft;
    }
  } catch { /* private mode or an old marker */ }
}
