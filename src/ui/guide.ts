import { A, B, G, K, KINGS, L, LETTERS, M, N, NAMES, O, P, PLAIN_KINGS, Q, R, RULES as GAME_RULES, S, type Color, type PieceType, type Position, type PowerName, type Rules } from '../rules/engine';
import { POOL } from '../rules/setup';
import { POWER_NAME, powerText, powersRules, usesAllowed } from '../powers-ui';
import { guideTypes, pieceGuide } from '../read';
import { pieceIcon } from '../piece-icons';
import { refreshLessonShelf } from '../lesson-shelf-ui';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/** "twice a game", "always on". */
const usesText = (p: PowerName, r: Rules = GAME_RULES): string => {
  const n = usesAllowed(p, r);
  return n === null || n === 0 ? 'always on' : n === 1 ? 'once a game' : n === 2 ? 'twice a game' : `${n} times a game`;
};

/** Painted figures cut from the board's sheets (docs/visual-design/make-ui-art.py); none for the lab pieces. */
const ART: Partial<Record<PieceType, string>> = Object.fromEntries(
  ([P, N, B, R, Q, A, L, G, M, S, O] as PieceType[]).map(t => [t, NAMES[t]]));
/** A side's king as the board draws him: the king it plays (Spirit and Shadow without powers), in its army's colour. */
export const kingArt = (c: Color): string =>
  `${import.meta.env.BASE_URL}ui/kings/${(GAME_RULES.kings[c]?.king ?? PLAIN_KINGS[c]).toLowerCase()}${c ? '-b' : ''}.webp`;
export const pieceArt = (t: PieceType, black = false): string | null =>
  t === K ? kingArt(black ? 1 : 0)
    : ART[t] ? `${import.meta.env.BASE_URL}ui/pieces/${ART[t]}-${black ? 'b' : 'w'}.webp` : null;

/** The Guide for `pos`: its piece cards, rules lead, move letters, powers and draw pool. `preset`: the page's `?rules=` preset. */
function fillPieceGuide(pos: Position, preset?: Partial<Rules>): void {
  const rows = $('rules-rows');
  rows.innerHTML = '';
  for (const t of guideTypes(pos)) {
    const g = pieceGuide(t);
    const card = document.createElement('article');
    card.className = 'piece-card';
    card.dataset.piece = NAMES[t];
    const letter = LETTERS[t];
    const name = NAMES[t][0].toUpperCase() + NAMES[t].slice(1);
    const art = pieceArt(t);
    // The heading shows the piece's icon before its name (tools find a card by data-piece); a lab piece has
    // no icon and shows its letter, as its art does.
    const icon = pieceIcon(t);
    card.innerHTML = `<div class="pc-art">${art ? `<img src="${art}" alt="" loading="lazy" decoding="async">` : `<span class="pc-medallion" aria-hidden="true">${letter}</span>`}</div>`
      + `<div class="pc-body"><h3>${icon || `<span class="pc-letter" title="Its letter in the move list">${letter}</span>`} ${name}</h3><dl>`
      + `<dt>Moves</dt><dd>${g.moves}</dd><dt>Takes</dt><dd>${g.captures}</dd>${g.special ? `<dt>Special</dt><dd>${g.special}</dd>` : ''}</dl></div>`;
    rows.appendChild(card);
  }
  const promo = GAME_RULES.promotionSet === 'anyNonKing'
    ? 'A pawn promotes to any piece but a king.'
    : GAME_RULES.promotionSet === 'anyNonKingNoGuard'
      ? 'A pawn promotes to any piece but a king or a guard.'
      : 'A pawn promotes to a queen, rook, bishop, or knight.';
  $('rules-lead').textContent =
    `Mate the king. Both sides share one random back rank, drawn from the pool. No castling or en passant. ${promo}`;
  $('rules-notation').textContent =
    // The move list keeps the letters (LAN), so the Guide names them here, once.
    `In the move list a move starts with its piece's letter (none for a pawn): ${([N, B, R, Q, K, A, L, G, M, S, O] as PieceType[]).map(t => `${LETTERS[t]} ${NAMES[t]}`).join(', ')}. `
    + 'Then - moves, x takes, * shoots without moving (archer), <> swaps (maester), > shoves (ogre; then where the shoved piece went), = promotes. '
    + 'Kings\' powers: ! Strike, !H Haste (-- ends a Haste turn early), ~ Flight, !F: Freeze, !W: Ice Wall, !S: Sacrifice, !M March, !L Leap.';
  // The twelve powers as a game with powers plays them: this game's rules when a king has a power,
  // else the official readings, which an older `?rules=` preset overrides (as the New game picker shows them).
  const pr: Rules = GAME_RULES.kings[0] || GAME_RULES.kings[1] ? GAME_RULES : powersRules(preset);
  $('powers-list').innerHTML = (Object.entries(KINGS) as [string, readonly PowerName[]][]).map(([king, powers]) =>
    `<li><b>${king} king</b>: ${powers.map(p => `<span data-power="${p}"><b>${POWER_NAME[p]}</b> (${usesText(p, pr)}) — ${powerText(p, pr, true)}.</span>`).join('')}</li>`).join('');
  // Each piece once, as its icon and how many the pool holds ("×2"); its name for a pointer and a screen reader.
  const pool = [...new Set(POOL)].map(ch => {
    const t = LETTERS.indexOf(ch) as PieceType, n = POOL.split(ch).length - 1, icon = pieceIcon(t);
    const name = `${NAMES[t]}${n > 1 ? ` ×${n}` : ''}`;
    return icon ? `<span class="pool-piece" title="${name}">${icon}${n > 1 ? `<span aria-hidden="true">×${n}</span>` : ''}<span class="sr-only">${name}</span></span>` : `<span class="pool-piece">${name}</span>`;
  }).join('<span class="sr-only">, </span>');
  $('rules-letters').innerHTML =
    `The random draw pool is ${pool}. Seven pieces join the king; two drawn bishops start on opposite colours. Custom setup and a pasted position can place other pieces.`;
}

/** A piece's rules in one line, for its card and the screen reader. */
export const pieceText = (t: PieceType): string => {
  const g = pieceGuide(t);
  return [g.moves, g.captures, g.special].filter(Boolean).join(' ');
};

/** The Guide button; `fill` writes the Guide for the position on the board (after a rules change). */
export function connectGuide(c: { shownPos(): Position; preset?: Partial<Rules> }) {
  const fill = (): void => fillPieceGuide(c.shownPos(), c.preset);
  $('rules-btn').onclick = () => {
    refreshLessonShelf();
    fill();
    $<HTMLDialogElement>('rules').showModal();
    document.querySelector<HTMLElement>('.lesson-guide-body')!.scrollTop = 0;
  };
  return { fill };
}
