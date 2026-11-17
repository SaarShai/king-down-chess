import { boardStates } from '../../render/effects/states';
import { A, B, G, K, L, N, O, P, Q, R, S, TAG_POWER, colorOf, typeOf, type Move } from '../../rules/engine';
import { cardName, POWER_NAME } from '../../powers-ui';
import { armKey, isDirect, targetOf, type DraftTurn } from './turn';
import { pieces, text } from './texts';
const reasons = {
  closed: 'Your move is ready. Tap End turn, or Undo to change it.',
  source: 'Select one of your pieces first.',
  guardTarget: 'Only a king can capture the Guard.',
  guardActor: 'The Guard cannot capture; choose an empty square.',
  archer: 'The Archer cannot shoot there: use two squares straight or on a forward diagonal.',
  ogreEdge: 'The Ogre cannot push off the board; the piece stays.',
  ogreKing: 'The Ogre cannot push a king.',
  ogreBlocked: 'The Ogre cannot push there: the square behind the piece must be empty.',
  paladinKing: 'The Paladin cannot capture a king or give check.',
  safety: 'Your king is attacked after that action. Choose a safe target.',
  chain: 'Each next Beast step must capture an adjacent enemy. Tap a ringed enemy piece.',
};
/** One proved cause. Pseudo membership alone does not prove a king-safety refusal. */
export function refusalForTap(draft: DraftTurn, source: number | null, square: number): string {
  if (!draft.open && !draft.chain) return reasons.closed;
  if (source == null && !draft.armed) return reasons.source;
  const rules = draft.game.context, pos = draft.now, shown = draft.position, code = source == null ? 0 : pos.board[source], target = shown.board[square];
  const states = boardStates(rules, shown), type = typeOf(code), name = pieces[type]?.name;
  const armed = draft.armed;
  const matches = (m: Move) => (source == null ? isDirect(m) && m.from === square : m.from === source) && !m.pass && (armed ? armKey(m) === armed : !armKey(m)) && (draft.chain ? draft.captures.every((q, i) => m.captures[i] === q) && m.captures[draft.captures.length] === square : (type === S && m.captures.length ? m.captures[0] : targetOf(m)) === square);
  const unsafe = rules.pseudoMoves(pos).filter(matches).some(m => rules.inCheck({ ...rules.makeMove(pos, m), turn: pos.turn }));
  if (unsafe) return reasons.safety;
  if (source != null && states.some(state => state.kind === 'freeze' && state.sq === source)) return `The ${name} cannot move: Freeze ends after its next turn.`;
  // A tap on a piece of yours that has no legal action names that fact, not a target rule (check "play" fault 12).
  if (source === square && !armed && !draft.chain) return text.noMoves;
  if (draft.chain) return reasons.chain;
  const enemy = target && colorOf(target) !== pos.turn;
  if (!armed && source != null && type === O && target && Math.max(Math.abs(square % 8 - source % 8), Math.abs((square >> 3) - (source >> 3))) === 1) {
    if (typeOf(target) === K) return reasons.ogreKing;
    const x = 2 * (square % 8) - source % 8, y = 2 * (square >> 3) - (source >> 3);
    if (x < 0 || x > 7 || y < 0 || y > 7) return reasons.ogreEdge;
    if (shown.board[x + y * 8]) return reasons.ogreBlocked;
  }
  const protection = states.find(state => state.sq === square && state.kind !== 'freeze' && enemy && !(state.exception === 'pawn' && type === P));
  if (protection) return `${protection.kind === 'ward' ? 'Ice Wall' : protection.kind === 'firewall' ? 'Firewall' : protection.kind === 'mercy' ? 'Mercy' : 'Holy Light'} protects that piece. Choose another target.`;
  // Armed effects use their action geometry before the actor's ordinary move rule.
  if (armed) {
    const active = draft.armedMoves, sample = active.find(m => source == null || m.from === source), id = sample?.power ? TAG_POWER[sample.power] : TAG_POWER[armed as keyof typeof TAG_POWER];
    const title = armed === 'mirrorb' ? 'Mirror' : id ? (id in POWER_NAME ? POWER_NAME[id as keyof typeof POWER_NAME] : cardName(id)) : 'This action';
    if (armed === 'freeze') return typeOf(target) === K ? 'Freeze cannot stop a king. Tap a ringed enemy piece.' : 'Freeze needs an enemy piece. Tap a ringed enemy piece.';
    if (armed === 'ward') return typeOf(target) === K ? 'Ice Wall cannot protect the king. Tap a ringed piece of yours.' : 'Ice Wall needs one of your pieces. Tap a ringed piece of yours.';
    if (source == null || !active.some(m => m.from === source)) return `${title} needs a ringed actor or target. Tap a ringed square.`;
    if (['haste', 'rally', 'flight', 'strike', 'mimic', 'curse'].includes(sample?.power ?? '') && target) return `${title} needs an empty target. Tap a ringed empty square.`;
    if (sample?.power === 'burn' || sample?.power === 'firestarter') return `${title} needs an enemy in its capture zone on a clear queen’s line. Tap a ringed enemy piece.`;
    return `${title} cannot act there. Tap a ringed target, or cancel and read its rule with ?.`;
  }
  if (source == null) return reasons.source;
  if (pos.haste !== undefined && target && (pos.rage === undefined || pos.rage === 3)) return 'This step cannot capture. Tap a ringed empty square, or select End turn.';
  if (type === L && typeOf(target) === K) return reasons.paladinKing;
  if (enemy && typeOf(target) === G && type !== K) return reasons.guardTarget;
  if (type === G && enemy) return reasons.guardActor;
  if (type === A && enemy) return reasons.archer;
  if (type === R) return 'The Rook cannot move there: its rank or file must be clear. Tap a ringed target.';
  const path: Record<number, string> = { [P]: rules.rules.kings[pos.turn]?.power === 'Darkness' ? 'step forward or diagonally to an empty square, or capture straight ahead' : 'move forward to an empty square, or capture on a forward diagonal', [N]: 'jump two squares, then one to the side', [B]: 'use a clear diagonal', [R]: 'use a clear rank or file', [Q]: 'use a clear rank, file or diagonal', [K]: 'step one square to a safe target', [A]: 'step one square to an empty target', [S]: 'step one square, or capture an adjacent enemy', [G]: 'step one square to an empty target', [O]: 'step one square, or push onto an empty square', [L]: 'use a clear line past your pieces', };
  return `The ${name} cannot move there: ${path[type] ?? 'step one square, or swap with a piece of yours next to it'}. Tap a ringed target.`;
}
