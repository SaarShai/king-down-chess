// Writes the hand film the game loads, film-poses-144.webp, from the FILM atlas film-poses.webp (build-film.py).
//   node docs/2d-first-pieces/king-shadow/hands/pack-runtime.mjs
// The same 130 frames in the same 8-column grid, each 192 px cell at 144 px: the board's largest display of a hand
// (the Darkness gate, .37 board px a film px, at resolution 2) is 142 px. Lossy colour at quality 75 and quantized
// alpha show no change at that size and at 2x. The FILM atlas stays as the source.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const here=fileURLToPath(new URL('./',import.meta.url)),CELL=192,OUT=144;
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const source=await fs.readFile(here+'film-poses.webp'),build=JSON.parse(await fs.readFile(here+'film-build.json'));
assert.equal(sha(source),build.output_sha256,'film-poses.webp is the FILM output that film-build.json records');
const {width,height}=await sharp(source).metadata();
// Each cell has a transparent gutter (film-build.json zero_alpha_gutter), so one resize of the whole atlas keeps the cells apart.
const out=await sharp(source).resize(width*OUT/CELL,height*OUT/CELL,{kernel:'lanczos3'}).webp({quality:75,alphaQuality:50,effort:6}).toBuffer();
await fs.writeFile(here+'film-poses-144.webp',out);
console.log(JSON.stringify({file:'film-poses-144.webp',bytes:out.length,width:width*OUT/CELL,height:height*OUT/CELL,sha256:sha(out)}));
