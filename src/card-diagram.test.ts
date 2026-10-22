import { expect, it } from 'vitest';
import { cardDiagram } from './card-diagram';

it.each(['Strike', 'Haste', 'Flight'] as const)('keeps the %s move picture for the detail', card => {
  expect(cardDiagram(card)).toContain(`pm-${card}`);
  expect(cardDiagram(card)).not.toContain('<img');
});
