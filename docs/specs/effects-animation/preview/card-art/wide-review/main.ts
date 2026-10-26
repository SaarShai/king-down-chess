import { RELEASED_CARDS } from '../../../../../../src/content/cards';
import { cardArt } from '../../../../../../src/plugin/card-face';
import { art } from '../../../../../../src/account-game/art';
import { cardText, ruleLine } from '../../../../../../src/powers-ui';
import { DEFAULT_RULES, type CardName } from '../../../../../../src/rules/rules';

type Status = 'keep' | 'approved' | 'redesigned' | 'new' | 'legacy';
interface Proposal { id: string; name: string; status: Status; proposal?: string; note?: string }
const paintings = import.meta.glob('./art/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const cards = [
  ...RELEASED_CARDS.map(card => ({ ...card, rule: ruleLine(cardText(card.id, DEFAULT_RULES)), extra: false })),
  { id: 'Rescue', name: 'Rescue', art: 'ui/cards/rescue.webp', rule: ruleLine(cardText('Rescue', DEFAULT_RULES)), extra: true },
  { id: 'Back', name: 'Card back', art: 'ui/cards/back.webp', rule: '', extra: true },
];
const labels: Record<Status, string> = { keep: 'Keep original', approved: 'Approved', redesigned: 'New composition', new: 'First painting', legacy: 'Additional file' };
const get = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const nav = get('#card-nav');
const proposals = new Map<string, Proposal>();
let selected = Math.max(0, cards.findIndex(card => card.id === location.hash.slice(1)));
let generation = 0;

function select(index: number) {
  selected = (index + cards.length) % cards.length;
  const card = cards[selected], proposal = proposals.get(card.id), revision = ++generation;
  const status = proposal?.status ?? (card.extra ? 'legacy' : card.art ? 'redesigned' : 'new');
  const rule = `<b>${card.name}</b>${card.rule ? `<small>${card.rule}</small>` : ''}`;
  get('#review').dataset.cardId = card.id;
  get('#review').dataset.kind = card.extra ? 'extra' : card.art ? 'painting' : 'rule';
  get('#card-title').textContent = card.name;
  get('#card-status').textContent = labels[status];
  get('#card-note').textContent = [card.extra ? (card.id === 'Back' ? 'Hidden-card asset. Outside the released deck.' : 'Outside the released deck.') : '', proposal?.note ?? ''].filter(Boolean).join(' ');
  get('#position').textContent = `${selected + 1} / ${cards.length}`;
  const current = card.id === 'Back' ? `<img class="back" src="${art(card.art!)}" alt="">` : cardArt(card.id as CardName);
  get('#current-face').innerHTML = `<div class="cf-art" role="img" aria-label="${card.name}, current game card">${current}</div><div class="cf-text">${rule}</div>`;
  get('#proposal-text').innerHTML = rule;
  const currentLink = get<HTMLAnchorElement>('#current-source');
  currentLink.hidden = !card.art;
  if (card.art) currentLink.href = art(card.art);
  else currentLink.removeAttribute('href');
  const proposalLink = get<HTMLAnchorElement>('#proposal-source');
  const window = get('#proposal-art');
  const keep = proposal?.status === 'keep';
  get('#proposal-label').textContent = keep ? 'Keep current art · game card' : 'Proposal · full 16:9 painting';
  get('#proposal-face').className = keep ? 'card-face' : 'proposal-face';
  window.className = keep ? 'cf-art' : 'proposal-art';
  window.replaceChildren();
  proposalLink.hidden = true;
  proposalLink.removeAttribute('href');
  window.dataset.state = 'pending';
  const pending = document.createElement('p');
  pending.setAttribute('role', 'status');
  pending.textContent = 'Generating proposal';
  window.append(pending);
  const source = proposal?.proposal && paintings[proposal.proposal];
  if (keep) {
    window.innerHTML = current;
    window.dataset.state = 'kept';
    proposalLink.href = art(card.art!);
    proposalLink.hidden = false;
  } else if (source) {
    const image = new Image();
    image.alt = `${card.name}, full proposed painting`;
    image.onload = () => {
      if (generation !== revision) return;
      window.replaceChildren(image);
      window.dataset.state = 'ready';
      proposalLink.href = source;
      proposalLink.hidden = false;
    };
    image.src = source;
  }
  for (const button of nav.querySelectorAll<HTMLButtonElement>('button')) button.setAttribute('aria-pressed', String(button.dataset.cardId === card.id));
  history.replaceState(null, '', `#${card.id}`);
}

for (const card of cards) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.cardId = card.id;
  button.textContent = card.name;
  button.addEventListener('click', () => select(cards.indexOf(card)));
  nav.append(button);
}
get('#previous').addEventListener('click', () => select(selected - 1));
get('#next').addEventListener('click', () => select(selected + 1));
window.addEventListener('hashchange', () => {
  const index = cards.findIndex(card => card.id === location.hash.slice(1));
  if (index >= 0) select(index);
});
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  select(selected + (event.key === 'ArrowRight' ? 1 : -1));
  if (nav.contains(document.activeElement)) nav.querySelector<HTMLButtonElement>('[aria-pressed="true"]')!.focus();
});
select(selected);

try {
  const response = await fetch('./manifest.json');
  if (!response.ok) throw new Error('Proposal list is unavailable');
  const manifest = await response.json() as { cards: Proposal[] };
  if (!Array.isArray(manifest.cards) || manifest.cards.length !== cards.length || manifest.cards.some((row, index) => row.id !== cards[index].id || !(row.status in labels))) throw new Error('Proposal list does not match the card catalog');
  for (const row of manifest.cards) proposals.set(row.id, row);
  select(selected);
} catch {
  get('#manifest-error').textContent = 'The proposal list could not load. Reload this page to try again.';
  get('#manifest-error').hidden = false;
}
document.documentElement.dataset.wideReview = 'ready';
