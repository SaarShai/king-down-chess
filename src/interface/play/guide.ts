import { kingDisplayName } from '../../king-label';
import { GameRules } from '../../game-rules';
import { A, B, G, K, KINGS, L, M, N, O, P, Q, R, S, type PieceType } from '../../rules/engine';
import { RELEASED_CARDS } from '../../content/cards';
import { POWER_NAME, usesAllowed } from '../../powers-ui';
import { rulesOf } from './saved';
import { pieces, powerLines } from './texts';
import { learningPanel } from './learning-panel';
import { effectRule, freeActionFollowUp, newPieces, type LearnSubject } from './learning';
import { button, icon } from '../ui/kit.js';

export const guideSections = ['Pieces', 'Kings and powers', 'Cards', 'How a turn works'] as const;
export interface GuideEntry { id: string; name: string; short: string; full: string; art?: string; kind: string; subject?: LearnSubject }
const context = new GameRules(rulesOf('powers', [null, null], [[], []]));
export function guideEntries(section: string): GuideEntry[] {
  if (section === 'Pieces') return ([A, S, G, M, O, L, P, N, B, R, Q, K] as PieceType[]).map(type => {
    return { id: String(type), name: pieces[type].name, short: pieces[type].short, full: pieces[type].full, art: `/ui/pieces/${type === K ? 'king-spirit' : pieces[type].name.toLowerCase()}-w.webp`, kind: 'Piece', subject: { kind: 'piece', type } };
  });
  if (section === 'Kings and powers') return Object.entries(KINGS).flatMap(([king, powers]) => powers.map(power => {
    const uses = usesAllowed(power, context.rules);
    const subject = { kind: 'power' as const, id: power };
    return { id: power, name: POWER_NAME[power], short: powerLines[power]!, full: effectRule(subject, context), art: `/ui/pieces/king-${king.toLowerCase()}-w.webp`, subject, kind: `${kingDisplayName(king)} King · ${uses == null || uses === 0 ? 'Always on' : `${uses} ${uses === 1 ? 'use' : 'uses'} per game`}` };
  }));
  if (section === 'Cards') return RELEASED_CARDS.map(card => {
    const subject = { kind: 'card' as const, id: card.id };
    return { id: card.id, name: card.name, short: powerLines[card.id]!, full: effectRule(subject, context), art: `/${card.art}`, kind: 'Card · One use', subject };
  });
  if (section === 'How a turn works') return [
    ['move', 'Make your move', 'Move one piece, then select End turn.', 'Select one of your pieces. Select a marked square. Your king must be safe when the turn ends. Checkmate wins.'],
    ['power', 'Use a power', 'An always-on power needs no tap.', `With powers only, each king has one power. It can be active or always on. Select an active power to see its rule and legal targets. Freeze and Ice Wall are free actions. ${freeActionFollowUp} Other active powers use the move.`],
    ['card', 'Play a card', 'Each card has one use.', `Both players start with the same four cards. With cards only, kings have no powers. With powers and cards, each king has an always-on power. Select a card, then its target. Freeze, Ice Wall and Firewall are free actions. ${freeActionFollowUp} Other cards use the move.`],
    ['undo', 'Change your turn', 'Undo changes a turn before End turn.', 'Your steps are not final until you select End turn. Undo removes the last step. A Beast can capture again before the turn ends.'],
    ['finish', 'End your turn', 'End turn makes your steps final.', 'Select End turn after a legal move or a free action that leaves your king safe. You cannot undo a final turn. The computer then plays. A game can end in checkmate, resign, stalemate, repetition, insufficient material or no progress for 100 actions.'],
  ].map(([id, name, short, full]) => ({ id, name, short, full, kind: 'Turn rule' }));
  return [];
}
let disposePanel: (() => void) | undefined;
export function closeGuidePanel() { disposePanel?.(); disposePanel = undefined; }

/** The display groups of the picture Guide (launch decision 29). The flat entries of guideEntries() stay the content API. */
export const pieceGroups = (): { name: string; entries: GuideEntry[] }[] => {
  const all = guideEntries('Pieces');
  return [{ name: 'New pieces', entries: all.filter(item => newPieces.has(+item.id)) }, { name: 'Chess pieces', entries: all.filter(item => !newPieces.has(+item.id)) }];
};
/** Six king blocks: each king one time, with its two powers (the engine's KINGS relation, not the names). */
export const kingBlocks = (): { king: string; art: string; powers: GuideEntry[] }[] => {
  const powers = guideEntries('Kings and powers');
  return Object.entries(KINGS).map(([king, ids]) => ({ king, art: `/ui/pieces/king-${king.toLowerCase()}-w.webp`, powers: ids.map(id => powers.find(item => item.id === id)!) }));
};
/** The counts of the front tiles, from the content. */
export const guideCounts = (): Record<typeof guideSections[number], string> => ({
  'Pieces': `${guideEntries('Pieces').length} pieces`,
  'Kings and powers': `${Object.keys(KINGS).length} kings · ${guideEntries('Kings and powers').length} powers`,
  'Cards': `${guideEntries('Cards').length} cards`,
  'How a turn works': `${guideEntries('How a turn works').length} steps`,
});
/** Previous and Next in the section's flat order. No wrap at the ends. */
export const neighbours = (section: string, id: string): { previous?: GuideEntry; next?: GuideEntry } => {
  const all = guideEntries(section), at = all.findIndex(item => item.id === id);
  return at < 0 ? {} : { previous: all[at - 1], next: all[at + 1] };
};
/** The use count of a power, as the king block shows it. */
const usesLine = (item: GuideEntry) => item.kind.split(' · ')[1]?.replace(' per game', '') ?? '';
/** The row that the person left for an entry: Back to its list returns there (launch decision 29). */
let left: { section: string; entry: string } | null = null;

