// Local visual/interaction prototype. The production game renderer is untouched.
import { P,A,typeOf,colorOf,sqName,parseSq,makeMove } from './rules.mjs';
import { createPosition,actionsFor,destination } from './model.mjs';
import { clamp } from '../painted-mesh.mjs';
import * as archer from '../wrist-bow/aiming.mjs';
import * as pawn from '../lance/aiming.mjs';
const $=id=>document.getElementById(id), scene=$('scene'), ctx=scene.getContext('2d'), detail=$('closeup').getContext('2d');
const SIZE=960, PAD=32, TILE=112, names={ [P]:'Pawn',[A]:'Archer' }, colours=['Ivory','Charcoal'];
const art={ [P]:new Image(),[A]:new Image() };
const specs={ [P]:{anchor:{x:330,y:870},hit:{x:327,y:556},pivot:{x:430,y:521},scale:.132,min:pawn.MIN_ANGLE,max:pawn.MAX_ANGLE}, [A]:{anchor:{x:382,y:1066},hit:{x:344,y:424},scale:.106,min:archer.MIN_ANGLE,max:archer.MAX_ANGLE} };
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
 if(type===A)archer.drawArcher(canvas,art[type],side,angle);else pawn.drawPawn(canvas,art[type],side,angle,extension);
 return canvas;
}
function drawPiece(out,value,pose,opacity=1,extension=0) {
 if(opacity<=0)return;
 const spec=specs[typeOf(value)];
 out.save();out.globalAlpha=opacity;out.fillStyle='#343a2229';out.beginPath();out.ellipse(pose.foot.x,pose.foot.y-2,210*pose.scale,36*pose.scale,0,0,Math.PI*2);out.fill();
 out.translate(pose.foot.x,pose.foot.y);out.scale(pose.scale*pose.facing,pose.scale);out.drawImage(sprite(value,pose.angle,extension),-spec.anchor.x,-spec.anchor.y);out.restore();
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
  const a=animation,t=(time-a.start)/a.speed,actor=poses.get(a.move.from),victim=poses.get(a.move.captures[0]);
  if(a.type==='move')actor.pose={...a.from,foot:mix(a.from.foot,a.to.foot,ease(t/420))};
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
  const impactTime=a.type==='pawn'?910:440;
  if(a.type!=='move'&&t>=impactTime&&!a.contacted){a.contacted=true;$('status').textContent='Hit. Recovering…';}
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
 const victimPose={foot:{x:665,y:445},scale:typeOf(a.victim)===A?.34:.40,facing:-1,angle:0};
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
 return move.captures.length?(typeOf(value)===A?`${name} shot ${to} and stayed on ${from}.`:`${name} captured on ${to}.`):`${name} moved ${from} → ${to}.`;
}
function commit(move,value) {
 history.push({position,message:describe(move,value),lastSquares:[...lastSquares]});
 position=makeMove({...position,turn:colorOf(value)},move);lastSquares=[move.from,destination(move)];selected=move.to;hover=null;aimAngle=0;aimFacing=sideFacing(value);
 $('status').textContent=describe(move,value);updateUI();
}
function finish(){const {move,value}=animation;animation=null;$('encounter').hidden=true;commit(move,value);}
function start(move) {
 if(animation||!ready)return;
 const value=position.board[move.from],from=poseFor(value,move.from),to=poseFor(value,move.to),victim=position.board[move.captures[0]];
 if(reduced()){commit(move,value);wake();return;}
 const base={move,value,from,to,victim,start:performance.now(),speed:$('slow').checked?2.5:1,contacted:false};
 if(!victim){base.type='move';base.duration=420;const dx=to.foot.x-from.foot.x;from.facing=dx?Math.sign(dx):sideFacing(value);}
 else{
  const target=world(specs[typeOf(victim)].hit,poseFor(victim,move.captures[0]),typeOf(victim));
  const pose=aimed(value,from,target);Object.assign(base,{target,pose});
  if(typeOf(value)===P){
   base.type='pawn';base.duration=1630;
   const contact=world(pawn.tipAt(pose.angle,colorOf(value),pawn.THRUST),pose,P);
   base.approach={x:pose.foot.x+target.x-contact.x,y:pose.foot.y+target.y-contact.y};
  }else{base.type='archer';base.duration=820;base.closeup=pose.outside;}
 }
 animation=base;$('status').textContent=base.type==='move'?'Moving…':base.closeup?'Taking aim · attack close-up.':'Taking aim…';updateUI();wake();
}
function cancel(){animation=null;$('encounter').hidden=true;hover=null;aimAngle=0;}
function reset(){cancel();position=createPosition($('layout').value);history=[];lastSquares=[];selected=$('layout').value==='ranks'?parseSq('b3'):$('layout').value==='angles'?parseSq('d4'):parseSq('c4');aimFacing=1;$('status').textContent='Choose a marked square, or select any other piece.';updateUI();wake();}
function undo(){if(animation){cancel();$('status').textContent='Action canceled. The position is unchanged.';}else if(history.length){const last=history.pop();position=last.position;lastSquares=last.lastSquares;selected=null;hover=null;aimAngle=0;$('status').textContent='Last action undone. Choose either army.';}updateUI();wake();}
function choose(square){
 if(animation||!ready)return;
 const move=actionsFor(position,selected).find(m=>destination(m)===square);
 if(move){start(move);return;}
 if(position.board[square]){selected=selected===square?null:square;hover=null;aimAngle=0;aimFacing=sideFacing(position.board[square]);$('status').textContent=selected===null?'Selection cleared.':`Choose a marked square for the ${names[typeOf(position.board[square])].toLowerCase()}.`;}
 else $('status').textContent='That square is not available. Choose a marked square.';
 updateUI();wake();
}
function updateUI(){
 const value=selected===null?0:position.board[selected],moves=actionsFor(position,selected),targetMap=new Map(moves.map(m=>[destination(m),m]));
 for(const [sq,button] of squares){const v=position.board[sq],move=targetMap.get(sq);button.className=`square${selected===sq?' selected':''}${move?(move.captures.length?' attack':' move'):''}${lastSquares.includes(sq)?' last':''}`;button.setAttribute('aria-pressed',String(selected===sq));button.setAttribute('aria-disabled',String(Boolean(animation)));button.setAttribute('aria-label',`${sqName(sq)}${v?`, ${colours[colorOf(v)]} ${names[typeOf(v)]}`:', empty'}${move?`, ${move.captures.length?'attack':'move'} available`:''}`);button.tabIndex=sq===(selected??parseSq('a1'))?0:-1;}
 $('allegiance').textContent=value?`${colours[colorOf(value)]} army`:'Choose a piece';$('piece-name').textContent=value?names[typeOf(value)]:'Your move.';
 $('description').textContent=!value?'Select a Pawn or Archer from either army to see its available actions.':typeOf(value)===A?'Aim the wrist bow at a marked enemy. The Archer captures without leaving her square.':'Advance into an empty square, or thrust at an enemy on a forward diagonal.';
 const moveCount=moves.filter(m=>!m.captures.length).length,attackCount=moves.length-moveCount;
 $('selection-state').textContent=value?`${sqName(selected)} · ${moveCount} move${moveCount===1?'':'s'} · ${attackCount} attack${attackCount===1?'':'s'}`:'No piece selected';
 $('choices').replaceChildren();for(const m of moves){const b=document.createElement('button');b.textContent=`${m.captures.length?(typeOf(value)===A?'Shoot':'Capture'):'Move'} ${sqName(destination(m))}`;b.className=m.captures.length?'capture':'';b.disabled=Boolean(animation);b.onclick=()=>start(m);b.onpointerenter=()=>{hover=destination(m);wake();};b.onfocus=()=>{hover=destination(m);wake();};$('choices').append(b);}
 if(value&&!moves.length)$('selection-state').textContent=`${sqName(selected)} · No available actions in this trial`;
 $('undo').disabled=!animation&&!history.length;
 for(const side of [0,1])$(side?'black-count':'white-count').textContent=Array.from(position.board).filter(v=>v&&colorOf(v)===side).length;
 $('history').replaceChildren();for(const h of history.slice(-6)){const li=document.createElement('li');li.textContent=h.message;$('history').append(li);}
}
for(let row=0;row<8;row++)for(let col=0;col<8;col++){
 const sq=(7-row)*8+col,b=document.createElement('button');b.type='button';b.dataset.square=sqName(sq);b.onclick=()=>choose(sq);
 b.onpointerenter=()=>{if(!animation){hover=sq;wake();}};b.onfocus=()=>{if(!animation){hover=sq;wake();}};
 b.onkeydown=event=>{const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:8,ArrowDown:-8}[event.key];if(delta!==undefined){event.preventDefault();const f=sq&7,r=sq>>3;const nextF=clamp(f+(delta===1?1:delta===-1?-1:0),0,7),nextR=clamp(r+(delta===8?1:delta===-8?-1:0),0,7);squares.get(nextR*8+nextF).focus();}if(event.key==='Escape'){selected=null;hover=null;updateUI();wake();}};
 squares.set(sq,b);$('squares').append(b);
}
$('squares').addEventListener('pointerleave',()=>{if(!animation){hover=null;wake();}});
$('reset').onclick=reset;$('undo').onclick=undo;$('layout').onchange=reset;
$('reduced').onchange=()=>{if(animation)undo();else wake();};preference.addEventListener('change',()=>{$('reduced').checked=preference.matches;if(animation)undo();else wake();});
updateUI();boardBackground();
try{
 await Promise.all([[P,'../lance/pawn.png'],[A,'../wrist-bow/archer.png']].map(([type,url])=>new Promise((resolve,reject)=>{art[type].onload=resolve;art[type].onerror=reject;art[type].src=url;})));
 ready=true;reset();
}catch{$('status').textContent='The artwork could not load. Reload the preview to try again.';}
