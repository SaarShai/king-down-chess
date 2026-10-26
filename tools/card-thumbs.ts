#!/usr/bin/env -S npx tsx
/**
 * The small card paintings of the New game tiles. A tile shows its painting in a 16:9 window (app.css `.cf-art`,
 * object-fit: cover) in two columns. The widest tile is 264 CSS px, in a 640 to 899 px frame (ChatGPT inline is
 * 760 px) where the New game box is 560 px; it is 223 px in the 560 px sheet and 139 px on a 390 px phone.
 * This tool writes that centre window at 528 × 297 (two pixels for each CSS pixel at the widest tile) for each
 * released painting of public/ui/cards. The full card keeps the full painting. tools/card-thumbs.test.ts
 * checks each file against its painting.
 *
 *   npx tsx tools/card-thumbs.ts
 *       writes src/plugin/assets/card-thumbs/<card>.webp again; run it after a card painting changes.
 */
import sharp from 'sharp';
import { mkdirSync, rmSync } from 'node:fs';
import { basename, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RELEASED_CARDS } from '../src/content/cards';

export const THUMBS = 'src/plugin/assets/card-thumbs', WIDTH = 528, HEIGHT = 297;
export const paintings = RELEASED_CARDS.flatMap(card => card.art ? [`public/${card.art}`] : []);
/** The part of a painting that a tile shows (the centre crop of object-fit: cover), at the thumbnail size. */
export const tileWindow = (painting: string) => sharp(painting).resize(WIDTH, HEIGHT, { fit: 'cover' });

if (process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  process.chdir(resolvePath(import.meta.dirname, '..'));
  // A clean folder drops the thumbnail of a card that has no painting now.
  rmSync(THUMBS, { recursive: true, force: true }); mkdirSync(THUMBS, { recursive: true });
  for (const painting of paintings) await tileWindow(painting).webp({ quality: 80, effort: 6 }).toFile(`${THUMBS}/${basename(painting)}`);
  console.log(`Wrote ${paintings.length} card thumbnails to ${THUMBS}.`);
}
