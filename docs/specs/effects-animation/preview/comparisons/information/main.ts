import '/src/style.css';
import '/src/ui/table.css';
import './style.css';
import { PaintedView } from '/src/render/PaintedView';
import { GameRules } from '/src/game-rules';
import { readText, pieceGuide, pieceStates, guideTypes, whyNot } from '/src/read';
import { contextLine } from '/src/context-line';
import { marksModel } from '/src/marks-model';
import { A, K, parseSq, sqName, typeOf, colorOf, NAMES, type Position } from '/src/rules/engine';
import { POWERS_BALANCED } from '/src/rules/rules';
import { powerText } from '/src/powers-ui';
import { turnOf, turnLine } from '/src/turn';

const $ = (id: string) => document.getElementById(id)!;
type Variant = 'current' | 'proposed';
type Sample = 'pawn' | 'archer' | 'frozen' | 'mercy' | 'staged';
let variant: Variant = 'current', sample: Sample = 'pawn', ready = false;
let context: GameRules, pos: Position, selected: number | null, staged = false;
let initial: Position, coords = true, cursor = parseSq('e2');
let turnWords = '', rawRead = '', currentWords = '', complete = '', stateWords = '';
const view = new PaintedView($('board'), { floor: null, webInk: true });
view.setPace('off');
view.canDrag = () => false;
view.onLoadError = error => { $('loading').textContent = `Pieces could not load: ${String(error)}`; };

function selectSample(id: Sample) {
  if (!['pawn', 'archer', 'frozen', 'mercy', 'staged'].includes(id)) throw new Error(`Unknown sample: ${id}`);
  sample = id; staged = id === 'staged';
  context = new GameRules(id === 'mercy' ? { ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'Mercy' }, null] } : id === 'frozen' ? { hands: [['Freeze'], ['Freeze']], markFree: false } : {});
  pos = context.fromFen(id === 'archer' ? '7k/8/8/2p5/2Pp4/2A5/8/K7 w - - 0 1'
    : id === 'frozen' ? '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1'
    : id === 'mercy' ? '3r3k/8/8/8/2p5/3N4/8/4K3 w - - 0 1'
    : 'rmnqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RMAQKBNR w - - 0 1');
  initial = structuredClone(pos);
  const action = id === 'frozen' ? '!F:d5' : id === 'mercy' ? 'Ke1-e2' : staged ? 'e2-e4' : '';
  if (action) {
    const move = context.legalMoves(pos).find(m => context.toLan(pos, m) === action);
    if (!move) throw new Error(`Sample action is not legal: ${action}`);
    pos = context.makeMove(pos, move);
  }
  selected = id === 'pawn' ? parseSq('e2') : id === 'archer' ? parseSq('c3') : id === 'frozen' ? parseSq('d5') : id === 'mercy' ? parseSq('d3') : null;
  cursor = selected ?? parseSq('e4');
  ($('sample') as HTMLSelectElement).value = id;
  view.setRules(context); view.sync(pos); render();
}

