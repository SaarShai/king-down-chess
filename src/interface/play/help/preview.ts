import { RELEASED_CARDS } from '../../../content/cards';
import { Game } from '../../../game';
import { BUILT, N, P, POWERS_BALANCED, colorOf, parseSq, sqName, typeOf, type PieceType } from '../../../rules/engine';
import { pieces } from '../texts';
import { DraftTurn } from '../turn';
import { button } from '../../ui/kit.js';
import '../../ui/tokens.css';
import '../../ui/components.css';
import { helpTopic, type HelpSubject } from './content';
import { figure } from './diagram';
import { createGameHelp } from './panel';
import { refusalReason } from './reasons';

const query = new URLSearchParams(location.search), promotion = query.get('at') === 'promotion';
const game = new Game('RNBQKBNR', POWERS_BALANCED);
game.load(game.context.fromFen(promotion ? 'k4r2/6P1/8/8/8/8/8/K7 w - - 0 5'
  : 'lmab1mgk/ppp3pp/2n1p3/3pN3/3PP3/8/PPP2PPP/LMAB1MGK w - - 0 5'));
const draft = new DraftTurn(game);
const board = document.querySelector<HTMLElement>('#board')!;
const narrator = document.querySelector<HTMLElement>('.narrator')!;
const count = (key: string) => { board.dataset[key] = String(Number(board.dataset[key] ?? 0) + 1); };
const help = createGameHelp({
  board,
  effects: { onSheetOpen: () => count('opened'), onSheetClose: () => count('closed'), onRefusedTap: () => count('refused') },
});
narrator.append(help.infoButton);
const shown = promotion ? parseSq('g7') : parseSq('c6');
const showTopic = (subject: HelpSubject, side = promotion ? 0 : 1) => {
  const color = side ? 1 : 0;
  const topic = helpTopic(subject, game.context, color);
  document.querySelector('#name')!.textContent = topic.name;
  document.querySelector('#line')!.textContent = topic.line;
  help.setTopic(subject, game.context, color);
};
showTopic({ kind: 'piece', type: promotion ? P : N });

const select = document.querySelector<HTMLSelectElement>('#topics')!;
const topics: HelpSubject[] = [
  ...Object.keys(pieces).map(type => ({ kind: 'piece' as const, type: Number(type) as PieceType })),
  ...RELEASED_CARDS.map(({ id }) => ({ kind: 'card' as const, id })),
  ...BUILT.map(id => ({ kind: 'power' as const, id })),
  { kind: 'frozen', type: N }, { kind: 'turn' },
];
for (const [index, subject] of topics.entries()) {
  select.add(new Option(`${subject.kind} · ${helpTopic(subject).name}`, String(index)));
}
const open = document.querySelector<HTMLButtonElement>('#open')!;
open.addEventListener('click', () => help.openRule(topics[select.selectedIndex], open, game.context));
if (query.has('catalog')) document.querySelector<HTMLElement>('.catalog')!.hidden = false;
let source: number | null = null;
const moves = draft.at(shown, parseSq('g8'));
for (let row = 7; row >= 0; row--) for (let col = 0; col < 8; col++) {
  const sq = row * 8 + col, code = game.pos.board[sq];
  const cell = sq === shown || (promotion && sq === parseSq('g8')) ? button(sqName(sq)) : document.createElement('span');
  if (cell instanceof HTMLButtonElement) {
    cell.setAttribute('aria-label', `${code ? pieces[typeOf(code)].name + ' ' : ''}${sqName(sq)}`);
    cell.replaceChildren();
    cell.addEventListener('click', () => {
      help.close();
      if (sq === shown) {
        source = sq;
        showTopic({ kind: 'piece', type: typeOf(code) }, colorOf(code));
        if (promotion) {
          cell.dataset.mark = 'actor';
          board.querySelector<HTMLElement>('[data-square="g8"]')!.dataset.mark = 'target';
          board.querySelector<HTMLElement>('[data-square="f8"]')!.dataset.mark = 'capture';
        }
      } else if (source === shown) {
        help.openPromotion(moves, cell, 0, move => {
          board.dataset.chosen = pieces[move.promo!].name;
          cell.replaceChildren(figure(move.promo!, 0));
          board.querySelector('[data-square="g7"] img')?.remove();
        }, () => count('cancelled'));
      }
    });
  }
  cell.className = 'square';
  cell.dataset.square = sqName(sq);
  if (code) cell.append(figure(typeOf(code), colorOf(code)));
  for (const [value, cls] of [[col === 0 ? String(row + 1) : '', 'rank'], [row === 0 ? sqName(sq)[0] : '', 'file']]) {
    if (!value) continue;
    const coordinate = document.createElement('small'); coordinate.className = cls; coordinate.textContent = value; cell.append(coordinate);
  }
  board.append(cell);
}
const hand = document.querySelector('.hand')!;
const emblem = document.createElement('span');
emblem.className = 'emblem';
emblem.innerHTML = '<img src="/ui/emblems/spirit.webp" alt=""><b>Mercy</b>Always on';
hand.append(emblem);
if (promotion) document.querySelector('.opponent .power')?.remove();
else for (const id of ['Flight', 'Firewall', 'Haste', 'Freeze']) {
  const data = RELEASED_CARDS.find(card => card.id === id)!;
  const card = document.createElement('span'), art = document.createElement('img');
  card.className = 'card'; art.src = `/${data.art}`; art.alt = '';
  card.append(art, data.name); hand.append(card);
}
document.querySelector<HTMLButtonElement>('#end')!.addEventListener('click', event => {
  const refused = refusalReason({ draft, player: 0 }, { kind: 'end' });
  if (refused) help.showRefusal(refused, event.currentTarget as HTMLElement);
});
if (query.has('hints')) {
  help.startHints(true);
  const hints = ['piece', 'ring', 'end', 'card', 'info'] as const;
  const anchors = [board.querySelector('[data-square="c6"]'), board.querySelector('[data-square="e5"]'), document.querySelector('#end'), hand.querySelector('.card'), help.infoButton];
  let index = 0;
  document.querySelector('#undo')!.addEventListener('click', () => {
    const anchor = anchors[index % hints.length];
    if (anchor instanceof HTMLElement) help.updateHint(hints[index % hints.length], anchor);
    index++;
  });
}
