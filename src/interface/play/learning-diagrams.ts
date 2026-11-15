import { GameRules } from '../../game-rules';
import { K, KINGS, NAMES, P, R, B, S, parseSq, piece, typeOf, TAG_POWER, type Color, type Move, type PieceType, type PowerName, type Position } from '../../rules/engine';
import { POWERS_BALANCED } from '../../rules/rules';
import type { LearnSubject } from './learning';
import { examples } from './diagram-examples';
interface Example { pieces: readonly (readonly string[])[]; moves?: readonly (readonly string[])[]; marks?: readonly string[]; text: string; crop?: number }
const exampleId = (subject: LearnSubject) => subject.kind === 'piece' ? NAMES[subject.type] : ({ IceWall: 'icewall', HolyLight: 'holylight', DeathTouch: 'deathtouch', MirrorB: 'mirror', MorphP: 'morph', Vault: 'hop', EarthQuake: 'earthquake', FireStarter: 'firestarter', SkyLift: 'skylift' } as Record<string, string>)[subject.id] ?? subject.id.toLowerCase();
export interface Diagram { rules: GameRules; frames: { before: Position; after: Position; move?: Move }[]; crop: number; side: Color; marks: number[]; text: string }
/** Use rule operations on a separate eight-square board. No live game or save enters here. */
export function diagramFor(subject: LearnSubject, side: Color = 0, context?: GameRules): Diagram {
  const darknessPawn = subject.kind === 'piece' && subject.type === P && context?.rules.kings[side]?.power === 'Darkness';
  const kingPower = subject.kind === 'piece' && subject.type === K ? context?.rules.kings[side]?.power : undefined;
  const activeKing = kingPower === 'Mercy' || kingPower === 'DeathTouch' || kingPower === 'Darkness' && context?.rules.darknessKingStep2 ? kingPower : null;
  const id = activeKing === 'Darkness' ? 'darknessKing' : activeKing === 'Mercy' ? 'mercy' : activeKing === 'DeathTouch' ? 'deathtouch' : darknessPawn ? 'darkness' : exampleId(subject), config = examples[id as keyof typeof examples] as Example;
  const card = subject.kind === 'card', power = activeKing ?? (darknessPawn ? 'Darkness' : subject.kind === 'power' ? subject.id : null);
  const kings: [null | { king: keyof typeof KINGS; power: PowerName }, null | { king: keyof typeof KINGS; power: PowerName }] = [null, null];
  if (power) kings[side] = { king: Object.entries(KINGS).find(([, values]) => (values as readonly string[]).includes(power))![0] as keyof typeof KINGS, power };
  const rules = new GameRules({ ...POWERS_BALANCED, ...context?.rules, kings, hands: card ? side ? [[], subject.id === 'MirrorB' ? ['MirrorB', 'Freeze'] : [subject.id]] : [subject.id === 'MirrorB' ? ['MirrorB', 'Freeze'] : [subject.id], []] : [[], []] });
  const square = (q: string) => side ? parseSq(q) ^ 56 : parseSq(q);
  const board = new Uint8Array(64);
  board[square('a1')] = piece(K, side); board[square('h8')] = piece(K, (side ^ 1) as Color);
  for (const [name, q, color] of config.pieces) {
    const type = NAMES.indexOf(name as typeof NAMES[number]) as PieceType;
    const by = (color === 'b' ? side ^ 1 : side) as Color;
    if (type === K) board[square(color === 'b' ? 'h8' : 'a1')] = 0;
    board[square(q)] = piece(type, by);
  }
  const lost = Array(32).fill(0); lost[side * 16 + R] = 1; lost[side * 16 + B] = 1;
  let before: Position = { board, turn: side, ply: 20, move: 10, halfmove: 0, lost };
  const frames: Diagram['frames'] = [];
  const tag = subject.kind === 'piece' || ['HolyLight', 'Mercy', 'DeathTouch', 'Darkness'].includes(power ?? '') || power === 'March' ? null : subject.kind === 'card' && subject.id === 'MirrorB' ? 'freeze' : Object.entries(TAG_POWER).find(([, value]) => value === subject.id)?.[0];
  const requests = id === 'haste' || id === 'rally' ? config.moves! : [config.moves?.[0]];
  for (const [i, request] of requests.entries()) {
    const legal = rules.legalMoves(before);
    const move = legal.find(m => {
      if (m.pass || (i === 0 ? tag ? m.power !== tag : !!m.power : !!m.power)) return false;
      if (card && subject.id === 'MirrorB' ? m.via !== 'mirrorb' : !!m.via) return false;
      if (id === 'beast') return typeOf(before.board[m.from]) === S && m.captures.length === 2;
      if (id === 'archer' || id === 'deathtouch') return m.from === square(config.pieces[0][1]) && m.from === m.to && m.captures.length === 1;
      if (id === 'ogre') return !!m.shove && m.from === square('c2') && m.shove.to === square('c4');
      if (id === 'maester' || id === 'skylift') return !!m.swap && [m.from, m.to].sort().join() === [square(config.pieces[0][1]), square(config.pieces[1][1])].sort().join(); // a swap lists its lower square first, so either order
      if (id === 'sacrifice') return m.from === square('c3') && m.promo === R;
      if (id === 'morph') return m.from === square('c3') && m.promo === 2;
      if (id === 'salvation') return m.to === square('c1') && m.drop === B;
      if (id === 'earthquake') return m.from === square('c3') && m.pushes?.length === 2;
      if (id === 'freeze' || id === 'mirror') return m.from === square('c4');
      if (id === 'icewall') return m.from === square('c3');
      if (id === 'firewall') return m.power === 'firewall';
      return !!request && m.from === square(request[0]) && m.to === square(request[1]);
    });
    if (!move) throw new Error(`No legal example for ${id}, step ${i + 1}.`);
    const after = rules.makeMove(before, move); frames.push({ before, move, after }); before = after;
  }
  return { rules, frames, crop: config.crop ?? 0, side, marks: (config.marks ?? []).map(square), text: side ? config.text.replace(/\b[a-h][1-8]\b/g, q => `${q[0]}${9 - Number(q[1])}`) : config.text };
}
