import { PaintedView } from '../../../../../../src/render/PaintedView';
import { GameRules } from '../../../../../../src/game-rules';
import { POWERS_BALANCED, parseKings } from '../../../../../../src/rules/rules';
import { toFen } from '../../../../../../src/rules/setup';
import { SHARED_MECHANICS } from '../../../../../../tools/fixtures/shared-mechanics';
import { RELEASED_CARDS } from '../../../../../../src/content/cards';
import { cardPlayback } from '../../../../../../src/render/effects/card';

const container = document.getElementById('board')!;
const view = new PaintedView(container);
const fixtures = RELEASED_CARDS.map(card => SHARED_MECHANICS.find(row => row.id === card.fixtureId)!);
let context: GameRules, pos: ReturnType<GameRules['fromFen']>, active = fixtures[0], index = 0, contacts = 0, flipped = false;
const cards = document.getElementById('cards') as HTMLSelectElement;
for (const fixture of fixtures) { const option = new Option(fixture.item, fixture.id); cards.add(option); }
function select(id: string) {
  active = fixtures.find(row => row.id === id)!;
  view.skip();
  const kings = active.setup.kings ? parseKings(active.setup.kings) : undefined;
  context = new GameRules({ ...(kings?.some(Boolean) ? POWERS_BALANCED : {}), ...(kings ? { kings } : {}), hands: [active.setup.hand!, active.setup.hand!] });
  pos = context.fromFen(active.setup.fen!); index = contacts = 0; view.setRules(context); view.sync(pos); cards.value = id;
  document.getElementById('title')!.textContent = active.item + ' · real card playback';
  document.getElementById('result')!.textContent = active.actions.join(' → ');
  return state();
}
async function step() {
  const before = pos, action = active.actions[index];
  const move = context.legalMoves(before).find(m => context.toLan(before, m) === action)!;
  if (!move) throw new Error(`No legal action ${action}`);
  const duration = cardPlayback(context, before, move)?.duration ?? 1000;
  (window as any).cardGame.duration = duration;
  const after = context.makeMove(before, move);
  await view.animateMove(before, move, () => contacts++);
  pos = after; index++; view.sync(pos);
  document.getElementById('result')!.textContent = `${active.actions.slice(0, index).join(' → ')} · legal result`;
  return state();
}
function state() { return { id: active.id, index, contacts, fen: toFen(pos), board: Array.from(pos.board), renderBoard: Array.from((view as any).scene.position.board), flipped, animating: (view as any).scene.animating, card: (view as any).card?.action, frame: (view as any).card?.frame?.t }; }
(window as any).cardGame = { view, select, step, state, duration: 0, flip(value: boolean) { flipped = value; view.flip(value); }, dispose() { view.dispose(); } };
cards.onchange = () => select(cards.value);
document.getElementById('play')!.onclick = async () => { while (index < active.actions.length) await step(); };
document.getElementById('flip')!.onclick = () => { flipped = !flipped; view.flip(flipped); };
select('card-burn');
await view.ready();
(window as any).cardGame.ready = true;
