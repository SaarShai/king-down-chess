import type { GameRules } from '../../../game-rules';
import type { Color, Move } from '../../../rules/engine';
import { button, sheet } from '../../ui/kit.js';
import { text } from '../texts';
import { helpTopic, type HelpSubject } from './content';
import { diagramLegend, figure, helpDiagram } from './diagram';
import { hintLines, startHints, type Hint } from './hints';
import { promotionChoices } from './promotion';
import type { Refusal } from './reasons';
import './help.css';

type Anchor = HTMLElement | DOMRectReadOnly;
interface HelpEffects {
  onSheetOpen?: (sheet: HTMLElement) => void;
  onSheetClose?: (sheet: HTMLElement, bounds: DOMRectReadOnly) => void;
  onRefusedTap?: (refusal: Refusal, bounds: DOMRectReadOnly) => void;
}

const box = (anchor: Anchor): DOMRectReadOnly => anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor;
const overlaps = (a: DOMRectReadOnly, b: DOMRectReadOnly) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

function placeBubble(element: HTMLElement, anchor: Anchor, avoid: readonly DOMRectReadOnly[]): boolean {
  const { left, right, top, bottom, width, height } = box(anchor);
  const w = element.offsetWidth, h = element.offsetHeight, n = 8;
  if (!width || !height) return false;
  const clamp = (at: number, end: number) => Math.max(n, Math.min(at, end - n));
  const x = clamp(left + (width - w) / 2, innerWidth - w), y = clamp(top + (height - h) / 2, innerHeight - h);
  const above = [x, top - h - n], below = [x, bottom + n], before = [left - w - n, y], after = [right + n, y];
  const candidates = element.dataset.hint === 'piece' || element.dataset.hint === 'ring'
    ? [before, after, above, below] : [above, below, before, after];
  for (const [l, t] of candidates) {
    const rect = new DOMRect(l, t, w, h);
    if (l < n || t < n || rect.right > innerWidth - n || rect.bottom > innerHeight - n || avoid.some(b => overlaps(rect, b))) continue;
    element.style.left = `${l}px`;
    element.style.top = `${t}px`;
    return true;
  }
  return false;
}

