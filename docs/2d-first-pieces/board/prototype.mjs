// Local visual/interaction trial. Drawing and animation live in scene.mjs, shared with the game.
import { P,N,B,R,Q,K,S,L,M,G,A,O,typeOf,colorOf,sqName,parseSq,makeMove } from './rules.mjs';
import { layouts,createPosition,actionsFor,destination } from './model.mjs';
import { clamp } from '../painted-mesh.mjs';
import { createScene } from './scene.mjs';
const $=id=>document.getElementById(id);
const names={ [K]:'King',[S]:'Beast',[P]:'Pawn',[N]:'Knight',[B]:'Bishop',[R]:'Rook',[Q]:'Queen',[L]:'Paladin',[M]:'Maester',[G]:'Guard',[A]:'Archer',[O]:'Ogre' };
const colours=['Ivory','Charcoal'];
const scene=createScene({canvas:$('scene'),pieces:{P,N,B,R,Q,K,S,L,M,G,A,O,typeOf,colorOf,sqName},closeup:{panel:$('encounter'),title:$('encounter-title'),ctx:$('closeup').getContext('2d')},onStatus:text=>{$('status').textContent=text;}});
const requestedLayout=new URLSearchParams(location.search).get('position');
if(Object.hasOwn(layouts,requestedLayout))$('layout').value=requestedLayout;
const squares=new Map();
let position=createPosition(), selected=parseSq('c4'), hover=null, history=[], lastSquares=[], ready=false;
const preference=matchMedia('(prefers-reduced-motion: reduce)'); $('reduced').checked=preference.matches;
const reduced=()=>$('reduced').checked;
function setHover(sq){hover=sq;scene.setAim(sq!==null&&actionsFor(position,selected).some(m=>destination(m)===sq)?sq:null);}
function describe(move,value) {
 const name=`${colours[colorOf(value)]} ${names[typeOf(value)]}`,from=sqName(move.from),to=sqName(destination(move));
 if(move.captures.length>1)return `${name} chained ${move.captures.map(sqName).join(' → ')} and stopped on ${sqName(move.to)}.`;
 if(move.swap)return `${name} swapped ${from} ↔ ${to}. Both pieces stay on the board.`;
 if(move.selfRemove)return `${name} captured on ${to}. Both the Paladin and the target are removed.`;
 if(move.shove)return `${name} pushed ${to} → ${sqName(move.shove.to)} and followed to ${sqName(move.to)}.`;
 if(typeOf(value)===N)return `${name} leaped ${from} → ${to}${move.captures.length?' and captured':''}.`;
 return move.captures.length?(typeOf(value)===A?`${name} shot ${to} and stayed on ${from}.`:`${name} captured on ${to}.`):`${name} moved ${from} → ${to}.`;
}
function commit(move,value) {
 history.push({position,message:describe(move,value),lastSquares:[...lastSquares]});
 position=makeMove({...position,turn:colorOf(value)},move);scene.setPosition(position);lastSquares=[move.from,destination(move),...(move.shove?[move.shove.to]:[])];
 selected=position.board[move.to]?move.to:null;scene.setSelected(selected);setHover(null);
 $('status').textContent=describe(move,value);updateUI();
}
function start(move) {
 if(scene.animating||!ready)return;
 $('action-picker').close();
 const value=position.board[move.from];
 if(reduced()){commit(move,value);return;}
 scene.play(move,{speed:$('slow').checked?2.5:1}).then(done=>{if(done)commit(move,value);});
 updateUI();
}
function cancel(){scene.cancel();$('action-picker').close();setHover(null);}
function reset(){cancel();position=createPosition($('layout').value);scene.setPosition(position);history=[];lastSquares=[];selected=$('layout').value==='ranks'?parseSq('b3'):$('layout').value==='angles'?parseSq('d4'):position.board[parseSq('c4')]?parseSq('c4'):position.board.findIndex(Boolean);scene.setSelected(selected);$('status').textContent=selectionPrompt();updateUI();}
function undo(){if(scene.animating){cancel();$('status').textContent='Action canceled. The position is unchanged.';}else if(history.length){const last=history.pop();position=last.position;scene.setPosition(position);lastSquares=last.lastSquares;selected=null;scene.setSelected(null);setHover(null);$('status').textContent='Last action undone. Choose either army.';}updateUI();}
function selectionPrompt(){
 if(selected===null)return 'Choose a piece from either army.';
 const value=position.board[selected],name=names[typeOf(value)];
 if(actionsFor(position,selected).length&&typeOf(value)===L)return 'Choose a marked square. Capturing a non-Pawn removes the Paladin too.';
 if(actionsFor(position,selected).length)return `Choose a marked square for the ${name.toLowerCase()}.`;
 if(typeOf(value)===P){
  const ahead=selected+(colorOf(value)?-8:8),blocker=position.board[ahead];
  if(blocker)return `The ${names[typeOf(blocker)].toLowerCase()} on ${sqName(ahead)} blocks this pawn. No diagonal capture is available. Select another piece.`;
 }
 return `This ${name.toLowerCase()} has no available actions in this trial. Select another piece.`;
}
function choose(square){
 if(scene.animating||!ready)return;
 const options=actionsFor(position,selected).filter(m=>destination(m)===square);
 if(options.length>1){
  $('action-title').textContent=`Choose what happens on ${sqName(square)}`;
  $('action-options').replaceChildren();
  for(const move of options){const button=document.createElement('button');button.textContent=actionLabel(move,position.board[selected]);button.onclick=()=>start(move);$('action-options').append(button);}
  $('action-picker').showModal();return;
 }
 if(options.length){start(options[0]);return;}
 if(position.board[square]){selected=selected===square?null:square;scene.setSelected(selected);setHover(null);$('status').textContent=selected===null?'Selection cleared.':selectionPrompt();}
 else $('status').textContent=(actionsFor(position,selected).length?'That square is not available. ':'')+selectionPrompt();
 updateUI();
}
function actionLabel(move,value){return move.captures.length>1?`Chain ${move.captures.map(sqName).join(' → ')}`:move.swap?`Swap with ${sqName(move.to)}`:move.shove?`Push ${sqName(move.shove.from)} → ${sqName(move.shove.to)}`:`${move.captures.length?(typeOf(value)===A?'Shoot':'Capture'):typeOf(value)===N?'Leap':'Move'} ${sqName(destination(move))}${move.selfRemove?' · both removed':''}`;}
function updateUI(){
 const value=selected===null?0:position.board[selected],moves=actionsFor(position,selected);
 for(const [sq,button] of squares){const v=position.board[sq],options=moves.filter(m=>destination(m)===sq),capture=options.some(m=>m.captures.length),push=options.some(m=>m.shove),swap=options.some(m=>m.swap),kind=swap?'swap':capture&&push?'capture or push':push?'push':capture?'attack':'move';button.className=`square${selected===sq?' selected':''}${options.length?(capture?' attack':'')+(push?' push':'')+(swap?' swap':'')+(!capture&&!push&&!swap?' move':''):''}${lastSquares.includes(sq)?' last':''}`;button.setAttribute('aria-pressed',String(selected===sq));button.setAttribute('aria-disabled',String(scene.animating));button.setAttribute('aria-label',`${sqName(sq)}${v?`, ${colours[colorOf(v)]} ${names[typeOf(v)]}`:', empty'}${options.length?`, ${kind} available`:''}`);button.tabIndex=sq===(selected??parseSq('a1'))?0:-1;
  button.title=options.some(m=>m.selfRemove)?'This capture removes the Paladin and his target.':'';
  if(push){const shove=options.find(m=>m.shove).shove,dx=Math.sign((shove.to&7)-(shove.from&7)),dy=Math.sign((shove.to>>3)-(shove.from>>3));button.dataset.pushArrow={'1,0':'→','-1,0':'←','0,1':'↑','0,-1':'↓','1,1':'↗','-1,1':'↖','1,-1':'↘','-1,-1':'↙'}[`${dx},${dy}`];}
 }
 $('allegiance').textContent=value?`${colours[colorOf(value)]} army`:'Choose a piece';$('piece-name').textContent=value?names[typeOf(value)]:'Your move.';
 $('description').textContent=!value?'Select a piece from either army to see its available actions.':typeOf(value)===K?'Move or capture one square in any direction. This trial has no check; king powers are off.':typeOf(value)===S?'Move one square in any direction. Capture an adjacent enemy, then keep biting adjacent enemies in the same turn. Choose a chain from the list, or stop after any bite.':typeOf(value)===Q?'Move and capture along clear ranks, files or diagonals. Pieces block the path; the Guard cannot be captured.':typeOf(value)===L?'Move along ranks, files or diagonals, passing over friends. Capturing a Pawn leaves the Paladin alive; capturing any other enemy removes him too. Guards block him.':typeOf(value)===M?'Move or capture one square in any direction, or swap with an adjacent friend. Swapping moves both pieces; it captures neither.':typeOf(value)===A?'Aim the wrist bow at a marked enemy. The Archer captures without leaving her square.':typeOf(value)===B?'Move and capture along diagonals. Pieces block the path; the Guard cannot be captured.':typeOf(value)===R?'Move and capture along ranks and files. Pieces block the path; the Guard cannot be captured.':typeOf(value)===G?'Move one square in any direction to an empty square. The Guard cannot capture. Only a King can capture him; an Ogre can push him.':typeOf(value)===N?'Leap two squares in one direction and one across. Jump over pieces; capture only on the landing square.':typeOf(value)===O?'Move one square in any direction. Capture an enemy or push a neighbour into the empty square beyond, then follow.':'Advance into an empty square, or thrust at an enemy on a forward diagonal.';
 const moveCount=moves.filter(m=>!m.captures.length&&!m.shove&&!m.swap).length,attackCount=moves.filter(m=>m.captures.length).length,pushCount=moves.filter(m=>m.shove).length,swapCount=moves.filter(m=>m.swap).length;
 const selectionName=value?`${colours[colorOf(value)]} ${names[typeOf(value)]} · ${sqName(selected)}`:'';
 $('selection-state').textContent=value?`${selectionName} · ${moveCount} move${moveCount===1?'':'s'} · ${attackCount} attack${attackCount===1?'':'s'}${pushCount?` · ${pushCount} push${pushCount===1?'':'es'}`:''}${swapCount?` · ${swapCount} swap${swapCount===1?'':'s'}`:''}`:'No piece selected';
 $('choices').replaceChildren();for(const m of moves){const b=document.createElement('button');b.textContent=actionLabel(m,value);b.className=m.swap?'swap-action':m.shove?'push-action':m.captures.length?'capture':'';b.disabled=scene.animating;b.onclick=()=>start(m);b.onpointerenter=()=>setHover(destination(m));b.onfocus=()=>setHover(destination(m));$('choices').append(b);}
 if(value&&!moves.length)$('selection-state').textContent=`${selectionName} · No available actions`;
 $('undo').disabled=!scene.animating&&!history.length;
 for(const side of [0,1])$(side?'black-count':'white-count').textContent=Array.from(position.board).filter(v=>v&&colorOf(v)===side).length;
 $('history').replaceChildren();for(const h of history.slice(-6)){const li=document.createElement('li');li.textContent=h.message;$('history').append(li);}
}
for(let row=0;row<8;row++)for(let col=0;col<8;col++){
 const sq=(7-row)*8+col,b=document.createElement('button');b.type='button';b.dataset.square=sqName(sq);b.onclick=()=>choose(sq);
 b.onpointerenter=()=>{if(!scene.animating)setHover(sq);};b.onfocus=()=>{if(!scene.animating)setHover(sq);};
 b.onkeydown=event=>{const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:8,ArrowDown:-8}[event.key];if(delta!==undefined){event.preventDefault();const f=sq&7,r=sq>>3;const nextF=clamp(f+(delta===1?1:delta===-1?-1:0),0,7),nextR=clamp(r+(delta===8?1:delta===-8?-1:0),0,7);squares.get(nextR*8+nextF).focus();}if(event.key==='Escape'&&!scene.animating){selected=null;scene.setSelected(null);setHover(null);$('status').textContent='Selection cleared. Choose a piece from either army.';updateUI();}};
 squares.set(sq,b);$('squares').append(b);
}
$('squares').addEventListener('pointerleave',()=>{if(!scene.animating)setHover(null);});
$('reset').onclick=reset;$('undo').onclick=undo;$('layout').onchange=reset;
$('cancel-choice').onclick=()=>$('action-picker').close();
$('reduced').onchange=()=>{scene.setReducedMotion(reduced());if(scene.animating)undo();};preference.addEventListener('change',()=>{$('reduced').checked=preference.matches;$('reduced').onchange();});scene.setReducedMotion(reduced());
updateUI();
scene.load().then(()=>{ready=true;reset();}).catch(()=>{$('status').textContent='The artwork could not load. Reload the preview to try again.';});
