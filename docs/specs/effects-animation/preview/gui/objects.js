import { GameRules } from '../../../../../src/game-rules.ts';
import fixture from './card-fixture.json';

// Copy only browser-safe inputs from the shared fixture; never import its Node checks.
const rules = new GameRules({ hands: [fixture.setup.hand, fixture.setup.hand] });
const before = rules.fromFen(fixture.setup.fen);
const moves = rules.legalMoves(before).filter(move => rules.toLan(before, move) === fixture.actions[0]);
if (moves.length !== 1) throw new Error('The card coin needs one legal Freeze action');
const after = rules.makeMove(before, moves[0]);
if (after.used?.[0] !== fixture.expected.used[0] || after.turn !== fixture.expected.turn || after.marks?.[0]?.sq !== 35 || after.board[35] !== before.board[35] || rules.legalMoves(after).some(move => rules.toLan(after, move) === 'Nd5-c3')) throw new Error('The Freeze coin result differs from the shared fixture');

export function objectSamples({ $, scene, phase, style, image, clamp }) {
  const burst = (selector, t, start, length, reach) => {
    scene.querySelectorAll(`${selector} i`).forEach((node, i) => {
      const p = clamp((t - start - i * 23) / length), angle = (i * 137.5 - 85) * Math.PI / 180;
      Object.assign(node.style, { opacity: Math.sin(p * Math.PI) * .8, transform: `translate(${Math.cos(angle) * reach * p}px,${Math.sin(angle) * reach * p - 12 * p}px) rotate(${i * 39}deg)` });
    });
  };
  const flecks = cls => `<span class="obj-flecks ${cls}" aria-hidden="true">${'<i></i>'.repeat(9)}</span>`;
  return [
    {
      id: 'coin-spend', name: 'Card coin · cast & spent', group: 'Interface objects', duration: 2500,
      phases: [[0, 'Freeze card · ready'], [450, 'The card use commits'], [800, 'Frost leaves the coin'], [1450, 'The same slot · spent']],
      note: 'The live player-strip card coin gives one frost release, then keeps its painting in the same spent slot. The other card slots stay still. Freeze resolves through the shared engine fixture. No card refill or new currency.',
      html: `<div class="object-study coin-object"><span class="eyebrow">Your cards</span><h2>One card. One cast.</h2><div class="obj-strip">${image('kings/frost','obj-king')}<div class="obj-card-row"><div class="obj-card-cell"><span class="obj-coin obj-spend">${image('cards/freeze')}<span class="obj-coin-light"></span><span class="obj-frost-breath"></span>${flecks('obj-ice')}<span class="obj-spent-mark" aria-hidden="true">✓</span></span><b>Freeze</b><small class="obj-coin-state">Ready</small></div>${['strike','haste','flight'].map(name => `<div class="obj-card-cell"><span class="obj-coin">${image(`cards/${name}`)}</span><b>${name[0].toUpperCase()+name.slice(1)}</b><small>Ready</small></div>`).join('')}</div></div><div class="obj-receipt"><span class="obj-receipt-seal">✓</span><div><b class="obj-receipt-title">Freeze ready</b><small>The card keeps its slot.</small></div></div><p class="obj-status">Choose your moment.</p><button type="button" class="demo-button obj-action" data-jump="450">Preview card use</button></div>`,
      render(t) {
        const press = phase(t,450,170) * (1-phase(t,800,240)), use = phase(t,800,550), mist = clamp((t-650)/850);
        style('.obj-spend > img', {transform:`translateY(${2*press}px)`,filter:`grayscale(${use})`,opacity:1-.53*use});
        style('.obj-coin-light',{opacity:Math.sin(clamp((t-450)/950)*Math.PI)*.8});
        style('.obj-frost-breath',{opacity:Math.sin(mist*Math.PI)*.65,transform:`translate(-50%,${-52*mist}px) scale(${.65+.5*mist})`});
        burst('.obj-ice',t,750,650,46);
        style('.obj-spent-mark',{opacity:phase(t,1250,220)});
        style('.obj-receipt-seal',{opacity:phase(t,1200,240),transform:`translateY(${(1-phase(t,1200,240))*5}px)`});
        $('.obj-coin-state').textContent=t>=1250?'Spent':t>=450?'Casting':'Ready';
        $('.obj-receipt-title').textContent=t>=1250?'Freeze used':t>=450?'Casting Freeze':'Freeze ready';
        $('.obj-status').textContent=t>=1450?'Freeze is spent. The other cards stay ready.':t>=450?'One frost cast leaves the coin.':'Choose your moment.';
        $('.obj-spend').dataset.state=t>=1250?'used':'ready';
      }
    },
    {
      id: 'draw-reply', name: 'Draw offer · wait & reply', group: 'Interface objects', duration: 3100,
      phases: [[0, 'Offer a draw'], [400, 'The offer is sent'], [1050, 'Wait for the opponent'], [2000, 'Declined · the game continues']],
      note: 'A parchment notice receives a small gold impression when the offer is sent. It rests while the opponent decides. A declined reply closes the offer with a quiet stone settle. This is distinct from the accepted dialog opening and the final draw result.',
      html: `<div class="object-study draw-object"><span class="eyebrow">Game action</span><h2>Offer a draw</h2><div class="obj-offer-players"><div>${image('kings/frost')}<b>You</b></div><span class="obj-draw-seal" aria-hidden="true">½</span><div>${image('kings/shadow-b')}<b>Opponent</b></div></div><div class="obj-offer-slip"><span class="obj-paper-light"></span>${flecks('obj-gold')}<b class="obj-offer-line">Your opponent can accept or decline.</b><small class="obj-offer-detail">The game stays open.</small><span class="obj-reply-mark" aria-hidden="true">—</span></div><p class="obj-status">Your game continues while you wait.</p><button type="button" class="demo-button obj-action" data-jump="400">Preview draw offer</button></div>`,
      render(t) {
        const sent=phase(t,400,420), reply=phase(t,2000,340), hit=Math.sin(clamp((t-400)/650)*Math.PI);
        style('.obj-draw-seal',{transform:`translateY(${-5*hit}px)`,color:t>=2000?'var(--stone-500)':'var(--gold-ink)',boxShadow:`0 ${2+3*hit}px ${8+10*hit}px rgba(122,87,18,${.08+.16*hit})`});
        style('.obj-offer-slip',{transform:`translateY(${2*Math.sin(reply*Math.PI)}px)`,borderColor:t>=2000?'var(--stone-500)':'var(--stone-300)'});
        style('.obj-paper-light',{opacity:Math.sin(sent*Math.PI)*.7});
        burst('.obj-gold',t,520,470,35);
        style('.obj-reply-mark',{opacity:reply,transform:`translateY(${(1-reply)*-5}px)`});
        $('.obj-offer-line').textContent=t>=2000?'Draw offer declined.':t>=400?'Draw offered.':'Your opponent can accept or decline.';
        $('.obj-offer-detail').textContent=t>=2000?'The game continues.':t>=400?'Waiting for your opponent.':'The game stays open.';
        $('.obj-status').textContent=t>=2000?'Keep playing. No game result is recorded.':'Your game continues while you wait.';
        $('.obj-offer-slip').dataset.state=t>=2000?'declined':t>=400?'waiting':'ready';
      }
    }
  ];
}
