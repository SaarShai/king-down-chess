import { kingDisplayName } from '../../king-label';
import { checkersOf } from '../../move-text';
import { boardStates } from '../../render/effects/states';
import type { PlainMarks } from '../../render/plain-marks';
import { GameRules } from '../../game-rules';
import { pieceGuide } from '../../read';
import type { PieceType } from '../../rules/engine';
import type { Move, Position } from '../board-api';
import { sqName, typeOf, colorOf, TAG_POWER, followSq, type Color, A, B, G, K, L, M, N, O, P, Q, R, S } from '../../rules/engine';
import type { DraftTurn } from './turn';
import type { CardName } from '../../rules/rules';
import { POWER_NAME, cardName, usesAllowed } from '../../powers-ui';
import type { PowerName } from '../../rules/engine';

// The copy table supplies short lines. The shared current content supplies full rules.
const pieceContext = new GameRules();
const piece = (type: PieceType, name: string, short: string) => {
  const guide = pieceGuide(pieceContext, type);
  const full = [guide.moves, guide.captures, guide.special].filter(Boolean).join(' ').replace(/\bTakes\b/g, 'Captures').replace(/\btakes\b/g, 'captures').replace(/\btaken\b/g, 'captured').replace(/\btake\b/g, 'capture').replace('Select "Stop here" to end the chain.', 'Select End turn to end the chain.');
  const extra = type === P ? ' The path must be clear. Choose a new piece on the last rank. No en passant in this game.' : type === K ? ' Stay out of attack. No castling in this game.' : '';
  return { name, short, full: full + extra };
};
export const pieces: Record<number, { name: string; short: string; full: string }> = {
  [P]: piece(P, 'Pawn', 'Move forward; capture diagonally. Promote on the last rank.'),
  [N]: piece(N, 'Knight', 'Jump two squares, then one across; jump over pieces.'),
  [B]: piece(B, 'Bishop', 'Move on a clear diagonal; pieces block the path.'),
  [R]: piece(R, 'Rook', 'Move on a clear rank or file; pieces block the path.'),
  [Q]: piece(Q, 'Queen', 'Move on a clear rank, file or diagonal; pieces block it.'),
  [K]: piece(K, 'King', 'Move one safe square. Only a king can capture a Guard.'),
  [A]: piece(A, 'Archer', 'Shoot two squares straight or diagonally ahead, over pieces.'),
  [S]: piece(S, 'Beast', 'Step one square; each later chain step must capture.'),
  [G]: piece(G, 'Guard', 'Step without capture; only a king can capture it.'),
  [M]: piece(M, 'Maester', 'Step or swap with an adjacent own piece; keep the king safe.'),
  [O]: piece(O, 'Ogre', 'Push and follow; never push a king or off the board.'),
  [L]: piece(L, 'Paladin', 'Queen paths over own pieces; non-pawn capture removes both.'),
};
/** Short lines of the powers and cards, by engine ID. The Vault card shows as "Hop" (cardName). */
export const powerLines: Partial<Record<CardName, string>> = {
  Freeze: 'Stop an enemy, not the king; it stays able to attack.', IceWall: 'Protect a piece, not the king; a push still works.',
  Strike: 'Move like a queen; no pawn, king or capture.', Haste: 'Move one piece up to twice; neither move captures.',
  Flight: 'Move to an empty square in your half; no king.', Sacrifice: 'Replace a pawn with a lost piece; no pawn, Guard or king.',
  March: 'Move a pawn two squares from any rank; the path stays clear.', Leap: 'Rook, Bishop or Queen: jump own pawns, not other pieces.',
  HolyLight: 'Protect pieces beside the king, not on its diagonals.', Mercy: 'The king jumps; its shelter stops captures except by pawns.',
  DeathTouch: 'King: capture beside it or two ahead or back; never move.', Darkness: 'Pawns step diagonally too; capture only straight ahead.',
  Salvation: 'Your back rank: return a lost piece; no pawn, Guard or king.', MirrorB: 'Copy another card in your hand; that card stays.',
  Firewall: 'Protect all pieces for the next enemy turn; a push works.', EarthQuake: 'Push pieces away; kings and blocked or edge pieces stay.',
  Burn: 'Capture on d4, e4, d5 or e5; no pawn or king can act.', FireStarter: 'Capture on the enemy back rank; no pawn or king can act.',
  Control: 'Move like a different adjacent own type; no pawn or king.', Rally: 'Move up to two different pieces; neither move captures.',
  MorphP: 'Change your pawn into a Knight or Bishop; it stays here.', Mimic: 'Use another own type to move, not capture; no pawn or king.',
  Vault: 'Jump exactly one piece with a Rook, Bishop or Queen.', Curse: 'Move an enemy to an empty square; no king or last-rank pawn.',
  SkyLift: 'Swap two different own types; no pawn or king.',
};
export const text = {
  yourCards: 'Your cards', cardsLeft: (n: number) => `${n} ${n === 1 ? 'card' : 'cards'} left`, unlimited: 'Unlimited', yourGames: 'Your games', showAllGames: 'Show all games',
  rematchHint: 'Select Rematch to play at the same level.', casual: 'Friendly', clever: 'Focused', club: 'Fierce', computerFailed: 'The computer cannot play. Open Menu, then Back to home.', title: 'King Down', intro: 'Chess with new pieces. Checkmate wins.', army: 'This game’s army', level: 'Computer level', play: 'Play', pieces: 'Pieces', computer: 'Computer', you: 'You', menu: 'Menu', rule: 'Rule', undo: 'Undo', replay: 'Replay', finish: 'End turn', close: 'Close',
  setup: 'Game', withPowers: 'With powers', withCards: 'With cards', withBoth: 'With powers and cards',
  noPowers: 'No powers · No cards', powersNote: 'Each king gets a random power.', cardsNote: 'Each king gets an always-on power. Both players get the same four cards.',
  ready: 'Your turn.', first: 'Your turn. · You move first', firstMinute: 'Tap a piece to see how it moves.', draft: '', notFinal: '', check: 'Check. · Your king is attacked', thinking: 'Computer is thinking…', choose: 'Choose a piece, then a marked square.', staged: 'Your move is ready. Tap End turn, or Undo to change it.', continue: 'Capture again, or select End turn.', endChain: 'Select End turn.', mustContinue: 'Capture again to keep your king safe.', noStep: 'No step to undo.', needMove: 'Complete a legal move first.', choiceFirst: 'Choose an action, or cancel.', choosePiece: 'Choose a piece to read its rule.', wait: 'The computer is choosing its action.', sent: 'This turn is final. The computer now plays.', invalid: 'Select one of your pieces first.', final: 'The game is over.', cancel: 'Cancel', take: 'Capture', push: 'Push', promote: 'Promote to', coordinates: 'Coordinates', sound: 'Sound', on: 'On', motion: 'Motion speed', normal: 'Normal', fast: 'Fast', off: 'Off', home: 'Back to home', resign: 'Resign', resignTitle: 'Resign this game?', resignCause: 'The computer wins. Your turn is final.', rematch: 'Rematch', newGame: 'New game', result: 'Game result', win: 'You win. Checkmate.', loss: 'The computer wins. Checkmate.', resigned: 'The computer wins. You resign.', stalemate: 'Draw. No legal action and no check.', draw50: 'Draw. No progress for 100 actions.', drawRepetition: 'Draw. The same position occurs three times.', drawMaterial: 'Draw. Insufficient material.', noMoves: 'This piece has no legal action.', undone: 'Last step removed.', loading: 'Loading the board.', loadFailed: 'The board cannot load. Reload the page.', last: 'Last action', steps: 'Turn steps', shortcuts: 'Arrows move the cursor. Enter selects. Escape clears.', openBoard: 'Open board', small: 'This view is too small for the board.',
  symbolsHint: 'Hard to tell the figures apart? Open Menu and choose Symbols.',
  pieceView: 'Pieces', figures: 'Figures', symbols: 'Symbols',
  handView: 'Powers and cards', hand: 'Hand', ribbon: 'Ribbon', fullRule: 'Full rule', power: 'power', card: 'card', alwaysOnShort: 'Always on',
  versus: 'VS', king: 'King',
  resume: 'Continue', newTitle: 'Start a new game?', newCause: 'Your saved game ends.', keepGame: 'Keep my game',
  kept: 'A game from the earlier version cannot open here yet. It is kept.', cannotSave: 'This device cannot save the game.',
  otherTab: 'Your saved game changed in another tab. Load the newer game to continue.',
  keptFull: 'This game cannot open here. Another kept game uses the copy space. Both games stay saved.',
  armed: 'Choose a target.', disarmed: 'You cancel the power.', disarmedCard: 'You cancel the card.', spent: 'You used this. It has no use left.', alwaysOn: 'Always on. It needs no tap.', left: 'left', noTarget: 'No legal target now.', notYet: 'You cannot use it at this step.', computerOwns: 'The computer has this.', again: 'Move it again, or select End turn.', another: 'Move another piece, or select End turn.', after: 'Now make your move.', effects: 'Effects', history: 'History', noHistory: 'No action yet.', stagedTurn: 'This turn', useSymbols: 'Use symbols', useRibbon: 'Use ribbon',
};

