// Package approved pairs for the app. Keep the source sheets and their prompts unchanged.
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
const cast = JSON.parse(readFileSync('docs/visual-design/workshop/cast.json', 'utf8'));
mkdirSync('public/ui/workshop', { recursive: true });
for (const figure of cast) {
  const { width, height } = await sharp(figure.source).metadata();
  for (const [army, offset] of [['w', 0], ['b', 1]]) {
    const half = Math.floor(width / 2);
    const crop = await sharp(figure.source).extract({ left: offset * half, top: 0, width: half, height }).toBuffer();
    await sharp(crop).trim().resize({ width: 384, height: 448, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88 }).toFile(`public/ui/workshop/${figure.id}-${army}.webp`);
  }
}
console.log(`Prepared ${cast.length} approved pairs.`);
