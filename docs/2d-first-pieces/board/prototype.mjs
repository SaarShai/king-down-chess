// Local visual/interaction prototype. The production game renderer is untouched.
import { P,N,B,R,G,A,O,typeOf,colorOf,sqName,parseSq,makeMove } from './rules.mjs';
import { layouts,createPosition,actionsFor,destination } from './model.mjs';
import { clamp } from '../painted-mesh.mjs';
import * as archer from '../wrist-bow/aiming.mjs';
import * as pawn from '../lance/aiming.mjs';
import * as ogre from '../ogre/motion.mjs';
import * as knight from '../knight/motion.mjs';
import * as bishop from '../bishop/motion.mjs';
import * as rook from '../rook/motion.mjs';
import * as guard from '../guard/motion.mjs';
const $=id=>document.getElementById(id), scene=$('scene'), ctx=scene.getContext('2d'), detail=$('closeup').getContext('2d');
const SIZE=960, PAD=32, TILE=112, names={ [P]:'Pawn',[N]:'Knight',[B]:'Bishop',[R]:'Rook',[G]:'Guard',[A]:'Archer',[O]:'Ogre' }, colours=['Ivory','Charcoal'];
const art={ [P]:new Image(),[N]:new Image(),[B]:new Image(),[R]:new Image(),[G]:new Image(),[A]:new Image(),[O]:new Image() };
const specs={ [P]:{anchor:{x:330,y:870},hit:{x:327,y:556},pivot:{x:430,y:521},scale:.132,min:pawn.MIN_ANGLE,max:pawn.MAX_ANGLE}, [A]:{anchor:{x:382,y:1066},hit:{x:344,y:424},scale:.106,min:archer.MIN_ANGLE,max:archer.MAX_ANGLE} };
specs[O]={anchor:ogre.ANCHOR,hit:ogre.HIT,scale:.155};
specs[N]={anchor:knight.ANCHOR,hit:knight.HIT,scale:.125};
const newMotions={ [B]:bishop,[R]:rook,[G]:guard };
for(const [type,scale] of [[B,.13],[R,.155],[G,.12]])specs[type]={anchor:newMotions[type].ANCHOR,hit:newMotions[type].HIT,scale};
const requestedLayout=new URLSearchParams(location.search).get('position');
if(Object.hasOwn(layouts,requestedLayout))$('layout').value=requestedLayout;
const idle=new Map(), work=new Map(), squares=new Map();
let position=createPosition(), selected=parseSq('c4'), hover=null, animation=null, history=[], lastSquares=[];
let frame=0, previousTime=0, aimAngle=0, aimFacing=1, ready=false;
const preference=matchMedia('(prefers-reduced-motion: reduce)'); $('reduced').checked=preference.matches;
const reduced=()=>$('reduced').checked, ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const foot=s=>({x:PAD+((s&7)+.5)*TILE,y:PAD+(7-(s>>3)+.5)*TILE+40});
const sideFacing=value=>colorOf(value)?-1:1;
const poseFor=(value,square)=>({foot:foot(square),scale:specs[typeOf(value)].scale,facing:sideFacing(value),angle:0});
function world(point,pose,type) { const a=specs[type].anchor; return {x:pose.foot.x+(point.x-a.x)*pose.scale*pose.facing,y:pose.foot.y+(point.y-a.y)*pose.scale}; }
function local(point,pose,type) { const a=specs[type].anchor; return {x:a.x+(point.x-pose.foot.x)/pose.scale/pose.facing,y:a.y+(point.y-pose.foot.y)/pose.scale}; }
function tip(type,side,angle,extension=0) { return type===A?archer.muzzle(angle,side):pawn.tipAt(angle,side,extension); }
function aimed(value,pose,target) {
 const type=typeOf(value), side=colorOf(value), spec=specs[type];
 pose={...pose,facing:Math.abs(target.x-pose.foot.x)>1?Math.sign(target.x-pose.foot.x):pose.facing};
 if(type!==P&&type!==A)return pose;
 const p=local(target,pose,type), pivot=type===A?{x:archer.pivot(side).x,y:archer.pivot(side).y+archer.FIGURE_Y}:spec.pivot;
 const zero=tip(type,side,0), dx=p.x-pivot.x,dy=p.y-pivot.y;
 const raw=Math.atan2(dy,dx)-Math.asin(clamp((zero.y-pivot.y)/Math.max(1,Math.hypot(dx,dy)),-1,1));
 return {...pose,angle:clamp(raw,spec.min,spec.max),outside:raw<spec.min-.01||raw>spec.max+.01};
}
function sprite(value,angle=0,extension=0) {
 const type=typeOf(value),side=colorOf(value),key=`${type}:${side}`;
 const staticPose=Math.abs(angle)<.00001&&Math.abs(extension)<.0001;
 let canvas=staticPose?idle.get(key):work.get(type);
 if(canvas&&staticPose)return canvas;
 if(!canvas){canvas=document.createElement('canvas');canvas.width=1152;canvas.height=1152;(staticPose?idle:work).set(staticPose?key:type,canvas);}
 if(type===A)archer.drawArcher(canvas,art[type],side,angle);else if(type===O)ogre.drawOgre(canvas,art[type],side,extension);else if(type===N)knight.drawKnight(canvas,art[type],side,extension);else if(type===B)bishop.drawBishop(canvas,art[type],side,extension);else if(type===R)rook.drawRook(canvas,art[type],side,extension);else if(type===G)guard.drawGuard(canvas,art[type],side,extension);else pawn.drawPawn(canvas,art[type],side,angle,extension);
 return canvas;
}
function drawPiece(out,value,pose,opacity=1,extension=0) {
 if(opacity<=0)return;
 const spec=specs[typeOf(value)],ground=pose.ground??pose.foot,shadowScale=clamp(1-(pose.lift??0)/TILE*.4,.6,1);
 out.save();out.globalAlpha=opacity;out.fillStyle='#343a2229';out.beginPath();out.ellipse(ground.x,ground.y-2,210*pose.scale*shadowScale,36*pose.scale*shadowScale,0,0,Math.PI*2);out.fill();
 out.translate(pose.foot.x,pose.foot.y);out.scale(pose.scale*pose.facing,pose.scale);out.rotate(pose.rotation??0);out.drawImage(sprite(value,pose.angle,extension),-spec.anchor.x,-spec.anchor.y);out.restore();
}
function bolt(out,start,end,t,scale=1) {
 if(t<0||t>1)return;
 const p=mix(start,end,t),angle=Math.atan2(end.y-start.y,end.x-start.x);
 out.save();out.translate(p.x,p.y);out.rotate(angle);out.lineWidth=2.4*scale;out.strokeStyle='#6e4e2d';out.beginPath();out.moveTo(-19*scale,0);out.lineTo(0,0);out.stroke();
 out.fillStyle='#a1a9a3';out.beginPath();out.moveTo(4*scale,0);out.lineTo(-5*scale,-3.5*scale);out.lineTo(-5*scale,3.5*scale);out.closePath();out.fill();out.restore();
}
function impact(out,point,t,scale=1) {
 if(t<0||t>1)return;
 out.save();out.globalAlpha=(1-t)*.85;out.strokeStyle='#c18d4f';out.lineWidth=2*scale;out.beginPath();out.arc(point.x,point.y,(5+t*17)*scale,0,Math.PI*2);out.stroke();out.restore();
}
function boardBackground() {
 ctx.clearRect(0,0,SIZE,SIZE);ctx.fillStyle='#e6e1cf';ctx.fillRect(0,0,SIZE,SIZE);
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  ctx.fillStyle=(row+col)%2?'#89977b':'#e9e6d5';ctx.fillRect(PAD+col*TILE,PAD+row*TILE,TILE,TILE);
  ctx.strokeStyle='#656e4d14';ctx.strokeRect(PAD+col*TILE+.5,PAD+row*TILE+.5,TILE-1,TILE-1);
 }
 if(selected!==null){ctx.strokeStyle='#6b7954';ctx.lineWidth=3;ctx.strokeRect(PAD+(selected&7)*TILE+1.5,PAD+(7-(selected>>3))*TILE+1.5,TILE-3,TILE-3);ctx.lineWidth=1;}
 ctx.fillStyle='#6d765d';ctx.font='13px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
 for(let i=0;i<8;i++){ctx.fillText('abcdefgh'[i],PAD+(i+.5)*TILE,SIZE-14);ctx.fillText(String(8-i),15,PAD+(i+.5)*TILE);}
}
function selectionTarget() {
 const moves=actionsFor(position,selected), match=moves.find(m=>destination(m)===hover);
 if(!match)return null;
 const value=position.board[hover];
 return value?world(specs[typeOf(value)].hit,poseFor(value,hover),typeOf(value)):foot(hover);
}
function desiredPose() {
 if(selected===null||!position.board[selected])return null;
 const value=position.board[selected],pose=poseFor(value,selected),target=selectionTarget();
 return target?aimed(value,pose,target):pose;
}
function render(time=performance.now()) {
 boardBackground();
 const poses=new Map();
 for(let sq=0;sq<64;sq++)if(position.board[sq])poses.set(sq,{value:position.board[sq],pose:poseFor(position.board[sq],sq),opacity:1,extension:0});
 if(selected!==null&&poses.has(selected))Object.assign(poses.get(selected).pose,{angle:aimAngle,facing:aimFacing});
 let shot=null,hit=null;
 if(animation){
  const a=animation,t=(time-a.start)/a.speed,actor=poses.get(a.move.from),victim=poses.get(a.move.shove?.from??a.move.captures[0]);
  if(a.type==='move')actor.pose={...a.from,foot:mix(a.from.foot,a.to.foot,ease(t/420))};
  else if(a.type==='advance'){
   actor.pose={...a.from,foot:mix(a.from.foot,a.to.foot,ease(t/(a.duration*.65)))};
   actor.extension=newMotions[typeOf(a.value)].actionAt(t/a.duration);
   if(victim)victim.opacity=1-clamp((t-a.duration*.5)/180,0,1);
   hit={point:a.target,t:(t-a.duration*.5)/240};
  }
  else if(a.type==='knight'){
   const motion=knight.leapAt(t/a.duration),ground=mix(a.from.foot,a.to.foot,motion.travel);
   // Keep the complete spear visible when jumping along the board's top edge.
   const lift=Math.min(TILE*.7,Math.max(0,ground.y-specs[N].scale*1000-12))*motion.lift;
   actor.pose={...a.from,ground,lift,foot:{x:ground.x,y:ground.y-lift},rotation:motion.rotation};
   actor.extension=motion.crouch;
   const landing=a.duration*knight.LANDING;
   if(victim)victim.opacity=1-clamp((t-landing)/120,0,1);
   hit={point:a.to.foot,t:(t-landing)/180};
  }
  else if(a.type==='ogre'){
   const drive=ease((t-780)/360),travel=a.move.shove?{x:(a.pushedTo.foot.x-a.victimPose.foot.x)*drive,y:(a.pushedTo.foot.y-a.victimPose.foot.y)*drive}:{x:0,y:0};
   if(t<300)actor.pose={...a.pose,foot:mix(a.from.foot,a.approach,ease(t/300))};
   else if(t<1300){actor.pose={...a.pose,foot:{x:a.approach.x+travel.x,y:a.approach.y+travel.y}};actor.extension=ogre.PUSH*ogre.pushAt((t-300)/1000);}
   else actor.pose={...a.pose,foot:mix({x:a.approach.x+travel.x,y:a.approach.y+travel.y},a.to.foot,ease((t-1300)/300))};
   if(victim){if(a.move.shove)victim.pose={...a.victimPose,foot:mix(a.victimPose.foot,a.pushedTo.foot,drive)};else victim.opacity=1-clamp((t-780)/180,0,1);}
   hit={point:{x:a.target.x+travel.x,y:a.target.y+travel.y},t:(t-780)/260};
  }
  else if(a.type==='pawn'){
   if(t<280)actor.pose={...a.from,angle:a.pose.angle*ease(t/280),facing:a.pose.facing};
   else if(t<550)actor.pose={...a.pose,foot:mix(a.from.foot,a.approach,ease((t-280)/270))};
   else if(t<1350){actor.pose={...a.pose,foot:a.approach};actor.extension=pawn.THRUST*pawn.thrustAt((t-550)/800);}
   else actor.pose={...a.pose,foot:mix(a.approach,a.to.foot,ease((t-1350)/280)),angle:a.pose.angle*(1-ease((t-1350)/280))};
   if(victim)victim.opacity=1-clamp((t-910)/180,0,1);
   hit={point:a.target,t:(t-910)/260};
  }else{
   actor.pose={...a.pose,angle:a.pose.angle*ease(t/160)};
   if(t>180&&t<500)actor.pose.angle-=Math.sin(clamp((t-180)/320,0,1)*Math.PI)*1.8*Math.PI/180;
   if(victim)victim.opacity=1-clamp((t-440)/180,0,1);
   if(!a.closeup){shot={start:world(archer.muzzle(a.pose.angle,colorOf(a.value)),a.pose,A),end:a.target,t:(t-180)/260};hit={point:a.target,t:(t-440)/260};}
   else actor.pose={...a.from,angle:0};
  }
  if(a.closeup)drawEncounter(a,t);else $('encounter').hidden=true;
  const impactTime=a.type==='pawn'?910:a.type==='ogre'?780:a.type==='knight'?a.duration*knight.LANDING:a.type==='advance'?a.duration*.5:440;
  if(a.type==='knight'&&t>=a.duration*.35&&!a.airborne){a.airborne=true;$('status').textContent='Airborne. Clearing the intervening pieces…';}
  if(a.type!=='move'&&t>=impactTime&&!a.contacted){a.contacted=true;$('status').textContent=a.type==='knight'?'Landed. Settling into stance…':'Hit. Recovering…';}
 }
 const ordered=[...poses].sort((a,b)=>a[1].pose.foot.y-b[1].pose.foot.y);
 if(animation){const i=ordered.findIndex(([sq])=>sq===animation.move.from);ordered.push(...ordered.splice(i,1));}
 for(const [,unit] of ordered)drawPiece(ctx,unit.value,unit.pose,unit.opacity,unit.extension);
 if(shot)bolt(ctx,shot.start,shot.end,shot.t);
 if(hit)impact(ctx,hit.point,hit.t);
}
function drawEncounter(a,t) {
 $('encounter').hidden=false;$('encounter-title').textContent=`${colours[colorOf(a.value)]} Archer · ${sqName(a.move.from)} → ${sqName(a.move.captures[0])}`;
 detail.clearRect(0,0,900,480);
 const victimPose={foot:{x:665,y:445},scale:specs[typeOf(a.victim)].scale*3,facing:-1,angle:0};
 const target=world(specs[typeOf(a.victim)].hit,victimPose,typeOf(a.victim));
 const actor=aimed(a.value,{foot:{x:205,y:445},scale:.34,facing:1,angle:0},target);
 const angle=actor.angle*ease(t/160)-(t>180&&t<500?Math.sin((t-180)/320*Math.PI)*.025:0);
 drawPiece(detail,a.victim,victimPose,1-clamp((t-440)/180,0,1));
 drawPiece(detail,a.value,{...actor,angle});
 bolt(detail,world(archer.muzzle(actor.angle,colorOf(a.value)),actor,A),target,(t-180)/260,1.5);
 impact(detail,target,(t-440)/260,1.5);
}
function tick(time) {
 frame=0;const dt=previousTime?Math.min((time-previousTime)/1000,.05):1/60;previousTime=time;
 const wanted=desiredPose();
 if(!animation&&wanted){aimFacing=wanted.facing;aimAngle+=(wanted.angle-aimAngle)*(reduced()?1:1-Math.exp(-14*dt));if(Math.abs(wanted.angle-aimAngle)<.0001)aimAngle=wanted.angle;}
 if(animation&&(time-animation.start)>=animation.duration*animation.speed){finish();}
 render(time);
 if(animation||(wanted&&aimAngle!==wanted.angle))wake();else previousTime=0;
}
function wake(){if(ready&&!frame)frame=requestAnimationFrame(tick);}
function describe(move,value) {
 const name=`${colours[colorOf(value)]} ${names[typeOf(value)]}`,from=sqName(move.from),to=sqName(destination(move));
 if(move.shove)return `${name} pushed ${to} → ${sqName(move.shove.to)} and followed to ${sqName(move.to)}.`;
 if(typeOf(value)===N)return `${name} leaped ${from} → ${to}${move.captures.length?' and captured':''}.`;
 return move.captures.length?(typeOf(value)===A?`${name} shot ${to} and stayed on ${from}.`:`${name} captured on ${to}.`):`${name} moved ${from} → ${to}.`;
}
function commit(move,value) {
 history.push({position,message:describe(move,value),lastSquares:[...lastSquares]});
 position=makeMove({...position,turn:colorOf(value)},move);lastSquares=[move.from,destination(move),...(move.shove?[move.shove.to]:[])];selected=move.to;hover=null;aimAngle=0;aimFacing=sideFacing(value);
 $('status').textContent=describe(move,value);updateUI();
}
function finish(){const {move,value}=animation;animation=null;$('encounter').hidden=true;commit(move,value);}
function start(move) {
 if(animation||!ready)return;
 $('action-picker').close();
 const value=position.board[move.from],from=poseFor(value,move.from),to=poseFor(value,move.to),victimSquare=move.shove?.from??move.captures[0],victim=position.board[victimSquare];
 if(reduced()){commit(move,value);wake();return;}
 const base={move,value,from,to,victim,start:performance.now(),speed:$('slow').checked?2.5:1,contacted:false};
 if(typeOf(value)===N){base.type='knight';base.duration=knight.DURATION;from.facing=Math.sign(to.foot.x-from.foot.x);}
 else if(!victim){base.type='move';base.duration=420;const dx=to.foot.x-from.foot.x;from.facing=dx?Math.sign(dx):sideFacing(value);}
 else{
  const target=world(specs[typeOf(victim)].hit,poseFor(victim,victimSquare),typeOf(victim));
  const pose=aimed(value,from,target);Object.assign(base,{target,pose});
  if(typeOf(value)===O){
   base.type='ogre';base.duration=1600;
   const contact=world(ogre.palmAt(colorOf(value),ogre.PUSH),pose,O);
   base.approach={x:pose.foot.x+target.x-contact.x,y:pose.foot.y+target.y-contact.y};
   base.victimPose=poseFor(victim,victimSquare);
   if(move.shove)base.pushedTo=poseFor(victim,move.shove.to);
  }else if(typeOf(value)===P){
   base.type='pawn';base.duration=1630;
   const contact=world(pawn.tipAt(pose.angle,colorOf(value),pawn.THRUST),pose,P);
   base.approach={x:pose.foot.x+target.x-contact.x,y:pose.foot.y+target.y-contact.y};
  }else if(typeOf(value)===B||typeOf(value)===R){base.type='advance';base.duration=newMotions[typeOf(value)].DURATION;from.facing=pose.facing;}else{base.type='archer';base.duration=820;base.closeup=pose.outside;}
 }
 animation=base;$('status').textContent=base.type==='move'?'Moving…':base.type==='advance'?'Advancing to capture…':base.type==='knight'?'Preparing to leap…':base.type==='ogre'?'Bracing for contact…':base.closeup?'Taking aim · attack close-up.':'Taking aim…';updateUI();wake();
}
function cancel(){animation=null;$('encounter').hidden=true;$('action-picker').close();hover=null;aimAngle=0;}
function reset(){cancel();position=createPosition($('layout').value);history=[];lastSquares=[];selected=$('layout').value==='ranks'?parseSq('b3'):$('layout').value==='angles'?parseSq('d4'):parseSq('c4');aimFacing=1;$('status').textContent='Choose a marked square, or select any other piece.';updateUI();wake();}
function undo(){if(animation){cancel();$('status').textContent='Action canceled. The position is unchanged.';}else if(history.length){const last=history.pop();position=last.position;lastSquares=last.lastSquares;selected=null;hover=null;aimAngle=0;$('status').textContent='Last action undone. Choose either army.';}updateUI();wake();}
function selectionPrompt(){
 if(selected===null)return 'Choose a piece from either army.';
 const value=position.board[selected],name=names[typeOf(value)];
 if(actionsFor(position,selected).length)return `Choose a marked square for the ${name.toLowerCase()}.`;
 if(typeOf(value)===P){
  const ahead=selected+(colorOf(value)?-8:8),blocker=position.board[ahead];
  if(blocker)return `The ${names[typeOf(blocker)].toLowerCase()} on ${sqName(ahead)} blocks this pawn. No diagonal capture is available. Select another piece.`;
 }
 return `This ${name.toLowerCase()} has no available actions in this trial. Select another piece.`;
}
function choose(square){
 if(animation||!ready)return;
 const options=actionsFor(position,selected).filter(m=>destination(m)===square);
 if(options.length>1){
  $('action-title').textContent=`Choose what happens on ${sqName(square)}`;
  $('action-options').replaceChildren();
  for(const move of options){const button=document.createElement('button');button.textContent=actionLabel(move,position.board[selected]);button.onclick=()=>start(move);$('action-options').append(button);}
  $('action-picker').showModal();return;
 }
 if(options.length){start(options[0]);return;}
 if(position.board[square]){selected=selected===square?null:square;hover=null;aimAngle=0;aimFacing=sideFacing(position.board[square]);$('status').textContent=selected===null?'Selection cleared.':selectionPrompt();}
 else $('status').textContent=(actionsFor(position,selected).length?'That square is not available. ':'')+selectionPrompt();
 updateUI();wake();
}
function actionLabel(move,value){return move.shove?`Push ${sqName(move.shove.from)} → ${sqName(move.shove.to)}`:`${move.captures.length?(typeOf(value)===A?'Shoot':'Capture'):typeOf(value)===N?'Leap':'Move'} ${sqName(destination(move))}`;}
function updateUI(){
 const value=selected===null?0:position.board[selected],moves=actionsFor(position,selected);
 for(const [sq,button] of squares){const v=position.board[sq],options=moves.filter(m=>destination(m)===sq),capture=options.some(m=>m.captures.length),push=options.some(m=>m.shove),kind=capture&&push?'capture or push':push?'push':capture?'attack':'move';button.className=`square${selected===sq?' selected':''}${options.length?(capture?' attack':'')+(push?' push':'')+(!capture&&!push?' move':''):''}${lastSquares.includes(sq)?' last':''}`;button.setAttribute('aria-pressed',String(selected===sq));button.setAttribute('aria-disabled',String(Boolean(animation)));button.setAttribute('aria-label',`${sqName(sq)}${v?`, ${colours[colorOf(v)]} ${names[typeOf(v)]}`:', empty'}${options.length?`, ${kind} available`:''}`);button.tabIndex=sq===(selected??parseSq('a1'))?0:-1;
  if(push){const shove=options.find(m=>m.shove).shove,dx=Math.sign((shove.to&7)-(shove.from&7)),dy=Math.sign((shove.to>>3)-(shove.from>>3));button.dataset.pushArrow={'1,0':'→','-1,0':'←','0,1':'↑','0,-1':'↓','1,1':'↗','-1,1':'↖','1,-1':'↘','-1,-1':'↙'}[`${dx},${dy}`];}
 }
 $('allegiance').textContent=value?`${colours[colorOf(value)]} army`:'Choose a piece';$('piece-name').textContent=value?names[typeOf(value)]:'Your move.';
 $('description').textContent=!value?'Select a piece from either army to see its available actions.':typeOf(value)===A?'Aim the wrist bow at a marked enemy. The Archer captures without leaving her square.':typeOf(value)===B?'Move and capture along diagonals. Pieces block the path; the Guard cannot be captured.':typeOf(value)===R?'Move and capture along ranks and files. Pieces block the path; the Guard cannot be captured.':typeOf(value)===G?'Move one square in any direction to an empty square. The Guard cannot capture. Only a King can capture him; an Ogre can push him.':typeOf(value)===N?'Leap two squares in one direction and one across. Jump over pieces; capture only on the landing square.':typeOf(value)===O?'Move one square in any direction. Capture an enemy or push a neighbour into the empty square beyond, then follow.':'Advance into an empty square, or thrust at an enemy on a forward diagonal.';
 const moveCount=moves.filter(m=>!m.captures.length&&!m.shove).length,attackCount=moves.filter(m=>m.captures.length).length,pushCount=moves.filter(m=>m.shove).length;
 const selectionName=value?`${colours[colorOf(value)]} ${names[typeOf(value)]} · ${sqName(selected)}`:'';
 $('selection-state').textContent=value?`${selectionName} · ${moveCount} move${moveCount===1?'':'s'} · ${attackCount} attack${attackCount===1?'':'s'}${pushCount?` · ${pushCount} push${pushCount===1?'':'es'}`:''}`:'No piece selected';
 $('choices').replaceChildren();for(const m of moves){const b=document.createElement('button');b.textContent=actionLabel(m,value);b.className=m.shove?'push-action':m.captures.length?'capture':'';b.disabled=Boolean(animation);b.onclick=()=>start(m);b.onpointerenter=()=>{hover=destination(m);wake();};b.onfocus=()=>{hover=destination(m);wake();};$('choices').append(b);}
 if(value&&!moves.length)$('selection-state').textContent=`${selectionName} · No available actions`;
 $('undo').disabled=!animation&&!history.length;
 for(const side of [0,1])$(side?'black-count':'white-count').textContent=Array.from(position.board).filter(v=>v&&colorOf(v)===side).length;
 $('history').replaceChildren();for(const h of history.slice(-6)){const li=document.createElement('li');li.textContent=h.message;$('history').append(li);}
}
for(let row=0;row<8;row++)for(let col=0;col<8;col++){
 const sq=(7-row)*8+col,b=document.createElement('button');b.type='button';b.dataset.square=sqName(sq);b.onclick=()=>choose(sq);
 b.onpointerenter=()=>{if(!animation){hover=sq;wake();}};b.onfocus=()=>{if(!animation){hover=sq;wake();}};
 b.onkeydown=event=>{const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:8,ArrowDown:-8}[event.key];if(delta!==undefined){event.preventDefault();const f=sq&7,r=sq>>3;const nextF=clamp(f+(delta===1?1:delta===-1?-1:0),0,7),nextR=clamp(r+(delta===8?1:delta===-8?-1:0),0,7);squares.get(nextR*8+nextF).focus();}if(event.key==='Escape'&&!animation){selected=null;hover=null;aimAngle=0;$('status').textContent='Selection cleared. Choose a piece from either army.';updateUI();wake();}};
 squares.set(sq,b);$('squares').append(b);
}
$('squares').addEventListener('pointerleave',()=>{if(!animation){hover=null;wake();}});
$('reset').onclick=reset;$('undo').onclick=undo;$('layout').onchange=reset;
$('cancel-choice').onclick=()=>$('action-picker').close();
$('reduced').onchange=()=>{if(animation)undo();else wake();};preference.addEventListener('change',()=>{$('reduced').checked=preference.matches;if(animation)undo();else wake();});
updateUI();boardBackground();
try{
 await Promise.all([[P,'../lance/pawn.png'],[A,'../wrist-bow/archer.png'],[O,'../ogre/ogre.png'],[N,'../knight/knight.png'],[B,'../bishop/bishop.png'],[R,'../rook/rook.png'],[G,'../guard/guard.png']].map(([type,url])=>new Promise((resolve,reject)=>{art[type].onload=resolve;art[type].onerror=reject;art[type].src=url;})));
 ready=true;reset();
}catch{$('status').textContent='The artwork could not load. Reload the preview to try again.';}
