import { createScene } from '../../../../2d-first-pieces/board/scene.mjs';
import * as pieces from '../../../../../src/rules/engine';
import { drawMarks, type Highlights } from '../../../../../src/render/marks';
import { marksModel } from '../../../../../src/marks-model';
import { boardInk } from '../../../../../src/render/board-ink';
import { checkersOf } from '../../../../../src/move-text';
import { frozenPieces } from '../../../../../src/render/frost';
import { fixtures, at, type Fixture } from './fixtures';
import { drawFreeze, drawIceWall, drawFirewall, materialState } from '../../../../../src/render/effects/materials';
import { drawGuard, drawShelter, drawSwap } from '../../../../../src/render/effects/state-flare';
import { drawArcherFocus } from '../../../../../src/render/effects/archer-flare';
import { ring, link, pips, checkImpact, SIGNAL_DURATION_MS } from '../../../../../src/render/effects/indications';
import './style.css';

type Sample = { id: string; title: string; group: string; detail: string; change: string; f: Fixture; selected?: number };
const samples: Sample[] = [
  { id: 'freeze', title: 'Freeze', group: '01 · Conditions', f: fixtures.freeze, detail: 'The knight on d5 cannot move for one Black turn. The crystal mark clears when that turn ends.', change: 'New: cracked ice builds around the lower figure. Frost climbs, holds, then melts. The piece keeps its shape.' },
  { id: 'archer', title: 'Distant Archer targets', group: '02 · Target', f: fixtures.archer, selected: at('c3'), detail: 'The Archer on c3 can shoot c5 over the pawn on c4. The Archer stays on c3.', change: 'New: warm focus feathers gather at the Archer and its distant eligible target. No shot is fired. The production target and shot badge stay still.' },
  { id: 'ward', title: 'Ice Wall', group: '01 · Conditions', f: fixtures.ward, detail: 'The rook on a4 cannot be captured during the next turn. The wall does not stop a shove.', change: 'New: a thick curved ice wall forms around the figure. Its front and back surfaces show its depth.' },
  { id: 'firewall', title: 'Firewall', group: '01 · Conditions', f: fixtures.firewall, detail: 'Every White piece is safe from capture until White’s next turn. White can still make its move.', change: 'New: red-orange flames with gold cores rise around each White piece. The fire protects the army.' },
  { id: 'guard', title: 'Guard protection', group: '01 · Conditions', f: fixtures.guard, detail: 'Only a king can capture this Guard on d4. The rook on d8 cannot capture it. The Black king on e5 can.', change: 'New: three steel plates form a broad shield below the Guard’s face. One bright reflection crosses the metal, then it holds still. The red crown stays: only a king can capture the Guard.' },
  { id: 'holy-light', title: 'Holy Light shelter', group: '01 · Conditions', f: fixtures.holyLight, detail: 'The Spirit king on e2 shelters the knight on e3. The rook and pawn cannot capture that knight.', change: 'New: the Spirit king gathers warm light and sends it into a broad mantle behind the supported knight. The shield stays.' },
  { id: 'mercy', title: 'Mercy shelter', group: '01 · Conditions', f: fixtures.mercy, detail: 'The Spirit king on e2 shelters the knight on d3 from the rook. The pawn on c4 can still capture the knight.', change: 'New: the king sends soft light to an open mantle behind the knight. The shield keeps a red pawn symbol: the pawn can still capture.' },
  { id: 'ghost', title: 'Hovered move', group: '03 · Move marks', f: fixtures.rook, selected: at('d4'), detail: 'The faint rook on d5 shows where the selected rook will stand. The real rook stays on d4.', change: 'Reused: the production figure ghost and hover mark. New: a short foot ring.' },
  { id: 'swap', title: 'Swap pair', group: '04 · Special moves', f: fixtures.swap, selected: at('a1'), detail: 'The Maester on a1 can swap places with the king on e1. No piece is captured.', change: 'New: two bright, intertwined currents loop between the pair, then settle into quiet wisps. This previews the swap; both figures stay in place.' },
  { id: 'shove', title: 'Shove and landing', group: '04 · Special moves', f: fixtures.shove, selected: at('c4'), detail: 'The Ogre on c4 pushes the pawn from c5 to c6, then enters c5. No piece is captured.', change: 'Reused: the shove ring and landing arrow. New: a trace joins target and landing.' },
  { id: 'check', title: 'Check and cause', group: '05 · Read the board', f: fixtures.check, detail: 'The Black rook on e3 attacks the White king on e1. White must answer the check.', change: 'New: a crimson danger burst rises behind the king, with a ground shock and scattering embers. It settles into a quiet line from the attacker.' },
  { id: 'hint', title: 'Hint', group: '05 · Read the board', f: fixtures.rook, selected: at('d4'), detail: 'This sample points to the legal move d4–d5. A gold frame shows the source and destination.', change: 'Reused: the hint frames. New: a single trace. This fixture does not run a search.' },
];
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
$('study').innerHTML = `<header><a class="back" href="../index.html">← Effects lab</a><p class="eyebrow">King Down · Motion study</p><h1>Board signals</h1><p class="intro">Clear effects. Still figures. One signal at a time.</p></header>
<div class="layout"><section class="stage" aria-label="Board preview"><div class="board"><canvas id="board" aria-label="King Down board signal sample"></canvas><p id="loading">Loading the painted board…</p></div><div class="status"><span id="phase">Ready</span><strong id="meaning"></strong><p id="status-text" aria-live="polite"></p></div></section>
<aside><label class="field" for="sample">Signal study</label><select id="sample">${samples.map(s => `<option value="${s.id}">${s.title}</option>`).join('')}</select><p id="group" class="eyebrow"></p><h2 id="title"></h2><p id="detail"></p><div class="controls"><button id="play" type="button">Play</button><button id="replay" type="button">Replay</button><button id="flip" type="button" aria-pressed="false">Flip board</button></div><label class="field" for="scrub">Timeline <output id="time"></output></label><input type="range" id="scrub" min="0" max="1000" value="420" aria-label="Effect timeline"><div class="timeline-labels"><span>Onset</span><span>Hold</span><span>Clear</span></div><div class="options"><label for="speed">Speed <select id="speed"><option value="1">Normal</option><option value="0.5">Slow</option></select></label><label class="motion"><input id="reduced" type="checkbox"> Reduced motion</label></div><div class="notes"><h3>What changes</h3><p id="change"></p><p id="rule"></p></div><p class="caption">Use the timeline to compare exact frames. Reduced motion keeps a still signal. Figures do not bend or stretch.</p></aside></div>`;
const transport = document.createElement('div'); transport.className = 'transport';
const aside = document.querySelector('aside')!;
for (const selector of ['label[for=sample]', '#sample', '.controls', 'label[for=scrub]', '#scrub', '.timeline-labels', '.options']) transport.append(aside.querySelector(selector)!);
aside.prepend(transport);
const canvas = $<HTMLCanvasElement>('board');
canvas.width = 960; canvas.height = 1024;
const scene = createScene({ canvas, pieces, headroom: 64, kings: ['spirit', 'shadow'], floor: null });
scene.setLively({ atmosphere: true, moves: false, idle: false, kings: false, captures: false, pawns: false });
scene.setReducedMotion(true);
let active = samples[0], progress = .42, playing = false, speed = 1, flipped = false, raf = 0, lastTime = 0, ready = false;
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = motionQuery.matches, currentPosition = active.f.after;
let displayedPosition: pieces.Position | undefined;
const duration = SIGNAL_DURATION_MS, clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { n = clamp(n); return n * n * (3 - 2 * n); };
const enter = () => smooth(progress / .24);
function marks(): Highlights {
  const f = active.f, selected = active.selected;
  const pos = f.before;
  const moves = f.rules.legalMoves(pos).filter(m => selected === undefined || m.from === selected);
  switch (active.id) {
    case 'archer': return { selected, ...marksModel(moves.filter(m => m.from === m.to && m.captures.length > 0)) };
    case 'ghost': return { selected, moves: [at('d5')] };
    case 'swap': return { selected, ...marksModel([f.move!]) };
    case 'shove': return { selected, ...marksModel([f.move!]) };
    case 'hint': return { hint: [f.move!.from, f.move!.to] };
    default: return {};
  }
}
function material(ctx: CanvasRenderingContext2D, sq: number, front: boolean, kind: 'freeze'|'ward'|'firewall') {
  const f=scene.foot(sq), draw=kind==='freeze'?drawFreeze:kind==='ward'?drawIceWall:drawFirewall;
  draw(ctx,{x:f.x,y:f.y,front,progress,seed:sq});
  if(front && materialState(progress).life>.08) pips(ctx,scene,canvas.getBoundingClientRect().width,sq,kind==='firewall'?'#a73c12':'#316d89',progress<.72?(kind==='freeze'?frozenPieces(active.f.rules,active.f.after)[0]?.turns??1:active.f.after.marks?.[0]?.left??1):0,kind!=='freeze');
}
function renderDecoration(ctx: CanvasRenderingContext2D, layer: 'under'|'over', row?: number) {
  const m=marks(), width=Math.max(1,canvas.getBoundingClientRect().width), last=layer==='over'&&row===7;
  const pulse=1-smooth((progress-.1)/.65), target=active.f.move?.to;
  if(layer==='under') switch(active.id) {
    case 'archer': ring(ctx,scene,at('c3'),'#bd8d2c',1);break;
    case 'ghost': ring(ctx,scene,at('d5'),'#6d8145',pulse);break;
  }
  drawMarks(ctx,scene,layer,{marks:m,piece:m.selected==null?0:currentPosition.board[m.selected],preview:active.id==='ghost'?at('d5'):null,k:Math.max(1,700/width),px:960/width,board:currentPosition.board,ink:boardInk(width)},row);
  if(active.id==='freeze' && (layer==='under'||row===scene.cell(at('d5')).row)) material(ctx,at('d5'),layer==='over','freeze');
  if(active.id==='ward' && (layer==='under'||row===scene.cell(at('a4')).row)) material(ctx,at('a4'),layer==='over','ward');
  if(active.id==='firewall') currentPosition.board.forEach((v,sq)=>{if(v && pieces.colorOf(v)===0 && (layer==='under'||row===scene.cell(sq).row))material(ctx,sq,layer==='over','firewall');});
  if (layer==='under' && ['guard','holy-light','mercy'].includes(active.id)) ring(ctx,scene,at(active.id==='guard'?'d4':active.id==='holy-light'?'e3':'d3'),'#a57d2f');
  if(layer==='under' && active.id==='check') checkImpact(ctx,scene,at('e1'),progress,reduced);
  const frame={progress,front:layer==='over',reduced};
  if(active.id==='guard' && (layer==='under'||row===scene.cell(at('d4')).row)) drawGuard(ctx,scene.foot(at('d4')),frame);
  if(active.id==='holy-light' && (layer==='under'||row===Math.max(scene.cell(at('e2')).row,scene.cell(at('e3')).row))) drawShelter(ctx,scene.foot(at('e2')),scene.foot(at('e3')),frame);
  if(active.id==='mercy' && (layer==='under'||row===Math.max(scene.cell(at('e2')).row,scene.cell(at('d3')).row))) drawShelter(ctx,scene.foot(at('e2')),scene.foot(at('d3')),frame,true);
  if(active.id==='archer') {
    const source=scene.foot(active.selected!);
    for(const sq of [active.selected!,...m.shots??[]]) if(layer==='under'||row===scene.cell(sq).row) drawArcherFocus(ctx,scene.foot(sq),source,progress,layer==='over',reduced,sq===active.selected);
  }
  if(active.id==='swap' && (layer==='under'||row===Math.max(scene.cell(at('a1')).row,scene.cell(at('e1')).row))) drawSwap(ctx,scene.foot(at('a1')),scene.foot(at('e1')),frame);
  if(!last)return;
  switch(active.id) {
    case 'guard': pips(ctx,scene,canvas.getBoundingClientRect().width,at('d4'),'#87611e',0,true,'king');break;
    case 'holy-light': pips(ctx,scene,canvas.getBoundingClientRect().width,at('e3'),'#87611e',0,true);break;
    case 'mercy': pips(ctx,scene,canvas.getBoundingClientRect().width,at('d3'),'#87611e',0,true,'pawn');break;
    case 'shove': link(ctx,scene,at('c5'),at('c6'),'#2f7f75',false,enter());break;
    case 'check': ctx.save();ctx.globalAlpha=progress<.3?1:.48;for(const ch of checkersOf(active.f.rules,active.f.before))link(ctx,scene,ch.sq,ch.king,'#b84d25',ch.path==='arc',Math.max(.06,smooth(progress/.16)));ctx.restore();break;
    case 'hint': link(ctx,scene,active.f.move!.from,target!,'#a77b25',false,enter(),true);break;
  }
}
scene.setDecorate((ctx,_scene,layer,row)=>renderDecoration(ctx,layer,row));
function stateText() {
  const condition=['freeze','ward','firewall'].includes(active.id), phase=condition?(progress<.26?'Onset':progress<.72?'Hold':progress<1?'Clear':'Complete'):(progress<.25?'Onset':progress<.75?'Hold':'Complete');
  $('phase').textContent=phase;
  $('meaning').textContent=active.id==='freeze'?(progress<.72?'Cannot move · 1 turn left':'Turn ends · freeze clears'):active.id==='ward'||active.id==='firewall'?(progress<.72?'Cannot be captured · 1 turn left':'Turn ends · ward clears'):active.id==='guard'?'Only a king can capture the Guard':active.id==='holy-light'?'Shelter · cannot be captured':active.id==='mercy'?'Shelter · pawn captures still allowed':active.id==='archer'?'Shot available · Archer stays on c3':active.title;
  $('status-text').textContent=reduced?'Reduced motion · use the timeline to inspect each state.':playing?'Playing · figures stay still.':progress===1?'Replay to see the effect again.':'Paused · drag the timeline or press Play.';
  $('time').textContent=`${(progress*duration/1000).toFixed(1)} s / 4.8 s`;
  $<HTMLInputElement>('scrub').value=String(Math.round(progress*1000));
  $('play').textContent=playing?'Pause':'Play';$<HTMLButtonElement>('play').disabled=reduced||!ready;
}
function render() {
  currentPosition = active.f.expired && progress >= .72 ? active.f.expired : ['freeze','ward','firewall','guard','holy-light','mercy'].includes(active.id) ? active.f.after:active.f.before;
  if(currentPosition!==displayedPosition){scene.setPosition(currentPosition);displayedPosition=currentPosition;}
  scene.setSelected(active.selected??null);scene.redraw();stateText();
}
function stop(){playing=false;cancelAnimationFrame(raf);raf=0;lastTime=0;stateText();}
function tick(now:number){if(!playing||reduced||document.hidden){stop();return;}if(lastTime)progress=clamp(progress+(now-lastTime)*speed/duration);lastTime=now;render();if(progress>=1)stop();else raf=requestAnimationFrame(tick);}
function play(){if(!ready||reduced||document.hidden)return;if(progress>=1)progress=0;playing=true;lastTime=0;raf=requestAnimationFrame(tick);stateText();}
function seek(value:number){stop();progress=clamp(Number.isFinite(value)?value:0);render();}
function select(id:string){const next=samples.find(s=>s.id===id);if(!next)throw new Error(`Unknown sample: ${id}`);stop();active=next;progress=.42;$<HTMLSelectElement>('sample').value=id;$('title').textContent=active.title;$('group').textContent=active.group;$('detail').textContent=active.detail;$('change').textContent=active.change;$('rule').textContent=id==='archer'?'far2: two squares in each straight direction, plus two squares on either forward diagonal. A blocker does not stop the shot.':['freeze','ward','firewall'].includes(id)?'The final phase applies the next turn in the engine. The mark and its turn pip then clear.':'The board and all figures come from the game. The engine supplies the state and legal moves.';render();}
$<HTMLSelectElement>('sample').addEventListener('change',e=>{select((e.target as HTMLSelectElement).value);if(!reduced){seek(0);play();}});
$('play').addEventListener('click',()=>playing?stop():play());$('replay').addEventListener('click',()=>{seek(0);if(!reduced)play();else seek(.42);});
$<HTMLInputElement>('scrub').addEventListener('input',e=>seek(Number((e.target as HTMLInputElement).value)/1000));
$<HTMLSelectElement>('speed').addEventListener('change',e=>{speed=Number((e.target as HTMLSelectElement).value);lastTime=0;});
$<HTMLInputElement>('reduced').checked=reduced;$('reduced').addEventListener('change',e=>{reduced=(e.target as HTMLInputElement).checked;stop();if(reduced&&(progress<.25||progress>.75))progress=.42;render();});
$('flip').addEventListener('click',()=>{flipped=!flipped;scene.setFlipped(flipped);$('flip').setAttribute('aria-pressed',String(flipped));render();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
motionQuery.addEventListener('change',()=>{reduced=motionQuery.matches;$<HTMLInputElement>('reduced').checked=reduced;stop();if(reduced)progress=.42;render();});
new ResizeObserver(()=>{scene.setCoords(true,Math.max(15,26*960/Math.max(390,canvas.getBoundingClientRect().width)),16);scene.redraw();}).observe(canvas);
const api={get ready(){return ready;},select,seek,getState:()=>({id:active.id,progress,playing,itemCount:samples.length,reduced,flipped,sceneFrames:scene.frames,fixtureLegal:true}),samples:samples.map(({id,title})=>({id,title}))};
Object.assign(window,{effectsStudy:api});
const requested = new URLSearchParams(location.search).get('sample');
select(samples.find(s=>s.id===requested)?.id||'freeze');
scene.load().then(()=>{ready=true;$('loading').hidden=true;render();if(!reduced){seek(0);play();}}).catch(error=>{$('loading').textContent=`The board could not load. ${String(error)}`;});
window.addEventListener('pagehide',()=>{stop();scene.dispose();});
