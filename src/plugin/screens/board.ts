import { fromFen, toLan } from '../../rules/setup';
import { colorOf, findKing, inCheck, legalMoves, moveNumber, nameOf, PLAIN_KINGS, RULES, setRules, sqName, typeOf, type Color, type Move, type Position, type PowerName } from '../../rules/engine';
import { cardText, coinState, coinWords, needsArming, offered, POWER_TAG, powerText } from '../../powers-ui';
import { checkCause, checkersOf, describeMove, threatsIn } from '../../move-text';
import { marksModel, railsOf } from '../../marks-model';
import { readText, reachOf } from '../../read';
import { contextLine } from '../../context-line';
import type { PlayerRecord, View } from '../../match/protocol';
import { ending } from '../ending';
import { board, highlight } from '../board-view';
import { art } from '../art';
import { client, memory, navigate } from '../app';
import { cardCoins, stripLine } from './board-model';
import './board.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
type Choice = { lan: string; move: Move };
let view: View | undefined, pos: Position | undefined;
export const boardGame = () => view;
const cardName = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2');
const portraitPath = (side: Color) => `ui/kings/${(RULES.kings[side]?.king ?? PLAIN_KINGS[side]).toLowerCase()}${side ? '-b' : ''}.webp`;
let sheet: HTMLDialogElement, scrim: HTMLDivElement;
export function closeBoardSheet() {
  if (!sheet) return;
  for (const id of ['choices', 'reload', 'computer', 'invite', 'invitation']) $('board-park').append($(id));
  sheet.close(); scrim.hidden = true; client.state.sheet = undefined; client.save();
}
export function boardSheet(title: string, ...nodes: HTMLElement[]) {
  if (!sheet) {
    scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.hidden = true;
    sheet = document.createElement('dialog'); sheet.id = 'board-sheet'; sheet.setAttribute('aria-labelledby', 'board-sheet-title'); sheet.className = 'over-sheet';
    $('app-frame').append(scrim, sheet); scrim.onclick = closeBoardSheet;
  }
  closeBoardSheet();
  sheet.innerHTML = '<header class="sheet-head"><h2 id="board-sheet-title"></h2><button aria-label="Close">×</button></header><div class="sheet-body"></div>';
  sheet.querySelector('h2')!.textContent = title; sheet.querySelector('button')!.onclick = closeBoardSheet;
  sheet.querySelector('.sheet-body')!.append(...nodes); scrim.hidden = false; sheet.show();
  client.state.sheet = 'board-sheet'; client.save();
}
const text = (words: string) => { const p = document.createElement('p'); p.textContent = words; return p; };
const button = (words: string, click: () => void) => { const b = document.createElement('button'); b.textContent = words; b.onclick = click; return b; };
export function boardScreen(call: (name: string, args: Record<string, unknown>, retain?: boolean) => Promise<unknown>, blocked: () => boolean) {
  let armed: PowerName | undefined;
  let selected: number | undefined, inspected: number | undefined, moves: Choice[] = [], cursor = 0;
  let ownRating: PlayerRecord['rating'] | undefined, profileRead = false;
  const active = () => ['board', 'end'].includes(client.state.screen);
  const rules = () => setRules(view!.rules!);
  const tag = () => armed ? POWER_TAG[armed] ?? null : null;
  const named = () => moves.filter(({move}) => ['freeze','ward','sacrifice'].includes(move.power ?? '') && move.power === tag());
  function choose(lan: string) {
    if (!view || blocked() || view.action !== 'ready') return;
    closeBoardSheet();
    void call('kingdown_move', { game_id: view.game_id, command_id: crypto.randomUUID(), expected_revision: view.revision, lan }, true);
  }
  function choices(list: Choice[]) {
    $('move-hint').textContent = !list.length ? '' : list.every(({move}) => needsArming(move)) ? 'Choose a move below.' : 'Tap a marked square to move, or choose a move below.';
    $('choices').replaceChildren(...list.map(({lan, move}) => { const b = button(describeMove(pos!, move), () => choose(lan)); b.title = lan; return b; }));
  }
  function select(square: number, submit = true) {
    if (!view || !pos || blocked()) return;
    rules(); $('error').textContent = '';
    const targets = submit && view.action === 'ready' ? named().filter(({move}) => move.to === square || move.from === square) : [];
    if (targets.length === 1) return choose(targets[0].lan);
    if (targets.length > 1) { choices(targets); boardSheet('Choose a move', $('choices')); return; }
    if (submit && selected === square) { selected = inspected = undefined; choices([]); refresh(); return; }
    const options = !submit || selected === undefined || view.action !== 'ready' ? [] : moves.filter(({move}) => move.from === selected && offered(move, tag()) && ((move.to !== move.from && move.to === square) || move.captures.includes(square) || move.shove?.from === square));
    const ordinary = options.filter(({move}) => !move.power);
    if (ordinary.length === 1) return choose(ordinary[0].lan);
    if (options.length === 1) return choose(options[0].lan);
    if (options.length > 1) { choices(options); boardSheet('Choose a move', $('choices')); return; }
    if (!pos.board[square]) { selected = inspected = undefined; choices(named()); }
    else if (view.action === 'ready' && colorOf(pos.board[square]) === view.seat) { selected = square; inspected = undefined; choices(moves.filter(({move}) => move.from === square && (!armed || offered(move, tag())))); }
    else { inspected = square; }
    refresh();
  }
  function bindBoard() {
    $('game-table').prepend($('board'));
    board.onSquareClick = square => select(square); board.onDragSelect = square => select(square, false);
    $('board').tabIndex = 0;
    $('board').onkeydown = event => {
      if (blocked()) return;
      const delta = ({ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,1], ArrowDown:[0,-1]} as Record<string,number[]>)[event.key];
      if (delta) { event.preventDefault(); const d = view?.seat === 1 ? -1 : 1; cursor = Math.max(0, Math.min(7, cursor % 8 + delta[0] * d)) + 8 * Math.max(0, Math.min(7, Math.floor(cursor / 8) + delta[1] * d)); board.setPreview(cursor); $('board').setAttribute('aria-label', `Chess board, ${sqName(cursor)}. Enter selects a square.`); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(cursor); }
      else if (event.key === 'Escape') { armed = undefined; selected = inspected = undefined; closeBoardSheet(); choices([]); refresh(); }
    };
  }
  function coinRead(side: Color, index?: number) {
    if (!view || !pos || blocked()) return;
    rules(); $('error').textContent = '';
    if (index !== undefined) {
      const card = RULES.hands[side][index], image = document.createElement('img'), face = art(`ui/cards/${card.toLowerCase()}.webp`);
      image.className = 'card-read-art'; image.src = face ?? art('ui/cards/back.webp'); image.alt = '';
      boardSheet(cardName(card), image, text(cardText(card)));
    } else {
      const coin = coinState(pos, side, RULES, [], side === view.seat && !!armed, moves.map(c => c.move), view.action === 'ready' ? view.seat : null);
      if (!coin) return;
      const nodes: HTMLElement[] = [text(coinWords(coin, pos)), text(powerText(coin.power, RULES, true))];
      if (side === view.seat && ['ready','armed'].includes(coin.state) && POWER_TAG[coin.power]) nodes.push(button('Use', () => {
        if (blocked() || view?.action !== 'ready') return;
        armed = coin.power; selected = inspected = undefined; closeBoardSheet(); choices(named()); refresh();
      }));
      boardSheet(coin.king + ' King', ...nodes);
    }
  }
  function strips() {
    if (!view || !pos) return;
    rules();
    for (const side of [0,1] as const) {
      const mine = side === view.seat, strip = $(mine ? 'strip-me' : 'strip-them');
      strip.classList.toggle('is-turn', view.status === 'playing' && view.turn === side);
      strip.innerHTML = '<div class="coin-row"><span class="portrait"><img alt=""></span></div><span class="player-name"><b></b><small></small></span>';
      strip.querySelector('img')!.src = art(portraitPath(side));
      strip.querySelector('b')!.textContent = mine ? memory.me?.handle ?? 'You' : view.opponent?.computer ? 'Computer' : view.opponent?.deleted ? 'Deleted player' : view.opponent?.handle ?? 'Opponent';
      strip.querySelector('small')!.textContent = stripLine(side, mine ? ownRating : view.opponent?.rating, !mine && view.opponent?.computer ? view.level : undefined);
      const row = strip.querySelector('.coin-row')!, coin = coinState(pos, side, RULES, [], mine && !!armed, mine ? moves.map(c => c.move) : undefined, !blocked() && view.action === 'ready' ? view.seat : null);
      if (coin) {
        const b = button('', () => coinRead(side)); b.className = 'coin'; b.id = `power-${side ? 'b' : 'w'}`; b.dataset.state = coin.state; if (coin.state !== 'always') b.setAttribute('aria-pressed', String(coin.state === 'armed')); b.setAttribute('aria-label', coinWords(coin, pos).replace(' · ', ', '));
        const image = document.createElement('img'); image.src = art(`ui/emblems/${coin.king.toLowerCase()}.webp`); image.alt = ''; b.append(image);
        if (coin.total !== null && coin.total > 0) { const n = document.createElement('span'); n.className = 'notches'; n.setAttribute('aria-hidden','true'); for (let i=0;i<coin.total;i++) { const notch = document.createElement('span'); notch.className = 'notch' + (i < coin.spent ? ' is-spent' : ''); n.append(notch); } b.append(n); }
        row.append(b);
      }
      for (const [index, card] of cardCoins(pos, side, RULES.hands[side], []).entries()) {
        const b = button('', () => coinRead(side, index)), image = document.createElement('img'), face = art(`ui/cards/${card.card.toLowerCase()}.webp`);
        b.className = 'coin card-coin'; b.dataset.state = card.spent ? 'used' : 'always'; b.setAttribute('aria-label', cardName(card.card) + (card.spent ? ', spent' : ''));
        image.src = face ?? art('ui/cards/back.webp'); image.alt = ''; b.append(image);
        if (!face) { const word = document.createElement('span'); word.className = 'cc-word'; word.textContent = cardName(card.card).slice(0,2); b.append(word); }
        row.append(b);
      }
    }
  }
  function refresh() {
    if (!view || !pos) return;
    rules(); const cands = selected === undefined ? [] : moves.filter(({move}) => move.from === selected && offered(move, tag())).map(c => c.move), marks = marksModel(cands);
    highlight({ ...marks, selected, read: inspected === undefined ? undefined : reachOf(pos, inspected), powers: [...new Set([...cands.filter(m => m.power && !m.pass).map(m => m.to), ...named().map(c => c.move.to)])], rails: selected === undefined ? [] : railsOf(pos.board, selected, [...marks.moves, ...marks.captures], marks.captures), check: inCheck(pos) ? findKing(pos.board, pos.turn) : null, checkers: checkersOf(pos), threats: view.status === 'playing' ? threatsIn({...pos, turn:view.seat}) : [] });
    const square = inspected ?? selected, code = square === undefined ? 0 : pos.board[square];
    const [line = '', states = ''] = square === undefined ? [] : readText(pos, square).split('\n');
    const words = code ? `${colorOf(code) ? 'Black' : 'White'} ${nameOf(typeOf(code))}.${states ? ' ' + states + '.' : ''}` : '';
    const context = contextLine({voice:'you', result:view.result ? ending(view) : '', refusal:$('error').textContent ?? '', read:inspected === undefined ? '' : words, selected:words, readNote:line.split(' · ')[1] ?? '', check:view.in_check && view.turn === view.seat, checkCause:checkCause(pos, undefined, 'link', view.seat), computer:view.turn !== view.seat, armed, armedLine:armed ? coinWords(coinState(pos,view.seat,RULES,[],true)!,pos) : ''});
    $('status').textContent = context.line; $('context-note').textContent = context.note; $('context-text').dataset.rank = context.rank;
    const actions: HTMLButtonElement[] = [];
    if (!armed && square !== undefined && code) actions.push(button('All rules', () => boardSheet('All rules', text(readText(pos!, square)))));
    if (selected !== undefined && moves.some(({move}) => move.from === selected && needsArming(move))) actions.push(button('Choose a move', () => boardSheet('Choose a move', $('choices'))));
    if (armed) actions.push(button('Cancel', () => { armed = undefined; choices([]); refresh(); }));
    $('context-actions').replaceChildren(...actions); strips();
  }
  $('reload').addEventListener('click', closeBoardSheet);
  $('board-menu').onclick = () => boardSheet('Menu', button('Choose a move', () => boardSheet('Choose a move', $('choices'))), button('Settings', () => { closeBoardSheet(); navigate('settings'); }), $('reload'), $('computer'), $('invite'), $('invitation'));
  $('moves-line').onclick = () => boardSheet('Moves', text('No moves shown yet.'));
  const observer = new MutationObserver(() => { if (active()) refresh(); });
  observer.observe($('reload'), {attributes:true, attributeFilter:['disabled']});
  observer.observe($('error'), {childList:true, characterData:true, subtree:true});
  return (next: View) => {
    if (view?.game_id === next.game_id && next.revision < view.revision) return;
    const same = view?.game_id === next.game_id;
    view = {...next, rules:next.rules ?? (same ? view?.rules : undefined), opponent:next.opponent && {...next.opponent, rating:next.rules ? next.opponent.rating : next.opponent.rating ?? (same ? view?.opponent?.rating : undefined)}};
    armed = undefined; selected = inspected = undefined; closeBoardSheet(); choices([]);
    $('game-table').dataset.empty = String(!next.fen || next.status === 'setup');
    if (!next.fen || next.status === 'setup') { pos = undefined; $('strip-me').replaceChildren(); $('strip-them').replaceChildren(); $('context-actions').replaceChildren(); $('context-note').textContent = ''; $('last-move').textContent = ''; $('status').textContent = next.result ? ending(next) : next.status === 'waiting' ? 'Waiting for your friend. Share an invitation.' : 'Choose your king and arrangement.'; $('computer').hidden = true; $('invite').hidden = next.kind !== 'friend' || next.status !== 'waiting'; return; }
    rules(); pos = fromFen(next.fen); const legal = new Set(next.legal), here = pos;
    moves = legal.size ? legalMoves(pos).map(move => ({lan:toLan(here,move),move})).filter(({lan}) => legal.has(lan)) : [];
    bindBoard(); board.sync(pos); board.flip(next.seat === 1); $('last-move').textContent = `Move ${moveNumber(pos)}.`;
    $('computer').hidden = next.kind !== 'solo' || next.status !== 'playing' || next.turn === next.seat; $('invite').hidden = true;
    refresh();
    if (!profileRead) { profileRead = true; void client.call('kingdown_profile', {}, {background:true}).then(result => { ownRating = (result._meta?.record as PlayerRecord | undefined)?.rating; if (active()) strips(); }).catch(() => {}); }
  };
}
