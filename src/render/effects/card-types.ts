import type { Move, Position } from '../../rules/engine';

export interface Point { x: number; y: number }
export type CardLayer = 'under' | 'over';
/** One real engine action, sampled by the scene's playback clock. */
export interface CardFrame {
  before: Position;
  after: Position;
  move: Move;
  index: number;
  t: number;
  travel: number;
  lender?: number;
}
