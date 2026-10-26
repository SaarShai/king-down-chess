import { createScene } from '/docs/2d-first-pieces/board/scene.mjs';
import { frozenPieces, frost, FROST_DEFS } from '/src/render/frost';
import { GameRules } from '/src/game-rules';
import * as pieces from '/src/rules/engine';
import { POWERS_BALANCED, parseKings } from '/src/rules/rules';
import { RELEASED_CARDS } from '/src/content/cards';
import fixtures from './fixtures.json';
import { cardLender } from '/src/render/effects/card';
import { drawFreeze, drawIceWall, drawFirewall } from '/src/render/effects/materials';
import { HEROES, drawHero } from '/src/render/effects/card-hero';
import { MOVEMENT_IDS, MOVEMENT_DURATIONS, drawMovement } from '/src/render/effects/card-movement';
import { SPELL_IDS, SPELL_DURATIONS, drawSpell } from '/src/render/effects/card-spell';

const effectRenderers = new Map([
  ...[...HEROES].map(id => [id, drawHero]),
  ...[...MOVEMENT_IDS].map(id => [id, drawMovement]),
  ...[...SPELL_IDS].map(id => [id, drawSpell]),
]);
const durations = { Burn: 1500, Freeze: 1600, EarthQuake: 1650, ...MOVEMENT_DURATIONS, ...SPELL_DURATIONS };
if (effectRenderers.size !== RELEASED_CARDS.length || HEROES.size + MOVEMENT_IDS.size + SPELL_IDS.size !== effectRenderers.size) throw new Error('Each released card needs exactly one effect');

// This data is a literal export of SHARED_MECHANICS's card family. No mechanics are authored here.
const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const square = name => name.charCodeAt(0) - 97 + (Number(name[1]) - 1) * 8;
const letters = ' PNBRQKALGMSOCVT';
const $ = id => document.getElementById(id);
const descriptions = {
  Freeze: ['Pin the enemy knight on d5 in ice.', 'The knight stays on d5. Its next turn is frozen.'],
  IceWall: ['Build an ice ward around the rook on a4.', 'The bishop on c2 cannot capture the warded rook.'],
  Strike: ['Send the pawn from d2 to d6 along a queen line.', 'The pawn stays a pawn. This move takes no piece.'],
  Haste: ['The rook captures on a5, then moves again to capture on e5.', 'Both captures use the same rook. White then ends the turn.'],
  Flight: ['Lift the knight from b1 to the empty d3 square.', 'The knight lands in its own half. It takes no piece.'],
  Sacrifice: ['Trade the pawn on a2 for a queen from White’s captured reserve.', 'The queen stands on a2. The captured Guard stays in reserve.'],
  March: ['Move the pawn from e3 through e4 to e5.', 'The pawn takes two forward steps from its current rank.'],
  Leap: ['The rook jumps over its own pawn on a2 and lands on a3.', 'The pawn stays on a2. No piece is captured.'],
  Salvation: ['Return the captured rook to the empty h1 square.', 'The rook leaves White’s reserve and re-enters the board.'],
  MirrorB: ['Mirror copies White’s own Freeze card onto d6. Then a2–a3 completes the turn.', 'Mirror is spent. The original Freeze card stays in hand.'],
  Firewall: ['Ward White’s whole army, then move the rook from a2 to d2.', 'The rook and knight are protected from capture. Firewall does no damage.'],
  EarthQuake: ['A ring from d4 pushes the knight c4→b4 and the pawn d5→d6.', 'The diagonal bishop on e3 stays still. No piece is captured.'],
  Burn: ['The rook captures the knight on d5 along a queen line.', 'd5 is in the central four-square zone. The queen on d1 stays still.'],
  FireStarter: ['The rook crosses a1→h8 along a queen line and captures there.', 'The target is on the enemy back rank. The knight on b8 stays still.'],
  Control: ['The knight borrows the adjacent friendly rook’s move to capture on b7.', 'The knight keeps its type. The lending rook stays on a1.'],
  Rally: ['Move the rook a1→a5, then a different piece: the knight b1→d2.', 'Both moves are quiet. The pawn on c3 stays on the board.'],
  MorphP: ['The pawn on b2 becomes a knight on the same square.', 'Morph permits a knight or bishop. This sample chooses a knight.'],
  Mimic: ['The knight borrows the friendly rook’s move and travels b1→b4.', 'It stays a knight and makes a quiet move. The enemy on b5 stays still.'],
  Vault: ['The rook vaults over the enemy knight on a3 and captures on a6.', 'Exactly one piece is passed. The knight on a3 stays on its square.'],
  Curse: ['Force the enemy knight one square from d5 to e5.', 'The knight stays with Black. No piece is captured.'],
  SkyLift: ['Lift the rook on a1 and the knight on g1 into a trade.', 'The two friendly pieces exchange squares. The b1 knight and c1 bishop stay still.'],
};