/** One help instance per game screen. The caller owns the narrator and turn events. */
export function createGameHelp({ board, player = 0, effects }: { board: HTMLElement; player?: Color; effects?: HelpEffects }) {
  let topic: { subject: HelpSubject; rules?: GameRules; side: Color } | null = null;
  let active: ReturnType<typeof sheet> | undefined;
  let hints = startHints(false);
  let hint: HTMLElement | undefined;
  let notice: HTMLElement | undefined;
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  const infoButton = button('i', {
    onPress: () => { if (topic) openRule(topic.subject, infoButton, topic.rules, topic.side); },
  });
  infoButton.classList.add('daylight-help-info');
  infoButton.querySelector('[data-button-label]')!.classList.add('daylight-help-mark');
  const label = document.createElement('span');
  label.className = 'daylight-help-rule-label'; label.textContent = 'Rule';
  infoButton.append(label);
  infoButton.hidden = true;

  function clearHint() { hint?.remove(); hint = undefined; }
  function clearNotice() { clearTimeout(noticeTimer); notice?.remove(); notice = undefined; }
  function close() { active?.close(); clearNotice(); clearHint(); }

  function openSheet(title: string, body: HTMLElement, source: HTMLElement, badge: string, onClose?: () => void) {
    close();
    const panel = sheet(title, body, board), { element } = panel;
    element.classList.add('daylight-help-sheet');
    const promotion = body.classList.contains('daylight-help-promotions');
    element.dataset.helpSheet = promotion ? 'promotion' : 'rule';
    if (badge) {
      const label = document.createElement('span');
      label.className = 'daylight-help-badge';
      label.textContent = badge;
      element.querySelector('h2')!.append(label);
    }
    const shade = document.createElement('div');
    shade.className = 'daylight-help-shade';
    shade.dataset.kind = element.dataset.helpSheet;
    shade.setAttribute('aria-hidden', 'true');
    let bounds = new DOMRect();
    function fit() {
      const b = board.getBoundingClientRect(), edge = 12;
      const right = innerWidth - b.right, left = b.left;
      const wide = innerWidth >= innerHeight * 1.25;
      const side = wide && Math.max(right, left) >= 220;
      const useRight = right >= left;
      const room = useRight ? right : left;
      const bottomRoom = Math.max(0, innerHeight - b.bottom - 10);
      const contracted = !side && bottomRoom < 80 && b.top - edge > bottomRoom;
      const sideWidth = promotion ? Math.min(420, room - 40) : Math.min(380, room - edge * 2);
      const width = side ? sideWidth : Math.min(680, innerWidth);
      const height = side ? innerHeight - edge * 2
        : contracted ? Math.max(0, b.top - edge) : bottomRoom;
      const sideInset = promotion ? (useRight ? room - width - edge : edge) : (room - width) / 2;
      const x = side ? (useRight ? b.right : 0) + sideInset : (innerWidth - width) / 2;
      element.dataset.placement = side ? 'side' : contracted ? 'above' : 'bottom';
      element.style.width = `${width}px`;
      element.style.maxHeight = `${height}px`;
      element.style.setProperty('--daylight-help-room', `${height}px`);
      element.style.left = `${x}px`;
      element.style.top = side ? `${edge}px` : contracted ? '0' : 'auto';
      element.style.bottom = side ? `${edge}px` : contracted ? 'auto' : '0';
      if (!element.hidden) bounds = element.getBoundingClientRect();
    }
    const observer = new ResizeObserver(fit);
    active = panel;
    document.body.append(shade, element);
    fit();
    observer.observe(board);
    window.addEventListener('resize', fit);
    window.addEventListener('scroll', fit, true);
    element.addEventListener('kd-close', () => {
      active = undefined;
      observer.disconnect();
      window.removeEventListener('resize', fit);
      window.removeEventListener('scroll', fit, true);
      source.removeAttribute('aria-controls');
      try { effects?.onSheetClose?.(element, bounds); } finally { element.remove(); shade.remove(); }
      onClose?.();
    }, { once: true });
    panel.open(source);
    bounds = element.getBoundingClientRect();
    effects?.onSheetOpen?.(element);
    return { close: panel.close };
  }

  function setTopic(subject: HelpSubject | null, rules?: GameRules, side: Color = 0): void {
    topic = subject && { subject, rules, side };
    infoButton.hidden = !topic;
    if (topic) infoButton.setAttribute('aria-label', `${text.fullRule}: ${helpTopic(topic.subject, rules, side).name}`);
  }

  function openRule(subject: HelpSubject, source: HTMLElement, rules?: GameRules, side: Color = 0) {
    const entry = helpTopic(subject, rules, side);
    const body = document.createElement('div');
    body.className = 'daylight-help-rule';
    const line = document.createElement('p'), detail = document.createElement('p');
    line.textContent = entry.line;
    detail.textContent = entry.detail;
    const diagram = helpDiagram(subject, side);
    body.append(diagram, line);
    if (entry.detail !== entry.line) body.append(detail);
    body.append(diagramLegend(diagram));
    const badge = entry.badge || (subject.kind === 'piece' ? side === player ? 'Yours' : 'Enemy' : '');
    return openSheet(entry.name, body, source, badge);
  }

  function openPromotion(
    moves: readonly Move[], source: HTMLElement, side: Color, onChoose: (move: Move) => void, onCancel?: () => void,
  ) {
    const choices = promotionChoices(moves);
    if (!choices.length) return null;
    const body = document.createElement('div');
    body.className = 'daylight-help-promotions';
    let picked = false;
    for (const { move, type, name } of choices) {
      const choice = button(name, { onPress: () => { picked = true; panel.close(); onChoose(move); } });
      choice.prepend(figure(type, side));
      body.append(choice);
    }
    const panel = openSheet('Choose a new piece', body, source, '', () => { if (!picked) onCancel?.(); });
    return panel;
  }

  function showRefusal(refusal: Refusal, anchor: Anchor, avoid: readonly DOMRectReadOnly[] = []): void {
    clearNotice();
    clearHint();
    if (active) return;
    effects?.onRefusedTap?.(refusal, box(anchor));
    const element = document.createElement('div');
    element.className = 'daylight-help-bubble daylight-help-refusal';
    element.dataset.reason = refusal.code;
    element.setAttribute('role', 'status');
    element.textContent = refusal.line;
    document.body.append(element);
    if (!placeBubble(element, anchor, avoid)) { element.remove(); return; }
    notice = element;
    noticeTimer = setTimeout(clearNotice, 1800);
  }

  function updateHint(name: Hint | null, anchor?: Anchor, avoid: readonly DOMRectReadOnly[] = []): void {
    if (!name || !anchor || active || notice) { clearHint(); return; }
    if (hint?.dataset.hint === name) {
      if (!placeBubble(hint, anchor, avoid)) clearHint();
      return;
    }
    clearHint();
    const element = document.createElement('div');
    element.className = 'daylight-help-bubble';
    element.dataset.hint = name;
    element.setAttribute('role', 'status');
    element.textContent = hintLines[name];
    element.style.visibility = 'hidden';
    document.body.append(element);
    if (!placeBubble(element, anchor, avoid) || !hints.take(name)) { element.remove(); return; }
    element.style.visibility = '';
    hint = element;
  }

  return {
    infoButton, setTopic, openRule, openPromotion, showRefusal, updateHint, close,
    startHints(newGame: boolean) { clearHint(); hints = startHints(newGame); },
  };
}
