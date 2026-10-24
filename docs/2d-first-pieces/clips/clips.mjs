// Character clips (clips/README.md): whole painted drawings that a figure plays once when it is selected —
// the Knight taps his lance, the Rook slams his stone arm, it cracks and heals. The drawings sit in one atlas
// a piece (clips/build.mjs): a row band an army, one cell a drawing, each cell covering the same box of the
// 1152 px sprite at `factor` of its size. Both armies' clips end on the drawing they start with.
import {FRAMES} from './frames.mjs';
// One literal URL per image: bundlers resolve and copy each file.
const FILES={knight:new URL('../knight/tap.webp',import.meta.url).href,rook:new URL('../rook/slam.webp',import.meta.url).href};
export const CLIPS=Object.fromEntries(Object.entries(FRAMES).map(([name,f])=>[name,{...f,file:FILES[name],duration:f.sequence.length/f.fps*1000}]));
/** The drawing clip `name` shows `ms` after it starts, or null before it starts and once it has ended. */
export function frameAt(name,ms){
 const c=CLIPS[name];
 return c&&ms>=0&&ms<c.duration?c.sequence[Math.floor(ms*c.fps/1000)]:null;
}
/** Draws drawing `index` of army `side` (0 Ivory, 1 Charcoal) into `canvas`, one cell in size. */
export function drawFrame(canvas,image,name,side,index){
 const c=CLIPS[name],[w,h]=c.cell,[x,y]=c.cells[index],g=canvas.getContext('2d');
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}else g.clearRect(0,0,w,h);
 g.drawImage(image,x,y+side*c.rows*h,w,h,0,0,w,h);
}
/** A sprite point (the figure's anchor) in a cell canvas's pixels. */
export const inCell=(name,point)=>{const c=CLIPS[name];return {x:(point.x-c.box.x)*c.factor,y:(point.y-c.box.y)*c.factor};};
