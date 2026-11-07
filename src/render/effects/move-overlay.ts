import type { GameRules } from '../../game-rules';
import type { Move, Position } from '../../rules/engine';
import type { PaintedScene } from '../painted/scene.mjs';
import type { CardLayer } from './card-types';
import { powerOverlay } from './power-overlays';
import { specialOverlay } from './special-overlays';

/**
 * A drawing over a move that keeps its real walk or attack. PaintedView calls draw on the 'under' layer and on each
 * 'over' row while the move runs, with ms since the action began (Fast is already scaled). Read the actor's live foot
 * from scene.characterFrames. Reduced motion, Off and a hidden page never ask for an overlay.
 */
export interface MoveOverlay {
  draw(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: CardLayer, row: number | undefined, ms: number): void;
}

export const moveOverlay = (context: GameRules, before: Position, move: Move): MoveOverlay | null =>
  powerOverlay(context, before, move) ?? specialOverlay(context, before, move);
