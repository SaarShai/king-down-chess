# Mockup asset kit

All paths are relative to `docs/research/rules-ui-2026-10-10/mockups/`. The tokens come from `src/style.css` lines 5-107 and `src/workshop/workshop.css` lines 160-190. The game is light only: no dark theme.

## Fonts

```css
@font-face { font-family: 'Cinzel'; src: url('assets/fonts/cinzel-latin.woff2') format('woff2'); font-weight: 400 900; font-display: swap; }
@font-face { font-family: 'Alegreya Sans'; src: url('assets/fonts/alegreya-sans-regular-latin.woff2') format('woff2'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'Alegreya Sans'; src: url('assets/fonts/alegreya-sans-italic-latin.woff2') format('woff2'); font-weight: 400; font-style: italic; font-display: swap; }
@font-face { font-family: 'Alegreya Sans'; src: url('assets/fonts/alegreya-sans-bold-latin.woff2') format('woff2'); font-weight: 600 800; font-display: swap; }
```

Cinzel is for titles only (capitals, letter spacing 0.08em). Alegreya Sans is for all body text.

## Tokens

```css
:root {
  color-scheme: only light;
  /* surfaces */
  --parchment: #f3ead7; --parchment-deep: #e7d8b8; --vellum: #fbf7ee;
  --floor-base: #f2e9d6; --floor-edge: #e6d7b9;
  --floor: radial-gradient(90% 75% at 50% 40%, #faf5ea 0%, var(--floor-base) 55%, var(--floor-edge) 100%);
  /* text */
  --ink: #2b2621; --ink-soft: #5b5045;
  /* stone */
  --stone-100: #ebe6da; --stone-300: #c9bfac; --stone-500: #8a8072; --stone-700: #4d453c; --stone-900: #1d1915;
  /* accent */
  --accent: #842c21; --accent-deep: #5a1c14; --accent-bright: #9c3a2d;
  --gold: #c99a3e; --gold-bright: #e9c071; --gold-ink: #7a5712;
  --danger: #b0251b; --focus: #1c5bb0; --check: #e02828;
  --night: #221d18; --on-night: #f3ead7; --on-night-soft: #d6c9ad;
  --line: rgba(43, 38, 33, 0.16); --wash: rgba(43, 38, 33, 0.06);
  /* board marks, as RGB triples: rgb(var(--mark-move) / 0.8) */
  --mark-move: 255 214 128;   /* gold gem: a move */
  --mark-capture: 214 52 40;  /* crimson ring: a take */
  --mark-swap: 160 120 220;   /* violet: the Maester's trade */
  --mark-shove: 64 190 176;   /* teal: the Ogre's push */
  --mark-power: 96 160 255;   /* blue rune: a king's power */
  /* board squares */
  --board-light: #efebe3; --board-dark: #6f6b65;          /* 3D board, src/render/renderer.ts:55 */
  --grid-light: #efe6d0;  --grid-dark: #ddd0b4;           /* Workshop 7x7 grid, workshop.css:166-168 */
  --grid-gap: var(--stone-700);
  /* Workshop grid marks (workshop.css:174-190) */
  --gem-hi: #fff4cf; --gem-mid: #f0bf52; --gem-edge: #9a6418;  /* move gem */
  --take-ring: #b3261e;                                    /* take ring; dashed = shoot */
  --line-gold: #d9a441; --line-edge: #6b4a14;              /* slide line */
  --power-hi: #e3f0ff; --power-mid: #7fb2ff; --power-edge: #2f5ea8; /* power gem, render/marks.ts:187 */
  --shove-teal: #2f7f75; --hover-gold: #f0c060;
  /* type */
  --font-display: 'Cinzel', 'Trajan Pro', Georgia, serif;
  --font-body: 'Alegreya Sans', 'Segoe UI', system-ui, sans-serif;
  --fs-xs: 12.5px; --fs-sm: 14px; --fs-md: 15.5px; --fs-body: 16px; --fs-lg: 18px; --fs-xl: 23px; --fs-2xl: 30px; --fs-3xl: 40px;
  --lh: 1.45; --lh-tight: 1.2; --track-display: 0.08em;
  /* space, radius, shadow */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px; --space-6: 32px; --space-7: 48px;
  --radius-sm: 5px; --radius: 8px; --radius-lg: 14px; --radius-pill: 999px; --tap: 44px;
  --lift: 0 2px 0 var(--stone-700);
  --shadow-card: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 2px 8px rgba(43, 38, 33, 0.1);
  --shadow-float: 0 18px 50px rgba(20, 14, 8, 0.45);
  --shadow-sheet: 0 -8px 40px rgba(20, 14, 8, 0.35);
  --rim: drop-shadow(0 0 0.75px rgba(43, 38, 33, 0.7)); /* outline for painted figures */
  /* motion */
  --dur-1: 120ms; --dur-2: 200ms; --dur-3: 320ms; --dur-4: 480ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1); --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.4, 0.64, 1);
}
body { margin: 0; font: var(--fs-md)/var(--lh) var(--font-body); color: var(--ink); background: var(--floor-base) var(--floor); }
```