function verifyExpected(pos, context, expected, label) {
  const assert = (ok, what) => { if (!ok) throw new Error(`${label}: ${what}`); };
  for (const [name, want] of Object.entries(expected.board ?? {})) {
    const p = pos.board[square(name)], letter = letters[p & 15];
    assert((p ? (p & 16 ? letter.toLowerCase() : letter) : null) === want, `board ${name}`);
  }
  if (expected.turn !== undefined) assert(pos.turn === expected.turn, 'turn');
  if (expected.used) assert(JSON.stringify(pos.used ?? [0, 0]) === JSON.stringify(expected.used), 'spent cards');
  if (expected.haste !== undefined) assert((pos.haste === undefined ? null : pieces.sqName(pos.haste)) === expected.haste, 'continuation');
  if (expected.free !== undefined) assert(!!pos.free === expected.free, 'free continuation');
  if (expected.marks) {
    const norm = mark => mark ? [typeof mark.sq === 'number' ? pieces.sqName(mark.sq) : mark.sq, !!mark.ward, !!mark.all, mark.left ?? 1] : null;
    assert(JSON.stringify([0, 1].map(side => norm(pos.marks?.[side]))) === JSON.stringify(expected.marks.map(norm)), 'marks');
  }
  if (expected.halfmove !== undefined) assert(pos.halfmove === expected.halfmove, 'halfmove');
  for (const [letter, count] of Object.entries(expected.lost ?? {})) assert((pos.lost?.[(letter === letter.toLowerCase() ? 16 : 0) + letters.indexOf(letter.toUpperCase())] ?? 0) === count, `reserve ${letter}`);
  for (const [key, value] of Object.entries(expected.rules ?? {})) assert(context.rules[key] === value, `rule ${key}`);
  const legal = context.legalMoves(pos).map(m => context.toLan(pos, m));
  for (const action of expected.legalIncludes ?? []) assert(legal.includes(action), `legal ${action}`);
  for (const action of expected.legalExcludes ?? []) assert(!legal.includes(action), `excluded ${action}`);
}
function buildSample(card) {
  const draw = effectRenderers.get(card.id);
  if (!draw || !durations[card.id]) throw new Error(`Missing ${card.id} effect`);
  const fixture = fixtures.find(f => f.id === card.fixtureId);
  if (!fixture) throw new Error(`Missing ${card.id} fixture`);
  const kings = fixture.setup.kings ? parseKings(fixture.setup.kings) : undefined;
  const context = new GameRules({ ...(kings?.some(Boolean) ? POWERS_BALANCED : {}), ...(kings ? { kings } : {}), hands: [fixture.setup.hand, fixture.setup.hand] });
  let pos = context.fromFen(fixture.setup.fen);
  const events = fixture.actions.map((action, i) => {
    const legal = context.legalMoves(pos).filter(m => context.toLan(pos, m) === action);
    if (legal.length !== 1) throw new Error(`${card.id}: ${action} has ${legal.length} matches`);
    const move = legal[0], before = pos, after = context.makeMove(pos, move);
    pos = after;
    for (const checkpoint of fixture.checkpoints ?? []) if (checkpoint.after === i + 1) verifyExpected(pos, context, checkpoint.expected, card.id);
    return { action, move, before, after, lender: cardLender(context, before, move) };
  });
  verifyExpected(pos, context, fixture.expected, card.id);
  return { ...card, fixture, context, events, duration: durations[card.id], draw, description: descriptions[card.id] };
}
const samples = RELEASED_CARDS.map(buildSample);
if (samples.length !== 21 || new Set(samples.map(s => s.id)).size !== 21) throw new Error('Released card coverage changed');
const canvas = $('board');
const scene = createScene({ canvas, pieces, headroom: 64, floor: null, kings: ['spirit', 'shadow'] });
scene.setLively({ atmosphere: true, moves: false, idle: false, kings: false, pawns: false, captures: false });
scene.setReducedMotion(true);
const frostImages = new Map();
function frostImage(layer, turns) {
  const key = `${layer}:${turns}`;
  if (frostImages.has(key)) return frostImages.get(key);
  const image = new Image();
  image.onload = () => scene.redraw();
  const drawing = frost(0, 0, 112, turns)[layer === 'under' ? 0 : 1];
  image.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="448" height="538" viewBox="0 0 112 134.4"><defs>${FROST_DEFS}</defs>${drawing}</svg>`)}`;
  frostImages.set(key, image);
  return image;
}
frostImage('under', 1); frostImage('over', 1);
// Ghost draws its own contact shadow. Suppress only that multiply pass for an airborne figure.
const airContext = new Proxy(canvas.getContext('2d'), {
  get(target, key) {
    if (key === 'drawImage' || key === 'fill') return (...args) => { if (target.globalCompositeOperation !== 'multiply') target[key](...args); };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  },
  set(target, key, value) { target[key] = value; return true; },
});
const initialId = new URL(location.href).searchParams.get('sample');
let active = samples.find(s => s.id === initialId) ?? samples.find(s => s.id === 'Burn'), progress = 0, playing = false, ready = false, flipped = false;
let speed = 1, raf = 0, lastTime = 0, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let current, shown;
function timeline() {
  const scaled = progress * active.events.length;
  const index = Math.min(active.events.length - 1, Math.floor(scaled));
  const t = progress === 1 ? 1 : scaled - index;
  const event = active.events[index];
  return { ...event, index, t, travel: ease((t - .22) / .4), contact: clamp((t - .62) / .2), resolve: clamp((t - .8) / .2) };
}
function movingUnits(e) {
  const m = e.move;
  if (m.pushes) return m.pushes.map(p => ({ ...p, value: e.before.board[p.from] }));
  if (m.swap) return [{ from: m.from, to: m.to, value: e.before.board[m.from] }, { from: m.to, to: m.from, value: e.before.board[m.to] }];
  if (m.from !== m.to) return [{ from: m.from, to: m.to, value: e.before.board[m.from] }];
  return [];
}
function updateBoard() {
  current = timeline(); const e = current, m = e.move;
  if (e.t >= .62 || reduced) shown = e.after;
  else {
    const board = new Uint8Array(e.before.board);
    if (e.t > .22) for (const unit of movingUnits(e)) board[unit.from] = 0;
    if ((m.promo || m.drop) && e.t > .35) board[m.from] = 0;
    shown = { ...e.before, board };
  }
  scene.setPosition(shown);
  const kings = active.context.rules.kings.map((k, i) => (k?.king ?? ['Spirit', 'Shadow'][i]).toLowerCase());
  scene.setKings(kings);
  scene.redraw();
  $('scrub').value = String(Math.round(progress * 1000));
  $('time').textContent = `${(progress * active.duration / 1000).toFixed(1)} s`;
  const phase = reduced || progress === 1 ? 'Result' : e.t < .22 ? 'Source' : e.t < .62 ? 'Action' : e.t < .8 ? 'Contact' : 'Resolve';
  $('phase').textContent = active.events.length > 1 ? `${e.index + 1}/${active.events.length} · ${phase}` : phase;
  $('play').textContent = playing ? 'Pause' : 'Play';
}
function drawEffect(ctx, event, layer) {
  if (!reduced && progress < 1) active.draw(ctx, scene, active.id, event, layer);
}
function drawActors(ctx, e) {
  if (reduced || e.t <= .22 || e.t >= .62) return;
  const u = e.travel, id = active.id;
  if (['Sacrifice', 'MorphP'].includes(id) && e.t > .35) {
    const opacity = ease((e.t - .35) / .27);
    scene.ghost(ctx, e.before.board[e.move.from], e.move.from, 1 - opacity);
    scene.ghost(ctx, e.after.board[e.move.to], e.move.to, opacity);
  }
  if (id === 'Salvation') scene.ghost(ctx, e.after.board[e.move.to], e.move.to, u);
  for (const [index, unit] of movingUnits(e).entries()) {
    const a = scene.foot(unit.from), b = scene.foot(unit.to);
    // The source illustration is kept intact. Whole-figure travel uses the shared scene's ghost renderer.
    const airborne = ['Flight', 'Leap', 'Vault', 'SkyLift'].includes(id);
    const lift = airborne ? Math.sin(u * Math.PI) * (id === 'SkyLift' ? 105 : 88) : 0;
    let dx = (b.x - a.x) * u, dy = (b.y - a.y) * u - lift;
    if (id === 'SkyLift') dx += Math.sin(u * Math.PI) * (index ? -24 : 24);
    if (id === 'Haste' || id === 'Strike') for (let j = 3; j >= 1; j--) { const trail = Math.max(0, u - j * .055); ctx.save(); ctx.translate((b.x - a.x) * trail, (b.y - a.y) * trail); scene.ghost(ctx, unit.value, unit.from, .08); ctx.restore(); }
    ctx.save(); ctx.translate(dx, dy); scene.ghost(airborne ? airContext : ctx, unit.value, unit.from, 1); ctx.restore();
  }
}
function drawResultMarks(ctx, layer, row) {
  if (layer === 'under' || row === 7) for (const { sq, turns } of frozenPieces(active.context, shown)) {
    const image = frostImage(layer, turns), c = scene.cell(sq);
    if (image.complete && image.naturalWidth) ctx.drawImage(image, scene.PAD + c.col * scene.TILE, scene.PAD + c.row * scene.TILE, scene.TILE, scene.TILE * 1.2);
  }
}
function drawMaterials(ctx, layer, row) {
  const e = current, frostHero = active.id === 'Freeze';
  const developing = !reduced && e.index === 0 && e.t < (frostHero ? .84 : .62) && ['freeze', 'ward', 'firewall'].includes(e.move.power);
  const pos = developing ? e.after : shown;
  const progress = developing ? .42 * ease(frostHero ? (e.t - .57) / .27 : (e.t - .14) / .48) : .42;
  const front = layer === 'over';
  for (const [by, mark] of (pos.marks ?? []).entries()) {
    if (!mark) continue;
    const draw = mark.ward ? (mark.all ? drawFirewall : drawIceWall) : drawFreeze;
    for (let sq = 0; sq < 64; sq++) {
      if (!pos.board[sq] || (mark.all ? pieces.colorOf(pos.board[sq]) !== by : mark.sq !== sq)) continue;
      if (front && scene.cell(sq).row !== row) continue;
      draw(ctx, { ...scene.foot(sq), progress, front, seed: sq });
    }
    // An army ward follows the same intact moving figure during its quiet continuation.
    if (mark.all && e.t > .22 && e.t < .62 && (!front || row === 7)) for (const unit of movingUnits(e)) {
      if (pieces.colorOf(unit.value) !== by) continue;
      const a = scene.foot(unit.from), b = scene.foot(unit.to), u = e.travel;
      draw(ctx, { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, progress: .42, front, seed: unit.from });
    }
  }
}
scene.setDecorate((ctx, _, layer, row) => {
  if (!current) return;
  drawResultMarks(ctx, layer, row);
  if (layer === 'under') { drawMaterials(ctx, layer, row); drawEffect(ctx, current, 'under'); }
  if (layer === 'over') {
    if (row === 7) {
      drawEffect(ctx, current, 'over');
      drawActors(ctx, current);
    }
    drawMaterials(ctx, layer, row);
  }
});
function stop() { playing = false; cancelAnimationFrame(raf); raf = 0; lastTime = 0; $('play').textContent = 'Play'; }
function tick(time) { if (!playing || document.hidden || reduced) { stop(); return; } if (lastTime) progress = clamp(progress + Math.min(50, time - lastTime) * speed / active.duration); lastTime = time; updateBoard(); if (progress >= 1) stop(); else raf = requestAnimationFrame(tick); }
function play() { if (!ready || reduced) return; stop(); if (progress >= 1) progress = 0; playing = true; updateBoard(); raf = requestAnimationFrame(tick); }
function seek(value) { stop(); progress = reduced ? 1 : clamp(value); updateBoard(); }
function select(id, historyMode = 'replace') {
  const sample = samples.find(s => s.id === id); if (!sample) throw new Error(`Unknown card ${id}`);
  stop(); active = sample; progress = reduced ? 1 : 0;
  const url = new URL(location.href);
  if (url.searchParams.get('sample') !== id) { url.searchParams.set('sample', id); history[historyMode === 'push' ? 'pushState' : 'replaceState']({ sample: id }, '', url); }
  $('sample-select').value = id;
  $('card-title').textContent = sample.name; $('description').textContent = sample.description[0]; $('result').textContent = sample.description[1];
  $('actions').textContent = sample.fixture.actions.join(' → ');
  $('fixture').textContent = `Shared fixture: ${sample.fixture.id}`;
  $('context').textContent = sample.fixture.setup.kings ? 'This fixture combines cards with Mud:March. Balanced powers permit the marked card, then a quiet continuation. The exact fixture setup is retained.' : 'Cards-only fixture. Card-only restrictions and turn rules apply here.';
  for (const button of $('cards').children) button.setAttribute('aria-pressed', String(button.dataset.card === id));
  updateBoard(); return state();
}
function state() { return { id: active.id, progress, playing, itemCount: samples.length, ready, reduced, flipped, action: current?.action, board: Array.from(shown?.board ?? []), frameCount: scene.frames }; }
for (const sample of samples) { const option = document.createElement('option'); option.value = sample.id; option.textContent = sample.name; $('sample-select').append(option); const button = document.createElement('button'); button.type = 'button'; button.className = 'card-choice'; button.dataset.card = sample.id; button.textContent = sample.name; button.setAttribute('aria-pressed', String(sample.id === active.id)); button.addEventListener('click', () => { select(sample.id, 'push'); play(); }); $('cards').append(button); }
$('sample-select').addEventListener('change', event => { select(event.target.value, 'push'); play(); });
$('replay').addEventListener('click', () => { seek(0); play(); });
$('play').addEventListener('click', () => playing ? stop() : play());
$('scrub').addEventListener('input', event => seek(Number(event.target.value) / 1000));
$('speed').addEventListener('change', event => { speed = Number(event.target.value); });
$('flip').addEventListener('click', () => { flipped = !flipped; scene.setFlipped(flipped); $('flip').setAttribute('aria-pressed', String(flipped)); updateBoard(); });
function setReduced(value) { reduced = value; $('reduced').checked = value; $('play').disabled = value; $('scrub').disabled = value; if (value) seek(1); }
$('reduced').addEventListener('change', event => { setReduced(event.target.checked); });
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => setReduced(event.matches));
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
window.addEventListener('popstate', () => { const id = new URL(location.href).searchParams.get('sample'); if (samples.some(s => s.id === id)) { select(id); play(); } });
window.addEventListener('pagehide', () => { stop(); scene.dispose(); });
new ResizeObserver(() => { const width = canvas.getBoundingClientRect().width; scene.setResolution(Math.min(2, Math.max(1, Math.ceil(width * devicePixelRatio / 960 * 4) / 4))); scene.setCoords(true, Math.max(13, 13 * 700 / width), 14); scene.redraw(); }).observe(canvas.parentElement);
function fitStage() {
  const stage = document.querySelector('.stage-panel'), wrap = $('board-wrap');
  const otherHeight = [...stage.children].filter(child => child !== wrap).reduce((sum, child) => {
    const style = getComputedStyle(child);
    return sum + child.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
  }, 0);
  const available = Math.max(120, innerHeight - (stage.getBoundingClientRect().top + scrollY) - otherHeight - 16);
  const width = Math.floor(Math.min(stage.clientWidth, available * 960 / 1024));
  wrap.style.setProperty('--board-width', `${width}px`);
}
new ResizeObserver(fitStage).observe(document.querySelector('.stage-panel'));
window.addEventListener('resize', fitStage);
document.fonts.ready.then(fitStage);
window.effectsStudy = { get ready() { return ready; }, select, seek, getState: state, samples: samples.map(s => ({ id: s.id, name: s.name, fixture: s.fixture.id, actions: s.fixture.actions, expected: s.fixture.expected, duration: s.duration })) };
setReduced(reduced); select(active.id);
await scene.load();
await new Promise(requestAnimationFrame);
ready = true; fitStage(); updateBoard();
if (!reduced) play();
