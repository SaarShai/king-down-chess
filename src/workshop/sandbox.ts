/**
 * Try it (docs/WORKSHOP.md W10): a DOM 8 × 8 board where the player moves the design among enemies
 * that never move. The moves come from moves.ts, never from the engine. It is not a game.
 */
import { BLACK, K, NAMES, T, WHITE, colorOf, piece, sq, sqName, typeOf, type Move, type PieceType } from '../rules/engine';
import { pieceIcon } from '../piece-icons';
import { snd } from '../render/sfx';
import { presetOf, type PieceDesign } from './model';
import { BODY_TYPE, CAPITAL, movesOf, type TryState } from './moves';
import { autoBody } from './judge';
import { figureHtml } from './art';
import { esc } from './text';

const ENEMIES: [PieceType, string][] = [[4, 'h8'], [2, 'f7'], [1, 'd6'], [3, 'b5'], [1, 'f5'], [1, 'g4']];
const at = (n: string): number => sq(n.charCodeAt(0) - 97, +n[1] - 1);
const INTO: Record<number, string> = { 5: 'queen', 4: 'rook', 3: 'bishop', 2: 'knight', 7: 'archer' };
/** The square a move is chosen by: the victim of a shot, the piece pushed, else the landing square. */
const tapOf = (m: Move): number => (m.shove ? m.shove.from : m.captures.length && m.to === m.from ? m.captures[0] : m.to);
const KIND_WORD: Record<string, string> = { move: 'move here', take: 'take', shot: 'shoot', push: 'push', swap: 'swap' };
const prefix = (a: number[], b: number[]): boolean => a.every((c, i) => b[i] === c);

