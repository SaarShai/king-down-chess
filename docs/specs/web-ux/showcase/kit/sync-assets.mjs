// Copy the real art and fonts of the app into showcase/assets/ (not versioned: see showcase/.gitignore).
// node docs/specs/web-ux/showcase/kit/sync-assets.mjs
//
// assets/pieces/<piece>-<w|b>.webp   painted figures (no king: see kings/)
// assets/kings/<design>[-b].webp     the six kings, ivory and charcoal
// assets/emblems/<design>.webp       the six king emblems
// assets/icons/<piece>.svg           the round rulebook piece icons (<use href="...#icon">)
// assets/workshop/<name>-<w|b>.webp  Workshop figures
// assets/stone-board.webp            the painted 8 x 8 stone board (exactly the 64 squares), 640 px
// assets/stone-board-hd.webp         the same board at 1024 px: the file the game itself draws
//                                    (docs/2d-first-pieces/board-art/), for a sharp board on a desktop
// assets/fonts/*.woff2               Cinzel and Alegreya Sans (SIL OFL 1.1, licences beside them)
import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const showcase = fileURLToPath(new URL('../', import.meta.url));
const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const assets = showcase + 'assets/';

// Copy over what is there (no delete first): a demo open in a browser keeps its files while this runs.
mkdirSync(assets + 'fonts', { recursive: true });
for (const dir of ['pieces', 'kings', 'emblems', 'icons', 'workshop']) cpSync(`${root}public/ui/${dir}`, assets + dir, { recursive: true });
cpSync(`${root}public/ui/stone-board.webp`, assets + 'stone-board.webp');
cpSync(`${root}docs/2d-first-pieces/board-art/stone-board.webp`, assets + 'stone-board-hd.webp');
for (const f of readdirSync(`${root}public/fonts`)) if (/\.(woff2|txt)$/.test(f)) cpSync(`${root}public/fonts/${f}`, assets + 'fonts/' + f);

writeFileSync(showcase + '.gitignore', ['assets/', 'kit/kd-engine.js', 'renders/', 'dist/', ''].join('\n'));

const count = d => readdirSync(assets + d).length;
console.log(`assets/: pieces ${count('pieces')}, kings ${count('kings')}, emblems ${count('emblems')}, icons ${count('icons')}, workshop ${count('workshop')}, fonts ${count('fonts')}, stone-board.webp, stone-board-hd.webp`);
