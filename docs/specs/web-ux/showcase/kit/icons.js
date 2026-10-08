// Inline SVG icons in one stroke style (24 x 24, 1.8 px round strokes, currentColor), and the piece art.
// import { icon, iconEl, pieceIcon, pieceArt, emblemArt } from '../../kit/icons.js';
//   button.innerHTML = icon('hint') + '<span>Hint</span>';
//   feed.innerHTML = pieceIcon('archer', 'w') + ' White archer shoots';

const ASSETS = new URL('../assets/', import.meta.url).href;

/** Path data per icon. Circles and rectangles are written as paths too, so every icon is one stroke style. */
const PATHS = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  moves: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  close: 'M6 6l12 12M18 6 6 18',
  chevron: 'M9 6l6 6-6 6',
  flip: 'M8 20V5M4.5 8.5 8 5l3.5 3.5M16 4v15M12.5 15.5 16 19l3.5-3.5',
  'chevron-down': 'M6 9l6 6 6-6',
  back: 'M15 6l-6 6 6 6',
  play: 'M7 4.5v15l12-7.5z',
  pause: 'M8.5 5v14M15.5 5v14',
  share: 'M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
  'sound-on': 'M11 5 6.5 9H3v6h3.5l4.5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  'sound-off': 'M11 5 6.5 9H3v6h3.5l4.5 4zM16 9.5l5 5M21 9.5l-5 5',
  settings: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  crown: 'M4 18h16M4 18 3 8l5 4 4-6 4 6 5-4-1 10',
  sparkle: 'M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  lock: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V7.5a4 4 0 0 1 8 0V11',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  swords: 'M5 5l11 11M14 18l4-4M16 16l4 4M19 5 8 16M10 18l-4-4M8 16l-4 4',
  flag: 'M5 21V4M5 4h12l-2.5 4L17 12H5',
  book: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5zM5 20.5A2.5 2.5 0 0 0 7.5 23M5 20.5V5.5M9 7.5h6',
  cards: 'M8.5 3.5H17a2 2 0 0 1 2 2V16M5 7.5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2z',
  users: 'M9 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8',
  globe: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  info: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 11v5.5M12 7.5h.01',
  plus: 'M12 5v14M5 12h14',
  clock: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7.5V12l3 2',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 21h7M10 17h4l.5 4h-5z',
  bolt: 'M13 2.5 5 13.5h6l-1 8 8-11h-6z',
  shield: 'M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z',
  target: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM12 11.5h.01',
  help: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3M12 16.5h.01',
};

/** Every icon name, for a demo that lists them. */
export const ICON_NAMES = Object.keys(PATHS);

/**
 * SVG markup for an icon. Decorative by default (aria-hidden); pass { label } when the icon is the
 * only name of its control. size is in px (default 22, from the .icon class in ui.css).
 */
export function icon(name, { label, size, className = '' } = {}) {
  const d = PATHS[name];
  if (!d) throw new Error(`icons.js: no icon "${name}" (${ICON_NAMES.join(', ')})`);
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true" focusable="false"';
  const dim = size ? ` width="${size}" height="${size}"` : '';
  return `<svg class="icon${className ? ' ' + className : ''}" viewBox="0 0 24 24"${dim} ${a11y}><path d="${d}"/></svg>`;
}

/** The same icon as an element. */
export function iconEl(name, options) {
  const t = document.createElement('template');
  t.innerHTML = icon(name, options);
  return t.content.firstElementChild;
}

const PIECES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre'];

/**
 * The round rulebook icon of a piece (assets/icons/<piece>.svg) as inline <svg><use>, coloured
 * by CSS (.pi in ui.css): color 'w' gives the pale disc, 'b' the charcoal disc, none the rulebook blue-grey.
 * Decorative: put the piece's name in text beside it.
 */
export function pieceIcon(type, color, { className = '' } = {}) {
  if (!PIECES.includes(type)) return '';
  const cls = ['pi', color === 'w' ? 'pi-w' : color === 'b' ? 'pi-b' : '', className].filter(Boolean).join(' ');
  return `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="${ASSETS}icons/${type}.svg#icon"/></svg>`;
}

/**
 * The painted figure of a piece (a URL). A king takes its design: 'spirit' (White's plain king),
 * 'shadow' (Black's plain king), or 'frost' | 'flame' | 'stratus' | 'mud' when it has that power.
 */
export function pieceArt(type, color = 'w', design) {
  if (type === 'king') {
    const d = design ?? (color === 'b' ? 'shadow' : 'spirit');
    return `${ASSETS}kings/${d}${color === 'b' ? '-b' : ''}.webp`;
  }
  return `${ASSETS}pieces/${type}-${color}.webp`;
}

/** A king's emblem (a URL): frost, flame, stratus, mud, spirit or shadow. */
export const emblemArt = design => `${ASSETS}emblems/${design}.webp`;

/** A Workshop figure (a URL), e.g. workshopArt('fire-spirit', 'w'). */
export const workshopArt = (name, color = 'w') => `${ASSETS}workshop/${name}-${color}.webp`;

/** The asset folder's URL, ending in '/'. */
export const ASSET_URL = ASSETS;
