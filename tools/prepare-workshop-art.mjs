// Remake the figure webp of the Workshop in the current checkout, from any checkout.
// The cast list names each figure by id. Each source lies in the main checkout (found through
// git's common directory) as `art-src/workshop/{id}.png`, with its prompt in `{id}.prompt.txt`.
// The script cuts each paired PNG into the ivory (left) and charcoal (right) half, trims it and
// writes `public/ui/workshop/{id}-w.webp` and `{id}-b.webp`. It writes nothing when a PNG or
// a prompt is missing: it names each missing file and stops with exit 1.
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const checkout = git('rev-parse', '--show-toplevel');
const sources = join(dirname(git('rev-parse', '--path-format=absolute', '--git-common-dir')), 'art-src', 'workshop');
const cast = JSON.parse(readFileSync(join(checkout, 'docs/visual-design/workshop/cast.json'), 'utf8'));

const missing = cast.flatMap(({ id }) => [`${id}.png`, `${id}.prompt.txt`]
  .filter(file => !existsSync(join(sources, file)))
  .map(file => `${id}: no ${file} in ${sources}`));
if (missing.length) {
  console.error(`prepare-workshop-art: missing sources, nothing written.\n${missing.join('\n')}`);
  process.exit(1);
}

const out = join(checkout, 'public/ui/workshop');
mkdirSync(out, { recursive: true });
for (const { id } of cast) {
  const source = join(sources, `${id}.png`);
  const { width, height } = await sharp(source).metadata();
  const half = Math.floor(width / 2);
  for (const [army, offset] of [['w', 0], ['b', 1]]) {
    const crop = await sharp(source).extract({ left: offset * half, top: 0, width: half, height }).toBuffer();
    await sharp(crop).trim().resize({ width: 384, height: 448, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88 }).toFile(join(out, `${id}-${army}.webp`));
  }
}
console.log(`Prepared ${cast.length} approved pairs from ${sources}.`);
