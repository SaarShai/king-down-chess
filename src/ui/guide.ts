import { A, B, G, K, L, M, N, NAMES, O, P, PLAIN_KINGS, Q, R, RULES as GAME_RULES, S, type Color, type PieceType } from '../rules/engine';

/** Painted figures cut from the board's sheets (docs/visual-design/make-ui-art.py); none for the lab pieces. */
const ART: Partial<Record<PieceType, string>> = Object.fromEntries(
  ([P, N, B, R, Q, A, L, G, M, S, O] as PieceType[]).map(t => [t, NAMES[t]]));
/** A side's king as the board draws him: the king it plays (Spirit and Shadow without powers), in its army's colour. */
export const kingArt = (c: Color): string =>
  `${import.meta.env.BASE_URL}ui/kings/${(GAME_RULES.kings[c]?.king ?? PLAIN_KINGS[c]).toLowerCase()}${c ? '-b' : ''}.webp`;
export const pieceArt = (t: PieceType, black = false): string | null =>
  t === K ? kingArt(black ? 1 : 0)
    : ART[t] ? `${import.meta.env.BASE_URL}ui/pieces/${ART[t]}-${black ? 'b' : 'w'}.webp` : null;
