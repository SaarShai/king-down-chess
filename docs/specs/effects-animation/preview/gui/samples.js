import { art } from '../../../../../src/account-game/art';
export function otherSamples({ $, scene, phase, style, reveal, image, clamp }) {
  const piece = (name, label = name) => `<div class="army-piece">${image(`pieces/${name}-w`)}<span>${label}</span></div>`;
  const card = (name, i) => `<div class="study-card" data-card="${i}"><div class="card-picture">${image(`cards/${name.toLowerCase()}`)}<span class="card-tick">✓</span></div><b>${name}</b><small class="card-state">Ready</small></div>`;
  const dialog = (title, body, actions) => `<div class="sample-dialog"><span class="dialog-ornament">◆</span><h2>${title}</h2><p>${body}</p><div class="sample-actions">${actions}</div></div>`;
  const button = (label, jump, primary = false) => `<button type="button" class="demo-button${primary ? ' primary' : ''}" data-jump="${jump}">${label}</button>`;
  const result = (kind, label, title, copy, extra) => `<div class="result ${kind}"><div class="result-seal">${kind === 'draw' ? '<span>½</span><span>½</span>' : kind === 'defeat' ? image('emblems/shadow') : '<span>—</span>'}</div><p class="result-label">${label}</p><h2 class="result-title">${title}</h2><div class="gold-rule"></div><p class="result-copy">${copy}</p><div class="result-detail">${extra}</div></div>`;
  return [
    {
      id: 'army', name: 'Game & army reveal', group: 'The game', duration: 3500,
      phases: [[0, 'The table opens'], [400, 'Your king'], [1050, 'Your army'], [2200, 'White moves first']],
      note: 'The king arrives first. The army follows in a short ordered reveal, then the first-turn prompt takes focus. All figures use the game art.',
      html: `<div class="army-reveal"><div class="army-king">${image('kings/frost')}<div><span class="eyebrow">Your king</span><h2>Frost</h2><p>White army</p></div></div><div class="army-line">${piece('knight','Knight')}${piece('archer','Archer')}${piece('paladin','Paladin')}${piece('rook','Rook')}</div><div class="first-turn"><span class="turn-line"></span><b>White moves first.</b><small>Your game begins.</small></div></div>`,
      render(t) { reveal('.army-king',t,250,600,20); scene.querySelectorAll('.army-piece').forEach((node,i)=>{const p=phase(t,850+i*130,450);Object.assign(node.style,{opacity:p,transform:`translateY(${(1-p)*25}px)`});});reveal('.first-turn',t,2200,420,8); }
    },
    {
      id: 'turn', name: 'Turn handoff', group: 'The game', duration: 3300,
      phases: [[0, 'Move sent'], [550, 'The turn passes'], [1300, 'Opponent’s turn']],
      note: 'The turn marker travels once between player panels. The prompt changes as it arrives; there is no repeating pulse while you wait.',
      html: `<div class="center-study"><div class="turn-pair"><div class="turn-side white">${image('kings/frost')}<b>You</b><small>White</small></div><div class="handoff-route"><div class="handoff-token">◆</div></div><div class="turn-side black">${image('kings/shadow-b')}<b>Opponent</b><small>Black</small></div></div><h2 class="handoff-title">Move sent.</h2><p class="handoff-copy">Your move is complete.</p></div>`,
      render(t) { const p=phase(t,550,700);style('.handoff-token',{transform:`translateX(${p*76}px) rotate(${p*90}deg)`,opacity:t<500?0:1});style('.turn-side.white',{opacity:1-.42*p});style('.turn-side.black',{opacity:.58+.42*p});$('.handoff-title').textContent=t<1300?'Move sent.':'Opponent’s turn';$('.handoff-copy').textContent=t<1300?'Your move is complete.':'Wait for Black to move.';reveal('.handoff-title',t,100,350,5); }
    },
    {
      id: 'check', name: 'Check', group: 'The game', duration: 2500,
      phases: [[0, 'The king is threatened'], [350, 'One warning beat'], [1000, 'The warning stays readable']],
      note: 'A single tightening frame marks check. The red word and direct instruction stay after the motion stops. This is GUI feedback; board threat marks belong to the board study.',
      html: `<div class="center-study check-study"><div class="check-portrait">${image('kings/frost')}<div class="check-frame"></div></div><p class="result-label">Your king is threatened</p><h2 class="check-title">Check</h2><p>Get your king out of check.</p><span class="notice-tag">White to move</span></div>`,
      render(t){const p=phase(t,250,430);style('.check-frame',{opacity:p,transform:`scale(${1.2-.2*p})`});style('.check-title',{opacity:p,transform:`translateY(${(1-p)*10}px)`});reveal('.check-study > p, .notice-tag',t,650,400,5);}
    },
    {
      id:'defeat', name:'Defeat', group:'Game endings', duration:3000,
      phases:[[0,'A quiet pause'],[700,'The loss is clear'],[1300,'A useful next step']],
      note:'Loss uses a slower downward settle and quiet stone. No victory burst, flourish or taunt. The result appears before the review action.',
      html:result('defeat','Black wins','Your king falls.','Every game leaves a lesson.',button('Review the final move',1300)),
      render(t){reveal('.result-seal',t,200,700,-12);reveal('.result-title',t,650,700,-8);reveal('.result-label, .gold-rule',t,850,500,0);reveal('.result-copy, .result-detail',t,1300,450,5);}
    },
    {
      id:'draw', name:'Draw', group:'Game endings', duration:2800,
      phases:[[0,'Both sides hold'],[450,'A balanced result'],[1400,'Reason and next step']],
      note:'Both halves meet at the same time. A centered line and neutral wording make the draw distinct from a win or a loss.',
      html:result('draw','A shared result','Draw','Neither kingdom falls.','<p class="ending-reason">By agreement</p>'+button('Review game',1500)),
      render(t){const p=phase(t,200,650);scene.querySelectorAll('.result-seal span').forEach((node,i)=>Object.assign(node.style,{opacity:p,transform:`translateX(${(1-p)*(i?25:-25)}px)`}));reveal('.result-title',t,450,500,0);reveal('.result-label, .gold-rule',t,700,400,0);reveal('.result-copy, .result-detail',t,1300,450,8);}
    },
    {
      id:'abort',name:'Abort / game did not start',group:'Game endings',duration:2600,
      phases:[[0,'The invitation closes'],[550,'No result is recorded'],[850,'Return to the table']],
      note:'Neutral closure uses a small, level fade. There is no fallen king or score. “Game did not start” is explicit so this cannot read as a defeat.',
      html:result('abort','Game closed','No game played.','The game did not start.','<p class="ending-reason">No result recorded.</p>'+button('Back to games',1400)),
      render(t){reveal('.result-seal',t,100,400,0);reveal('.result-title, .result-label',t,450,450,0);reveal('.gold-rule, .result-copy, .result-detail',t,850,350,0);}
    },
    {
      id:'cards',name:'Cards · deal, select, use, refill',group:'Cards & powers',duration:6200,
      phases:[[0,'Four cards are dealt'],[1700,'Freeze is selected'],[3100,'Freeze is used'],[4500,'A new card fills the slot']],
      note:'Four actual card paintings deal with a short stagger. Selection lifts one card. Use presses it into a spent state; the optional refill arrives into the same slot. This is motion vocabulary, not a proposed rule change.',
      html:`<div class="card-study"><span class="eyebrow">Your cards</span><h2 class="card-heading">A fresh hand.</h2><div class="card-hand">${card('Freeze',0)}${card('Strike',1)}${card('Haste',2)}${card('Flight',3)}</div><p class="card-message">Four cards. Choose your moment.</p></div>`,
      render(t){scene.querySelectorAll('.study-card').forEach((node,i)=>{const p=phase(t,150+i*130,500);let y=(1-p)*65,angle=(1-p)*(i-1.5)*9,scale=.9+.1*p; if(i===0&&t>=1700&&t<3100)y=-16*phase(t,1700,300); if(i===0&&t>=3100&&t<4500){const use=phase(t,3100,400);y=-16+16*use;scale=1-.04*use;} if(i===0&&t>=4500){const fill=phase(t,4500,500);y=(1-fill)*25;angle=(1-fill)*-6;}Object.assign(node.style,{opacity:p,transform:`translateY(${y}px) rotate(${angle}deg) scale(${scale})`,borderColor:i===0&&t>=1700&&t<3100?'var(--gold-ink)':'var(--stone-300)'});});const used=t>=3100&&t<4500,refill=t>=4500;const first=scene.querySelector('[data-card="0"]');first.querySelector('img').src=art(refill?'ui/cards/leap.webp':'ui/cards/freeze.webp');first.querySelector('b').textContent=refill?'Leap':'Freeze';first.querySelector('.card-state').textContent=used?'Used':t>=1700&&!refill?'Selected':'Ready';first.querySelector('.card-picture').style.filter=used?'grayscale(1)':'none';first.querySelector('.card-tick').style.opacity=used?1:0;$('.card-heading').textContent=refill?'Ready for the next move.':used?'Freeze used.':t>=1700?'Choose a piece to freeze.':'A fresh hand.';$('.card-message').textContent=refill?'Sample refill · one card replaces one slot.':used?'The card keeps its place while it is spent.':t>=1700?'Only the selected card moves forward.':'Four cards. Choose your moment.';}
    },
    {
      id:'power',name:'Power · one use spent',group:'Cards & powers',duration:3000,
      phases:[[0,'Two uses remain'],[650,'The power is used'],[1300,'One use is spent']],
      note:'The active use closes once into the spent state. The power count changes at contact. The remaining use stays bright and still.',
      html:`<div class="center-study power-study">${image('emblems/frost','power-emblem')}<span class="eyebrow">Frost power</span><h2>Power ready.</h2><div class="uses"><span class="use-coin">◆</span><span class="use-coin spent-target">◆<i></i></span></div><p class="power-count">2 uses left</p><p class="subtle">Your power stays in the same place.</p></div>`,
      render(t){const p=phase(t,650,500);style('.spent-target',{transform:`scale(${1-.1*p})`,color:t>=1050?'var(--stone-500)':'var(--gold-ink)',background:t>=1050?'var(--stone-100)':'var(--vellum)'});style('.spent-target i',{transform:`scaleX(${p})`,opacity:p});style('.power-emblem',{transform:`scale(${1+.06*Math.sin(clamp((t-650)/650)*Math.PI)})`});$('.power-count').textContent=t>=1050?'1 use left':'2 uses left';$('.power-study h2').textContent=t>=1050?'Power used.':'Power ready.';}
    },
    {
      id:'promotion',name:'Promotion choice',group:'Game actions',duration:3800,
      phases:[[0,'The choice opens'],[600,'Promotion options'],[1900,'Queen is chosen'],[2800,'The choice settles']],
      note:'The choice panel arrives as one unit. A brief stagger helps scan the pieces. The chosen piece rises and keeps a clear label; the others recede.',
      html:`<div class="center-study promotion-study"><div class="promotion-sheet"><span class="eyebrow">Pawn promotion</span><h2>Choose a piece.</h2><div class="promotion-options">${['queen','rook','bishop','knight'].map((name,i)=>`<button type="button" data-jump="1900" class="promotion-option ${i===0?'chosen':''}">${image(`pieces/${name}-w`)}<span>${name[0].toUpperCase()+name.slice(1)}</span><small>${i===0?'Chosen':' '}</small></button>`).join('')}</div><p class="promotion-caption">Your pawn becomes your choice.</p></div></div>`,
      render(t){reveal('.promotion-sheet',t,100,400,20);scene.querySelectorAll('.promotion-option').forEach((node,i)=>{const p=phase(t,550+i*90,350),choose=phase(t,1900,400);Object.assign(node.style,{opacity:p*(i?1-.58*choose:1),transform:`translateY(${(1-p)*12-(i===0?8*choose:0)}px)`,borderColor:i===0&&t>=1900?'var(--gold-ink)':'var(--stone-300)'});node.querySelector('small').style.opacity=i===0?choose:0;});$('.promotion-caption').textContent=t>=1900?'Queen selected.':'Your pawn becomes your choice.';}
    },
    {
      id:'confirm',name:'Move / send confirmation',group:'Game actions',duration:3300,
      phases:[[0,'Ready to send'],[650,'Sending'],[1500,'The move is confirmed']],
      note:'The button holds its width while the label changes. A drawn check confirms success only after the send phase. This sample sends nothing.',
      html:`<div class="center-study send-study"><span class="eyebrow">Your move</span><div class="move-slip"><small>Move 18</small><strong>Knight to f5</strong><span class="move-status">Ready to send</span></div><button type="button" class="demo-button primary send-button" data-jump="650"><span class="send-check">✓</span><span class="send-label">Send move</span></button><p class="send-copy">Review your move, then send.</p></div>`,
      render(t){const done=t>=1500,sending=t>=650&&!done;$('.send-label').textContent=done?'Move sent':sending?'Sending…':'Send move';$('.move-status').textContent=done?'Confirmed':sending?'Waiting for confirmation':'Ready to send';$('.send-copy').textContent=done?'Your opponent can now move.':sending?'Keep this window open.':'Review your move, then send.';const p=phase(t,1500,350);style('.send-check',{width:`${20*p}px`,opacity:p,transform:`scale(${.6+.4*p})`});const press=t>=650&&t<1000?Math.sin((t-650)/350*Math.PI):0;style('.send-button',{transform:`translateY(${2*press}px)`});}
    },
    {
      id:'failure',name:'Move / send failure',group:'Game actions',duration:3400,
      phases:[[0,'Sending'],[750,'The send fails'],[1400,'Keep the move and offer retry']],
      note:'An error settles below the pending move. The move remains intact and the retry action appears in the same place. No shake of the whole screen.',
      html:`<div class="center-study send-study"><span class="eyebrow">Your move</span><div class="move-slip"><small>Move 18</small><strong>Knight to f5</strong><span class="move-status">Sending…</span></div><div class="send-error"><b>Move not sent.</b><span>Your move is still here. Try again.</span></div><button type="button" class="demo-button primary retry-button" data-jump="1400">Try again</button><p class="subtle">Mocked failure · no request is sent.</p></div>`,
      render(t){reveal('.send-error',t,750,400,8);reveal('.retry-button',t,1400,350,5);$('.move-status').textContent=t>=750?'Not sent':'Sending…';style('.move-slip',{borderColor:t>=750?'var(--accent)':'var(--stone-300)'});}
    },
    {
      id:'history',name:'Undo / replay',group:'Game actions',duration:4200,
      phases:[[0,'Move 18'],[650,'Undo returns one step'],[1600,'Move 17 restored'],[2600,'Replay returns forward']],
      note:'The history marker moves one place. Undo and replay use opposite directions while the move labels remain fixed. The board would follow the same selected move.',
      html:`<div class="center-study history-study"><span class="eyebrow">Review game</span><h2 class="history-heading">Move 18</h2><div class="history-rail"><div class="history-item"><small>Move 16</small><b>Paladin to d4</b></div><div class="history-item"><small>Move 17</small><b>Rook to f8</b></div><div class="history-item"><small>Move 18</small><b>Knight to f5</b></div><span class="history-marker"></span></div><div class="sample-actions">${button('← Undo',650)}${button('Replay →',2600)}</div><p class="history-copy">The latest move.</p></div>`,
      render(t){const back=phase(t,650,600),forward=phase(t,2600,650);const n=2-back+forward;style('.history-marker',{transform:`translateX(${n*100}%)`});$('.history-heading').textContent=n<1.5?'Move 17':'Move 18';$('.history-copy').textContent=t<650?'The latest move.':t<2600?'One move restored.':'Replay returns to the latest move.';}
    },
    {
      id:'dialog',name:'Dialog open / close',group:'Interface feedback',duration:4300,
      phases:[[0,'The game stays in place'],[500,'The dialog opens'],[2100,'The choice is readable'],[3200,'The dialog closes']],
      note:'A short rise and soft backdrop separate the choice from the game. Closing reverses the same path; focus returns to the action that opened it.',
      html:`<div class="center-study dialog-study"><span class="eyebrow">Game actions</span><h2>Take a moment.</h2><p>Your game is still here.</p>${button('Offer a draw',500)}<div class="dialog-layer"><div class="dialog-shade"></div>${dialog('Offer a draw?','Your opponent can accept or continue the game.',button('Keep playing',3200)+button('Offer draw',3200,true))}</div></div>`,
      render(t){const p=phase(t,500,350)*(1-phase(t,3200,300));style('.dialog-shade',{opacity:p*.4});style('.sample-dialog',{opacity:p,transform:`translateY(${(1-p)*22}px) scale(${.98+.02*p})`});style('.dialog-layer',{visibility:p>0?'visible':'hidden',pointerEvents:p>.5?'auto':'none'});}
    },
    {
      id:'button',name:'Button feedback',group:'Interface feedback',duration:3400,
      phases:[[0,'Ready'],[650,'Press · the raised face meets its base'],[1200,'Release'],[2100,'Confirmed']],
      note:'The stone button moves by two pixels on press. A short label change confirms the action. Hover and focus use the game’s own control styling.',
      html:`<div class="center-study button-study"><span class="eyebrow">Small actions</span><h2>A deliberate press.</h2><button type="button" class="demo-button primary feedback-button" data-jump="650">Ready to play</button><p class="feedback-copy">The raised edge invites a press.</p></div>`,
      render(t){const press=phase(t,650,150)*(1-phase(t,1200,180));style('.feedback-button',{transform:`translateY(${press*2}px)`,boxShadow:`0 ${2*(1-press)}px 0 var(--accent-deep), inset 0 1px 0 rgba(255,255,255,.2)`});$('.feedback-button').textContent=t>=2100?'Ready ✓':'Ready to play';$('.feedback-copy').textContent=t>=2100?'Your choice is confirmed.':t>=650&&t<1400?'Press, release, then confirm.':'The raised edge invites a press.';}
    },
    {
      id:'connection',name:'Connection lost / recovered',group:'Interface feedback',duration:5000,
      phases:[[0,'Connected'],[500,'Connection lost'],[1400,'The game stays in place'],[3200,'Connection restored']],
      note:'A persistent notice enters the game frame without moving the content. Recovery replaces it with one quiet check. This is a mocked connection state.',
      html:`<div class="connection-study"><div class="connection-notice"><span class="connection-symbol">!</span><div><b>Connection lost</b><small>Reconnecting. Your game stays here.</small></div></div><div class="connection-content"><span class="eyebrow">Your game</span><h2>White to move</h2>${image('kings/frost','connection-king')}<p class="connection-copy">Choose your next move.</p></div></div>`,
      render(t){const p=phase(t,500,350);style('.connection-notice',{opacity:p,transform:`translateY(${(1-p)*-18}px)`,borderColor:t>=3200?'var(--stone-500)':'var(--accent)',background:t>=3200?'var(--vellum)':'#f7e7df'});$('.connection-notice b').textContent=t>=3200?'Connection restored':'Connection lost';$('.connection-notice small').textContent=t>=3200?'Your game is up to date.':'Reconnecting. Your game stays here.';$('.connection-symbol').textContent=t>=3200?'✓':'!';$('.connection-copy').textContent=t>=500&&t<3200?'Please wait while we reconnect.':'Choose your next move.';}
    },
    {
      id:'lesson',name:'Lesson complete',group:'Interface feedback',duration:3400,
      phases:[[0,'The final move lands'],[450,'The lesson is complete'],[1500,'Progress is recorded'],[2200,'The next lesson']],
      note:'A single ink check and a short progress fill celebrate learning without borrowing the match victory. The next lesson arrives last.',
      html:`<div class="center-study lesson-study"><div class="lesson-seal">✓</div><span class="eyebrow">Lesson complete</span><h2>A way through.</h2><p>You found the move that opens the line.</p><div class="lesson-progress"><div><b>Learning the pieces</b><small>3 of 6 complete</small></div><span><i></i></span></div><div class="lesson-next">${button('Next lesson →',2400,true)}</div></div>`,
      render(t){const p=phase(t,350,450);style('.lesson-seal',{opacity:p,transform:`scale(${.85+.15*p}) rotate(${-8+8*p}deg)`});reveal('.lesson-study > .eyebrow, .lesson-study > h2, .lesson-study > p',t,600,450,8);reveal('.lesson-progress',t,1250,350,8);style('.lesson-progress i',{transform:`scaleX(${1/3+phase(t,1500,500)/6})`});reveal('.lesson-next',t,2250,400,10);}
    }
  ];
}
