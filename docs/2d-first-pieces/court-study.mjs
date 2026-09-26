import {figures,drawCourt,actionAt} from './court-motion.mjs';
const $=id=>document.getElementById(id),name=document.body.dataset.piece,art=new Image(),spec=figures[name];
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let side=0,action=null,frame=0,ready=false,held=false;
$('reduce-motion').checked=preference.matches;
function draw(progress=0){
 const amount=actionAt(progress);
 drawCourt($('character'),art,name,side,amount);
 drawCourt($('sample-ivory'),art,name,0,amount);
 drawCourt($('sample-charcoal'),art,name,1,amount);
}
function cancel(){
 cancelAnimationFrame(frame);frame=0;action=null;held=false;
 $('hold').setAttribute('aria-pressed','false');$('play').disabled=!ready;
 if(ready)draw();$('status').textContent=ready?'Ready. Preview the motion or hold the pose.':'Loading artwork…';
}
function tick(now){
 if(!action)return;const t=Math.min(1,(now-action.start)/action.duration);draw(t);
 $('status').textContent=t<.18?'Preparing…':t<.5?'Leaning into the action…':t<.72?'Holding the pose…':'Recovering…';
 if(t===1)cancel();else frame=requestAnimationFrame(tick);
}
function play(){
 if(!ready||action)return;cancel();
 if($('reduce-motion').checked){draw(.5);held=true;$('hold').setAttribute('aria-pressed','true');$('status').textContent='Action pose shown. Motion reduced.';return;}
 action={start:performance.now(),duration:spec.duration*($('slow-motion').checked?3:1)};$('play').disabled=true;frame=requestAnimationFrame(tick);
}
$('play').onclick=play;$('reset').onclick=cancel;$('scene').onclick=play;
$('scene').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();play();}};
$('hold').onclick=()=>{if(!ready)return;const next=!held;cancel();held=next;draw(held?.5:0);$('hold').setAttribute('aria-pressed',String(held));$('status').textContent=held?'Action pose held for inspection.':'Ready. Preview the motion or hold the pose.';};
for(const b of document.querySelectorAll('[data-side]'))b.onclick=()=>{side=Number(b.dataset.side);cancel();for(const other of document.querySelectorAll('[data-side]'))other.setAttribute('aria-pressed',String(other===b));};
$('reduce-motion').onchange=cancel;preference.onchange=()=>{$('reduce-motion').checked=preference.matches;cancel();};
art.onload=()=>{ready=true;cancel();};art.onerror=()=>{$('status').textContent='Artwork could not load. Reload the preview.';};art.src=`${name}.png`;
