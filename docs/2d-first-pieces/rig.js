import {clamp,poseAt,elbow} from './rig-motion.mjs';
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const parts=await (await fetch('./rig-parts.json')).json();
const atlas=new Image();atlas.src='./archer-parts.png';await atlas.decode();
const el=(tag,attrs={},parent)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);parent?.append(n);return n};
for(const [name,[x,y,w,h]]of Object.entries(parts)){const symbol=el('symbol',{id:name,viewBox:`${x} ${y} ${w} ${h}`,preserveAspectRatio:'none',overflow:'hidden'},$('defs'));el('image',{href:'./archer-parts.png',width:1448,height:1086},symbol)}
function part(name,x,y,w,h,parent){return el('use',{href:`#${name}`,x,y,width:w,height:h},parent)}
const puppet=$('puppet');
const back=el('g',{},puppet),body=part('bodyIvory',180,270,341,504,puppet),hair=el('g',{},puppet);part('braid',290,225,37,182,hair);
const headGroup=el('g',{},puppet),head=part('headIvory',265,112,173,175,headGroup);
const front=el('g',{},puppet),bowGroup=el('g',{},puppet);
const bow=part('bow',-102,-176,130,345,bowGroup);
const string=el('path',{fill:'none',stroke:'#bda676','stroke-width':2.2},bowGroup);
const arrow=part('arrow',0,-6,238,26,bowGroup);
function limb(parent,name,len,height){const g=el('g',{},parent);part(name,-8,-height/2,len+16,height,g);return g}
const bowUpper=limb(back,'bowUpper',110,40),bowFore=limb(back,'bowFore',118,35);
const drawUpper=limb(front,'drawUpper',90,39),drawFore=limb(front,'drawFore',124,35);
const flying=part('arrow',-112,-6,120,13,$('projectile'));
const bonePath=el('path',{stroke:'#5ba3b4','stroke-width':3,fill:'none'},$('bones'));
const joints=Array.from({length:6},()=>el('circle',{r:5,fill:'#cda449',stroke:'#fff'},$('bones')));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let aim=0,desired=0,progress=0,started=null,duration=1800,previous=performance.now(),raf=0,lastPhase='';
function segment(g,a,b){g.setAttribute('transform',`translate(${a.x} ${a.y}) rotate(${Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI})`)}
function render(now){const p=poseAt(progress),breath=reduced.matches?0:Math.sin(now/650)*1.2;const recoil=p.recoil*8;const rise=p.lift;
const bs={x:404-recoil,y:315+breath},ds={x:293-recoil,y:317+breath};
const hand={x:535+rise*76-recoil,y:405-rise*93+Math.sin(aim)*210+breath};
const be=elbow(bs,hand,110,118,1);
segment(bowUpper,bs,be);segment(bowFore,be,hand);
// Root body stays anchored; only head and secondary hair motion respond to aim.
headGroup.setAttribute('transform',`rotate(${aim*14-p.recoil*2} 350 270) translate(0 ${breath*.35})`);
hair.setAttribute('transform',`rotate(${aim*5+Math.sin(now/830)*(reduced.matches?0:1.1)+p.recoil*6} 304 234)`);
bowGroup.setAttribute('transform',`translate(${hand.x} ${hand.y}) rotate(${aim*180/Math.PI})`);
// Bow art's grip is at the hand; its tips sit behind the grip.
const nock=-95-p.draw*100;string.setAttribute('d',`M-95 -169L${nock} 0L-95 163`);
arrow.setAttribute('x',nock-8);arrow.style.visibility=progress<.62?'visible':'hidden';
// Drawing hand follows the string nock exactly, not a separately animated pose.
const stringHand={x:hand.x+Math.cos(aim)*nock,y:hand.y+Math.sin(aim)*nock};
const actualElbow=elbow(ds,stringHand,90,124,1);segment(drawUpper,ds,actualElbow);segment(drawFore,actualElbow,stringHand);
const tx=805,ty=hand.y+Math.tan(aim)*(tx-hand.x);$('target').setAttribute('transform',`translate(${tx} ${ty})`);$('target').style.opacity=progress>.82?'.35':'1';
const show=progress>=.62&&progress<.82;flying.style.visibility=show?'visible':'hidden';const fx=hand.x+90+p.flight*(tx-hand.x-90),fy=hand.y+Math.tan(aim)*(fx-hand.x);$('projectile').setAttribute('transform',`translate(${fx} ${fy}) rotate(${aim*180/Math.PI})`);
bonePath.setAttribute('d',`M${bs.x} ${bs.y}L${be.x} ${be.y}L${hand.x} ${hand.y}M${ds.x} ${ds.y}L${actualElbow.x} ${actualElbow.y}L${stringHand.x} ${stringHand.y}`);
[bs,be,hand,ds,actualElbow,stringHand].forEach((v,i)=>{joints[i].setAttribute('cx',v.x);joints[i].setAttribute('cy',v.y)});
$('progress').value=progress;if(started!==null)$('scrub').value=progress*1000;
const text=p.phase+(started!==null?' · playing':progress>0?' · scrub to inspect':' · move your pointer to aim');if(text!==lastPhase){$('phase').textContent=text;lastPhase=text}
$('scene').dataset.phase=p.phase;$('scene').dataset.aim=aim.toFixed(3);$('scene').dataset.progress=progress.toFixed(3);
}
function tick(now){const dt=Math.min(.05,(now-previous)/1000);previous=now;aim+= (desired-aim)*(1-Math.exp(-10*dt));if(started!==null){progress=clamp((now-started)/duration,0,1);if(progress===1){started=null;progress=0;$('scrub').value=0;$('shoot').disabled=false;}}
render(now);if(!document.hidden&&(!reduced.matches||started!==null||Math.abs(aim-desired)>.001))raf=requestAnimationFrame(tick);else raf=0;}
function wake(){if(!raf){previous=performance.now();raf=requestAnimationFrame(tick)}}
function reset(){started=null;progress=0;$('scrub').value=0;$('shoot').disabled=false;render(performance.now());wake()}
function army(n){body.setAttribute('href',`#body${n?'Charcoal':'Ivory'}`);head.setAttribute('href',`#head${n?'Charcoal':'Ivory'}`);$('ivory').setAttribute('aria-pressed',!n);$('charcoal').setAttribute('aria-pressed',!!n);reset()}
$('ivory').onclick=()=>army(0);$('charcoal').onclick=()=>army(1);
$('shoot').onclick=()=>{if(started!==null)return;if(reduced.matches){progress=1;render(performance.now());$('phase').textContent='Shot complete · reduced motion';return}duration=$('slow').checked?5400:1800;started=performance.now();progress=0;$('shoot').disabled=true;wake()};
$('reset').onclick=()=>{desired=0;reset()};$('scrub').oninput=()=>{started=null;progress=Number($('scrub').value)/1000;$('shoot').disabled=false;render(performance.now());wake()};
$('rig').onclick=()=>{const show=$('rig').getAttribute('aria-pressed')!=='true';$('rig').setAttribute('aria-pressed',show);$('bones').setAttribute('visibility',show?'visible':'hidden')};
function point(e){if(started!==null)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform($('scene').getScreenCTM().inverse());desired=clamp(Math.atan2(p.y-320,Math.max(300,p.x-400)),-.26,.24);wake()}
$('scene').addEventListener('pointermove',e=>{if(e.pointerType==='mouse')point(e)});$('scene').addEventListener('pointerdown',point);
document.querySelectorAll('[data-aim]').forEach(b=>b.onclick=()=>{if(started!==null)return;desired=Number(b.dataset.aim);wake()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;if(started!==null)reset()}else wake()});reduced.addEventListener('change',reset);army(0);
