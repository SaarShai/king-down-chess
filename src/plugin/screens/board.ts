import { fromFen, toFen, toLan } from '../../rules/setup';
import { colorOf, findKing, inCheck, legalMoves, moveNumber, nameOf, piece, PLAIN_KINGS, RULES, setRules, sqName, typeOf, type Color, type Move, type Position, type PowerName } from '../../rules/engine';
import { cardText, coinState, coinWords, needsArming, offered, POWER_TAG, powerText } from '../../powers-ui';
import { checkCause, checkersOf, describeMove, threatsIn } from '../../move-text';
import { marksModel, railsOf } from '../../marks-model';
import { readText, reachOf } from '../../read';
import { contextLine } from '../../context-line';
import type { PlayerRecord, View } from '../../match/protocol';
import { ending } from '../ending';
import { board, highlight } from '../board-view';
import { art, symbols } from '../art';
import { pieceIcon } from '../../piece-icons';
import { client, memory, navigate } from '../app';
import { actionButtons, confirmDraw, confirmResign } from './board-actions';
import { updateEnd } from './end';
import { applyLan, boardActions, cardCoins, replayHistory, replayLans, stripLine, type BoardMove } from './board-model';
import './board.css';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
type Choice = { lan: string; move: Move };
let view: View | undefined, pos: Position | undefined;
export const boardGame = () => view;
export let rollbackBoardMove: () => Promise<void>;
let history: BoardMove[] = [], lastMove: BoardMove | undefined;
export const boardLastMove = () => lastMove;
let command: (name: string, args: Record<string, unknown>) => Promise<View | undefined>;
export const sendBoardCommand = (name: string, args: Record<string, unknown> = {}) => command(name, args);
const cardName = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2');
const portraitPath = (side: Color) => `ui/kings/${(RULES.kings[side]?.king ?? PLAIN_KINGS[side]).toLowerCase()}${side ? '-b' : ''}.webp`;
let sheet: HTMLDialogElement, scrim: HTMLDivElement, sheetFocus: HTMLElement | undefined;
export function closeBoardSheet() {
  if (!sheet) return;
  for (const id of ['choices', 'reload', 'computer', 'invite', 'invitation']) $('board-park').append($(id));
  const restore = sheet.open && sheet.contains(document.activeElement);
  if (sheet.open) document.querySelector<HTMLElement>('.page-sheet')!.inert = false;
  sheet.close(); scrim.hidden = true;
  const focus = sheetFocus?.id ? document.getElementById(sheetFocus.id) : sheetFocus;
  if (restore && focus?.isConnected) focus.focus({preventScroll:true}); client.state.sheet = undefined; client.save();
}
export function boardSheet(title: string, ...nodes: HTMLElement[]) {
  if (!sheet) {
    scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.hidden = true;
    sheet = document.createElement('dialog'); sheet.id = 'board-sheet'; sheet.setAttribute('aria-labelledby', 'board-sheet-title'); sheet.className = 'over-sheet'; sheet.setAttribute('aria-modal', 'true');
    $('app-frame').append(scrim, sheet); scrim.onclick = closeBoardSheet;
    sheet.onkeydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); closeBoardSheet(); }
      else if (event.key === 'Tab') {
        const buttons = [...sheet.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, [tabindex="0"]')], i = buttons.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && i <= 0 || !event.shiftKey && i === buttons.length - 1) { event.preventDefault(); buttons[event.shiftKey ? buttons.length - 1 : 0]?.focus({preventScroll:true}); }
      }
    };
  }
  const opener = sheet.contains(document.activeElement) ? sheetFocus : document.activeElement as HTMLElement;
  closeBoardSheet(); sheetFocus = opener;
  sheet.innerHTML = '<header class="sheet-head"><h2 id="board-sheet-title"></h2><button aria-label="Close">×</button></header><div class="sheet-body"></div>';
  sheet.querySelector('h2')!.textContent = title; sheet.querySelector('button')!.onclick = closeBoardSheet;
  sheet.querySelector('.sheet-body')!.append(...nodes); scrim.hidden = false; document.querySelector<HTMLElement>('.page-sheet')!.inert = true; sheet.show(); sheet.querySelector('button')!.focus({preventScroll:true});
  client.state.sheet = 'board-sheet'; client.save();
}
const text = (words: string) => { const p = document.createElement('p'); p.textContent = words; return p; };
const button = (words: string, click: () => void) => { const b = document.createElement('button'); b.textContent = words; b.onclick = click; return b; };
export function boardScreen(call: (name: string, args: Record<string, unknown>, retain?: boolean) => Promise<View | undefined>, networkBlocked: () => boolean) {
  let generation = 0, animating = false, optimistic: BoardMove | undefined;
  const blocked = () => networkBlocked() || animating;
  let armed: PowerName | undefined, armedCard: number | undefined;
  let selected: number | undefined, inspected: number | undefined, moves: Choice[] = [], cursor = 0;
  let computerCalls = 0, computerRunning = false, thinking = false, tornDown = false, thinkingTimer: ReturnType<typeof setTimeout> | undefined;
  let ownRating: PlayerRecord['rating'] | undefined, profileRead = false;
  let readAt = Date.now(), deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  const refused = new Set<string>();
  const active = () => ['board', 'end'].includes(client.state.screen);
  const rules = () => setRules(view!.rules!);
  command = async (name, args) => {
    if (!view || networkBlocked()) return;
    const game = view.game_id;
    // A draw reply can arrive on our turn, before the next poll.
    if (view.draw_offer !== null && view.kind !== 'solo') {
      const fresh = await call('kingdown_get', {});
      if (!fresh || fresh.game_id !== game) return;
    }
    const next = await call(name, {game_id:game, command_id:crypto.randomUUID().replaceAll('-', ''), expected_revision:view.revision, ...args}, true);
    if (!next && !client.state.pending && view?.game_id === game) {
      const message = $('error').textContent ?? '';
      if (/Abort is/.test(message) || args.choice==='offer' && /No draw offer/.test(message)) refused.add(name);
      await call('kingdown_get', {}); $('error').textContent = message; refresh();
    }
    return next;
  };
  const tag = () => armed ? POWER_TAG[armed] ?? null : null;
  const cardChoices = () => armedCard === undefined || !pos || !view ? [] : moves.filter(c => cardCoins(pos!,view!.seat,RULES.hands[view!.seat],moves.map(c=>c.move))[armedCard!].moves.includes(c.move));
  const reachable = (move: Move) => armedCard !== undefined ? cardChoices().some(c=>c.move===move) : RULES.hands[view!.seat].length ? !move.power : offered(move,tag());
  const named = () => armedCard !== undefined ? cardChoices().filter(({move}) => !move.pass && (move.from === move.to || move.drop !== undefined)) : moves.filter(({move}) => ['freeze','ward','sacrifice'].includes(move.power ?? '') && move.power === tag());
  async function computer() {
    if (tornDown || !view || client.state.screen !== 'board' || document.hidden || blocked() || computerRunning || computerCalls >= 4 || view.kind !== 'solo' || view.status !== 'playing' || view.turn === view.seat || $<HTMLDialogElement>('over').open) return;
    const game = view.game_id; computerRunning = true;
    if (computerCalls++ === 0) thinkingTimer = setTimeout(() => { if (view?.game_id === game && view.turn !== view.seat) { thinking = true; strips(); } }, 1000);
    const next = await call('kingdown_computer', {game_id:game, command_id:crypto.randomUUID().replaceAll('-', ''), expected_revision:view.revision}, true);
    if (!next && !client.state.pending && view?.game_id === game) await call('kingdown_get', {});
    computerRunning = false;
    if (!view || view.game_id !== game || view.turn === view.seat || view.status !== 'playing' || client.state.pending?.error) { clearTimeout(thinkingTimer); thinking = false; }
    if (view?.game_id === game) { strips(); void computer(); }
  }
  const scheduleComputer = () => { if (!tornDown) setTimeout(() => void computer(), 0); };
  window.addEventListener('message', event => { if (event.data?.method === 'ui/resource-teardown') { tornDown = true; clearTimeout(thinkingTimer); clearTimeout(deadlineTimer); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleComputer(); });
  function moveLine() {
    if (!pos) return;
    const nodes: HTMLElement[] = [];
    if (lastMove) {
      const code = lastMove.move.drop === undefined ? lastMove.pre.board[lastMove.move.from] : piece(lastMove.move.drop,lastMove.pre.turn), icon = pieceIcon(typeOf(code), colorOf(code)), name = /ui\/icons\/([a-z]+)\.svg/.exec(icon)?.[1];
      if (name) { const image = document.createElement('img'); image.className = 'pi'; image.alt = ''; image.src = symbols[`../../public/ui/icons/${name}.svg`][colorOf(code)]; nodes.push(image); }
    }
    const words = document.createElement('span'); words.textContent = lastMove?.words ?? `Move ${moveNumber(pos)}.`; nodes.push(words); $('last-move').replaceChildren(...nodes);
  }
  async function choose(lan: string) {
    if (!view || !pos || blocked() || view.action !== 'ready') return;
    const before = view, step = applyLan(pos, lan, view.rules!, view.legal);
    if (!step) return;
    closeBoardSheet(); armed = undefined; armedCard = undefined; selected = inspected = undefined; choices([]);
    const token = ++generation; optimistic = lastMove = step; pos = step.pos; animating = true;
    board.skip(); moveLine();
    if (step.move.drop !== undefined) board.sync(step.pos);
    void (step.move.drop === undefined ? board.animateMove(step.pre, step.move) : Promise.resolve()).then(() => { if (token === generation) board.sync(step.pos); }).finally(() => { if (token === generation) { animating = false; refresh(); scheduleComputer(); } });
    await call('kingdown_move', { game_id: before.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: before.revision, lan }, true);
  }
  rollbackBoardMove = async () => {
    if (!view) return;
    const message = $('error').textContent ?? '';
    ++generation; board.skip(); animating = false; optimistic = undefined; lastMove = history.at(-1);
    rules(); pos = fromFen(view.fen); board.sync(pos); moveLine(); refresh();
    await call('kingdown_get', {}); $('error').textContent = message; refresh();
  };
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
    const options = !submit || selected === undefined || view.action !== 'ready' ? [] : moves.filter(({move}) => move.from === selected && reachable(move) && ((move.to !== move.from && move.to === square) || move.captures.includes(square) || move.shove?.from === square));
    const ordinary = options.filter(({move}) => !move.power);
    if (ordinary.length === 1) return choose(ordinary[0].lan);
    if (options.length === 1) return choose(options[0].lan);
    if (options.length > 1) { choices(options); boardSheet('Choose a move', $('choices')); return; }
    if (!pos.board[square]) { selected = inspected = undefined; choices(named()); }
    else if (view.action === 'ready' && (colorOf(pos.board[square]) === view.seat || armedCard !== undefined && cardChoices().some(c=>c.move.from===square))) { selected = square; inspected = undefined; choices(moves.filter(({move}) => move.from === square && (armed || armedCard !== undefined || RULES.hands[view!.seat].length ? reachable(move) : true))); }
    else { inspected = square; }
    refresh();
  }
  function bindBoard() {
    document.querySelector('[data-screen="board"]')!.prepend($('game-table')); $('table-bar').hidden = false;
    $('game-table').prepend($('board'));
    board.onSquareClick = square => select(square); board.onDragSelect = square => select(square, false);
    $('board').tabIndex = 0;
    $('board').onkeydown = event => {
      if (blocked()) return;
      const delta = ({ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,1], ArrowDown:[0,-1]} as Record<string,number[]>)[event.key];
      if (delta) { event.preventDefault(); const d = view?.seat === 1 ? -1 : 1; cursor = Math.max(0, Math.min(7, cursor % 8 + delta[0] * d)) + 8 * Math.max(0, Math.min(7, Math.floor(cursor / 8) + delta[1] * d)); board.setPreview(cursor); $('board').setAttribute('aria-label', `Chess board, ${sqName(cursor)}. Enter selects a square.`); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(cursor); }
      else if (event.key === 'Escape') { armed = undefined; armedCard = undefined; selected = inspected = undefined; closeBoardSheet(); choices([]); refresh(); }
    };
  }
  function coinRead(side: Color, index?: number) {
    if (!view || !pos || blocked()) return;
    rules(); $('error').textContent = '';
    if (index !== undefined) {
      const card = RULES.hands[side][index], image = document.createElement('img'), face = art(`ui/cards/${card.toLowerCase()}.webp`);
      image.src = face ?? art('ui/cards/back.webp'); image.alt = '';
      const window = document.createElement('div'); window.className = 'cf-art'; window.append(image);
      const nodes: HTMLElement[] = [window, text(cardText(card))], coin = cardCoins(pos,side,RULES.hands[side],moves.map(c=>c.move))[index];
      if (side === view.seat && view.action === 'ready' && !coin.spent && coin.moves.length) nodes.push(button('Use', () => {
        if (blocked() || view?.action !== 'ready') return;
        armed = undefined; armedCard = index; selected = inspected = undefined; closeBoardSheet(); choices(cardChoices()); refresh();
      }));
      boardSheet(cardName(card), ...nodes);
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
      strip.querySelector('b')!.title = strip.querySelector('b')!.textContent;
      strip.querySelector('small')!.textContent = stripLine(side, mine ? ownRating : view.opponent?.rating, !mine && view.opponent?.computer ? view.level : undefined) + (!mine && thinking ? ' · thinking…' : '');
      const row = strip.querySelector('.coin-row')!, coin = coinState(pos, side, RULES, [], mine && !!armed, mine ? moves.map(c => c.move) : undefined, !blocked() && view.action === 'ready' ? view.seat : null);
      if (coin) {
        const b = button('', () => coinRead(side)); b.className = 'coin'; b.id = `power-${side ? 'b' : 'w'}`; b.dataset.state = coin.state; if (coin.state !== 'always') b.setAttribute('aria-pressed', String(coin.state === 'armed')); b.setAttribute('aria-label', coinWords(coin, pos).replace(' · ', ', '));
        const image = document.createElement('img'); image.src = art(`ui/emblems/${coin.king.toLowerCase()}.webp`); image.alt = ''; b.append(image);
        if (coin.total !== null && coin.total > 0) { const n = document.createElement('span'); n.className = 'notches'; n.setAttribute('aria-hidden','true'); for (let i=0;i<coin.total;i++) { const notch = document.createElement('span'); notch.className = 'notch' + (i < coin.spent ? ' is-spent' : ''); n.append(notch); } b.append(n); }
        row.append(b);
      }
      for (const [index, card] of cardCoins(pos, side, RULES.hands[side], []).entries()) {
        const b = button('', () => coinRead(side, index)), image = document.createElement('img'), face = art(`ui/cards/${card.card.toLowerCase()}.webp`);
        b.className = 'coin card-coin'; b.id = `card-${side ? 'b' : 'w'}-${index}`; b.dataset.state = card.spent ? 'used' : 'always'; b.setAttribute('aria-label', cardName(card.card) + (card.spent ? ', spent' : ''));
        image.src = face ?? art('ui/cards/back.webp'); image.alt = ''; b.append(image);
        if (!face) { const word = document.createElement('span'); word.className = 'cc-word'; word.textContent = cardName(card.card).slice(0,2); b.append(word); }
        row.append(b);
      }
    }
  }
  function refresh() {
    if (!view || !pos) return;
    $('board').dataset.animating = String(animating);
    rules(); const cands = selected === undefined ? [] : moves.filter(({move}) => move.from === selected && reachable(move)).map(c => c.move), marks = marksModel(cands);
    highlight({ ...marks, selected, last: !lastMove ? [] : lastMove.move.shove ? [lastMove.move.shove.from,lastMove.move.shove.to] : lastMove.move.to === lastMove.move.from ? [...lastMove.move.captures] : [lastMove.move.to], read: inspected === undefined ? undefined : reachOf(pos, inspected), powers: [...new Set([...cands.filter(m => m.power && !m.pass).map(m => m.to), ...named().map(c => c.move.to)])], rails: selected === undefined ? [] : railsOf(pos.board, selected, [...marks.moves, ...marks.captures], marks.captures), check: inCheck(pos) ? findKing(pos.board, pos.turn) : null, checkers: checkersOf(pos), threats: view.status === 'playing' && !animating ? threatsIn({...pos, turn:view.seat}) : [] });
    const square = inspected ?? selected, code = square === undefined ? 0 : pos.board[square];
    const [line = '', states = ''] = square === undefined ? [] : readText(pos, square).split('\n');
    const words = code ? `${colorOf(code) ? 'Black' : 'White'} ${nameOf(typeOf(code))}.${states ? ' ' + states + '.' : ''}` : '';
    const available = boardActions(view,Date.now()-readAt), opponent = view.opponent?.handle ?? 'Your opponent';
    const deadline = available.claim === 'end' ? 'The first-turn deadline passes.' : available.claim ? view.days_per_move ? `${opponent} has not moved for ${view.days_per_move} day${view.days_per_move===1?'':'s'}.` : `${opponent} misses the move deadline.` : '';
    const context = contextLine({voice:'you', result:view.result ? ending(view) : '', refusal:$('error').textContent ?? '', link:deadline, read:inspected === undefined ? '' : words, selected:words, readNote:line.split(' · ')[1] ?? '', check:view.in_check && view.turn === view.seat, checkCause:checkCause(pos, lastMove?.move, 'link', view.seat), computer:pos.turn !== view.seat, midWay:pos.haste !== undefined || !!pos.free, free:!!pos.free, turnLine:pos.free ? 'Make your move, or stop here.' : 'Move it again, or stop here.', armed, armedLine:armed ? coinWords(coinState(pos,view.seat,RULES,[],true)!,pos) : ''});
    if (context.rank==='link' && deadline) context.note=available.claim==='end'?'You may end the game with no result.':'You may claim the win.';
    if (available.abort && ['your-move','computer'].includes(context.rank)) context.note='Abort ends the game with no result, until each side moves once.';
    if (armedCard !== undefined && !['result','refusal','link'].includes(context.rank)) Object.assign(context, {rank:'armed',line:cardName(RULES.hands[view.seat][armedCard]),note:'Choose a piece, then a marked square.'});
    if (view.draw_offer != null && !['result','refusal','link'].includes(context.rank)) context.note = view.draw_offer === view.seat ? 'Draw offered. Waiting for your opponent.' : 'Your opponent offers a draw.';
    $('status').textContent = context.line; $('context-note').textContent = context.note; $('context-text').dataset.rank = context.rank;
    const actions: HTMLButtonElement[] = [];
    if (!armed && armedCard === undefined && square !== undefined && code) actions.push(button('All rules', () => boardSheet('All rules', text(readText(pos!, square)))));
    if (selected !== undefined && moves.some(({move}) => move.from === selected && needsArming(move))) actions.push(button('Choose a move', () => boardSheet('Choose a move', $('choices'))));
    if (armed || armedCard !== undefined) actions.push(button('Cancel', () => { armed = undefined; armedCard = undefined; choices([]); refresh(); }));
    if (view.legal.includes('--')) actions.push(button('Stop here', () => choose('--')));
    const gameActions = actionButtons(view,Date.now()-readAt,refused);
    if (!actions.length && !view.result) actions.push(...gameActions.filter(b=>['abort','claim','accept-draw','decline-draw'].includes(b.id)));
    $('offer-draw').hidden = view.kind === 'solo' || view.status !== 'playing' || view.draw_offer !== null || refused.has('kingdown_draw');
    $('resign').hidden = view.status !== 'playing';
    $('context-actions').replaceChildren(...actions); strips();
    board.setFallen(view.result?.reason === 'checkmate' && view.result.winner !== null ? findKing(pos.board,(1-view.result.winner) as Color) : null,false);
  }
  $('resign').onclick = confirmResign; $('offer-draw').onclick = () => confirmDraw('offer');
  $('reload').addEventListener('click', closeBoardSheet);
  $('board-menu').onclick = () => boardSheet('Menu', button('Choose a move', () => boardSheet('Choose a move', $('choices'))), button('Moves', showMoves), ...view ? actionButtons(view,Date.now()-readAt,refused) : [], button('Settings', () => { closeBoardSheet(); navigate('settings'); }), $('reload'), $('computer'), $('invite'), $('invitation'));
  function showMoves() { boardSheet('Moves', ...history.length ? history.map(step => text(`Move ${moveNumber(step.pre)}. ${step.words}`)) : [text('No moves shown yet.')]); }
  $('moves-line').onclick = showMoves;
  bindBoard();
  const observer = new MutationObserver(() => { if (active()) refresh(); scheduleComputer(); if (client.state.screen === 'end') updateEnd(); });
  observer.observe($('reload'), {attributes:true, attributeFilter:['disabled']});
  observer.observe(document.body, {attributes:true, attributeFilter:['data-page']});
  observer.observe($('over'), {attributes:true, attributeFilter:['open']});
  observer.observe($('error'), {childList:true, characterData:true, subtree:true});
  return (next: View) => {
    if (view?.game_id === next.game_id && next.revision < view.revision) return;
    const before = view, same = view?.game_id === next.game_id;
    const unchanged = same && before?.revision === next.revision && before.fen === next.fen && before.status === next.status;
    view = {...next, rules:next.rules ?? (same ? view?.rules : undefined), outcome:next.outcome ?? (same ? view?.outcome : undefined), opponent:next.opponent && {...next.opponent, rating:next.rules ? next.opponent.rating : next.opponent.rating ?? (same ? view?.opponent?.rating : undefined)}};
    if (['finished','aborted'].includes(next.status)) setTimeout(()=>{ if (active()) { if(client.state.screen==='board') navigate('end'); updateEnd(); } },0);
    readAt = Date.now(); clearTimeout(deadlineTimer);
    if (next.deadline_at && next.turn !== next.seat && next.kind !== 'solo' && next.status === 'playing') deadlineTimer = setTimeout(refresh, Math.max(0,Date.parse(next.deadline_at)-Date.parse(next.server_now))+1);
    if (unchanged && !optimistic) { if (pos) { rules(); refresh(); } scheduleComputer(); return; }
    const token = ++generation; board.skip(); animating = false; $('board').dataset.animating='false';
    if (!same) { history = []; lastMove = undefined; optimistic = undefined; computerCalls = 0; clearTimeout(thinkingTimer); thinking = false; refused.clear(); }
    if (next.turn === next.seat || next.status !== 'playing') { computerCalls = 0; clearTimeout(thinkingTimer); thinking = false; }
    const local = optimistic; optimistic = undefined;
    armed = undefined; armedCard = undefined; selected = inspected = undefined; closeBoardSheet(); choices([]);
    document.querySelector('[data-screen="board"]')!.prepend($('game-table')); $('table-bar').hidden = false;
    $('game-table').dataset.empty = String(!next.fen || next.status === 'setup');
    if (!next.fen || next.status === 'setup') { pos = undefined; $('strip-me').replaceChildren(); $('strip-them').replaceChildren(); $('context-actions').replaceChildren(); $('context-note').textContent = ''; $('last-move').textContent = ''; $('status').textContent = next.result ? ending(next) : next.status === 'waiting' ? 'Waiting for your friend. Share an invitation.' : 'Choose your king and arrangement.'; $('computer').hidden = true; $('invite').hidden = next.kind !== 'friend' || next.status !== 'waiting'; return; }
    rules(); pos = fromFen(next.fen); const legal = new Set(next.legal), here = pos;
    moves = legal.size ? legalMoves(pos).map(move => ({lan:toLan(here,move),move})).filter(({lan}) => legal.has(lan)) : [];
    const steps = before && same ? replayLans(before, next, view.rules!) : undefined;
    const restored = replayHistory(next, view.rules!);
    if (restored) { history = restored; lastMove = restored.at(-1); }
    else if (steps) { history.push(...steps); if (steps.length) lastMove = steps.at(-1); }
    else if (same && before?.revision !== next.revision) {
      if (local && toFen(local.pos) === next.fen) { history.push(local); lastMove = local; } else lastMove = undefined;
    }
    bindBoard(); board.flip(next.seat === 1); moveLine();
    const replay = steps?.filter((step, index) => !(index === 0 && local && toFen(local.pos) === toFen(step.pos))) ?? [];
    const authoritative = pos;
    if (replay.length) {
      animating = true;
      void (async () => {
        for (const step of replay) { if (token !== generation) return; rules(); if (step.move.drop === undefined) await board.animateMove(step.pre, step.move); if (token !== generation) return; board.sync(step.pos); }
        if (token === generation) { rules(); board.sync(authoritative); animating = false; refresh(); scheduleComputer(); }
      })();
    } else board.sync(pos);
    $('computer').hidden = true; $('invite').hidden = true;
    refresh(); scheduleComputer();
    if (!profileRead) { profileRead = true; void client.call('kingdown_profile', {}, {background:true}).then(result => { ownRating = (result._meta?.record as PlayerRecord | undefined)?.rating; if (active()) strips(); }).catch(() => {}); }
  };
}
