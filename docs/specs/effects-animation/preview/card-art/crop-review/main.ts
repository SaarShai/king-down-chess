import { RELEASED_CARDS } from '../../../../../../src/content/cards';
import { cardArt } from '../../../../../../src/plugin/card-face';
import { art } from '../../../../../../src/account-game/art';
import { cardText, ruleLine } from '../../../../../../src/powers-ui';
import { DEFAULT_RULES } from '../../../../../../src/rules/rules';

const guide = '<span class="crop-guide" aria-hidden="true"><i></i><span>Cut</span></span>';

function source(path: string, name: string) {
  const url = art(path);
  return `<figure class="original"><figcaption>Full source <a href="${url}" target="_blank" rel="noopener">Open original</a></figcaption><a class="source" href="${url}" target="_blank" rel="noopener" aria-label="Open full ${name} artwork"><img src="${url}" alt="Full ${name} artwork">${guide}</a></figure>`;
}

function face(name: string, picture: string, rule: string, back = false) {
  return `<figure class="current"><figcaption>${back ? 'Current card-back window' : 'As shown in cards · 16:9'}</figcaption><div class="card-face"><div class="cf-art" role="img" aria-label="${name}, current card window">${picture}</div><div class="cf-text"><b>${name}</b>${rule ? `<small>${rule}</small>` : ''}</div></div>${back ? '<p class="position-note">The back uses 85% opacity. The current layout clips the bottom, just like the other images.</p>' : ''}</figure>`;
}

document.querySelector('#jump-index')!.innerHTML = RELEASED_CARDS.map(card => `<a href="#${card.id}">${card.name}</a>`).join('') + '<a href="#extras-title">Additional files</a>';
document.querySelector('#released')!.innerHTML = RELEASED_CARDS.map(card => `
  <section class="review-row" id="${card.id}" data-card-id="${card.id}" data-kind="${card.art ? 'painting' : 'rule'}" aria-labelledby="title-${card.id}">
    <h2 id="title-${card.id}">${card.name}</h2>
    <div class="comparison">
      ${card.art ? source(card.art, card.name) : '<div class="rule-note"><h3>Rule picture only</h3><p>This card has no painting. It uses the current rule illustration shown beside this note.</p></div>'}
      ${face(card.name, cardArt(card.id), ruleLine(cardText(card.id, DEFAULT_RULES)))}
    </div>
  </section>`).join('');

document.querySelector('#additional')!.innerHTML = `
  <section class="review-row" id="Rescue" data-extra="Rescue" aria-labelledby="title-Rescue">
    <h3 id="title-Rescue">Rescue <span>Not in the released deck</span></h3>
    <div class="comparison">${source('ui/cards/rescue.webp', 'Rescue')}${face('Rescue', cardArt('Rescue'), '')}</div>
  </section>
  <section class="review-row extra-back" id="Back" data-extra="Back" aria-labelledby="title-Back">
    <h3 id="title-Back">Card back <span>Hidden-card asset</span></h3>
    <div class="comparison">${source('ui/cards/back.webp', 'card back')}${face('Card back', `<img class="back" src="${art('ui/cards/back.webp')}" alt="">`, '', true)}</div>
  </section>`;

document.querySelector<HTMLInputElement>('#guides')!.addEventListener('change', event => {
  document.body.classList.toggle('guides-off', !(event.target as HTMLInputElement).checked);
});

// The current game grid keeps each image at its natural ratio and clips its bottom.
// Measure image boxes when reviewing this: computed object-position alone does not describe the crop.
for (const image of document.querySelectorAll<HTMLImageElement>('.source > img')) {
  const sizeGuide = () => {
    const source = image.parentElement!;
    const cut = 1 - (image.naturalWidth / image.naturalHeight) * 9 / 16;
    source.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
    source.style.setProperty('--cut-bottom', `${cut * 100}%`);
  };
  if (image.complete && image.naturalWidth) sizeGuide();
  else image.addEventListener('load', sizeGuide, { once: true });
}

document.documentElement.dataset.cropReview = 'ready';
