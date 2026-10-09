import type { Color } from '../rules/engine';
import { POWER_NAME, type PowerCoin } from '../powers-ui';

/** The portrait binds the first coin. Card coins can append to this row. */
export function coinRow(portrait: HTMLElement, side: Color, power: PowerCoin | null): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'coin-row';
  row.dataset.side = side === 0 ? 'w' : 'b';
  row.append(portrait);
  if (!power) return row;

  const coin = document.createElement('button');
  coin.type = 'button';
  coin.className = 'coin';
  coin.id = `power-${row.dataset.side}`;
  coin.dataset.state = power.state;
  const state = power.state === 'always' ? 'Always on'
    : power.state === 'used' ? (power.usedOn === null ? 'Used' : `Used on move ${power.usedOn}`)
    : power.left === null ? 'Unlimited' : `${power.left} left`;
  coin.setAttribute('aria-label', `${POWER_NAME[power.power]}, ${state}`);
  coin.setAttribute('aria-disabled', String(power.state === 'used' || power.state === 'always'));
  if (power.state !== 'always') coin.setAttribute('aria-pressed', String(power.state === 'armed'));

  const emblem = document.createElement('img');
  emblem.src = `${import.meta.env.BASE_URL}ui/emblems/${power.king.toLowerCase()}.webp`;
  emblem.alt = '';
  coin.append(emblem);
  if (power.total !== null && power.total > 0) {
    const notches = document.createElement('span');
    notches.className = 'notches';
    notches.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < power.total; i++) {
      const notch = document.createElement('span');
      notch.className = i < power.spent ? 'notch is-spent' : 'notch';
      notches.append(notch);
    }
    coin.append(notches);
  }
  row.append(coin);
  return row;
}
