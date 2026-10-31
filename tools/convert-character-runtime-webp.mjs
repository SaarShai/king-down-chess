/** Convert a retained PNG runtime package without changing its source or geometry. */
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import sharp from 'sharp';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const [sourceArg, outputArg, ...extra] = process.argv.slice(2);
if (!sourceArg || !outputArg || extra.length) throw Error('Use: node tools/convert-character-runtime-webp.mjs <PNG package> <new output>');
const source = resolve(sourceArg), output = resolve(outputArg), rel = relative(source, output);
if (!rel || !rel.startsWith('..')) throw Error('Output must be outside source');
const manifest = JSON.parse(await readFile(resolve(source, 'manifest.json')));
const assets = JSON.parse(await readFile(resolve(source, 'assets.json')));
await mkdir(output); // Refuse an existing output, including partial prior builds.
await mkdir(resolve(output, 'assets'));
await cp(resolve(source, 'effects'), resolve(output, 'effects'), { recursive: true });
const converted = new Map();
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < assets.length) {
    const asset = assets[next++];
    if (asset.url !== `assets/${asset.sha256}.png` || !/^[a-f0-9]{64}$/.test(asset.sha256)) throw Error('Invalid PNG asset path');
    const bytes = await readFile(resolve(source, asset.url));
    if (hash(bytes) !== asset.sha256) throw Error(`PNG hash mismatch: ${asset.url}`);
    const image = sharp(bytes), metadata = await image.metadata();
    if (!metadata.hasAlpha || metadata.width !== asset.size[0] || metadata.height !== asset.size[1]) throw Error(`PNG geometry or alpha mismatch: ${asset.url}`);
    const webp = await image.webp({ quality: 90, alphaQuality: 100, exact: true, effort: 6 }).toBuffer(), sha256 = hash(webp), url = `assets/${sha256}.webp`;
    await writeFile(resolve(output, url), webp);
    converted.set(asset.url, { ...asset, url, sha256, encoding: 'webp-q90-alpha-lossless' });
  }
}));
for (const bank of manifest.banks) for (const frame of bank.frames) {
  const asset = converted.get(frame.url);
  if (!asset || asset.sourceSha256 !== frame.sourceSha256) throw Error(`Frame not in PNG inventory: ${frame.url}`);
  frame.url = asset.url;
}
await writeFile(resolve(output, 'assets.json'), JSON.stringify(assets.map(asset => converted.get(asset.url))) + '\n');
await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest) + '\n');
console.log(JSON.stringify({ banks: manifest.banks.length, assets: assets.length }));