const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => { const n = document.createElement(tag); n.className = className; n.textContent = text; return n; };
const picture = (src: string, className = '') => { const img = node('img', className); img.src = src; img.alt = ''; img.loading = 'lazy'; return img; };
/** A back link that names its target. */
const backLink = (target: string, onPress: () => void) => { const link = button(target, { icon: 'back', onPress }); link.className = 'guide-back'; link.setAttribute('aria-label', `Back to ${target}`); return link; };
function entryRow(item: GuideEntry, open: () => void, small = false): HTMLButtonElement {
  const row = node('button', 'list-row guide-row'); row.type = 'button'; row.dataset.entry = item.id; row.addEventListener('click', open);
  const copy = node('span', 'list-row-copy'), name = node('strong', '', item.name);
  if (item.kind === 'Piece' && newPieces.has(+item.id)) name.append(node('span', 'new-tag', 'New'));
  copy.append(name, node('small', '', item.short));
  const next = icon('next'); next.classList.add('list-row-next');
  row.append(...(item.art ? [picture(item.art, small ? 'row-art row-art-small' : 'row-art')] : []), copy, next);
  return row;
}
function cardTile(item: GuideEntry, open: () => void): HTMLButtonElement {
  const tile = node('button', 'guide-card'); tile.type = 'button'; tile.dataset.entry = item.id; tile.addEventListener('click', open);
  const copy = node('span'); copy.append(node('strong', '', item.name), node('small', '', item.short));
  tile.append(picture(item.art!), copy); return tile;
}
/** The list of one section: the page body, and (small) the list beside an entry on a wide screen. */
function sectionList(section: string, go: (section?: string, entry?: string) => void, small = false): HTMLElement {
  const list = node(small ? 'nav' : 'div', `guide-list guide-list-${guideSections.indexOf(section as typeof guideSections[number])}`);
  const open = (id: string) => () => go(section, id);
  if (section === 'Pieces') for (const group of pieceGroups()) {
    const box = node('section', 'guide-group'), head = node(small ? 'p' : 'h2', 'group-title', group.name); box.append(head, ...group.entries.map(item => entryRow(item, open(item.id), small))); list.append(box);
  } else if (section === 'Kings and powers') for (const block of kingBlocks()) {
    const box = node('section', 'king-block'), title = node('div', 'king-title'), name = node(small ? 'p' : 'h2', '', `${kingDisplayName(block.king)} King`);
    title.append(picture(block.art), name); box.setAttribute('aria-label', `${kingDisplayName(block.king)} King`);
    const powers = node('div', 'king-powers');
    powers.append(...block.powers.map(item => { const row = entryRow({ ...item, art: undefined }, open(item.id), small); row.querySelector('strong')!.after(node('span', 'uses', usesLine(item))); return row; }));
    box.append(title, powers); list.append(box);
  } else if (section === 'Cards') { const grid = node('div', 'card-grid'); grid.append(...guideEntries('Cards').map(item => cardTile(item, open(item.id)))); list.append(grid); }
  return list;
}
/** How a turn works: the five steps on one page. */
function turnSteps(focus?: string): HTMLElement {
  const list = node('ol', 'turn-steps');
  for (const item of guideEntries('How a turn works')) {
    const step = node('li'); step.dataset.entry = item.id;
    const name = node('h2', '', item.name); if (item.id === focus) name.tabIndex = -1;
    step.append(name, node('p', 'step-short', item.short), node('p', '', item.full)); list.append(step);
  }
  return list;
}
/** The front tiles: a picture, the name and the count of each section, in the order of the learning spec. */
function frontTiles(go: (section?: string) => void): HTMLElement {
  const tiles = node('div', 'guide-tiles'), counts = guideCounts();
  const fan = () => { const box = node('span', 'tile-fan'); box.append(...['freeze', 'icewall', 'firestarter'].map(name => picture(`/ui/cards/${name}.webp`))); return box; };
  const arts: Record<string, () => Node[]> = {
    'Pieces': () => [picture('/ui/pieces/archer-w.webp'), picture('/ui/pieces/beast-w.webp')],
    'Kings and powers': () => [picture('/ui/pieces/king-frost-w.webp'), picture('/ui/pieces/king-flame-w.webp')],
    'Cards': () => [fan()],
    'How a turn works': () => { const box = node('span', 'tile-turn'); box.append(picture('/ui/icons/knight.svg'), node('span', 'tile-end', 'End turn')); return [box]; },
  };
  for (const name of guideSections) {
    const tile = node('button', 'guide-tile'); tile.type = 'button'; tile.dataset.section = name;
    const art = node('span', 'tile-art'); art.setAttribute('aria-hidden', 'true'); art.append(...arts[name]());
    const copy = node('span', 'tile-copy'); copy.append(node('strong', '', name), node('small', '', counts[name]));
    const next = icon('next'); next.classList.add('list-row-next');
    tile.append(art, copy, next); tile.addEventListener('click', () => go(name)); tiles.append(tile);
  }
  return tiles;
}
/** After the page is in place: focus a node and bring it into view. The shell then keeps this focus and scroll. */
function restore(page: HTMLElement, target: HTMLElement | null | undefined) {
  if (!target) return;
  page.dataset.restore = 'true';
  requestAnimationFrame(() => {
    if (!target.isConnected) return;
    const animations = page.getAnimations();
    void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (!target.isConnected) return;
      target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'center' });
    });
  });
}
export function guidePage(section: string | undefined, entry: string | undefined, go: (section?: string, entry?: string) => void, announce: (line: string) => void = () => {}): HTMLElement {
  closeGuidePanel();
  const page = document.createElement('section'); page.className = 'shell-page guide-page';
  const isTurn = section === 'How a turn works', item = isTurn ? undefined : guideEntries(section ?? '').find(item => item.id === entry);
  page.dataset.view = item ? 'entry' : section ? 'section' : 'front';
  const title = document.createElement('h1'); title.textContent = item?.name ?? section ?? 'Guide'; title.tabIndex = -1;
  if (item && section) {
    left = { section, entry: item.id };
    page.append(backLink(section, () => go(section)));
    const layout = node('div', 'entry-layout'), side = sectionList(section, go, true), body = node('article', 'guide-entry');
    side.classList.add('entry-list'); side.setAttribute('aria-label', section);
    const current = side.querySelector<HTMLElement>(`[data-entry="${CSS.escape(item.id)}"]`); current?.setAttribute('aria-current', 'true');
    if (item.art) { const art = node('div', item.kind.startsWith('Card') ? 'entry-art card-art' : 'entry-art figure-art'); art.append(picture(item.art)); body.append(art); }
    if (item.kind === 'Piece' && newPieces.has(+item.id)) title.append(node('span', 'new-tag', 'New'));
    body.append(node('p', 'guide-kind', item.kind), title, node('p', 'guide-short', item.short));
    if (item.subject) { const panel = learningPanel(item.subject, context, { announce }); body.append(panel.element); disposePanel = panel.dispose; }
    else body.append(node('p', 'guide-rule', item.full));
    const { previous, next } = neighbours(section, item.id), pager = node('nav', 'entry-pager'); pager.setAttribute('aria-label', `${section}: Previous and Next`);
    const step = (label: 'Previous' | 'Next', to?: GuideEntry) => {
      const control = button(label, { icon: label === 'Previous' ? 'back' : 'next', ...(to ? { onPress: () => go(section, to.id) } : { disabledReason: label === 'Previous' ? 'This is the first entry.' : 'This is the last entry.' }) });
      if (to) { control.setAttribute('aria-label', `${label}: ${to.name}`); control.append(node('small', 'pager-name', to.name)); }
      control.classList.add(label === 'Previous' ? 'pager-previous' : 'pager-next'); return control;
    };
    pager.append(step('Previous', previous), step('Next', next)); body.append(pager);
    layout.append(side, body); page.append(layout);
    // The list beside the entry keeps the open row in its view.
    queueMicrotask(() => { if (current && side.isConnected && side.scrollHeight > side.clientHeight) side.scrollTop = current.offsetTop - side.clientHeight / 2; });
    return page;
  }
  if (section) {
    page.append(backLink('Guide', () => go()), title);
    if (isTurn) { page.append(turnSteps(entry)); restore(page, entry ? page.querySelector<HTMLElement>(`[data-entry="${CSS.escape(entry)}"] h2`) : null); return page; }
    page.append(sectionList(section, go));
    if (left?.section === section) { restore(page, page.querySelector<HTMLElement>(`[data-entry="${CSS.escape(left.entry)}"]`)); left = null; }
    return page;
  }
  page.append(title, frontTiles(name => go(name)));
  return page;
}