export function sandbox(host: HTMLElement, design: PieceDesign, name: string): { reset(): void } {
  const some = (f: (r: PieceDesign['rules'][number]) => boolean): boolean => design.rules.some(f);
  const home = at(some(r => r.when.on === 'zone' && r.when.zone === 'startRank') ? 'd2' : 'd4');
  const near = design.rules.find(r => r.when.on === 'near')?.when;
  const capital = some(r => r.when.on === 'zone' && r.when.zone === 'capital');
  const safe = some(r => r.does.a === 'cannotBeTaken');
  const look = { ...design.look, body: design.look.auto ? autoBody(design) : design.look.body, letter: design.letter };
  let board = new Uint8Array(64), pos = home, st: TryState = { move: 1, captured: false, card: false };
  let d: Pick<PieceDesign, 'squares' | 'lines' | 'rules'> = design, became: PieceType | 0 = 0, gone = false;
  /** The moves at the start of this turn; a chain's next takes come from them. */
  let start: Move[] = [];
  /** A chain in progress: the pieces taken so far this move. Its next takes show at once; Finish ends it. */
  let chain: { caps: number[] } | null = null, promo: Move[] | null = null;

  function reset(shuffle = false): void {
    board = new Uint8Array(64);
    pos = home; d = design; became = 0; gone = false; chain = promo = null;
    st = { move: 1, captured: false, card: st.card };
    board[home] = piece(T, WHITE); // its own type: the moves come from the design, not from T
    board[at('c3')] = board[at('e3')] = piece(1, WHITE);
    // A "next to your …" rule gets its partner beside the piece.
    if (near?.on === 'near' && near.who !== 'enemy' && near.who !== 'friend') board[home + 7] = piece(near.who === 'king' ? K : BODY_TYPE[near.who], WHITE);
    const free = [...Array(64).keys()].filter(s => !board[s] && Math.max(Math.abs((s & 7) - (home & 7)), Math.abs((s >> 3) - (home >> 3))) > 1);
    for (const [t, s] of ENEMIES) {
      const to = shuffle ? free.splice(Math.floor(Math.random() * free.length), 1)[0] : at(s);
      if (!board[to]) board[to] = piece(t, BLACK);
    }
    render();
  }

  function play(m: Move): void {
    const mover = board[pos], fresh = m.captures.slice(chain?.caps.length ?? 0);
    for (const s of fresh) board[s] = 0;
    if (m.shove) { board[m.shove.to] = board[m.shove.from]; board[m.shove.from] = 0; }
    if (m.swap) { board[pos] = board[m.to]; board[m.to] = mover; pos = m.to; }
    else if (m.to !== m.from || chain) { board[pos] = 0; board[m.to] = mover; pos = m.to; }
    if (m.selfRemove) { board[pos] = 0; gone = true; }
    if (m.promo) { board[pos] = piece(m.promo, WHITE); d = presetOf(INTO[m.promo]); became = m.promo; }
    if (m.captures.length) st.captured = true;
    (m.shove ? snd.shove : m.swap ? snd.swap : chain ? snd.chain : m.captures.length && m.to === m.from ? snd.shot : m.captures.length ? snd.capture : snd.move)();
    const more = !m.selfRemove && !m.promo && m.captures.length > 0 && m.to !== m.from
      && start.some(x => x.captures.length > m.captures.length && prefix(m.captures, x.captures));
    chain = more ? { caps: m.captures } : null;
    if (!chain) st.move++;
    render();
  }

  function render(): void {
    if (!chain) start = gone ? [] : movesOf(d, board, pos, st);
    const list = !chain ? start.filter(m => m.captures.length <= 1)
      : start.filter(m => m.captures.length === chain!.caps.length + 1 && prefix(chain!.caps, m.captures));
    const byTap = new Map<number, Move[]>();
    for (const m of list) { const s = chain ? m.to : tapOf(m); byTap.set(s, [...(byTap.get(s) ?? []), m]); }
    let cells = '';
    for (let r = 7; r >= 0; r--) for (let f = 0; f < 8; f++) {
      const s = sq(f, r), v = board[s], ms = byTap.get(s) ?? [], mine = s === pos && !gone;
      const kind = !ms.length ? '' : ms.some(m => m.shove) ? 'push' : ms.some(m => m.swap) ? 'swap'
        : ms.some(m => m.captures.length && m.to === m.from) ? 'shot' : ms.some(m => m.captures.length) ? 'take' : 'move';
      const fig = !v ? '' : mine ? (became ? pieceIcon(became, WHITE) : figureHtml(look, 'tb-me')) : pieceIcon(typeOf(v), colorOf(v));
      const who = !v ? 'empty' : mine ? `your piece, ${esc(became ? NAMES[became] : name)}` : `${colorOf(v) ? 'enemy' : 'your'} ${NAMES[typeOf(v)]}`;
      cells += `<button type="button" class="tb-sq${(f + r) & 1 ? ' lt' : ''}${capital && CAPITAL.includes(s) ? ' cap' : ''}${kind ? ` mk mk-${kind}` : ''}"`
        + ` data-sq="${s}"${f === 0 ? ` data-r="${r + 1}"` : ''}`
        + ` aria-label="${sqName(s)}, ${who}${kind ? `: ${KIND_WORD[kind]}` : ''}">${fig}${safe && mine ? '<span class="tb-shield" aria-hidden="true"></span>' : ''}</button>`;
    }
    host.querySelector('.tb-board')!.innerHTML = cells;
    host.querySelector('.tb-count')!.textContent = `Move ${st.move}`;
    const ask = host.querySelector<HTMLElement>('.tb-ask')!;
    ask.hidden = !promo;
    ask.innerHTML = promo ? promo.map((m, i) => `<button type="button" data-promo="${i}">${pieceIcon(m.promo!)}<span>${INTO[m.promo!]}</span></button>`).join('') : '';
    host.querySelector<HTMLElement>('.tb-finish')!.hidden = !chain;
    // One line of help at a time, in a box of fixed height, so the board and the buttons never move.
    host.querySelector('.tb-say')!.textContent = gone ? 'It took and is removed too. Tap Reset.'
      : promo ? 'It becomes which piece?'
      : chain ? 'It may take again: tap a marked piece, or tap Finish.'
      : `The other side does not move.${safe ? ' Enemies cannot take this piece.' : ''} Tap a marked square.`;
    for (const b of host.querySelectorAll<HTMLButtonElement>('.tb-sq')) b.onclick = () => {
      const ms = byTap.get(+b.dataset.sq!);
      if (!ms?.length) return;
      if (ms.length > 1 && ms.every(m => m.promo)) { promo = ms; render(); return; }
      play(ms.find(m => !m.promo) ?? ms[0]);
    };
    for (const b of ask.querySelectorAll<HTMLButtonElement>('[data-promo]')) b.onclick = () => { const m = promo![+b.dataset.promo!]; promo = null; play(m); };
  }

  const time = some(r => r.when.on === 'fromMove' || r.when.on === 'beforeMove'), card = some(r => r.when.on === 'afterCard');
  host.innerHTML = '<div class="tb-board" role="group" aria-label="Try it board"></div><div class="tb-files" aria-hidden="true">'
    + [...'abcdefgh'].map(f => `<span>${f}</span>`).join('') + '</div>'
    + '<p class="tb-say" role="status"></p><div class="tb-ask" hidden></div>'
    + `<div class="tb-row"><span class="tb-count"></span><button type="button" class="primary tb-finish" hidden>Finish</button>${time ? '<button type="button" class="quiet tb-plus">+5 moves</button>' : ''}<button type="button" class="quiet tb-shuffle">Shuffle</button></div>`
    + (card ? '<label class="check tb-card"><input type="checkbox" /><span>Pretend your opponent played a card</span></label>' : '');
  host.querySelector<HTMLButtonElement>('.tb-shuffle')!.onclick = () => reset(true);
  host.querySelector<HTMLButtonElement>('.tb-finish')!.onclick = () => { chain = null; st.move++; render(); };
  host.querySelector<HTMLButtonElement>('.tb-plus')?.addEventListener('click', () => { st.move += 5; render(); });
  host.querySelector<HTMLInputElement>('.tb-card input')?.addEventListener('change', e => { st.card = (e.target as HTMLInputElement).checked; if (!chain) render(); });
  reset();
  return { reset: () => reset() };
}
