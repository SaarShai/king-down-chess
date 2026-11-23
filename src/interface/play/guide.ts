import { kingDisplayName } from '../../king-label';
import { GameRules } from '../../game-rules';
import { A, B, G, K, KINGS, L, M, N, O, P, Q, R, S, type PieceType } from '../../rules/engine';
import { RELEASED_CARDS } from '../../content/cards';
import { POWER_NAME, usesAllowed } from '../../powers-ui';
import { rulesOf } from './saved';
import { cardLine, guideTabLabels as tabLabels, pieces, powerLines, text } from './texts';
import { learningPanel } from './learning-panel';
import { effectRule, guideFollowUp, newPieces, type LearnSubject } from './learning';
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
    return { id: card.id, name: card.name, short: cardLine(card.id), full: effectRule(subject, context), art: `/${card.art}`, kind: 'Card · One use', subject };
  });
  // One Guide serves solo and online play, so it names the finish button of each.
  const finish = `${text.finish} or ${text.send}`;
  if (section === 'How a turn works') return [
    ['move', 'Make your move', `Move one piece, then select ${finish}.`, 'Select one of your pieces. Select a marked square. Your king must be safe after each action. Checkmate wins.'],
    ['power', 'Use a power', 'An always-on power needs no tap.', `With powers only, each king has one power. It can be active or always on. Select an active power to see its rule and legal targets. Freeze and Ice Wall are free actions. ${guideFollowUp} Other active powers use the move.`],
    ['card', 'Play a card', 'Each card has one use.', `Both players start with the same four cards. With cards only, kings have no powers. With powers and cards, each king has an always-on power. Select a card, then its target. Freeze, Ice Wall and Firewall are free actions. ${guideFollowUp} Other cards use the move.`],
    ['undo', 'Change your turn', `${text.undo} changes a turn before ${finish}.`, `Your steps are not final until you select ${finish}. ${text.undo} removes the last step. A Beast can capture again before the turn ends.`],
    ['finish', 'End your turn', `${finish} makes your steps final.`, `Select ${finish} after a legal move or a free action that leaves your king safe. You cannot undo a final turn. Then your opponent plays. A game can end in checkmate, resign, stalemate, repetition, insufficient material or no progress for 100 actions.`],
  ].map(([id, name, short, full]) => ({ id, name, short, full, kind: 'Turn rule' }));
  return [];
}
let disposeGuide: (() => void) | undefined;
export function closeGuidePanel() { disposeGuide?.(); disposeGuide = undefined; }

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
/** The section counts, from the content. */
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
let focusActiveTab = false;
let guideId = 0;

const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => { const n = document.createElement(tag); n.className = className; n.textContent = text; return n; };
const picture = (src: string, className = '') => { const img = node('img', className); img.src = src; img.alt = ''; img.loading = 'lazy'; return img; };
/** A back link that names its target. */
const backLink = (target: string, onPress: () => void) => { const link = button(target, { icon: 'back', onPress }); link.className = 'guide-back'; link.setAttribute('aria-label', text.backTo(target)); return link; };
function entryRow(item: GuideEntry, open: () => void): HTMLButtonElement {
  const row = node('button', 'list-row guide-row'); row.type = 'button'; row.dataset.entry = item.id; row.addEventListener('click', open);
  const copy = node('span', 'list-row-copy'), name = node('strong', '', item.name);
  copy.append(name, node('small', '', item.short));
  const next = icon('next'); next.classList.add('list-row-next');
  row.append(...(item.art ? [picture(item.art, 'row-art')] : []), copy, next);
  return row;
}
function cardTile(item: GuideEntry, open: () => void): HTMLButtonElement {
  const tile = node('button', 'guide-card'); tile.type = 'button'; tile.dataset.entry = item.id; tile.addEventListener('click', open);
  const copy = node('span'); copy.append(node('strong', '', item.name), node('small', '', item.short));
  tile.append(picture(item.art!), copy); return tile;
}
function sectionList(section: string, go: (section?: string, entry?: string) => void): HTMLElement {
  const list = node('nav', 'guide-list-pane'); list.setAttribute('aria-label', section);
  const open = (id: string) => () => go(section, id);
  if (section === 'Pieces') for (const group of pieceGroups()) {
    const box = node('section', 'guide-group'), head = node('h2', 'group-title', group.name); box.append(head, ...group.entries.map(item => entryRow(item, open(item.id)))); list.append(box);
  } else if (section === 'Kings and powers') for (const block of kingBlocks()) {
    const box = node('section', 'king-block'), title = node('div', 'king-title'), name = node('h2', '', `${kingDisplayName(block.king)} King`);
    title.append(picture(block.art), name); box.setAttribute('aria-label', `${kingDisplayName(block.king)} King`);
    const powers = node('div', 'king-powers');
    powers.append(...block.powers.map(item => { const row = entryRow({ ...item, art: undefined }, open(item.id)); row.querySelector('strong')!.after(node('span', 'uses', usesLine(item))); return row; }));
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
/** After the page is in place: focus a node and bring it into view. The shell then keeps this focus and scroll. */
function restore(page: HTMLElement, target: HTMLElement | null, block: ScrollLogicalPosition = 'center', scrollTarget = target) {
  if (!target) return;
  page.dataset.restore = 'true';
  requestAnimationFrame(() => {
    if (!target.isConnected) return;
    const animations = page.getAnimations();
    void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (!target.isConnected) return;
      target.focus({ preventScroll: true }); scrollTarget?.scrollIntoView({ block });
    });
  });
}
export interface GuideOptions {
  backLabel?: string;
  onBack?: () => void;
}

