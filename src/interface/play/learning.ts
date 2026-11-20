import { GameRules } from '../../game-rules';
import { pieceGuide } from '../../read';
import { A, G, K, KINGS, L, M, O, P, S, type Color, type PieceType, type PowerName, type Position } from '../../rules/engine';
import type { CardName } from '../../rules/rules';
import { RELEASED_CARDS } from '../../content/cards';
import { cardName, cardText, powerText, POWER_NAME, usesAllowed } from '../../powers-ui';
import { cardLine, pieces, powerLines } from './texts';
import type { DraftTurn } from './turn';
import { learningNotes } from './learning-content';
export { diagramFor } from './learning-diagrams';
export type LearnSubject = { kind: 'piece'; type: PieceType } | { kind: 'power'; id: PowerName } | { kind: 'card'; id: CardName };
export const subjectKey = (subject: LearnSubject) => `${subject.kind}:${subject.kind === 'piece' ? subject.type : subject.id}`;
export const newPieces = new Set<number>([A, S, G, M, O, L]);
export const captureWords = (line: string) => line.replace(/\bTakes\b/g, 'Captures').replace(/\btakes\b/g, 'captures').replace(/\btaken\b/g, 'captured').replace(/\btake\b/g, 'capture').replace('Select "Stop here" to end the chain.', 'Select End turn to end the chain.');
const complete = (line: string) => `${line[0].toUpperCase()}${line.slice(1).replace(/\.$/, '')}.`;
export const freeActionFollowUp = 'After a free action, you can move a piece. If your king is safe, you can select End turn.';
const isFreeMark = (id: string, context: GameRules) => context.rules.markFree && ['Freeze', 'IceWall', 'Firewall'].includes(id);
export function effectRule(subject: Exclude<LearnSubject, { kind: 'piece' }>, context: GameRules): string {
  if (subject.kind === 'card' && subject.id === 'March') return cardLine(subject.id);
  const line = subject.kind === 'power' ? powerText(subject.id, context.rules) : cardText(subject.id, context.rules);
  const copy = isFreeMark(subject.id, context) ? line
    .replace(', then make your move, which cannot capture: the', '. If you move a piece, it cannot capture. The')
    .replace(', then make your move: the', '. The')
    .replace('; then make your move', '') : line;
  return complete(captureWords(copy));
}
export function learningEntry(subject: LearnSubject, context: GameRules, pos?: Position, side: Color = 0, cardIndex?: number) {
  const isPiece = subject.kind === 'piece', name = isPiece ? pieces[subject.type].name : subject.kind === 'power' ? POWER_NAME[subject.id] : cardName(subject.id);
  let full: string, uses = '', king = '', short = isPiece ? pieces[subject.type].short : subject.kind === 'card' ? cardLine(subject.id) : powerLines[subject.id]!;
  const power = context.rules.kings[side]?.power;
  if (isPiece) {
    const guide = pieceGuide(context, subject.type);
    full = captureWords([guide.moves, guide.captures, guide.special].filter(Boolean).join(' '));
    if (subject.type === P && context.rules.kings[side]?.power === 'Darkness') full = 'Move one square forward or diagonally forward to an empty square. Capture only straight ahead. Move two squares from the start rank on an empty file. Promote on the last rank.';
    if (subject.type === P) full += ` The path must be clear. Choose a new piece on the last rank. ${context.rules.classicChess ? 'En passant is allowed.' : 'No en passant in this game.'}`;
    if (subject.type === K) {
      if (power === 'Mercy' || power === 'DeathTouch') {
        full = `${power === 'DeathTouch' ? 'Move one square in any direction. ' : ''}${complete(captureWords(powerText(power, context.rules)))} Only a king can capture a Guard.`;
        short = powerLines[power]!;
      } else if (power === 'Darkness' && context.rules.darknessKingStep2) {
        const r = context.rules;
        short = 'Move one safe square, or two over an empty square.';
        full += ` With Darkness, move two squares in a straight line over an empty square${r.darknessKingStepSafe && !r.darknessKingStepTakes ? ' that no enemy attacks' : ''}${r.darknessKingStepTakes ? '; you can also capture there' : ' to an empty square; this move cannot capture'}.`;
      }
      full += ` Stay out of attack. ${context.rules.classicChess ? 'Castling is allowed.' : 'No castling in this game.'}`;
    }
  } else {
    full = effectRule(subject, context);
    if (subject.kind === 'power') {
      king = context.rules.kings[side]?.power === subject.id ? context.rules.kings[side]!.king : Object.entries(KINGS).find(([, powers]) => (powers as readonly string[]).includes(subject.id))![0];
      const n = usesAllowed(subject.id, context.rules);
      uses = n == null || n === 0 ? 'Always on' : pos ? `${Math.max(0, n - (pos.used?.[side] ?? 0))} of ${n} left` : `${n} ${n === 1 ? 'use' : 'uses'} per game`;
    } else uses = pos && cardIndex != null && (pos.used?.[side] ?? 0) >> cardIndex & 1 ? 'Used in this game' : 'One use';
  }
  let [limits, against] = learningNotes[isPiece ? name : subject.id];
  if (isPiece && context.rules.classicChess) limits = limits.replace('No en passant in this game.', 'En passant is allowed.').replace('There is no castling in this game.', 'Castling is allowed.');
  if (isPiece && subject.type === P && context.rules.kings[side]?.power === 'Darkness') limits += ' Darkness overrides the base pawn rule: step forward or diagonally forward; capture only straight ahead.';
  if (isPiece && subject.type === P && context.rules.kings[side]?.power === 'March') limits += ' March also permits two steps forward from any rank if both squares are empty.';
  if (isPiece && subject.type === K && short !== pieces[K].short) limits += ` ${full}`;
  if (!isPiece && subject.id === 'March' && context.rules.kings[side]?.power === 'Darkness') limits = limits.replace('Pawns still capture on a forward diagonal.', 'With Darkness, pawns capture only straight ahead.');
  if (!isPiece && isFreeMark(subject.id, context)) limits += ` ${freeActionFollowUp}`;
  return { key: subjectKey(subject), subject, name, short: isPiece && subject.type === P && power === 'Darkness' ? 'Darkness: step forward or diagonally; capture only straight ahead. Promote on the last rank.' : short, full, limits, against, uses, king, kind: isPiece ? 'Piece' : subject.kind === 'power' ? 'King’s power' : 'Card', isNew: isPiece && newPieces.has(subject.type), art: isPiece ? `/ui/pieces/${subject.type === K ? 'king-spirit' : name.toLowerCase()}-${side ? 'b' : 'w'}.webp` : subject.kind === 'power' ? `/ui/pieces/king-${king.toLowerCase()}-${side ? 'b' : 'w'}.webp` : `/${RELEASED_CARDS.find(card => card.id === subject.id)!.art}` };
}
/** Pass and a free mark do not count as the first move. The computer's actions before the player's first turn do not count. */
export function firstMinute(draft: DraftTurn, player: Color = 0): boolean {
  const real = (move: { pass?: boolean; power?: string }) => !move.pass && !['freeze', 'ward', 'firewall'].includes(move.power ?? '');
  const h = draft.game.history, mine = h.findIndex(entry => entry.pos.turn === player);
  return !(mine < 0 ? [] : h.slice(mine)).some(entry => real(entry.move)) && !draft.steps.some(h => real(h.move)) && !draft.captures.length;
}
const steps: Record<string, string> = {
  Freeze: 'Tap a frosted square. Move or tap End turn.',
  IceWall: 'Tap a ringed piece of yours. Then move a piece, or select End turn.',
  Strike: 'Tap a ringed piece of yours, then an empty square on a queen’s line. This is your move.',
  Haste: 'Tap a ringed piece, then an empty target. You can move that piece once more without a capture.',
  Flight: 'Tap a ringed piece of yours, then an empty square in your half.',
  Sacrifice: 'Tap a ringed pawn of yours. Choose the lost piece that replaces it.',
  March: 'Tap a ringed pawn, then its target two squares forward.',
  Leap: 'Tap a ringed Rook, Bishop or Queen, then a target beyond your pawns.',
  Salvation: 'Tap a ringed empty back-rank square. Choose the lost piece to return.',
  MirrorB: 'Tap a ringed piece or square. Choose the copied effect if asked.',
  Firewall: 'Tap your ringed king. Then move a piece, or select End turn.',
  EarthQuake: 'Tap a ringed centre for the push. Read each piece’s destination before End turn.',
  Burn: 'Tap a ringed piece, then an enemy on d4, e4, d5 or e5 along a clear queen’s line.',
  FireStarter: 'Tap a ringed piece, then an enemy on the opponent’s back rank along a clear queen’s line.',
  Control: 'Tap a ringed piece, then a target it reaches with a different piece of yours next to it.',
  Rally: 'Tap a ringed piece, then an empty target. You can then move a different piece without a capture.',
  MorphP: 'Tap a ringed pawn. Choose Knight or Bishop as its new type.',
  Mimic: 'Tap a ringed piece, then an empty target it reaches like another piece of yours.',
  Vault: 'Tap a ringed Rook, Bishop or Queen, then a target beyond exactly one piece.',
  Curse: 'Tap a ringed enemy piece, then an empty square next to it.',
  SkyLift: 'Tap one ringed piece, then the other piece to swap. They must have different types.',
};
export const stepLine = (subject: LearnSubject) => subject.kind === 'piece' ? '' : steps[subject.id] ?? '';
