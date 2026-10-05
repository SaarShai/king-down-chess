/**
 * The round piece icons of the 2017 rulebook (public/ui/icons/<piece>.svg; the Ogre's is new).
 * Each file's root is `<svg id="icon">`, so `<use href="….svg#icon">` draws it in the page, where CSS
 * paints it: ring and glyph in `currentColor`, the disc in `--pi-disc` (src/style.css `.pi`).
 * The icon is decoration (aria-hidden): the text beside it names the piece.
 */
import { NAMES, type Color, type PieceType } from './rules/engine';

/** The pieces that have an icon; the lab pieces (catapult, reaver, templar) have none. */
export const ICON_PIECES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre'] as const;

/** `<svg>` markup for piece type `t`, in its army's colours when `army` is given; '' for a piece with no icon. */
export function pieceIcon(t: PieceType, army?: Color): string {
  const name = NAMES[t] as string;
  if (!(ICON_PIECES as readonly string[]).includes(name)) return '';
  const cls = army == null ? 'pi' : army ? 'pi pi-b' : 'pi pi-w';
  return `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="${import.meta.env.BASE_URL}ui/icons/${name}.svg#icon"/></svg>`;
}