export function guidePage(
  section: string | undefined,
  entry: string | undefined,
  go: (section?: string, entry?: string) => void,
  announce: (line: string) => void = () => {},
  options: GuideOptions = {},
): HTMLElement {
  closeGuidePanel();
  const page = node('section', 'shell-page guide-page');
  const activeSection = guideSections.find(sec => sec === section) ?? 'Pieces';
  const activeIndex = guideSections.indexOf(activeSection);
  const head = node('header', 'guide-head'), top = node('div', 'guide-top'), title = node('h1', '', text.guide);
  title.tabIndex = -1;
  if (options.onBack) top.append(backLink(options.backLabel ?? text.homeLabel, options.onBack));
  top.append(title);

  const tabs = node('div', 'guide-tabs'), panel = node('div', 'guide-panel');
  tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Guide sections');
  panel.id = `guide-panel-${++guideId}`; panel.setAttribute('role', 'tabpanel');
  function activate(next: number) {
    if (next === activeIndex) tabButtons[next].focus({ preventScroll: true });
    focusActiveTab = true;
    go(guideSections[next]);
    queueMicrotask(() => { focusActiveTab = false; });
  }
  const tabButtons = guideSections.map((sec, index) => {
    const tab = node('button', 'guide-tab', tabLabels[index]);
    tab.type = 'button'; tab.id = `${panel.id}-tab-${index}`; tab.dataset.section = sec;
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panel.id);
    tab.setAttribute('aria-selected', String(index === activeIndex)); tab.tabIndex = index === activeIndex ? 0 : -1;
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', event => {
      const last = guideSections.length - 1;
      let next: number;
      switch (event.key) {
        case 'ArrowLeft': next = index === 0 ? last : index - 1; break;
        case 'ArrowRight': next = index === last ? 0 : index + 1; break;
        case 'Home': next = 0; break;
        case 'End': next = last; break;
        default: return;
      }
      event.preventDefault(); activate(next);
    });
    return tab;
  });
  tabs.append(...tabButtons); head.append(top, tabs);
  panel.setAttribute('aria-labelledby', tabButtons[activeIndex].id);
  page.append(head, panel);
  page.dataset.section = activeSection;
  const focusTab = focusActiveTab;
  focusActiveTab = false;

  if (activeSection === 'How a turn works') {
    page.dataset.view = 'section'; panel.tabIndex = 0; panel.append(turnSteps(entry));
    if (focusTab) restore(page, tabButtons[activeIndex], 'nearest');
    else if (entry) restore(page, panel.querySelector<HTMLElement>(`[data-entry="${CSS.escape(entry)}"] h2`));
    left = null;
    return page;
  }

  const entries = guideEntries(activeSection), selected = entries.find(item => item.id === entry);
  const list = sectionList(activeSection, go), body = node('article', 'guide-entry-pane');
  const rowFor = (id: string) => list.querySelector<HTMLElement>(`[data-entry="${CSS.escape(id)}"]`);
  page.dataset.view = selected ? 'entry' : 'section'; panel.classList.add('guide-split'); panel.append(list, body);
  const wide = typeof matchMedia === 'function' ? matchMedia('(min-width: 900px)') : undefined;
  const isWide = () => wide?.matches ?? false;
  if (focusTab && (!selected || isWide())) restore(page, tabButtons[activeIndex], 'nearest');
  let disposeDetail: (() => void) | undefined;

  function mountDetail(item: GuideEntry) {
    const current = rowFor(item.id); current?.setAttribute('aria-current', 'true');
    const back = backLink(tabLabels[activeIndex], () => go(activeSection)); back.classList.add('guide-entry-back');
    const heading = node('h2', 'guide-entry-title', item.name); heading.tabIndex = -1;
    body.append(back);
    if (item.art) { const art = node('div', item.kind.startsWith('Card') ? 'entry-art card-art' : 'entry-art figure-art'); art.append(picture(item.art)); body.append(art); }
    if (item.kind === 'Piece' && newPieces.has(+item.id)) heading.append(node('span', 'new-tag', 'New'));
    body.append(node('p', 'guide-kind', item.kind), heading, node('p', 'guide-short', item.short));
    if (item.subject) { const demo = learningPanel(item.subject, context, { announce }); body.append(demo.element); disposeDetail = demo.dispose; }
    else body.append(node('p', 'guide-rule', item.full));
    const { previous, next } = neighbours(activeSection, item.id), pager = node('nav', 'entry-pager'); pager.setAttribute('aria-label', `${activeSection}: Previous and Next`);
    const step = (label: 'Previous' | 'Next', to?: GuideEntry) => {
      const control = button(label, { icon: label === 'Previous' ? 'back' : 'next', ...(to ? { onPress: () => go(activeSection, to.id) } : { disabledReason: label === 'Previous' ? 'This is the first entry.' : 'This is the last entry.' }) });
      if (to) { control.setAttribute('aria-label', `${label}: ${to.name}`); control.append(node('small', 'pager-name', to.name)); }
      control.classList.add(label === 'Previous' ? 'pager-previous' : 'pager-next'); return control;
    };
    pager.append(step('Previous', previous), step('Next', next)); body.append(pager);
    return heading;
  }

  function unmountDetail() {
    disposeDetail?.(); disposeDetail = undefined;
    body.replaceChildren(); list.querySelector('[aria-current]')?.removeAttribute('aria-current');
  }

  let detailFocused = false;
  page.addEventListener('focusin', event => { detailFocused = body.contains(event.target as Node); });
  const updateDefaultDetail = () => {
    if (isWide() && entries[0]) mountDetail(entries[0]);
    else {
      const hadFocus = detailFocused || body.contains(document.activeElement);
      const currentId = list.querySelector<HTMLElement>('[aria-current]')?.dataset.entry;
      unmountDetail();
      detailFocused = false;
      if (hadFocus && (!document.activeElement || document.activeElement === document.body || body.contains(document.activeElement))) {
        (currentId ? rowFor(currentId) : tabButtons[activeIndex])?.focus({ preventScroll: true });
      }
    }
  };
  if (selected) {
    left = { section: activeSection, entry: selected.id };
    const heading = mountDetail(selected);
    if (!isWide()) restore(page, heading, 'start', page);
    else if (!focusTab && options.onBack) restore(page, heading, 'nearest');
    queueMicrotask(() => {
      const current = rowFor(selected.id);
      if (isWide() && current?.isConnected) list.scrollTop = current.getBoundingClientRect().top - list.getBoundingClientRect().top - (list.clientHeight - current.offsetHeight) / 2;
    });
  } else {
    updateDefaultDetail(); wide?.addEventListener('change', updateDefaultDetail);
    if (!focusTab && !isWide() && left?.section === activeSection) restore(page, rowFor(left.entry));
    left = null;
  }
  disposeGuide = () => {
    if (!selected) wide?.removeEventListener('change', updateDefaultDetail);
    unmountDetail();
  };
  return page;
}
