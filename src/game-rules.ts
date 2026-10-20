/** Immutable game definitions and the only product entry points to rules-dependent helpers. */
import * as engine from './rules/engine';
import { DEFAULT_RULES, RULES, setRules, type Rules } from './rules/rules';
import * as setup from './rules/setup';
import * as read from './read';
import * as words from './move-text';
import * as marks from './marks-model';
import { cursorText } from './cursor-text';
import { previouslyTurn } from './previously';
import { frozenPieces } from './render/frost';
import { genDesigned, type DesignSpec, type Refused, type TryState } from './rules/design';
import { positionKey } from './rules/position-key';

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export class GameRules {
  readonly rules: Rules;

  constructor(over: Partial<Rules> = DEFAULT_RULES) {
    const prior = { ...RULES };
    try { this.rules = freeze(structuredClone(setRules(structuredClone(over)))); }
    finally { Object.assign(RULES, prior); }
    Object.freeze(this);
  }

  // Only concrete synchronous operations enter the private scope.
  #scoped<T>(fn: () => T): T {
    const prior = { ...RULES };
    try { Object.assign(RULES, this.rules); return fn(); }
    finally { Object.assign(RULES, prior); }
  }

  startPosition(back?: string) { const army = back ?? this.randomBackRank(); return this.#scoped(() => setup.startPosition(army)); }
  fromFen(fen: string) { return this.#scoped(() => setup.fromFen(fen)); }
  randomBackRank(rng?: () => number, pool?: string) { return setup.randomBackRank(rng, pool, this.rules); }
  positionKey(pos: engine.Position) { return this.#scoped(() => positionKey(pos)); }
  legalMoves(pos: engine.Position) { return this.#scoped(() => engine.legalMoves(pos)); }
  pseudoMoves(pos: engine.Position) { return this.#scoped(() => engine.pseudoMoves(pos)); }
  inCheck(pos: engine.Position) { return this.#scoped(() => engine.inCheck(pos)); }
  status(pos: engine.Position) { return this.#scoped(() => engine.status(pos)); }
  makeMove(pos: engine.Position, move: engine.Move) { return this.#scoped(() => engine.makeMove(pos, move)); }
  toLan(pos: engine.Position, move: engine.Move) { return setup.toLan(pos, move); }
  genPiece(board: Uint8Array, from: number, mode: engine.GenMode, out: engine.Move[]) { return this.#scoped(() => engine.genPiece(board, from, mode, out)); }
  designedMoves(board: Uint8Array, from: number, design: DesignSpec, state: TryState, refused?: Refused[]) {
    return this.#scoped(() => { const moves: engine.Move[] = []; genDesigned(board, from, 'all', moves, design, refused, state); return moves; });
  }
  nameOf(...args: Parameters<typeof engine.nameOf>) { return this.#scoped(() => engine.nameOf(...args)); }
  theName(...args: Parameters<typeof engine.theName>) { return this.#scoped(() => engine.theName(...args)); }
  aName(...args: Parameters<typeof engine.aName>) { return this.#scoped(() => engine.aName(...args)); }
  playedDesign() { return this.#scoped(() => { const design = engine.playedDesign(); return design ? freeze(structuredClone(design)) : null; }); }
  markKind(...args: Parameters<typeof engine.markKind>) { return this.#scoped(() => engine.markKind(...args)); }
  pieceTitle(...args: Parameters<typeof read.pieceTitle>) { return this.#scoped(() => read.pieceTitle(...args)); }
  reachOf(...args: Parameters<typeof read.reachOf>) { return this.#scoped(() => read.reachOf(...args)); }
  pieceGuide(...args: Parameters<typeof read.pieceGuide>) { return this.#scoped(() => read.pieceGuide(...args)); }
  readText(...args: Parameters<typeof read.readText>) { return this.#scoped(() => read.readText(...args)); }
  teachNote(...args: Parameters<typeof read.teachNote>) { return this.#scoped(() => read.teachNote(...args)); }
  pieceStates(...args: Parameters<typeof read.pieceStates>) { return this.#scoped(() => read.pieceStates(...args)); }
  whyNot(...args: Parameters<typeof read.whyNot>) { return this.#scoped(() => read.whyNot(...args)); }
  readTap(...args: Parameters<typeof read.readTap>) { return this.#scoped(() => read.readTap(...args)); }
  unmarkedTap(...args: Parameters<typeof read.unmarkedTap>) { return this.#scoped(() => read.unmarkedTap(...args)); }
  guideTypes(...args: Parameters<typeof read.guideTypes>) { return this.#scoped(() => read.guideTypes(...args)); }
  checkCause(...args: Parameters<typeof words.checkCause>) { return this.#scoped(() => words.checkCause(...args)); }
  checkersOf(...args: Parameters<typeof words.checkersOf>) { return this.#scoped(() => words.checkersOf(...args)); }
  describeMove(...args: Parameters<typeof words.describeMove>) { return this.#scoped(() => words.describeMove(...args)); }
  threatsIn(...args: Parameters<typeof words.threatsIn>) { return this.#scoped(() => words.threatsIn(...args)); }
  railsOf(...args: Parameters<typeof marks.railsOf>) { return this.#scoped(() => marks.railsOf(...args)); }
  cursorText(...args: Parameters<typeof cursorText>) { return this.#scoped(() => cursorText(...args)); }
  previouslyTurn(...args: Parameters<typeof previouslyTurn>) { return this.#scoped(() => previouslyTurn(...args)); }
  frozenPieces(...args: Parameters<typeof frozenPieces>) { return this.#scoped(() => frozenPieces(...args)); }
}
