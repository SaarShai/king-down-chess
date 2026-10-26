import { createScene } from '/docs/2d-first-pieces/board/scene.mjs';
import * as pieces from '/src/rules/engine';
import { GameRules } from '/src/game-rules';
import { cardLender } from '/src/render/effects/card';
import { drawShelter } from '/src/render/effects/state-flare';
import { drawSpell, SPELL_DURATIONS } from '/src/render/effects/card-spell';
import { pips, ring } from '/src/render/effects/indications';
import { fixtures, at } from '../../signals/fixtures';
import cardFixtures from '../../cards/fixtures.json';
import { clamp, ease, drawPaintedShelter, drawPaintedBorrow } from './paint.js';

const $=id=>document.getElementById(id);
const samples=[
 {id:'holy-light',title:'Holy Light',f:fixtures.holyLight,source:at('e2'),target:at('e3'),pawn:at('d4'),meaning:'Shelter · cannot be captured',description:'The Spirit king on e2 shelters the knight on e3. The rook and pawn cannot capture that knight.',choice:'Warm light gathers behind the knight. Uneven curls and small motes settle into a soft, broken shelter. The figure stays clear.',provenance:'signals/fixtures.ts · Ke1–e2 · HolyLight. Current calls drawShelter from state-flare.ts.'},
 {id:'mercy',title:'Mercy',f:fixtures.mercy,source:at('e2'),target:at('d3'),pawn:at('c4'),meaning:'Shelter · pawn captures still allowed',description:'The king shelters the knight on d3 from the rook. The pawn on c4 can still capture it. The red pawn mark stays visible.',choice:'A lower, uneven envelope of light stays open toward the pawn. The red pawn exception stays clear.',provenance:'signals/fixtures.ts · Ke1–e2 · Mercy. Current calls the real drawShelter with mercy=true.'},
 ...['Control','Mimic'].map(id=>{
 const fixture=cardFixtures.find(f=>f.item===id),rules=new GameRules({hands:[fixture.setup.hand,fixture.setup.hand]});const before=rules.fromFen(fixture.setup.fen);
 const moves=rules.legalMoves(before).filter(m=>rules.toLan(before,m)===fixture.actions[0]);if(moves.length!==1)throw new Error(`${id}: one legal action required`);
 const move=moves[0],after=rules.makeMove(before,move),lender=cardLender(rules,before,move);
 if(lender!==at('a1')||after.board[lender]!==before.board[lender]||pieces.typeOf(after.board[move.to])!==pieces.N)throw new Error(`${id}: real lender and unchanged knight required`);
 const letters=' PNBRQKALGMSOCVT';for(const [sq,want] of Object.entries(fixture.expected.board)){const p=after.board[at(sq)],letter=p?letters[p&15]:null;const actual=p&&p&16?letter.toLowerCase():letter;if(actual!==want)throw new Error(`${id}: wrong final ${sq}`);}
 return {id,title:id,f:{rules,before,after,move},lender,meaning:'Borrowed movement · still a knight',description:id==='Control'?'The knight borrows the adjacent rook’s move and captures on b7. The lending rook stays on a1.':'The knight borrows the rook’s move and travels b1–b4. The rook stays on a1. The enemy on b5 stays still.',choice:id==='Control'?'Soft teal light leaves the real rook. Broken curls briefly follow the intact knight, then disperse.':'Pale light gathers from the real rook. Small luminous fragments travel beside the intact knight, then disperse.',provenance:`cards/fixtures.json · ${fixture.actions[0]} · legal action and lender from the engine. Current calls drawSpell → borrow in card-spell.ts. Clock and actor travel match cards/study.js.`};
 })
];
const canvas=$('board'),scene=createScene({canvas,pieces,headroom:64,floor:null,kings:['spirit','shadow']});
scene.setLively({atmosphere:true,moves:false,idle:false,kings:false,captures:false,pawns:false});scene.setReducedMotion(true);
const query=matchMedia('(prefers-reduced-motion: reduce)');let reduced=query.matches,variant='proposed',active=samples[0],progress=1,playing=false,ready=false,flipped=false,speed=1,raf=0,lastTime=0,inView=true,frame;
const duration=()=>active.lender===undefined?2400:SPELL_DURATIONS[active.id];
const isShelter=()=>active.lender===undefined;
function cardFrame(){const t=reduced?1:progress;return {...active.f,index:0,t,travel:ease((t-.22)/.4),lender:active.lender};}
scene.setDecorate((c,_,layer,row)=>{
 if(!ready)return;
 if(isShelter()){
  const source=scene.foot(active.source),target=scene.foot(active.target),p=progress;
  // The production signal preview draws this same base mark and rule pip in both variants.
  if(layer==='under')ring(c,scene,active.target,'#a57d2f');
  if(layer==='under'||row===Math.max(scene.cell(active.source).row,scene.cell(active.target).row)){
   const f={progress:p,front:layer==='over',reduced};
   if(variant==='current')drawShelter(c,source,target,f,active.id==='mercy');
   else drawPaintedShelter(c,source,target,f,active.id==='mercy',scene.foot(active.pawn));
  }
  if(layer==='over'&&row===7)pips(c,scene,canvas.getBoundingClientRect().width,active.target,'#87611e',0,true,active.id==='mercy'?'pawn':undefined);
 }else{
  if(layer==='under'||row===7){if(!reduced&&progress<1){if(variant==='current')drawSpell(c,scene,active.id,frame,layer);else drawPaintedBorrow(c,scene,active.id,frame,layer);}}
  if(layer==='over'&&row===7&&!reduced&&progress>.22&&progress<.62){const a=scene.foot(frame.move.from),b=scene.foot(frame.move.to);c.save();c.translate((b.x-a.x)*frame.travel,(b.y-a.y)*frame.travel);scene.ghost(c,frame.before.board[frame.move.from],frame.move.from,1);c.restore();}
 }
});
function render(){
 frame=isShelter()?null:cardFrame();let pos=active.f.after;
 if(frame&&!reduced&&progress<.62){pos=frame.before;if(progress>.22){const board=new Uint8Array(pos.board);board[frame.move.from]=0;pos={...pos,board};}}
 scene.setPosition(pos);scene.redraw();
 $('title').textContent=active.title;$('meaning').textContent=active.meaning;$('description').textContent=active.description;$('choice').textContent=variant==='current'?'The source effect from the game, drawn without changes. Toggle to inspect the revised light at this same time.':active.choice;$('provenance').textContent=active.provenance;
 $('variant-title').textContent=variant==='current'?'Current':'Proposed';$('current').setAttribute('aria-pressed',String(variant==='current'));$('proposed').setAttribute('aria-pressed',String(variant==='proposed'));for(const sample of samples){const button=$('choose-'+sample.id);button.setAttribute('aria-pressed',String(sample===active));button.disabled=!ready;}
 const phase=progress===1?(isShelter()?'Shelter holds':'Move complete'):isShelter()?(progress<.4?'Shelter forms':'Shelter holds'):progress<.22?'Gather from rook':progress<.62?'Borrowed move':progress<.8?'Trace settles':'Trace clears';
 $('phase').textContent=reduced?'Still result':phase;$('time').textContent=`${(progress*duration()/1000).toFixed(2)} s`;$('scrub').value=String(Math.round(progress*1000));$('scrub').disabled=!ready||reduced;$('play').textContent=playing?'Pause':'Play';$('play').disabled=!ready||reduced;$('replay').disabled=!ready;
 $('clock-note').textContent=reduced?'Final meaning stays visible.':'Same board. Same moment.';$('reduced').checked=reduced;
 document.querySelector('.stage').dataset.state=JSON.stringify({variant,sample:active.id,progress,playing,reduced,flipped,speed});
 canvas.setAttribute('aria-label',`${active.title}. ${active.meaning}. ${active.description} ${phase}.`);
}
function stop(){playing=false;cancelAnimationFrame(raf);raf=0;lastTime=0;}
function seek(p){if(!Number.isFinite(p))return;stop();progress=reduced?1:clamp(p);render();}
function tick(now){if(!playing)return;if(document.hidden||!inView||reduced){stop();render();return;}if(lastTime)progress=clamp(progress+(now-lastTime)*speed/duration());lastTime=now;if(progress===1)stop();render();if(playing)raf=requestAnimationFrame(tick);}
function play(){if(!ready||reduced||document.hidden||!inView)return;if(playing){stop();render();return;}if(progress===1)progress=0;playing=true;lastTime=0;render();raf=requestAnimationFrame(tick);}
function replay(){seek(reduced?1:0);if(!reduced)play();}
function setVariant(v){if(!['current','proposed'].includes(v))throw new Error('Unknown variant');variant=v;render();}
function select(id){const sample=samples.find(s=>s.id===id);if(!sample)throw new Error('Unknown sample');stop();active=sample;progress=1;render();}
function setReduced(value){stop();reduced=value;if(reduced)progress=1;render();}
$('current').onclick=()=>setVariant('current');$('proposed').onclick=()=>setVariant('proposed');$('play').onclick=play;$('replay').onclick=replay;for(const sample of samples)$('choose-'+sample.id).onclick=()=>{select(sample.id);replay();};$('scrub').oninput=e=>seek(Number(e.target.value)/1000);$('speed').onchange=e=>{speed=Number(e.target.value);lastTime=0;render();};$('reduced').onchange=e=>setReduced(e.target.checked);
$('flip').onclick=()=>{flipped=!flipped;scene.setFlipped(flipped);$('flip').setAttribute('aria-pressed',String(flipped));render();};
query.addEventListener('change',()=>setReduced(query.matches));document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();render();}});
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView){stop();render();}},{threshold:.05}).observe(canvas);
new ResizeObserver(()=>{scene.setCoords(true,Math.max(15,14*960/Math.max(390,canvas.getBoundingClientRect().width)),16);scene.redraw();}).observe(canvas);
window.comparisonStudy={get ready(){return ready;},getState:()=>({variant,sample:active.id,progress,playing,reduced,flipped,speed,fixtureLegal:true,lender:active.lender===undefined?null:pieces.sqName(active.lender),frames:scene.frames}),setVariant,seek,select};
const params=new URLSearchParams(location.search);if(params.has('sample'))active=samples.find(s=>s.id===params.get('sample'))||active;if(params.get('variant')==='current')variant='current';if(params.has('progress'))progress=clamp(Number(params.get('progress')));if(params.get('reduced')==='1')reduced=true;if(reduced)progress=1;
scene.load().then(()=>{ready=true;$('loading').hidden=true;render();}).catch(e=>{$('loading').textContent='The art could not load. Reload this page.';console.error(e);});
window.addEventListener('pagehide',()=>{stop();scene.dispose();});render();
