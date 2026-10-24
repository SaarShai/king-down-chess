// Package the original Drive painting for the board's two-cell sheet and UI portraits.
// Keep its colours and proportions; army identity comes from the board's existing side treatment.
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const path = name => fileURLToPath(new URL(name, import.meta.url));
const figure = await sharp(path('original.png')).resize({height:1000}).png().toBuffer();
const {width} = await sharp(figure).metadata(), left = Math.round((768-width)/2);
const sheet = await sharp({create:{width:1536,height:1024,channels:4,background:'#00000000'}})
 .composite([{input:figure,left,top:0},{input:figure,left:768+left,top:0}]).png().toBuffer();
await sharp(sheet).toFile(path('king.png'));
await sharp(sheet).webp({lossless:true}).toFile(path('king.webp'));
for(const suffix of ['', '-b']) await sharp(path('original.png')).resize({height:448}).webp({quality:92}).toFile(path(`../../../public/ui/kings/stratus${suffix}.webp`));
