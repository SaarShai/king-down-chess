// Stage "readingb" (launch decision 33; runs/review/reading-lab/design.md sections 2 and 4): the B reading area.
// One small turn state, one headline, one subject, and the lasting effects last in one summary control.
// main.ts decides the words (the A functions of texts.ts); this module places them for the form of the layout.
import { calm, swapText, time } from './motion';
import type { Form } from './layout';

export { finishKind, sentences, summaryLabel } from './reader-rules';

export interface ReaderModel {
  /** The turn state: small, one line. */
  state: string;
  /** The headline: a name (a piece, power, card or choice) or the current sentence. */
  title: string;
  named: boolean;
  isNew?: boolean;
  /** A shorter headline (the actor's name) when the sentence does not fit; the sentence then opens the subject. */
  short?: string;
  /** Subject art: a figure or a card painting (option f1, joy item 5). */
  art?: string;
  /** ? and Cancel or Close: beside the name (option e1). */
  headTools: HTMLElement[];
  /** The instruction, the refusal or the result: it stays fixed. */
  primary: HTMLElement[];
  /** Secondary text: it scrolls inside its own box. */
  secondary: HTMLElement[];
  /** Show again, or the choices of one square. */
  tools: HTMLElement[];
  /** The effects summary control, or nothing. */
  summary: HTMLElement | null;
}
export interface ReaderNodes { state: HTMLElement; title: HTMLElement; art: HTMLImageElement }
const div = (className: string, ...children: (Node | null | undefined | false)[]) => {
  const node = document.createElement('div'); node.className = className; node.append(...children.filter(Boolean) as Node[]); return node;
};
/** The persistent nodes: the turn state and the headline keep one label each (joy item 1, Single-label Exact). */
export function readerNodes(): ReaderNodes {
  const state = document.createElement('p'); state.className = 'play-turn-state';
  const title = document.createElement('span'); title.className = 'play-title';
  const art = document.createElement('img'); art.className = 'play-art'; art.alt = '';
  return { state, title, art };
}
function headline(m: ReaderModel, nodes: ReaderNodes) {
  const h = document.createElement('h2'); h.className = 'play-headline'; h.append(nodes.title);
  if (m.isNew) { const tag = document.createElement('span'); tag.className = 'learn-new'; tag.textContent = 'New'; h.append(tag); }
  return h;
}
// The last sentence that did not fit its headline: the next render keeps the short headline at once (no second swap).
let shortened = '';
export const resetFit = () => { shortened = ''; };
const lastLine = (line: string) => { const p = document.createElement('p'); p.className = 'play-last'; p.textContent = line; return p; };
/** Build the normal reading area. Tall and wide: state, headline row, subject, summary. Compact: one pinned 44 px header, then the body. */
export function readerView(m: ReaderModel, form: Form, nodes: ReaderNodes): HTMLElement {
  const short = form !== 'compact' && !!m.short && !m.named && m.title === shortened;
  swapText(nodes.state, m.state); swapText(nodes.title, short ? m.short! : m.title);
  const box = div('play-b'); box.dataset.form = form;
  const art = m.art ? nodes.art : null;
  if (art && art.getAttribute('src') !== m.art) {
    art.src = m.art!;
    // The painting fades in over 120 ms with no travel (joy item 5, Direct pip); Fast halves it, Off and reduced motion show it at once.
    if (!calm()) art.animate([{ opacity: 0 }, { opacity: 1 }], { duration: time(120), easing: 'linear' });
  }
  if (!m.art) nodes.art.removeAttribute('src');
  const primary = div('play-primary', short ? lastLine(m.title) : null, ...m.primary), secondary = div('play-secondary', ...m.secondary);
  if (form === 'compact') {
    // Show again shares the header when no name tools are there; the summary goes to the header when it has room.
    const headTools = m.headTools.length ? m.headTools : m.tools.length === 1 && m.tools[0].matches('.kd-button') ? m.tools : [];
    const bodyTools = headTools === m.tools ? [] : m.tools, summaryInHead = !m.headTools.length && !!m.summary;
    const text = div('play-bhead-text', nodes.state, m.named && m.title ? headline(m, nodes) : null);
    box.append(div('play-bhead', text, div('play-bhead-tools', ...headTools, summaryInHead ? m.summary : null)));
    if (!m.named && m.title) { const line = headline(m, nodes); line.classList.add('play-headline-line'); primary.prepend(line); }
    if (bodyTools.length) primary.append(div('play-tools', ...bodyTools));
    if (m.summary && !summaryInHead) secondary.append(m.summary);
    const lines = div('play-lines', primary, secondary), subject = div('play-sub', art, lines);
    if (art) subject.dataset.art = 'on';
    box.append(subject);
    return box;
  }
  const head = div('play-head', m.title ? headline(m, nodes) : null, m.headTools.length ? div('play-head-tools', ...m.headTools) : null);
  const subject = div('play-sub', art, div('play-lines', primary, secondary), m.tools.length ? div('play-tools', ...m.tools) : null);
  if (art) subject.dataset.art = 'on';
  box.append(nodes.state, head, subject, div('play-summary', m.summary));
  return box;
}
/** After the reading area is in the page: art goes first when the text does not fit; a long sentence leaves the headline for the actor's name. */
export function fitReader(box: HTMLElement, m: ReaderModel) {
  const lines = box.querySelector<HTMLElement>('.play-lines'), sub = box.querySelector<HTMLElement>('.play-sub');
  // A full line more than the box: the glyphs of one line can stand 2 or 3 px past their line height, which is not overflow.
  const over = (node: HTMLElement | null) => !!node && node.clientWidth > 0 && node.scrollHeight > node.clientHeight + Math.max(4, (parseFloat(getComputedStyle(node).lineHeight) || 0) / 3);
  const title = box.querySelector<HTMLElement>('.play-head .play-headline');
  if (title && m.short && !m.named && m.title !== shortened && over(title)) {
    shortened = m.title; title.querySelector('.play-title')!.textContent = m.short;
    box.querySelector('.play-primary')!.prepend(lastLine(m.title));
  }
  if (sub?.dataset.art === 'on' && (over(lines) || over(box.querySelector('.play-primary')) || over(box.querySelector('.play-secondary')))) sub.dataset.art = 'off';
  // The fixed part does not scroll (decision 34): its last lines go to the top of the secondary text, which can scroll (design section 4).
  const primary = box.querySelector<HTMLElement>('.play-primary'), secondary = box.querySelector<HTMLElement>('.play-secondary');
  while (primary && secondary && primary.childElementCount > 1 && primary.scrollHeight > primary.clientHeight + 1) secondary.prepend(primary.lastElementChild!);
}
