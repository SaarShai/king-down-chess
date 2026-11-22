import { Game } from '../../game';
import { S, typeOf, type Move, type Position } from '../../rules/engine';

const prefix = (move: Move, bites: number[]) => bites.every((sq, i) => move.captures[i] === sq);
export const targetOf = (move: Move) => move.shove?.from ?? (move.from === move.to && move.captures.length ? move.captures[0] : move.to);
/** The power or card that a move spends: its tag, or the Mirror card that plays another card. */
export const armKey = (move: Move): string | null => move.via ?? move.power ?? null;
/** A move with one square only: a mark, a pawn change, a returned piece, a quake. */
export const isDirect = (move: Move) => move.from === move.to && !move.captures.length && !move.pass;
/** Sky Lift and Morph trade two own pieces: one engine move, but a tap on either piece starts it (plugin repair fcde7a5eb). */
const symmetric = (move: Move) => !!move.swap && (move.power === 'skylift' || move.power === 'morphs');

/**
 * The engine keeps the accepted position. A draft keeps the steps of one turn: one action, a Haste or
 * Rally second move, the move after a free mark, and an open Beast chain on the last step.
 */
export class DraftTurn {
  private plies: { before: Position; move: Move; after: Position }[] = [];
  private source: number | null = null;
  private bites: number[] = [];
  private nowLegal: Move[] | null = null;
  private nowStatus: string | null = null;
  /** The armed power or card (`armKey`), or null. */
  armed: string | null = null;
  constructor(readonly game: Game) {}
  get base(): Position { return this.game.pos; }
  /** The position after the staged steps, before an open chain. */
  get now(): Position { return this.plies.at(-1)?.after ?? this.base; }
  get legal(): Move[] { return this.plies.length ? (this.nowLegal ??= this.game.context.legalMoves(this.now)) : this.game.legal; }
  /** The legal moves as the taps reach them: each symmetric swap also from its second piece. Stage turns a copy back. */
  private get choices(): Move[] { return this.legal.flatMap(m => symmetric(m) ? [m, { ...m, from: m.to, to: m.from }] : [m]); }
  get steps(): readonly { before: Position; move: Move }[] { return this.plies; }
  get chain(): boolean { return this.source !== null; }
  get captures(): readonly number[] { return this.bites; }
  get length(): number { return this.plies.length + this.bites.length; }
  /** The turn takes another step: the first one, or a step after a Haste move or a free mark. */
  get open(): boolean { return !this.chain && this.now.turn === this.base.turn && this.playing; }
  /** A staged step can end the game (a free mark or a Haste step at the 50-move limit): then the turn ends there, as online. */
  private get playing(): boolean { return (this.plies.length ? (this.nowStatus ??= this.game.context.status(this.now)) : this.game.status) === 'playing'; }
  private get chainMove(): Move | undefined {
    return this.legal.find(m => m.from === this.source && m.captures.length === this.bites.length && prefix(m, this.bites));
  }
  get previewMove(): Move | undefined {
    return this.chain ? { from: this.source!, to: this.bites.at(-1)!, captures: [...this.bites] } : undefined;
  }
  get position(): Position { const m = this.previewMove; return m ? this.game.context.makeMove(this.now, m) : this.now; }
  /** End turn is legal: the turn passes, or the side can stop with a pass (Haste, Rally, a free mark). */
  get canFinish(): boolean {
    if (!this.length) return false;
    let pos = this.now;
    if (this.chain) { const m = this.chainMove; if (!m) return false; pos = this.game.context.makeMove(pos, m); }
    return pos.turn !== this.base.turn || !this.chain && !this.playing || this.game.context.legalMoves(pos).some(m => m.pass);
  }
  /** The armed moves of this step. */
  get armedMoves(): Move[] { return this.open && this.armed ? this.choices.filter(m => armKey(m) === this.armed) : []; }
  armable(key: string): boolean { return this.open && this.legal.some(m => armKey(m) === key); }
  /** One tap arms a power or a card. A second tap cancels it. */
  arm(key: string): void {
    if (this.armed === key) { this.armed = null; return; }
    if (!this.armable(key)) throw new Error('The power has no legal target now.');
    this.armed = key;
  }
  private keyOf(move: Move): number {
    return this.chain ? move.captures[this.bites.length] : typeOf(this.now.board[move.from]) === S && move.captures.length ? move.captures[0] : targetOf(move);
  }
  options(source: number): Move[] {
    if (this.chain) return this.legal.filter(m => m.from === this.source && prefix(m, this.bites) && m.captures.length > this.bites.length);
    if (!this.open) return [];
    return this.choices.filter(m => m.from === source && !m.pass && (this.armed ? armKey(m) === this.armed : !armKey(m)));
  }
  targets(source: number): number[] { return [...new Set(this.options(source).map(m => this.keyOf(m)))]; }
  at(source: number, target: number): Move[] { return this.options(source).filter(m => this.keyOf(m) === target); }
  stage(choice: Move): void {
    const move = this.legal.find(m => m === choice || symmetric(m) && m.from === choice.to && m.to === choice.from && armKey(m) === armKey(choice));
    if (!this.open || !move) throw new Error('The action is not available.');
    this.plies.push({ before: this.now, move, after: this.game.context.makeMove(this.now, move) });
    this.nowLegal = this.nowStatus = null; this.armed = null;
  }
  bite(source: number, square: number): void {
    if (typeOf(this.now.board[source]) !== S || (!this.chain && !this.open) || !this.at(source, square).some(m => m.captures.length)) throw new Error('The capture is not available.');
    this.source = source; this.bites.push(square); this.armed = null;
  }
  /** Undo removes the last step: one capture of a chain, one Haste move, or a power use. */
  undo(): void {
    if (this.chain) { this.bites.pop(); if (!this.bites.length) this.source = null; }
    else if (this.plies.pop()) this.nowLegal = this.nowStatus = null;
    this.armed = null;
  }
  /** Play the steps, and the pass that ends a mid-way turn. Return the played moves. */
  commit(): Move[] {
    if (!this.canFinish) throw new Error('Complete a legal action first.');
    const moves = this.plies.map(p => p.move), side = this.base.turn;
    if (this.chain) moves.push(this.chainMove!);
    for (const m of moves) this.game.play(m);
    const pass = this.game.pos.turn === side && this.game.status === 'playing' && this.game.legal.find(m => m.pass);
    if (pass) { this.game.play(pass); moves.push(pass); }
    this.plies = []; this.source = null; this.bites = []; this.nowLegal = this.nowStatus = null; this.armed = null;
    return moves;
  }
}
