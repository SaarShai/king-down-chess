import { expect, it } from 'vitest';
import { DEAL_CARDS } from './match/setup';
import { cardPicture, cardSymbol } from './card-symbol';

it('gives every dealt card a symbol with no letters', () => {
  const missing = ['Curse','MirrorB','MorphP','FireStarter','Burn','Rally','Control','EarthQuake','Firewall'] as const;
  const symbols = missing.map(card => cardSymbol(card).replace(/ data-card-symbol="[^"]+"/, ''));
  expect(new Set(symbols).size).toBe(missing.length);
  for (const card of DEAL_CARDS) {
    expect(cardSymbol(card)).toContain(`data-card-symbol="${card}"`);
    expect(cardSymbol(card)).toContain('aria-hidden="true"');
    expect(cardSymbol(card)).not.toMatch(/undefined|<text| data-card=/);
    expect(cardPicture(card)).toContain(`class="card-picture" data-card-picture="${card}"`);
    expect(cardPicture(card)).not.toMatch(/undefined|<text|back.webp| data-card=/);
  }
});

it.each(['Burn', 'FireStarter', 'Control'] as const)('shows no pawn for %s, which cannot use a pawn', card => {
  expect(cardPicture(card)).not.toContain('data-piece="pawn"');
  expect(cardPicture(card)).toContain('data-piece="knight"');
});

it('shows friendly pieces for Control and the right pawn count for Spawn', () => {
  expect(cardPicture('Control')).not.toContain('fill="#514638"');
  for (const card of ['Spawn2', 'SpawnK2'] as const) expect(cardPicture(card).match(/data-piece="pawn"/g)).toHaveLength(2);
  for (const card of ['SpawnK', 'SpawnK2'] as const) expect(cardPicture(card)).toContain('data-piece="king"');
});
