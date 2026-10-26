import { createScene } from '../../../../../2d-first-pieces/board/scene.mjs';
import * as engine from '../../../../../../src/rules/engine';
import { drawMarks, type Highlights, type MarkState } from '../../../../../../src/render/marks';
import { boardInk, coordInk } from '../../../../../../src/render/board-ink';
import { StateEffects } from '../../../../../../src/render/effects/states';
import { drawBoardEffects } from '../../../../../../src/render/effects/board-effects';
import { marksModel, railsOf } from '../../../../../../src/marks-model';
import { threatsIn } from '../../../../../../src/move-text';
import { samples } from './fixtures';
import { proposed } from './proposed';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('board');
const scene = createScene({ canvas, pieces: engine, headroom: 64, floor: null, kings: ['spirit','shadow'] });
scene.setLively({ atmosphere:true, moves:false, idle:false, kings:false, pawns:false, captures:false });
scene.setReducedMotion(true);
const effects = new StateEffects();
let active = samples[0], selected = active.selected, variant: 'current' | 'proposed' = 'proposed', ready = false, flipped = false, cursor: number | null = null;
let marks: Highlights = {}, offered: engine.Move[] = [];
const query = matchMedia('(prefers-reduced-motion: reduce)');
function rebuild() {
  const menu = $<HTMLSelectElement>('selection');
  menu.replaceChildren(...Array.from(active.pos.board).flatMap((piece, sq) => piece && engine.colorOf(piece) === active.pos.turn
    ? [new Option(`${engine.sqName(sq)} · ${active.rules.nameOf(engine.typeOf(piece))}${sq === 18 ? ' (frozen)' : sq === 28 ? ' (protected)' : ''}`, String(sq), false, sq === selected)] : []));
  offered = active.rules.legalMoves(active.pos).filter(m => m.from === selected && !m.power && m.drop == null && !m.pass);
  const verb = marksModel(offered);
  const hintMove = offered.find(m => !m.captures.length) ?? offered[0];
  marks = { ...verb, selected, last:[active.last.from,active.last.to], hint: hintMove ? [selected,hintMove.to] : [],
    rails:railsOf(active.rules.rules.design,active.pos.board,selected,[...verb.moves,...verb.captures],verb.captures), threats:threatsIn(active.rules,active.pos) };
  effects.sync(active.rules,active.pos,0,false);
  scene.setPosition(active.pos);
  scene.setSelected(selected);
  render();
}
function render() {
  const width=canvas.getBoundingClientRect().width;
  const ink=coordInk(width);scene.setCoords(ink.shown,ink.size,ink.inset);scene.redraw();
  for (const value of ['current','proposed']) $(value).setAttribute('aria-pressed',String(variant === value));
  $('detail').textContent = `${engine.sqName(selected)} selected${selected === engine.parseSq('c3') ? ' · frozen' : selected === engine.parseSq('e4') ? ' · protected' : ''}`;
  $('target-count').textContent = `${marks.moves?.length ?? 0} moves · ${marks.captures?.length ?? 0} targets`;
  const shapes=variant === 'proposed' ? [
    ['Selected','<path d="M2 8V2h6M14 2h6v6M20 14v6h-6M8 20H2v-6" stroke="#67400f" stroke-width="2.5" fill="none"/>'],
    ['Move','<circle cx="11" cy="11" r="4" fill="#365540"/>'],
    ['Capture','<rect x="3" y="3" width="16" height="16" rx="5" fill="none" stroke="#8b3424" stroke-width="2"/>'],
    ['Hint','<path d="m11 4 7 7-7 7-7-7Z" stroke="#79531b" stroke-width="2" fill="#fff9e8"/>'],
    ['Last move','<path d="M2 13h17m-5-5 5 5-5 5" stroke="#675b48" stroke-width="2" fill="none"/>']
  ] : [
    ['Selected','<rect x="2" y="2" width="18" height="18" fill="#d8aa43" stroke="#684819"/>'],
    ['Move','<rect x="2" y="2" width="18" height="18" fill="#65975b"/>'],
    ['Capture','<circle cx="11" cy="11" r="7" fill="none" stroke="#b34230" stroke-width="2"/><path d="M11 1v6m0 8v6M1 11h6m8 0h6" stroke="#b34230"/>'],
    ['Hint','<rect x="3" y="3" width="16" height="16" fill="none" stroke="#c99a2e" stroke-width="3"/>'],
    ['Last move','<rect x="2" y="2" width="18" height="18" fill="#e6b84a" fill-opacity=".43"/>']
  ];
  if (marks.shots?.length) shapes.push(['Shot', '<circle cx="11" cy="11" r="7" fill="none" stroke="#8b3424" stroke-width="2"/><path d="M4 18 18 4m-5 0h5v5" stroke="#8b3424" stroke-width="2" fill="none"/>']);
  if (marks.threats?.length) shapes.push(['Threat', '<path d="M3 19 19 3m-7 0h7v7" stroke="#8b3424" stroke-width="2" fill="none"/>']);
  $('key').innerHTML=shapes.map(([label,svg])=>`<span><svg viewBox="0 0 22 22" aria-hidden="true">${svg}</svg>${label}</span>`).join('');
  $('evidence').textContent=JSON.stringify(evidence(),null,2);
  canvas.setAttribute('aria-label',`${active.title}. ${engine.sqName(selected)} selected. ${marks.moves?.length ?? 0} legal moves and ${marks.captures?.length ?? 0} capture targets. c3 is frozen; e4 is protected. Use arrow keys to inspect and Enter to select.`);
}
function evidence() {
  return { fen:active.fen, inputs:active.inputs, steps:active.steps, pieces:Array.from(active.pos.board).filter(Boolean).length,
    turn:active.pos.turn === 0 ? 'White' : 'Black', selected:engine.sqName(selected), legalMoves:offered.map(m=>active.rules.toLan(active.pos,m)),
    destinations:(marks.moves ?? []).map(engine.sqName), captures:(marks.captures ?? []).map(engine.sqName), shots:(marks.shots ?? []).map(engine.sqName),
    frozenCannotMove:!active.rules.legalMoves(active.pos).some(m=>m.from === engine.parseSq('c3')),
    protection:active.protection, freezeControl:active.freezeControl,
    states:active.states.map(s=>({kind:s.kind,square:engine.sqName(s.sq),turns:s.turns,owner:s.owner})),
    hint:(marks.hint ?? []).map(engine.sqName),last:(marks.last ?? []).map(engine.sqName) };
}
scene.setDecorate((ctx,scene,layer,row)=>{
  const width=canvas.getBoundingClientRect().width;
  const state: MarkState = { marks, piece:active.pos.board[selected], preview:cursor, k:Math.max(1,700/width),px:960/width, board:active.pos.board,ink:boardInk(width) };
  if (variant === 'current') {
    // Match PaintedView.drawMarks: last wash, production legend, then production state effects.
    if (layer === 'under') {ctx.save();for (const sq of marks.last ?? []) {const c=scene.cell(sq);ctx.fillStyle='#e6b84a6e';ctx.fillRect(scene.PAD+c.col*scene.TILE,scene.PAD+c.row*scene.TILE,scene.TILE,scene.TILE);}ctx.restore();}
    drawMarks(ctx,scene,layer,state,row);
  } else proposed(ctx,scene,layer,state,row);
  drawBoardEffects(ctx,scene,layer,row,effects,variant === 'current' ? marks : {...marks,hint:[]},width,0,false,false,cursor,active.pos.board[selected]);
});
function setVariant(value: 'current' | 'proposed') { if(value !== 'current' && value !== 'proposed') return;variant=value;render(); }
function select(sq:number) {if(active.pos.board[sq] && engine.colorOf(active.pos.board[sq]) === active.pos.turn){ selected=sq;$<HTMLSelectElement>('selection').value=String(sq);rebuild();}}
function flip(){flipped=!flipped;scene.setFlipped(flipped);$('flip').setAttribute('aria-pressed',String(flipped));render();}
$('current').addEventListener('click',()=>setVariant('current'));
$('proposed').addEventListener('click',()=>setVariant('proposed'));
$('flip').addEventListener('click',flip);
$('sample').addEventListener('change',()=>{active=samples.find(s=>s.id === $<HTMLSelectElement>('sample').value)!;selected=active.selected;cursor=null;$<HTMLSelectElement>('selection').value=String(selected);rebuild();});
$('selection').addEventListener('change',()=>select(Number($<HTMLSelectElement>('selection').value)));
canvas.addEventListener('click',event=>{const r=canvas.getBoundingClientRect();const sq=scene.squareAt((event.clientX-r.left)*960/r.width,(event.clientY-r.top)*960/r.width);if(sq != null) select(sq);});
canvas.addEventListener('keydown',event=>{
  if (event.key.toLowerCase() === 'f') {event.preventDefault();flip();return;}
  if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();select(cursor ?? selected);return;}
  const direction:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};
  const delta=direction[event.key];if(!delta)return;event.preventDefault();const sq=cursor ?? selected,sign=flipped?-1:1;
  const x=Math.max(0,Math.min(7,sq%8+delta[0]*sign)),y=Math.max(0,Math.min(7,(sq>>3)+delta[1]*sign));cursor=y*8+x;render();
});
new ResizeObserver(render).observe(canvas);
Object.assign(window,{comparisonStudy:{get ready(){return ready;},setVariant,getState:()=>({variant,sample:active.id,reduced:query.matches,playing:false,selected,selectedSquare:engine.sqName(selected),flipped,cursor,board:Array.from(active.pos.board),legalFixture:evidence(),marks,scene:{frames:scene.frames,playing:scene.playing,pose:'static',width:960,height:1024},bounds:canvas.getBoundingClientRect().toJSON()})}});
rebuild();
scene.load().then(()=>{ready=true;$('loading').hidden=true;render();}).catch(error=>{$('loading').textContent=`Painted art failed to load. Reload the preview. ${String(error)}`;console.error(error);});
window.addEventListener('pagehide',()=>scene.dispose());
