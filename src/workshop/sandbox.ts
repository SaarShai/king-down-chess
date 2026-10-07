/**
 * Try it (revision 3, W10): a DOM 8 × 8 board where the player moves the design among enemies
 * that never move. The moves come from moves.ts, never from the engine. It is not a game. A square
 * with two actions (push or take) asks which one. The board takes arrow keys (one square in the Tab
 * order), focus follows the piece, and each move is announced.
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import { BLACK, K, NAMES, T, WHITE, colorOf, piece, sq, sqName, typeOf, type Move, type PieceType } from '../rules/engine';
import { pieceIcon } from '../piece-icons';
import { snd } from '../render/sfx';
import { presetOf, type PieceDesign } from './model';
import { BODY_TYPE, CAPITAL, holds, movesOf, type TryState } from './moves';
import { autoBody } from './judge';
import { selectedFigure } from './figures';
import { figureHtml } from './art';
import { cap, esc, ruleText } from './text';

const ENEMIES: [PieceType, string][] = [[4, 'h8'], [2, 'f7'], [1, 'd6'], [3, 'b5'], [1, 'f5'], [1, 'g4']];
const at = (n: string): number => sq(n.charCodeAt(0) - 97, +n[1] - 1);
const INTO: Record<number, string> = { 5: 'queen', 4: 'rook', 3: 'bishop', 2: 'knight', 7: 'archer' };
/** The square a move is chosen by: the victim of a shot, the piece pushed, else the landing square. */
const tapOf = (m: Move): number => (m.shove ? m.shove.from : m.captures.length && m.to === m.from ? m.captures[0] : m.to);
type Kind = 'move' | 'take' | 'shot' | 'push' | 'swap';
const KIND_WORD: Record<Kind, string> = { move: 'move here', take: 'take', shot: 'shoot', push: 'push', swap: 'swap' };
const kindOf = (m: Move): Kind => (m.shove ? 'push' : m.swap ? 'swap' : m.captures.length && m.to === m.from ? 'shot' : m.captures.length ? 'take' : 'move');
const ARROW: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
const prefix = (a: number[], b: number[]): boolean => a.every((c, i) => b[i] === c);

