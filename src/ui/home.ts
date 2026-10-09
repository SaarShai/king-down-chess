import type { SkillName } from '../ai/skill';
import type { Game, Side } from '../game';
import { describeMove, nextMoveNumber } from '../move-text';
import type { Color } from '../rules/engine';
import { randomBackRank } from '../rules/setup';
import { mulberry32 } from '../sim/rng';

export interface HomeInput {
  game: Pick<Game, 'pos' | 'history' | 'status'>;
  sides: readonly [Side, Side];
  level: SkillName;
  linkSide: Color | null;
  staged: boolean;
  /** The game result line, including a resignation; empty while play continues. */
  result: string;
}

/** The Home words read the live game. Opening Home does not play or undo a move. */
export function homeState({ game, sides, level, linkSide, staged, result }: HomeInput) {
  const last = game.history.at(-1);
  const mine = linkSide != null ? game.pos.turn === linkSide : sides[game.pos.turn] === 'human';
  const finished = !staged && (game.status !== 'playing' || result !== '');
  const you = linkSide ?? (sides[0] === 'human' ? 0 : 1);
  const rematch = linkSide == null && sides.every(s => s === 'human') ? 'Same army. Both sides play here.' : `Same army. You play ${you === 0 ? 'Black' : 'White'}.`;
  let detail: string;
  if (finished) detail = rematch;
  else if (staged) detail = 'Your turn is ready';
  else if (!game.history.length) detail = `A new game. You play ${you === 0 ? 'White' : 'Black'}.`;
  else detail = mine ? 'Your move' : 'Their move';
  return {
    opponent: linkSide != null ? 'vs your friend' : sides.every(s => s === 'human') ? 'White vs Black' : `vs Computer · ${level[0].toUpperCase()}${level.slice(1)}`,
    progress: finished ? 'Finished' : `Move ${nextMoveNumber(game.history.map(h => h.pos.turn), game.pos.turn)}`,
    action: finished ? 'Rematch' : 'Continue',
    detail,
    review: finished,
    lastMove: last ? describeMove(last.pos, last.move) : '',
    result: finished ? result : '',
  };
}

/** The empty start-up save belongs to the first visit. A URL position always opens the game. */
export function shouldShowHome(params: URLSearchParams, gate: { hasSave: boolean; titleSeen: boolean; firstVisit: boolean }): boolean {
  return gate.hasSave && !gate.titleSeen && !gate.firstVisit && params.get('title') !== '0'
    && !['army', 'fen', 'design'].some(key => params.has(key));
}

/** Today uses the local date and the same draw as New game. */
export function todayDeal(day: Date) {
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const words = day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
  return { date, label: `Today's army · ${words}`, army: randomBackRank(mulberry32(+date.replace(/-/g, ''))) };
}
