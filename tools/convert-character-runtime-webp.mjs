/** Convert a retained PNG runtime package without changing its source or geometry. */
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import sharp from 'sharp';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const args = process.argv.slice(2), cacheAt = args.indexOf('--cache'), cacheArg = cacheAt < 0 ? null : args[cacheAt + 1];
if (cacheAt >= 0) args.splice(cacheAt, 2);
const [sourceArg, outputArg, ...extra] = args;
if (!sourceArg || !outputArg || extra.length || cacheAt >= 0 && !cacheArg) throw Error('Use: node tools/convert-character-runtime-webp.mjs <PNG package> <new output> [--cache <WebP package>]');
const source = resolve(sourceArg), output = resolve(outputArg), rel = relative(source, output);
if (!rel || !rel.startsWith('..')) throw Error('Output must be outside source');
const manifest = JSON.parse(await readFile(resolve(source, 'manifest.json')));
const assets = JSON.parse(await readFile(resolve(source, 'assets.json')));
const attackAssets = new Set(manifest.banks.filter(bank => bank.kind === 'attack').flatMap(bank => bank.frames.map(frame => frame.url)));
// A frame whose source hash is in the cache keeps its converted WebP bytes. The bytes, the size and
// the alpha are checked, so a stale or edited package cannot pass as a cached conversion.
const cacheDir = cacheArg ? resolve(cacheArg) : null;
const cache = cacheDir ? new Map(JSON.parse(await readFile(resolve(cacheDir, 'assets.json'))).map(asset => [asset.sourceSha256, asset])) : new Map();
await mkdir(output); // Refuse an existing output, including partial prior builds.
await mkdir(resolve(output, 'assets'));
await cp(resolve(source, 'effects'), resolve(output, 'effects'), { recursive: true });
const converted = new Map();
const counts = { reused: 0, converted: 0 };
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < assets.length) {
    const asset = assets[next++];
    if (asset.url !== `assets/${asset.sha256}.png` || !/^[a-f0-9]{64}$/.test(asset.sha256)) throw Error('Invalid PNG asset path');
    const bytes = await readFile(resolve(source, asset.url));
    if (hash(bytes) !== asset.sha256) throw Error(`PNG hash mismatch: ${asset.url}`);
    const image = sharp(bytes), metadata = await image.metadata();
    if (!metadata.hasAlpha || metadata.width !== asset.size[0] || metadata.height !== asset.size[1]) throw Error(`PNG geometry or alpha mismatch: ${asset.url}`);
    const cached = cache.get(asset.sourceSha256);
    if (cached) {
      if (cached.encoding !== 'webp-q90-alpha-lossless' || JSON.stringify(cached.size) !== JSON.stringify(asset.size) || cached.top !== asset.top || cached.url !== `assets/${cached.sha256}.webp`) throw Error(`Cached conversion does not match: ${asset.url}`);
      const webp = await readFile(resolve(cacheDir, cached.url));
      if (hash(webp) !== cached.sha256) throw Error(`Cached WebP hash mismatch: ${cached.url}`);
      const info = await sharp(webp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      if (info.info.width !== asset.size[0] || info.info.height !== asset.size[1] || !info.data.includes(0) || !info.data.some(value => value > 0)) throw Error(`Cached WebP geometry or alpha mismatch: ${cached.url}`);
      await writeFile(resolve(output, cached.url), webp);
      converted.set(asset.url, { ...asset, url: cached.url, sha256: cached.sha256, encoding: 'webp-q90-alpha-lossless' });
      counts.reused++;
      continue;
    }
    let input=image;
    if (attackAssets.has(asset.url)) {
      const {data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
      let changed=false;
      const clear=(x,y)=>{const i=(y*info.width+x)*4+3;if(data[i]>1)throw Error(`Attack frame has an opaque border: ${asset.url}`);if(data[i]){data[i]=0;changed=true;}};
      for(let x=0;x<info.width;x++){clear(x,0);clear(x,info.height-1);}
      for(let y=1;y<info.height-1;y++){clear(0,y);clear(info.width-1,y);}
      if(changed)input=sharp(data,{raw:{width:info.width,height:info.height,channels:4}});
    }
    const webp = await input.webp({ quality: 90, alphaQuality: 100, exact: true, effort: 6 }).toBuffer(), sha256 = hash(webp), url = `assets/${sha256}.webp`;
    await writeFile(resolve(output, url), webp);
    converted.set(asset.url, { ...asset, url, sha256, encoding: 'webp-q90-alpha-lossless' });
    counts.converted++;
  }
}));
for (const bank of manifest.banks) for (const frame of bank.frames) {
  const asset = converted.get(frame.url);
  if (!asset || asset.sourceSha256 !== frame.sourceSha256) throw Error(`Frame not in PNG inventory: ${frame.url}`);
  frame.url = asset.url;
}
await writeFile(resolve(output, 'assets.json'), JSON.stringify(assets.map(asset => converted.get(asset.url))) + '\n');
await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest) + '\n');
console.log(JSON.stringify({ banks: manifest.banks.length, assets: assets.length, ...(cacheDir ? counts : {}) }));