const article = (name: string) => /^[aeiou]/i.test(name) ? 'an' : 'a';
const nameOf = (code: number) => pieces[typeOf(code)]?.name ?? '';
/** The name of the power or card that a move spends, with "card" when it comes from a hand. */
export function spentName(move: Move): string {
  const card = TAG_POWER[move.power!];
  const name = card in POWER_NAME ? POWER_NAME[card as keyof typeof POWER_NAME] : cardName(card);
  return move.via ? `Mirror as ${name}` : name;
}
/** One sentence for one engine action, after the copy table. `card`: the side spends cards, not a king power. */
export function sentence(before: Position, move: Move, computer = false, card = false): string {
  if (move.pass) return '';
  const piece = nameOf(before.board[move.from]);
  const at = (square: number) => `${nameOf(before.board[square])} on ${sqName(square)}`;
  const actor = computer ? `The opponent's ${piece}` : `Your ${piece}`;
  const own = computer ? "the opponent's" : 'your';
  if (move.power) {
    const who = computer ? `The opponent ${card ? 'plays' : 'uses'} ${spentName(move)}` : `You ${card ? 'play' : 'use'} ${spentName(move)}`;
    switch (move.power) {
      case 'freeze': return `${who}. ${computer ? 'Your' : 'The'} ${at(move.from)} cannot move on ${computer ? 'your next turn' : 'its next turn'}; it still attacks.`;
      case 'ward': return `${who}. ${computer ? "The opponent's" : 'Your'} ${at(move.from)} cannot be captured on ${computer ? 'your' : 'the opponent’s'} next turn.`;
      case 'firewall': return `${who}. ${computer ? "The opponent's" : 'Your'} pieces cannot be captured on ${computer ? 'your' : 'the opponent’s'} next turn.`;
      case 'quake': case 'quakeb': return `${who} on ${sqName(move.from)}. ${(move.pushes ?? []).map(p => `The ${at(p.from)} moves to ${sqName(p.to)}`).join('; ')}.`;
      case 'sacrifice': return `${who}. ${computer ? "The opponent's" : 'Your'} Pawn on ${sqName(move.from)} leaves and ${own} lost ${pieces[move.promo!].name} returns on ${sqName(move.to)}.`;
      case 'salvation': return `${who}. ${computer ? "The opponent's" : 'Your'} lost ${pieces[move.drop!].name} returns on ${sqName(move.to)}.`;
      case 'morphp': case 'morph': case 'morphb': return `${who}. The ${at(move.from)} becomes ${article(pieces[move.promo!].name)} ${pieces[move.promo!].name} and stays on ${sqName(move.to)}.`;
      case 'curse': return `${who}. ${computer ? 'Your' : "The opponent's"} ${piece} moves from ${sqName(move.from)} to ${sqName(move.to)}.`;
    }
    return `${who}. ${sentence(before, { ...move, power: undefined, via: undefined }, computer)}`;
  }
  if (move.shove) return `The ${nameOf(before.board[move.shove.from])} moves to ${sqName(move.shove.to)} and ${own} Ogre ends on ${sqName(move.to)}.`;
  if (move.swap) return `${actor} ends on ${sqName(move.to)} and ${own} ${nameOf(before.board[move.to])} ends on ${sqName(move.from)}.`;
  if (move.castle) return `${actor} ends on ${sqName(move.to)} and ${own} Rook ends on ${sqName(move.castle.to)}.`;
  if (move.from === move.to && move.captures.length) return `${actor} stays on ${sqName(move.from)} and ${typeOf(before.board[move.from]) === K ? 'captures' : 'shoots'} the ${at(move.captures[0])}.`;
  const promo = move.promo ? ` and becomes ${article(pieces[move.promo].name)} ${pieces[move.promo].name}` : '';
  if (move.captures.length) {
    const victims = move.captures.map(at).join(', then the ');
    if (move.selfRemove) return `${actor} captures the ${victims}; both leave the board.`;
    return `${actor} captures the ${victims} and ends on ${sqName(move.to)}${promo}.`;
  }
  return `${actor} moves from ${sqName(move.from)} to ${sqName(move.to)}${promo}.`;
}
export const biteLine = (_before: Position, square: number, optional = false) => `Your Beast captures on ${sqName(square)}${optional ? '; another adjacent capture is optional' : ''}.`;
/** The latest capture offers a continuation only when both the stop and the next capture are legal. */
export function draftSentences(draft: DraftTurn, card = false): string[] {
  return [...draft.steps.map(step => sentence(step.before, step.move, false, card)), ...draft.captures.map((square, i) => biteLine(draft.now, square, i === draft.captures.length - 1 && draft.canFinish && draft.targets(draft.previewMove!.from).length > 0))];
}
/** Follow each marked piece. A changed square alone is not an expired effect. */
export function effectEndLines(rules: GameRules, before: Position, move: Move, after: Position, viewer: Color = 0): string[] {
  const next = boardStates(rules, after), groups = new Map<string, { effect: string; whose: string; lines: string[] }>();
  for (const state of boardStates(rules, before)) {
    const sq = followSq(move, state.sq);
    if (next.some(n => n.kind === state.kind && n.owner === state.owner && n.sq === sq)) continue;
    const effect = ({ freeze: 'Freeze', ward: 'Ice Wall', firewall: 'Firewall', 'holy-light': 'Holy Light', mercy: 'Mercy' })[state.kind];
    const whose = colorOf(state.code) === viewer ? 'your' : "the opponent's", key = `${state.kind}:${state.owner}`;
    const group = groups.get(key) ?? { effect, whose, lines: [] }; groups.set(key, group);
    if (sq < 0 || !after.board[sq]) group.lines.push(`${effect} ends; ${whose} ${nameOf(state.code)} on ${sqName(state.sq)} leaves the board.`);
    else if (state.kind === 'freeze') group.lines.push(`${effect} ends; ${whose} ${nameOf(after.board[sq])} can move again.`);
    else group.lines.push(`${effect} ends for ${whose} ${nameOf(after.board[sq])} on ${sqName(sq)}.`);
  }
  return [...groups.values()].map(g => g.lines.length === 1 ? g.lines[0] : `${g.effect} ends for ${g.lines.length} of ${g.whose} pieces.`);
}
export const squareLabel = (pos: Position, square: number) => `${sqName(square)}${pos.board[square] ? ` ${colorOf(pos.board[square]) ? 'Dark' : 'Light'} ${pieces[typeOf(pos.board[square])].name}` : ' empty'}`;
/** The player side names the owner. The turn side keeps the duration of a staged effect. */
export function stateDescriptions(rules: GameRules, pos: Position, player: Color = 0, turn: Color = pos.turn): { squares: number[]; line: string }[] {
  const at = (sq: number) => `${colorOf(pos.board[sq]) !== player ? 'the computer’s' : 'your'} ${nameOf(pos.board[sq])} on ${sqName(sq)}`;
  const out = boardStates(rules, pos).map(state => {
    const when = turn !== state.owner ? 'this turn' : `${state.owner !== player ? 'your' : 'the computer’s'} next turn`;
    let line: string;
    if (state.kind === 'freeze') line = `Frozen: ${at(state.sq)} cannot move on ${when}.`;
    else if (state.kind === 'ward' || state.kind === 'firewall') line = `${state.kind === 'ward' ? 'Ice Wall' : 'Firewall'}: ${at(state.sq)} cannot be captured on ${when}.`;
    else line = `${state.kind === 'holy-light' ? 'Holy Light' : 'Mercy'}: ${at(state.sq)} cannot be captured${state.exception === 'pawn' ? ', except by a pawn,' : ''} while beside the King on ${sqName(state.source!)}.`;
    return { squares: [state.sq], line };
  });
  if (rules.inCheck(pos)) for (const check of checkersOf(rules, pos)) out.push({ squares: [check.sq, check.king], line: `Check: ${at(check.sq)} attacks ${at(check.king)}.` });
  return out;
}
/** Each active mark and when it ends. `player`: the person's side. */
export const effectLines = (pos: Position, rules: GameRules, player: Color = 0): string[] => stateDescriptions(rules, pos, player).map(state => state.line);
/** Step text reads the drawn candidate, including its optional later destination. */
export function routeLine(marks: PlainMarks): string {
  return marks.steps.length ? `Candidate Haste route. ${marks.steps.map(step => `Step ${step.number}: ${sqName(step.square)}.`).join(' ')} The second move is optional.` : '';
}
/** The Versus card for a screen reader: each king and its power. */
export const versusLine = (you: string, youPower: string, rival: string, rivalPower: string) =>
  `Your ${kingDisplayName(you)} King ${youPower ? `has ${youPower}` : 'has no power'}. The computer’s ${kingDisplayName(rival)} King ${rivalPower ? `has ${rivalPower}` : 'has no power'}.`;

