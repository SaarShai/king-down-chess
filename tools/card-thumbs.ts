#!/usr/bin/env -S npx tsx
/**
 * The small card paintings of the New game tiles. A tile shows its painting in a 16:9 window (app.css `.cf-art`,
 * object-fit: cover) that is 236 CSS px wide in the 560 px sheet (two columns) and about 153 px on a 393 px phone.
 * This tool writes that centre window at 480 × 270 (two pixels for each CSS pixel in the sheet, three on the phone)
 * for each released painting of public/ui/cards. The full card keeps the full painting. tools/card-thumbs.test.ts
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

export const THUMBS = 'src/plugin/assets/card-thumbs', WIDTH = 480, HEIGHT = 270;
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