## Controls (style.css lines 167-190)

```css
button { font: inherit; font-weight: 700; min-height: 40px; padding: 8px 12px; color: var(--ink);
  background: linear-gradient(var(--vellum), #efe4cc); border: 1px solid var(--stone-700); border-radius: var(--radius);
  box-shadow: var(--lift), inset 0 1px 0 rgba(255,255,255,.8); }
button.primary { color: var(--vellum); background: linear-gradient(var(--accent-bright), var(--accent));
  border-color: var(--accent-deep); box-shadow: 0 2px 0 var(--accent-deep), inset 0 1px 0 rgba(255,220,200,.35); }
button.quiet { background: transparent; box-shadow: none; border-color: var(--stone-500); font-weight: 400; }
.card-panel { background: var(--vellum); border: 1px solid var(--stone-300); border-radius: var(--radius); box-shadow: var(--shadow-card); }
```

## Power coin (CSS only, no art file; style.css lines 500-518, src/ui/coin.ts)

A 48px parchment disc with a king emblem inside and blue diamond notches for uses.

```css
.coin { position: relative; width: 48px; height: 48px; border-radius: 50%;
  background: radial-gradient(circle at 40% 30%, #fbf7ee, #d9ccb0 70%, #b9aa8a);
  border: 1px solid var(--stone-700); box-shadow: var(--lift), inset 0 0 0 3px rgba(255,255,255,.5); }
.coin img { position: absolute; inset: 5px; width: 36px; height: 36px; }   /* assets/emblems/<king>.webp */
.coin .notches { position: absolute; left: 50%; bottom: -5px; transform: translateX(-50%); display: flex; gap: 3px; }
.coin .notch { width: 9px; height: 9px; transform: rotate(45deg); background: #7fb2ff; border: 1.5px solid #2c5a8f; }
.coin .notch.is-spent { background: var(--stone-300); border-color: var(--stone-500); }
.coin[data-state='armed'] { box-shadow: var(--lift), inset 0 0 0 2px var(--ink), inset 0 0 0 5px var(--gold-bright); }
.coin[data-state='used'] { filter: grayscale(1); opacity: .7; }
```

## Workshop grid marks (workshop.css lines 174-190)

```css
.cell { position: relative; aspect-ratio: 1; background: var(--grid-light); } .cell.dk { background: var(--grid-dark); }
.c-move::before { content: ''; position: absolute; left: 33%; top: 33%; width: 34%; height: 34%; rotate: 45deg;
  border: 1px solid #9a6418; background: linear-gradient(135deg, #fff4cf, #f0bf52 50%, #9a6418); }
.c-take::after, .c-shoot::after { content: ''; position: absolute; inset: 13%; border: 3px solid #b3261e; border-radius: 50%; }
.c-shoot::after { border-style: dashed; }
.c-shoot::before { content: ''; position: absolute; inset: 40%; border-radius: 50%; background: #b3261e; }
```

## Cards

The game has no in-play card frame today. `cardText()` in `src/powers-ui.ts:72` gives one sentence per card. The rulebook (`docs/RULES.md`) holds the card rules. No card frame or card back exists in `public/`. The card art below is raw illustration from `art-src/cards/`. A mockup must draw its own frame (vellum panel, gold rule, Cinzel title).