export function sandbox(host: HTMLElement, design: PieceDesign, name: string): { reset(): void } {
  const some = (f: (r: PieceDesign['rules'][number]) => boolean): boolean => design.rules.some(f);
  const home = at(some(r => r.when.on === 'zone' && r.when.zone === 'startRank') ? 'd2' : 'd4');
  const near = design.rules.find(r => r.when.on === 'near')?.when;
  const capital = some(r => r.when.on === 'zone' && r.when.zone === 'capital');
  // The piece plays White here, so it is drawn ivory beside its white pawns (the army is only how it looks).
  const look = { ...design.look, figure: selectedFigure(design).id, army: 0 as const, body: design.look.auto ? autoBody(design) : design.look.body, letter: design.letter };
  let board = new Uint8Array(64), pos = home, st: TryState = { move: 1, captured: false, card: false };
  let d: Pick<PieceDesign, 'squares' | 'lines' | 'rules'> = design, became: PieceType | 0 = 0, gone = false;
  /** The moves at the start of this turn; a chain's next takes come from them. */
  let start: Move[] = [];
  /** A chain in progress: the pieces taken so far this move. Its next takes show at once; Finish ends it. */
  let chain: { caps: number[] } | null = null, promo: Move[] | null = null;
  /** A square with more than one action: its moves by kind, until the player picks one. */
  let choice: { sq: number; kinds: Kind[]; by: Map<Kind, Move[]> } | null = null;
  /** The square in the Tab order (the board's one tab stop); it follows the piece after each move. */
  let cursor = home;

  function reset(shuffle = false): void {
    board = new Uint8Array(64);
    pos = cursor = home; d = design; became = 0; gone = false; chain = promo = choice = null;
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

  const who = (s: number): string => { const v = board[s]; return `${colorOf(v) ? 'enemy' : 'your'} ${NAMES[typeOf(v)]}`; };
  function play(m: Move): void {
    const mover = board[pos], fresh = m.captures.slice(chain?.caps.length ?? 0), k = kindOf(m);
    const said = k === 'move' ? `Moved to ${sqName(m.to)}.` : k === 'push' ? `Pushed the ${who(m.shove!.from)} from ${sqName(m.shove!.from)} to ${sqName(m.shove!.to)}.`
      : k === 'swap' ? `Swapped places with the ${who(m.to)} on ${sqName(m.to)}.`
      : `${k === 'shot' ? 'Shot' : 'Took'} the ${fresh.map(s => `${who(s)} on ${sqName(s)}`).join(' and the ')}.`;
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
    cursor = gone ? cursor : pos;
    live.textContent = `${said}${m.promo ? ` It became a ${INTO[m.promo]}.` : ''}${gone ? ' It is removed too.' : ''}${chain ? ' It may take again, or Finish.' : ''}`;
    render();
  }
  /** A tap on a marked square: its one action, or a choice when it has more than one. */
  function tap(s: number, ms: Move[]): void {
    const by = new Map<Kind, Move[]>();
    for (const m of ms) by.set(kindOf(m), [...(by.get(kindOf(m)) ?? []), m]);
    if (by.size > 1) { choice = { sq: s, kinds: [...by.keys()], by }; render(); return; }
    pick(ms);
  }
  /** The moves of one action: a "becomes" asks which piece, else it plays the move. */
  function pick(ms: Move[]): void {
    choice = null;
    if (ms.length > 1 && ms.every(m => m.promo)) { promo = ms; render(); return; }
    play(ms[0]);
  }

  function render(): void {
    const focused = host.contains(document.activeElement) && document.activeElement !== document.body;
    if (!chain) start = gone ? [] : movesOf(d, board, pos, st);
    const safe = gone ? undefined : d.rules.find(r => r.does.a === 'cannotBeTaken'), shield = !!safe && holds(safe.when, board, pos, st);
    const list = !chain ? start.filter(m => m.captures.length <= 1)
      : start.filter(m => m.captures.length === chain!.caps.length + 1 && prefix(chain!.caps, m.captures));
    const byTap = new Map<number, Move[]>();
    for (const m of list) { const s = chain ? m.to : tapOf(m); byTap.set(s, [...(byTap.get(s) ?? []), m]); }
    let cells = '';
    for (let r = 7; r >= 0; r--) for (let f = 0; f < 8; f++) {
      const s = sq(f, r), v = board[s], ms = byTap.get(s) ?? [], mine = s === pos && !gone;
      const kinds = [...new Set(ms.map(kindOf))], kind = kinds.length > 1 ? 'many' : kinds[0] ?? '';
      const fig = !v ? '' : mine ? (became ? pieceIcon(became, WHITE) : figureHtml(look, 'tb-me')) : pieceIcon(typeOf(v), colorOf(v));
      const what = !v ? 'empty' : mine ? `your piece, ${esc(became ? NAMES[became] : name)}` : who(s);
      cells += `<button type="button" class="tb-sq${(f + r) & 1 ? ' lt' : ''}${capital && CAPITAL.includes(s) ? ' cap' : ''}${kind ? ` mk mk-${kind}` : ''}${choice?.sq === s ? ' picked' : ''}"`
        + ` data-sq="${s}"${f === 0 ? ` data-r="${r + 1}"` : ''} tabindex="${s === cursor ? 0 : -1}"`
        + ` aria-label="${sqName(s)}, ${what}${kind ? `: ${kinds.map(k => KIND_WORD[k]).join(' or ')}` : ''}">${fig}${shield && mine ? '<span class="tb-shield" aria-hidden="true"></span>' : ''}</button>`;
    }
    host.querySelector('.tb-board')!.innerHTML = cells;
    host.querySelector('.tb-count')!.textContent = `Move ${st.move}`;
    const ask = host.querySelector<HTMLElement>('.tb-ask')!;
    ask.hidden = !promo && !choice;
    ask.innerHTML = promo ? promo.map((m, i) => `<button type="button" data-promo="${i}">${pieceIcon(m.promo!)}<span>${INTO[m.promo!]}</span></button>`).join('')
      : choice ? choice.kinds.map(k => `<button type="button" data-kind="${k}">${cap(KIND_WORD[k])}</button>`).join('') : '';
    host.querySelector<HTMLElement>('.tb-finish')!.hidden = !chain;
    // One line of help at a time, in a box of fixed height, so the board and the buttons never move.
    host.querySelector('.tb-say')!.textContent = gone ? 'It took and is removed too. Tap Reset.'
      : promo ? 'It becomes which piece?'
      : choice ? `On ${sqName(choice.sq)} it can ${choice.kinds.map(k => KIND_WORD[k]).join(' or ')}. Which one?`
      : chain ? 'It may take again: tap a marked piece, or tap Finish.'
      : 'The other side does not move. Tap a marked square.';
    // A Safe rule: its exact words and whether it holds now. Enemies never move here, so it cannot be tried.
    const note = host.querySelector<HTMLElement>('.tb-safe')!;
    note.hidden = !safe;
    if (safe) note.textContent = `${ruleText(safe)} ${shield ? 'That holds now.' : 'That does not hold now.'} The other side never moves, so Try it cannot test this rule.`;
    for (const b of host.querySelectorAll<HTMLButtonElement>('.tb-sq')) b.onclick = () => {
      const s = +b.dataset.sq!, ms = byTap.get(s);
      cursor = s;
      if (!ms?.length) { if (choice) { choice = null; render(); } return; }
      tap(s, ms);
    };
    for (const b of ask.querySelectorAll<HTMLButtonElement>('[data-promo]')) b.onclick = () => { const m = promo![+b.dataset.promo!]; promo = null; play(m); };
    for (const b of ask.querySelectorAll<HTMLButtonElement>('[data-kind]')) b.onclick = () => pick(choice!.by.get(b.dataset.kind as Kind)!);
    // Focus stays on the board: on the asked choice, else on the piece's square (or the square it moved to).
    if (focused && !host.contains(document.activeElement)) (ask.querySelector<HTMLElement>('button') ?? host.querySelector<HTMLElement>(`.tb-sq[data-sq="${cursor}"]`))?.focus();
  }

  const time = some(r => r.when.on === 'fromMove' || r.when.on === 'beforeMove'), card = some(r => r.when.on === 'afterCard');
  host.innerHTML = '<div class="tb-board" role="group" aria-label="Try it board. Arrow keys move between squares."></div><div class="tb-files" aria-hidden="true">'
    + [...'abcdefgh'].map(f => `<span>${f}</span>`).join('') + '</div>'
    + '<p class="tb-say" role="status"></p><p class="sr-only tb-live" role="status"></p><div class="tb-ask" hidden></div>'
    + `<div class="tb-row"><span class="tb-count"></span><button type="button" class="primary tb-finish" hidden>Finish</button>${time ? '<button type="button" class="quiet tb-plus">+5 moves</button>' : ''}<button type="button" class="quiet tb-shuffle">Shuffle</button></div>`
    + (card ? '<label class="check tb-card"><input type="checkbox" /><span>Pretend your opponent played a card</span></label>' : '')
    + '<p class="tb-safe" hidden></p>';
  const live = host.querySelector<HTMLElement>('.tb-live')!;
  host.querySelector<HTMLElement>('.tb-board')!.onkeydown = e => {
    const k = ARROW[e.key], b = (e.target as HTMLElement).closest<HTMLElement>('.tb-sq');
    if (!k || !b) return;
    e.preventDefault();
    const s = +b.dataset.sq!, f = Math.max(0, Math.min(7, (s & 7) + k[0])), r = Math.max(0, Math.min(7, (s >> 3) + k[1]));
    cursor = sq(f, r);
    for (const c of host.querySelectorAll<HTMLElement>('.tb-sq')) c.tabIndex = +c.dataset.sq! === cursor ? 0 : -1;
    host.querySelector<HTMLElement>(`.tb-sq[data-sq="${cursor}"]`)!.focus();
  };
  host.querySelector<HTMLButtonElement>('.tb-shuffle')!.onclick = () => reset(true);
  host.querySelector<HTMLButtonElement>('.tb-finish')!.onclick = () => { chain = null; st.move++; render(); };
  host.querySelector<HTMLButtonElement>('.tb-plus')?.addEventListener('click', () => { st.move += 5; render(); });
  host.querySelector<HTMLInputElement>('.tb-card input')?.addEventListener('change', e => { st.card = (e.target as HTMLInputElement).checked; if (!chain) render(); });
  reset();
  return { reset: () => reset() };
}
