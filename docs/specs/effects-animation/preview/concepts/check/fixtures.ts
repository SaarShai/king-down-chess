import { fixtures } from '../../signals/fixtures';
import { checkersOf } from '../../../../../../src/move-text';
import { parseSq, type Color } from '../../../../../../src/rules/engine';

const rules = fixtures.check.rules;
const originalCause = checkersOf(rules, fixtures.check.before);
function build(id: string, title: string, fen: string) {
  const before = rules.fromFen(fen);
  const bothSafe = (pos: typeof before) => ([0, 1] as Color[]).every(turn => !rules.inCheck({ ...pos, turn }));
  if (!bothSafe(before)) throw new Error(`${id}: check entry starts in check`);
  const entry = rules.legalMoves(before).find(m => rules.toLan(before, m) === 'Rd3-e3');
  if (!entry || entry.captures.length) throw new Error(`${id}: no legal quiet check entry`);
  const checked = rules.makeMove(before, entry);
  const checkers = checkersOf(rules, checked);
  if (!rules.inCheck(checked) || JSON.stringify(checkers) !== JSON.stringify(originalCause)) throw new Error(`${id}: wrong check cause`);
  const evasion = rules.legalMoves(checked).find(m => rules.toLan(checked, m) === 'Ke1-f1');
  if (!evasion || evasion.captures.length) throw new Error(`${id}: no legal quiet evasion`);
  const resolved = rules.makeMove(checked, evasion);
  if (!bothSafe(resolved) || rules.status(resolved) !== 'playing') throw new Error(`${id}: invalid resolved state`);
  if (resolved.board[parseSq('f1')] !== checked.board[parseSq('e1')] || resolved.board[parseSq('e1')]) throw new Error(`${id}: king identity changed`);
  return { id, title, rules, before, checked, resolved, checkers, entry, evasion };
}
export const samples = [
  build('dense', 'Dense board', 'rnbq3k/pppp1ppp/5n2/8/8/3r4/PPPP1PPP/RNBQK1NR b - - 0 12'),
  build('open', 'Open board', '7k/7p/8/8/8/3r4/P7/4K2R b - - 0 12'),
];