/** The result card separates the outcome from its cause. */
export function resultText(status: string, resigned: boolean, losingSide: number, player: Color = 0) {
  const title = resigned || status === 'checkmate' && losingSide === player ? 'The computer wins' : status === 'checkmate' ? 'You win' : 'Draw';
  const cause = resigned ? 'You resign.' : status === 'checkmate' ? 'Checkmate.' : ({ stalemate: 'No legal action and no check.', draw50: 'No progress for 100 actions.', drawRepetition: 'The same position occurs three times.', drawMaterial: 'Insufficient material.' } as Record<string, string>)[status] ?? '';
  return { title, cause };
}

// Stage "reading": the reading area of the game screen (launch decisions 17 to 22). The viewer is the player's side.
export const readingText = {
  pickOwn: 'Choose one of your pieces.', pickEnemy: 'Choose an enemy piece.', pickAny: 'Choose a ringed piece.',
  cancelCard: 'You cancel the card.', cancelPower: 'You cancel the power.', possible: 'Possible result:',
  yourPower: 'Your power', computerPower: 'Computer’s power', capturePush: 'Capture or push?', returns: 'Choose the piece that returns.', newPiece: 'Choose the new piece.', mirror: 'Choose the card that Mirror copies.',
  mustMove: 'Move a piece to keep your king safe.',
};
const EFFECT_NAME = { freeze: 'Freeze', ward: 'Ice Wall', firewall: 'Firewall', 'holy-light': 'Holy Light', mercy: 'Mercy' } as const;
export interface EffectGroup { key: string; summary: string; details: { squares: number[]; line: string }[] }
/** One group for each source: the effect and its owner, or the Guards. Each detail keeps its exact square line. */
export function effectGroups(rules: GameRules, pos: Position, turn: Color = pos.turn, viewer: Color = 0): EffectGroup[] {
  const lines = stateDescriptions(rules, pos, viewer, turn), groups = new Map<string, EffectGroup & { owner: number; kind: keyof typeof EFFECT_NAME }>();
  boardStates(rules, pos).forEach((state, i) => {
    const key = `${state.kind}:${state.owner}`;
    if (!groups.has(key)) groups.set(key, { key, owner: state.owner, kind: state.kind, summary: '', details: [] });
    groups.get(key)!.details.push(lines[i]);
  });
  const out: EffectGroup[] = [...groups.values()].map(({ key, owner, kind, details }) => {
    const n = new Set(details.flatMap(d => d.squares)).size;
    return { key, summary: `${owner === viewer ? 'You' : 'Computer'}: ${EFFECT_NAME[kind]} ${kind === 'freeze' ? 'stops' : 'protects'} ${n} ${n === 1 ? 'piece' : 'pieces'}.`, details };
  });
  return out;
}
/** Each check in the position, for either king, with its attacker and king squares. `mine`: the viewer's king is attacked. */
export function checkLines(rules: GameRules, pos: Position, viewer: Color = 0): { mine: boolean; lines: string[] } {
  const at = (sq: number) => `${colorOf(pos.board[sq]) === viewer ? 'your' : 'the computer’s'} ${nameOf(pos.board[sq])} on ${sqName(sq)}`;
  const lines = ([viewer, viewer ^ 1] as Color[]).flatMap(side => rules.inCheck({ ...pos, turn: side }) ? checkersOf(rules, { ...pos, turn: side }).map(c => `Check: ${at(c.sq)} attacks ${at(c.king)}.`) : []);
  return { mine: rules.inCheck({ ...pos, turn: viewer }), lines };
}
const passive: Partial<Record<string, { types: number[]; line: string }>> = {
  Mercy: { types: [K], line: 'this King steps up to two squares.' },
  DeathTouch: { types: [K], line: 'this King captures without leaving its square.' },
  Darkness: { types: [P], line: 'this Pawn steps diagonally too, but captures only straight ahead.' },
  March: { types: [P], line: 'this Pawn can move two squares on a clear file.' },
  Leap: { types: [R, B, Q], line: 'this piece can jump over its own pawns.' },
};
/** The lines for one selected or inspected piece: each effect on its square, and an always-on power that changes how it moves. */
export function selectionLines(rules: GameRules, pos: Position, square: number, turn: Color = pos.turn, viewer: Color = 0): string[] {
  const code = pos.board[square];
  if (!code) return [];
  const lines = boardStates(rules, pos).flatMap((state, i) => state.sq === square ? [stateDescriptions(rules, pos, viewer, turn)[i].line] : []);
  const side = colorOf(code) as Color, power = rules.rules.kings[side]?.power, rule = power && passive[power];
  if (power && rule && rule.types.includes(typeOf(code)) && !usesAllowed(power, rules.rules)) lines.push(`${side === viewer ? 'Your' : 'The computer’s'} ${POWER_NAME[power]}: ${rule.line}`);
  return lines;
}
/** The next step of an armed power or card, from its legal moves: an actor first, or one target square. */
export function armedStep(moves: readonly Move[], pos: Position, actor: number | null, viewer: Color = 0): string {
  const direct = (m: Move) => m.from === m.to && !m.captures.length && !m.pass;
  if (actor != null || !moves.length || moves.every(direct)) return text.armed;
  const sides = new Set(moves.filter(m => !direct(m)).map(m => colorOf(pos.board[m.from])));
  return sides.size > 1 ? readingText.pickAny : sides.has(viewer) ? readingText.pickOwn : readingText.pickEnemy;
}
export const cancelLine = (kind: 'piece' | 'power' | 'card') => kind === 'card' ? readingText.cancelCard : readingText.cancelPower;
/** After a free action (a mark that does not end the turn): what is possible next. */
export function freeLine(action: string, canFinish: boolean, canMove: boolean): string {
  if (!canFinish) return readingText.mustMove;
  return canMove ? `Move a piece, or end with ${action}.` : `Select End turn to end with ${action}.`;
}
/** The computer's power, in the third person. The copy table's lines speak to the owner. */
export const opponentLines: Partial<Record<PowerName, string>> = {
  Freeze: 'The computer can stop an enemy, not the king; it stays able to attack.', IceWall: 'The computer can protect a piece, not the king; a push still works.',
  Strike: 'The computer can move a piece like a queen; no pawn, king or capture.', Haste: 'The computer can move one piece up to twice; neither move captures.',
  Flight: 'The computer can move to an empty square in its half; no king.', Sacrifice: 'The computer can replace a pawn with a lost piece; no pawn, Guard or king.',
  March: 'The computer’s pawns can move two squares from any rank; the path stays clear.', Leap: 'The computer’s Rook, Bishop or Queen can jump own pawns, not other pieces.',
  HolyLight: 'The computer protects pieces beside the king, not on its diagonals.', Mercy: 'The computer’s king jumps; its shelter stops captures except by pawns. The king captures only an adjacent pawn or Guard.',
  DeathTouch: 'The computer’s king can capture beside it or two ahead or back; these captures never move the king.', Darkness: 'The computer’s pawns step diagonally too, but capture only straight ahead.',
};
/** A short label for one choice of several actions at one square. */
export function choiceLabel(before: Position, move: Move, card = false): string {
  if (move.promo) return pieces[move.promo].name;
  if (move.drop) return pieces[move.drop].name;
  if (move.via) return spentName(move);
  return sentence(before, move, false, card);
}
/** The prompt above a choice of several actions at one square. */
export function choicePrompt(moves: readonly Move[]): string {
  if (moves.some(m => m.shove) && moves.some(m => !m.shove)) return readingText.capturePush;
  if (moves.every(m => m.drop)) return readingText.returns;
  if (moves.every(m => m.promo)) return readingText.newPiece;
  if (moves.every(m => m.via)) return readingText.mirror;
  return text.choiceFirst;
}

