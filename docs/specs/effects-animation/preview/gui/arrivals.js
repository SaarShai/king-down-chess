export function arrivalSamples({ $, scene, phase, style, image, clamp }) {
  const dust = cls => `<span class="obj-warm-dust ${cls}" aria-hidden="true">${'<i></i>'.repeat(7)}</span>`;
  const scatter = (selector,t,start) => scene.querySelectorAll(`${selector} i`).forEach((node,i)=>{
    const p=clamp((t-start-i*19)/560),angle=(i*137.5-110)*Math.PI/180;
    Object.assign(node.style,{opacity:Math.sin(p*Math.PI)*.65,transform:`translate(${Math.cos(angle)*34*p}px,${Math.sin(angle)*27*p-8*p}px) rotate(${i*29}deg)`});
  });
  return [
    {
      id:'opponent-found', name:'Opponent found · arrival notice', group:'Interface objects', duration:2600,
      phases:[[0,'Finding an opponent'],[480,'A player joins the open game'],[950,'One warm portrait impression'],[1500,'Switch now or stay · your choice']],
      note:'The shipped opponent-found notice arrives while a computer game is open. The painted profile portrait meets a warm paper impression. The choice stays open with Switch now and Not now. This study does not choose or switch a game.',
      html:`<div class="object-study found-object"><span class="eyebrow">Your open game</span><h2 class="obj-found-title">Finding an opponent</h2><div class="obj-found-window"><div class="obj-found-wait"><span>…</span><b>Waiting for a player.</b></div><div class="obj-found-card"><div class="obj-found-art"><span class="obj-found-aura"></span>${image('kings/spirit','obj-found-portrait')}${dust('obj-found-dust')}<span class="obj-found-check" aria-hidden="true">✓</span></div><b>Your opponent joined your open game.</b><p>Switch now? The computer game then ends with no result.</p><div class="sample-actions"><button type="button" class="demo-button primary">Switch now</button><button type="button" class="demo-button">Not now</button></div></div></div><p class="obj-status">Your computer game stays here.</p></div>`,
      render(t) {
        const p=phase(t,480,420), stamp=phase(t,800,260), glow=Math.sin(clamp((t-600)/800)*Math.PI);
        style('.obj-found-wait',{opacity:1-p,visibility:t>=1000?'hidden':'visible'});
        style('.obj-found-card',{opacity:p,transform:`translateY(${(1-p)*10}px)`,visibility:t>=480?'visible':'hidden',pointerEvents:t>=1000?'auto':'none'});
        style('.obj-found-aura',{opacity:glow*.6,transform:`scale(${.8+.2*p})`});
        style('.obj-found-check',{opacity:stamp,transform:`translateY(${(1-stamp)*4}px)`});
        scatter('.obj-found-dust',t,750);
        $('.obj-found-title').textContent=t>=480?'Opponent found':'Finding an opponent';
        $('.obj-status').textContent=t>=1500?'Choose when to open the human game.':'Your computer game stays here.';
      }
    },
    {
      id:'setup-ready', name:'Both players · ready confirmation', group:'Interface objects', duration:3000,
      phases:[[0,'Both players choose'],[450,'Your Ready is confirmed'],[1450,'The other player is ready'],[2200,'The game can begin']],
      note:'Each setup strip receives one small seal only when that player is ready. The second seal gives a brief warm contact and settles. King art stays intact and the hidden opposing army stays hidden. The final line follows the real setup-to-playing handoff.',
      html:`<div class="object-study ready-object"><span class="eyebrow">Before the first move</span><h2>Ready at the table.</h2><div class="obj-ready-pair">${[['spirit','You','mine'],['shadow-b','Opponent','theirs']].map(([king,label,cls])=>`<div class="obj-ready-player ${cls}"><div class="obj-ready-art"><span class="obj-ready-warmth"></span>${image(`kings/${king}`)}<span class="obj-ready-seal" aria-hidden="true">✓</span>${dust(`obj-ready-${cls}`)}</div><b>${label}</b><small class="obj-ready-state">Choosing</small></div>`).join('')}</div><div class="obj-ready-receipt"><b class="obj-ready-line">Choose your king, then press Ready.</b><small>Their army stays hidden until both are ready.</small></div><p class="obj-status">Your setup stays in place.</p><button type="button" class="demo-button obj-action" data-jump="450">Preview Ready</button></div>`,
      render(t) {
        for(const [cls,start] of [['mine',450],['theirs',1450]]) {
          const p=phase(t,start,300), glow=Math.sin(clamp((t-start)/650)*Math.PI);
          style(`.${cls} .obj-ready-seal`,{opacity:p,transform:`translateY(${(1-p)*-6}px)`});
          style(`.${cls} .obj-ready-warmth`,{opacity:glow*.5});
          $(`.${cls} .obj-ready-state`).textContent=t>=start?'Ready':'Choosing';
          scatter(`.obj-ready-${cls}`,t,start+90);
        }
        $('.obj-ready-line').textContent=t>=2200?'White moves first.':t>=1450?'Both players are ready.':t>=450?'Waiting for the other player.':'Choose your king, then press Ready.';
        $('.obj-status').textContent=t>=2200?'The game begins.':t>=450?'Your Ready is confirmed.':'Your setup stays in place.';
        $('.obj-ready-pair').dataset.state=t>=1450?'both-ready':t>=450?'one-ready':'choosing';
      }
    },
    {
      id:'invite-copy', name:'Invite code · copy impression', group:'Interface objects', duration:2400,
      phases:[[0,'Six code tiles · sample'],[400,'Copy invite'],[800,'A paper copy leaves the code'],[1200,'Copied · the source stays intact']],
      note:'The six shipped code tiles hold still. A short light sweep and a paper impression make the copy tangible; an ink check confirms it. The source code and action keep their positions. This sample uses a fixed example and makes no clipboard or share call.',
      html:`<div class="object-study invite-object"><span class="eyebrow">Friend game · sample code</span><h2>Your game code</h2><div class="obj-code-tiles" aria-label="Sample code K D 7 Q 2 M">${[...'KD7Q2M'].map(c=>`<span>${c}<i aria-hidden="true"></i></span>`).join('')}</div><p class="obj-code-help">Your friend types this code in Play.</p><div class="obj-copy-well"><div class="obj-copy-paper"><span>Join King Down game</span><b>KD7Q2M</b><span class="obj-copy-check" aria-hidden="true">✓</span>${dust('obj-copy-dust')}</div></div><button type="button" class="demo-button obj-action obj-copy-button" data-jump="400"><span class="obj-copy-label">Copy invite</span></button><p class="obj-status">Sample only. Your clipboard stays as it is.</p></div>`,
      render(t) {
        scene.querySelectorAll('.obj-code-tiles i').forEach((node,i)=>{
          const p=clamp((t-400-i*35)/450); Object.assign(node.style,{opacity:Math.sin(p*Math.PI)*.65,transform:`translateX(${-80+160*p}%)`});
        });
        const copy=phase(t,680,470),stamp=phase(t,1070,230),press=phase(t,400,100)*(1-phase(t,600,150));
        style('.obj-copy-paper',{opacity:copy,transform:`translateY(${(1-copy)*-22}px) rotate(${(1-copy)*-2}deg)`});
        style('.obj-copy-check',{opacity:stamp,transform:`translateY(${(1-stamp)*-5}px)`});
        style('.obj-copy-button',{transform:`translateY(${2*press}px)`});
        scatter('.obj-copy-dust',t,1050);
        $('.obj-copy-label').textContent=t>=1200?'Copied ✓':'Copy invite';
        $('.obj-code-tiles').dataset.state=t>=1200?'copied':'ready';
      }
    }
  ];
}