function reading() {
  if (selected == null || !pos.board[selected]) return { title: '', note: '' };
  const code = pos.board[selected];
  rawRead = readText(context, pos, selected);
  const [line = '', states = ''] = rawRead.split('\n');
  // Match src/ui/table.ts readPiece exactly. Current keeps its short rule note.
  return { title: `${colorOf(code) ? 'Black' : 'White'} ${context.nameOf(typeOf(code))}.${states ? ` ${states}.` : ''}`, note: line.split(' · ')[1] ?? '' };
}
function render() {
  rawRead = ''; complete = ''; stateWords = '';
  const read = reading();
  const game = { history: staged ? [{ pos: initial }] : [], pos, status: context.status(pos), legal: context.legalMoves(pos), inCheck: context.inCheck(pos) };
  const turn = turnOf(game, 0);
  $('strip-me').classList.toggle('is-turn', turn.activeSide === 0);
  $('strip-them').classList.toggle('is-turn', turn.activeSide === 1);
  turnWords = turnLine(game, turn, 'device');
  const line = contextLine({ voice: pos.turn ? 'Black' : 'White', selected: read.title, readNote: read.note, waiting: turn.waits, turnLine: turnWords });
  currentWords = [line.line, line.note].filter(Boolean).join('\n');
  $('context-text').replaceChildren(...[line.line, line.note].filter(Boolean).map(words => { const row = document.createElement('span'); row.textContent = words; return row; }));
  $('context-text').dataset.rank = line.rank;
  $('all-rules').hidden = selected == null;
  $('selection-actions').hidden = selected == null;
  $('piece-reading').hidden = variant !== 'proposed' || selected == null;
  $('context-line').hidden = variant === 'proposed';
  if (selected != null && pos.board[selected]) {
    const code = pos.board[selected], guide = pieceGuide(context, typeOf(code));
    const name = context.nameOf(typeOf(code));
    $('piece-name').textContent = `${colorOf(code) ? 'Black' : 'White'} ${name[0].toUpperCase() + name.slice(1)}`;
    const power = typeOf(code) === K ? context.rules.kings[colorOf(code)]?.power : undefined;
    const movement = power ? powerText(power, context.rules, true) + '.' : [guide.moves, guide.captures].filter(Boolean).join(' ');
    const special = power ? '' : guide.special;
    $('piece-movement').textContent = movement;
    $('piece-special').textContent = special;
    $('piece-special').hidden = !special;
    stateWords = pieceStates(context, pos, selected).includes('Frozen') ? whyNot(context, pos, selected, selected) : '';
    if (sample === 'mercy' && selected === parseSq('d3')) stateWords = `Protected by Mercy. ${whyNot(context, pos, parseSq('d8'), selected)}`;
    $('piece-state').textContent = stateWords; $('piece-state').hidden = !stateWords;
    complete = [movement, special].filter(Boolean).join(' ');
  }
  $('turn-guidance').hidden = variant !== 'proposed';
  const moves = selected == null ? [] : context.legalMoves(pos).filter(m => m.from === selected);
  let instruction = turnWords || line.line;
  if (selected != null && !turnWords) {
    if (stateWords.startsWith('Frozen') || colorOf(pos.board[selected]) !== pos.turn) instruction = `${pos.turn ? 'Black' : 'White'} to move.`;
    else if (!moves.length) instruction = `${context.theName(typeOf(pos.board[selected]), 'This')} has no legal move.`;
    else instruction = typeOf(pos.board[selected]) === A ? 'Select a marked enemy to shoot without moving, or a marked empty square to move.' : 'Select a marked square to move or take.';
  }
  $('turn-instruction').textContent = instruction;
  $('end-turn').setAttribute('aria-disabled', String(!turn.ready));
  $('end-turn').className = turn.ready ? 'primary' : '';
  $('undo').setAttribute('aria-disabled', String(!staged));
  document.body.classList.toggle('turn-ready', turn.ready);
  document.body.dataset.variant = variant;
  $('last-move').textContent = sample === 'staged' && staged ? 'White pawn moved from e2 to e4.' : '';
  view.highlight({ selected, ...marksModel(selected == null || turn.waits ? [] : context.legalMoves(pos).filter(m => m.from === selected)) });
  document.querySelectorAll<HTMLButtonElement>('.variant-controls button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.variant === variant)));
}
function setVariant(next: Variant) {
  if (next !== 'current' && next !== 'proposed') throw new Error(`Unknown variant: ${next}`);
  variant = next; render();
}

const rulesDialog = $('rules') as HTMLDialogElement;
let ruleOpener: HTMLElement | null = null;
function openRules(opener: HTMLElement) {
  ruleOpener = opener;
  const content = $('rule-content'); content.replaceChildren();
  for (const t of guideTypes(pos)) {
    const guide = pieceGuide(context, t), article = document.createElement('article');
    article.className = 'rule-entry'; article.dataset.piece = NAMES[t]; article.tabIndex = -1;
    const h = document.createElement('h3'), name = context.nameOf(t); h.textContent = name[0].toUpperCase() + name.slice(1); article.append(h);
    for (const words of [guide.moves, guide.captures, guide.special].filter(Boolean)) { const p = document.createElement('p'); p.textContent = words; article.append(p); }
    content.append(article);
  }
  if (sample === 'mercy' || sample === 'frozen') {
    const power = sample === 'mercy' ? 'Mercy' : 'Freeze', article = document.createElement('article');
    article.className = 'rule-entry'; article.dataset.power = power; article.tabIndex = -1;
    const h = document.createElement('h3'); h.textContent = power;
    const p = document.createElement('p'); p.textContent = powerText(power, context.rules, true) + '.'; article.append(h, p); content.append(article);
  }
  rulesDialog.showModal();
  const mercyRule = stateWords.startsWith('Protected by Mercy') || (selected != null && typeOf(pos.board[selected]) === K && colorOf(pos.board[selected]) === 0 && sample === 'mercy');
  const target = content.querySelector<HTMLElement>(mercyRule ? '[data-power="Mercy"]' : selected == null ? '.rule-entry' : `[data-piece="${NAMES[typeOf(pos.board[selected])]}"]`)!;
  target.focus(); target.scrollIntoView({ block: 'center' });
}
$('all-rules').onclick = e => openRules(e.currentTarget as HTMLElement);
$('piece-rules').onclick = e => openRules(e.currentTarget as HTMLElement);
$('rules-close').onclick = () => rulesDialog.close();
rulesDialog.addEventListener('close', () => ruleOpener?.focus());
document.querySelectorAll<HTMLButtonElement>('.variant-controls button').forEach(b => b.onclick = () => setVariant(b.dataset.variant as Variant));
$('sample').onchange = e => selectSample((e.currentTarget as HTMLSelectElement).value as Sample);
$('end-turn').onclick = () => { if ($('end-turn').getAttribute('aria-disabled') === 'true') return; staged = false; selected = null; render(); };
$('undo').onclick = () => { if (!staged) return; pos = structuredClone(initial); staged = false; selected = parseSq('e2'); view.sync(pos); render(); };
view.onSquareClick = sq => { if (!pos.board[sq] || staged) return; selected = sq; cursor = sq; render(); };
$('board').addEventListener('keydown', e => {
  const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: 8, ArrowDown: -8 }[e.key];
  if (delta != null) { e.preventDefault(); cursor = Math.max(0, Math.min(63, cursor + delta)); view.setPreview(cursor); }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); view.onSquareClick(cursor, false); }
});
const utility = $('utility') as HTMLDialogElement;
$('menu-btn').onclick = () => {
  $('utility-title').textContent = 'Board settings'; $('utility-content').replaceChildren();
  const label = document.createElement('label'), input = document.createElement('input');
  input.type = 'checkbox'; input.checked = coords; input.onchange = () => { coords = input.checked; view.setCoords(coords); };
  label.append('Coordinates', input); $('utility-content').append(label); utility.showModal();
};
$('moves-line').onclick = () => { $('utility-title').textContent = 'Moves'; $('utility-content').textContent = staged ? '1. e2-e4 · staged' : 'No moves in this sample.'; utility.showModal(); };
function rect(id: string) { const r = $(id).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; }
function getState() {
  return { variant, sample, selected: selected == null ? null : sqName(selected), board: Array.from(pos.board), marks: pos.marks, turn: pos.turn, staged, coords, pace: 'off', rawRead, currentText: currentWords, completeRuleText: complete, stateText: stateWords, turnText: turnWords, displayedText: variant === 'current' ? $('context-text').innerText : [$('piece-reading').hidden ? '' : $('piece-reading').innerText, $('turn-instruction').innerText].join('\n'), layout: { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, context: rect('context-text'), reading: rect('piece-reading'), endTurn: rect('end-turn'), instruction: rect('turn-instruction'), currentClamp: getComputedStyle($('context-text')).webkitLineClamp, currentScrollHeight: $('context-text').scrollHeight, currentClientHeight: $('context-text').clientHeight } };
}
const api = { get ready() { return ready; }, getState, setVariant, setSample: selectSample, samples: ['pawn', 'archer', 'frozen', 'mercy', 'staged'] };
Object.assign(window, { comparisonStudy: api });
selectSample('pawn');
view.ready().then(async () => { await document.fonts.ready; $('loading').hidden = true; ready = true; });
