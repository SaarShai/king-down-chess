import { motionState, seek } from '../../../../../src/plugin/card-motion/runtime';
import { mapOf, motionTag } from '../../../../../src/plugin/card-motion/tag';

const paintings = import.meta.glob<string>('../../../../../public/ui/cards/*.webp', { eager: true, query: '?url', import: 'default' });
const thumbs = import.meta.glob<string>('../../../../../src/plugin/assets/card-thumbs/*.webp', { eager: true, query: '?url', import: 'default' });
const only = new URLSearchParams(location.search).get('card')?.split(',');
const names = Object.keys(paintings).map(path => path.split('/').pop()!.replace('.webp', '')).filter(card => mapOf(card) && (!only || only.includes(card)));
const frame = (card: string, kind: string, url: string) => `<div class="frame ${kind}" data-kind="${kind}" data-name="${card}"><img src="${url}" alt="">${motionTag(card, url)}</div>`;
const hrefs = (card: string) => [paintings[`../../../../../public/ui/cards/${card}.webp`], thumbs[`../../../../../src/plugin/assets/card-thumbs/${card}.webp`] ?? paintings[`../../../../../public/ui/cards/${card}.webp`]];
const released = names.filter(card => card !== 'back' && card !== 'rescue');
// ?set=1: the most a phone shows at once: all 21 tiles and two hands of four coins.
document.getElementById('cards')!.innerHTML = new URLSearchParams(location.search).has('set')
  ? `<div class="row">${released.map(card => frame(card, 'tile', hrefs(card)[1])).join('')}${released.slice(0, 8).map(card => frame(card, 'coin', hrefs(card)[0])).join('')}</div>`
  : names.map(card => {
  const full = paintings[`../../../../../public/ui/cards/${card}.webp`], thumb = thumbs[`../../../../../src/plugin/assets/card-thumbs/${card}.webp`] ?? full;
  return `<section data-card-row="${card}"><h2>${card}</h2><div class="row">${frame(card, 'sheet', full)}${frame(card, 'tile', thumb)}${frame(card, 'coin', full)}</div></section>`;
}).join('');
Object.assign(window, { cardMotion: { seek, motionState, names } });
const phase = new URLSearchParams(location.search).get('phase');
if (phase !== null) seek(Number(phase));
