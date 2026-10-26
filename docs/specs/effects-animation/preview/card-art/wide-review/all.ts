import motionCatalog from './motion/catalog.json';
import { RELEASED_CARDS } from '../../../../../../src/content/cards';
import { cardArt } from '../../../../../../src/plugin/card-face';
import { cardText, ruleLine } from '../../../../../../src/powers-ui';
import { DEFAULT_RULES } from '../../../../../../src/rules/rules';

interface Painting { id: string; name: string; status: string; proposal: string }
const paintings = import.meta.glob('./art/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const released = new Map(RELEASED_CARDS.map(card => [card.id, card]));
const animated = new Set(motionCatalog.cards.map(card => card.id));

try {
  const response = await fetch('./manifest.json');
  if (!response.ok) throw new Error('Artwork list unavailable');
  const manifest = await response.json() as { cards: Painting[] };
  if (manifest.cards.length !== RELEASED_CARDS.length + 2 || manifest.cards.some(card => !paintings[card.proposal])) throw new Error('Artwork set incomplete');
  document.querySelector('#all-cards')!.replaceChildren();
  for (const card of manifest.cards) {
    const entry = released.get(card.id as typeof RELEASED_CARDS[number]['id']);
    const keep = card.status === 'keep';
    const rule = entry ? ruleLine(cardText(entry.id, DEFAULT_RULES)) : card.id === 'Rescue' ? ruleLine(cardText('Rescue', DEFAULT_RULES)) : '';
    const article = document.createElement('article');
    article.id = card.id;
    article.dataset.cardId = card.id;
    article.className = 'art-card';
    article.innerHTML = `<a class="${keep ? 'cf-art' : 'all-art'}" href="${paintings[card.proposal]}" target="_blank" rel="noopener" aria-label="Open full ${card.name} artwork">${keep && entry ? cardArt(entry.id) : `<img src="${paintings[card.proposal]}" alt="${card.name} artwork">`}</a><div class="cf-text"><h2>${card.name}</h2>${rule ? `<p>${rule}</p>` : ''}${animated.has(card.id.toLowerCase()) ? `<a class="watch-animation" href="./motion/index.html#${card.id.toLowerCase()}">Animate</a>` : ''}</div>`;
    document.querySelector(entry ? '#all-cards' : '#additional-art')!.append(article);
  }
  document.documentElement.dataset.allArt = 'ready';
} catch {
  document.querySelector('#all-cards')!.innerHTML = '<p role="alert">The artwork could not load. Reload this page to try again.</p>';
}
