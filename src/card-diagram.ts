import { powerArt } from './power-motion';
import type { CardName } from './rules/rules';
import './card-diagram.css';

/** Keep the move picture beside the rule, under the painting. */
export function cardDiagram(card: CardName): string {
  return card === 'Strike' || card === 'Haste' || card === 'Flight' ? powerArt(card) : '';
}
