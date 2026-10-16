import { client } from '../app';
import { art } from '../art';
import { DEAL_CARDS, POOL_KINDS } from '../../match/setup';
import { LETTERS, NAMES, type PieceType } from '../../rules/engine';
import { pieceGuide } from '../../read';
import { DEFAULT_RULES } from '../../rules/rules';
import { cardName, cardText, powerOptions, ruleLine } from '../../powers-ui';
import { cardArt } from '../card-face';
import { kingRules } from './setup';
import './collection.css';
const image = (path: string, cls = '') => `<img class="${cls}" src="${art(path)}" alt="">`;
const unlocked = '<span class="unlocked"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>Unlocked</span>';
function guideCard(name: string, picture: string, symbol: string, rows: readonly (readonly [string, string])[]) {
  const card = document.createElement('article'); card.className = 'piece-card';
  card.innerHTML = `<div class="pc-art">${picture}</div><div class="pc-body"><h3>${symbol} ${name}</h3><dl>${rows.map(([label, text]) => `<dt>${label}</dt><dd>${text}</dd>`).join('')}<dt>Status</dt><dd>${unlocked}</dd></dl></div>`;
  return card;
}
export function collectionScreen() {
  const tabs = ['Pieces', 'Kings', 'Powers', 'Cards'], saved = client.state.sheet?.startsWith('collection:') ? client.state.sheet.slice(11) : '';
  const tab = tabs.includes(saved) ? saved : 'Pieces';
  const inputs = document.querySelectorAll<HTMLInputElement>('#collection-tabs input');
  inputs.forEach(input => { input.checked = input.value === tab; input.onchange = () => { client.state.sheet = `collection:${input.value}`; client.save(); draw(input.value); }; });
  draw(tab);
}
function draw(tab: string) {
  const target = document.getElementById('collection-items')!; target.replaceChildren(); target.className = tab === 'Cards' ? 'card-grid' : 'piece-cards';
  const groups = powerOptions(kingRules);
  if (tab === 'Pieces') for (const letter of ['P', ...POOL_KINDS].sort((a, b) => 'PALGMSORBNQ'.indexOf(a) - 'PALGMSORBNQ'.indexOf(b))) {
    const type = LETTERS.indexOf(letter) as PieceType, name = NAMES[type], guide = pieceGuide(type);
    const rows: [string, string][] = [['Moves', guide.moves], ['Takes', guide.captures]]; if (guide.special) rows.push(['Special', guide.special]);
    const card = guideCard(name[0].toUpperCase() + name.slice(1), image(`ui/pieces/${name}-w.webp`), image(`ui/icons/${name}.svg`, 'pi'), rows); card.dataset.piece = name; target.append(card);
  }
  else if (tab === 'Kings') for (const group of groups) {
    const card = guideCard(`${group.king} King`, image(`ui/kings/${group.king.toLowerCase()}.webp`), image('ui/icons/king.svg', 'pi'), [['Powers', group.options.map(option => `${option.label}: ${ruleLine(option.title)}`).join('<br>')]]); card.dataset.king = group.king; target.append(card);
  }
  else if (tab === 'Powers') for (const group of groups) for (const option of group.options) {
    const card = guideCard(option.label, `<span class="coin">${image(`ui/emblems/${group.king.toLowerCase()}.webp`)}</span>`, '', [['Rule', ruleLine(option.title)]]); card.dataset.power = option.value.split(':')[1]; target.append(card);
  }
  else if (tab === 'Cards') for (const card of DEAL_CARDS) {
    const face = document.createElement('label'); face.className = 'card-face'; face.dataset.card = card;
    face.innerHTML = `<span class="cf-art">${cardArt(card)}</span><span class="cf-text"><b>${cardName(card)}</b><small>${ruleLine(cardText(card, DEFAULT_RULES))}</small>${unlocked}</span>`; target.append(face);
  }
  document.querySelector<HTMLElement>('#collection-sheet .new-game-body')!.scrollTop = 0;
}
