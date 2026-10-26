import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import { art } from '../src/account-game/art';
import { HEIGHT, paintings, THUMBS, tileWindow, WIDTH } from './card-thumbs';

it('keeps one thumbnail for each released card painting, in the plugin art', () => {
  expect(paintings.length).toBe(12);
  expect(readdirSync(THUMBS).sort()).toEqual(paintings.map(painting => basename(painting)).sort());
  for (const painting of paintings) expect(art(`assets/card-thumbs/${basename(painting)}`), painting).toBeTruthy();
});

it('cuts the 16:9 window that app.css gives a card painting', () => {
  expect(readFileSync('src/plugin/app.css', 'utf8')).toMatch(/\n\.cf-art \{[^}]*aspect-ratio: 16 \/ 9;[^}]*\}\n\.cf-art img \{[^}]*object-fit: cover;/);
  expect(WIDTH * 9).toBe(HEIGHT * 16);
});

it.each(paintings)('ships %s as a smaller webp of its current tile window', async painting => {
  const thumb = `${THUMBS}/${basename(painting)}`, meta = await sharp(thumb).metadata();
  expect([meta.format, meta.width, meta.height]).toEqual(['webp', WIDTH, HEIGHT]);
  expect(statSync(thumb).size).toBeLessThan(statSync(painting).size);
  const [a, b] = await Promise.all([sharp(thumb), tileWindow(painting)].map(image => image.removeAlpha().raw().toBuffer()));
  // Quality 80 moves a pixel by at most 4 levels on average; another card's painting moves it by more than 50.
  let sum = 0; for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  expect(sum / a.length).toBeLessThan(6);
});