// Stage "readingb": the new labels of the B reading area (runs/review/reading-lab/design.md, marked "new" there).
export const readingBText = { rivalCards: 'Computer’s cards', used: 'Used', notNow: 'Not now', computerTurn: 'Computer’s turn' };

/** The shared New game panel (owner playtest decisions 88 to 93). */
export const panelText = {
  opponent: 'Opponent', player: 'Player', options: 'Game options', pieces: 'Pieces', powers: 'With powers', cards: 'With cards',
  allPieces: 'All pieces', pool: 'Piece pool', poolLock: 'Keep at least 7 pieces in the pool. Add a piece to unlock a box.',
  arrangement: 'Starting arrangement', random: 'Random', manual: 'Manual', manualLine: 'Arrange your pieces on the board before the first move.',
  yourKing: 'Your king', power: 'King power', unavailable: "With cards, this king's powers come as cards.",
  changedKing: (from: string, to: string) => `With cards, ${to} replaces ${from}. Turn cards off to restore it.`,
  cardLine: (names: readonly string[]) => names.length === 4 ? `Your 4 cards: ${names.slice(0, 3).join(', ')} and ${names[3]}.` : 'Randomized 4 cards hand.',
  needFour: 'You must select at least 4 cards', use: (name: string) => `Use ${name}`,
  send: 'Send link', byName: 'Invite by name', back: 'Back', closeRule: 'Back to cards', loading: 'Opening online play…', onlineFailed: 'Online play cannot load. Try again.',
} as const;
/** The same board step for a solo game and each online seat (owner playtest 90). */
export const arrangeText = {
  title: 'Arrange your back rank', instruction: 'Tap two pieces to swap.',
  keys: 'Arrows move along your back rank. Enter or Space picks and swaps.',
  ready: 'Ready', confirming: 'Confirming your choice…', legal: 'Select Ready to start.', wait: 'Ready. Wait for the other player.',
  choose: 'Choose a piece on your back rank.', selected: 'Choose a second piece.',
};