## Inventory

| Path | What it shows | Pixels |
|---|---|---|
| assets/fonts/cinzel-latin.woff2 | Cinzel, variable weight 400-900 | font, 24 KB |
| assets/fonts/alegreya-sans-regular-latin.woff2 | Alegreya Sans regular | font, 20 KB |
| assets/fonts/alegreya-sans-italic-latin.woff2 | Alegreya Sans italic | font, 20 KB |
| assets/fonts/alegreya-sans-bold-latin.woff2 | Alegreya Sans bold (600-800) | font, 20 KB |
| assets/pieces/{pawn,knight,bishop,rook,queen}-{w,b}.webp | Painted classic pieces, white and black army | 185-270 x 320 |
| assets/pieces/{archer,paladin,guard,maester,beast,ogre}-{w,b}.webp | Painted fairy pieces, white and black army | 231-257 x 320 |
| assets/icons/{pawn,knight,bishop,rook,queen,king,archer,paladin,guard,maester,beast,ogre}.svg | 2017 rulebook piece glyph in a ring. Disc color is `var(--pi-disc)` (white army #fffcf4; black army #4a4850 with `--pi-glyph: #f3ead7`) | 48 x 48 viewBox |
| assets/kings/{flame,frost,mud,shadow,spirit,stratus}.webp | The six elemental kings, white army | 221-241 x 320 |
| assets/kings/{flame,frost,mud,shadow,spirit,stratus}-b.webp | The six elemental kings, black army | 192-240 x 320 |
| assets/emblems/{flame,frost,mud,shadow,spirit,stratus}.webp | King power emblems (the coin face) | 256 x 256 |
| assets/board/stone-board.webp | Stone board texture, full 8x8 | 640 x 640 |
| assets/board/white-tile.jpg | One light stone tile | 256 x 256 |
| assets/board/black-tile.jpg | One dark stone tile | 256 x 256 |
| assets/workshop/blade-dancer-{w,b}.webp | Workshop figure: blade dancer | 339 x 448 |
| assets/workshop/hare-scout-{w,b}.webp | Workshop figure: hare scout | 338-355 x 448 |
| assets/workshop/fox-pathfinder-{w,b}.webp | Workshop figure: fox pathfinder | 384 x 420-438 |
| assets/workshop/iron-warden-{w,b}.webp | Workshop figure: iron warden | 290 x 448 |
| assets/workshop/owl-archivist-{w,b}.webp | Workshop figure: owl archivist | 257 x 448 |
| assets/workshop/clay-golem-{w,b}.webp | Workshop figure: clay golem | 354 x 448 |
| assets/workshop/fire-spirit-{w,b}.webp | Workshop figure: fire spirit | 307-321 x 448 |
| assets/workshop/crossbow-warden-{w,b}.webp | Workshop figure: crossbow warden | 292 x 448 |
| assets/cards/back.jpg | Card back illustration | 512 x 512 |
| assets/cards/freeze.jpg | Card art: Freeze | 512 x 512 |
| assets/cards/icewall.jpg | Card art: Ice Wall | 512 x 512 |
| assets/cards/march.jpg | Card art: March | 512 x 512 |
| assets/cards/mimic.jpg | Card art: Mimic | 512 x 512 |
| assets/cards/skylift.jpg | Card art: Skylift | 512 x 512 |
| assets/cards/vault.jpg | Card art: Vault | 512 x 512 |
| assets/cards/leap.jpg | Card art: Leap (older hand-drawn set) | 491 x 512 |
| assets/cards/rescue.jpg | Card art: Rescue, the ice hand that pulls a hand out of the water (older hand-drawn set) | 491 x 512 |
| assets/cards/salvation.jpg | Card art: Salvation, the graveyard. Only the picture, cut from docs/research/drive-assets/cards/card-spell-salvation.jpg (no frame, title, cost badge or text) | 512 x 512 |
| assets/cards/sacrifice.jpg | Card art: Sacrifice (older hand-drawn set) | 491 x 512 |
| assets/legend/range-tiles.jpg | The owner's physical-game move legend: green square = can move; red X on white = can take only; green with red X = move or take | 960 x 540 |

Total size: about 2.6 MB.
