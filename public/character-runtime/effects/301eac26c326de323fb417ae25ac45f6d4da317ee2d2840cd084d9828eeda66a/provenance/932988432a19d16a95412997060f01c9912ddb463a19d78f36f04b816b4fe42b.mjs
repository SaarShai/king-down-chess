// Reuse the approved texture. This clock never reads or resets the body clock.
export class ArrowSmoke {
  constructor(){this.image=new Image();this.image.src='effects/golden-wisp.png';this.clock=0;this.credit=0;this.particles=[];this.seed=937361;}
  random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;}
  tick(dt,anchor,scale=0.65){this.clock+=dt;this.particles=this.particles.filter(p=>this.clock-p.born<p.life);this.credit+=dt*5;while(this.credit>=1){this.credit--;if(!anchor||this.particles.length>=18)continue;const r=()=>this.random();this.particles.push({born:this.clock,x:anchor[0]+(r()-.5)*4,y:anchor[1],life:1.4+r()*.5,opacity:.28+r()*.12,scale:(.067+r()*.019)*scale,rise:(45+r()*30)*scale,drift:(r()*18-9)*scale,rotation:(r()-.5)*.22});}}
  draw(ctx){if(!this.image.complete)return;for(const p of this.particles){const age=this.clock-p.born,t=age/p.life,envelope=Math.min(1,age/.12)*Math.pow(1-t,.55);ctx.save();ctx.translate(p.x+p.drift*age+Math.sin(age*3)*3,p.y-p.rise*age);ctx.rotate(p.rotation);ctx.scale(p.scale*(1+t*.18),p.scale*(1+t*.18)*1.4);ctx.globalAlpha=Math.min(.8,p.opacity*1.8)*envelope;ctx.drawImage(this.image,-622,-1092);ctx.restore();}}
}
