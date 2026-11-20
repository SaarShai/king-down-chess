import { kingDisplayName } from '../../king-label';
import { button, closeX } from '../ui/kit.js';
import { colorOf, followSq, sqName, typeOf, type Color, type Position } from '../../rules/engine';
import type { GameRules } from '../../game-rules';
import { pieces } from './texts';
import { diagramFor, learningEntry, type LearnSubject } from './learning';
import type { Diagram } from './learning-diagrams';
const node = (tag: string, className = '', text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
/** A local symbol board. Its cells are pictures, never game inputs. */
export function playDiagram(diagram: Diagram, name: string, announce: (line: string) => void) {
  const element = node('div', 'learn-demo'), board = node('div', 'learn-board'), copy = node('div', 'learn-demo-copy');
  board.setAttribute('role', 'img'); board.setAttribute('aria-label', `${name} example. ${diagram.text}`);
  let token = 0, animations: Animation[] = [];
  const cancel = () => { token++; animations.forEach(a => a.cancel()); animations = []; };
  const xy = (sq: number) => [sq % 8, diagram.side ? 7 - (sq >> 3) - diagram.crop : (sq >> 3) - diagram.crop];
  const put = (el: HTMLElement, sq: number) => { const [x, y] = xy(sq); el.style.left = `${x * 20}%`; el.style.top = `${(4 - y) * 20}%`; };
  function draw(pos: Position, settled = false) {
    board.replaceChildren(); board.dataset.frame = settled ? 'after' : 'before';
    for (let row = 4; row >= 0; row--) for (let x = 0; x < 5; x++) {
      const cell = node('span', `learn-cell ${(x + row) % 2 ? 'learn-cell-dark' : ''}`);
      const sq = x + 8 * (diagram.side ? 7 - row - diagram.crop : row + diagram.crop);
      if (x === 0 || row === 0) cell.append(node('small', 'learn-coordinate', sqName(sq)));
      board.append(cell);
    }
    pos.board.forEach((code, sq) => {
      const [x, y] = xy(sq); if (!code || x > 4 || y < 0 || y > 4) return;
      const img = document.createElement('img'); img.src = `/ui/icons/${pieces[typeOf(code)].name.toLowerCase()}.svg`; img.alt = ''; img.className = `learn-symbol ${colorOf(code) ? 'learn-dark' : ''}`; img.dataset.square = String(sq); put(img, sq); board.append(img);
    });
    for (const sq of diagram.marks) { const [x, y] = xy(sq); if (x > 4 || y < 0 || y > 4) continue; const mark = node('span', 'learn-ring'); put(mark, sq); board.append(mark); }
  }
  async function play() {
    cancel(); const own = token; draw(diagram.frames[0].before); show.setAttribute('aria-busy', 'true');
    announce(diagram.text);
    const { calm, time } = await import('./motion');
    if (own !== token) return;
    try {
      for (const frame of diagram.frames) {
        if (own !== token) return;
        draw(frame.before);
        const duration = calm() ? 0 : time(420), move = frame.move;
        if (duration && move) {
          const current: Animation[] = [];
          for (const img of board.querySelectorAll<HTMLElement>('[data-square]')) {
            const from = Number(img.dataset.square), to = followSq(move, from);
            let frames: Keyframe[] = [];
            if (to < 0) frames = [{ opacity: 1 }, { opacity: 0 }];
            else if (to !== from) {
              const [x, y] = xy(from), path = from === move.from && move.captures.length > 1 ? move.captures : [to];
              frames = [{ transform: 'none' }, ...path.map(q => { const [xx, yy] = xy(q); return { transform: `translate(${(xx - x) * 100}%, ${(y - yy) * 100}%)` }; })];
            }
            if (frames.length) current.push(img.animate(frames, { duration: duration * Math.max(1, move.captures.length), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }));
          }
          animations = current; await Promise.all(current.map(a => a.finished.catch(() => {})));
          if (own !== token) return;
          current.forEach(a => a.cancel()); animations = [];
        }
        draw(frame.after, true);
        if (duration && move && move.from === move.to && !move.captures.length && diagram.marks.length) {
          animations = [...board.querySelectorAll('.learn-ring')].map(ring => ring.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'ease-out' }));
          await Promise.all(animations.map(a => a.finished.catch(() => {})));
          if (own !== token) return;
          animations.forEach(a => a.cancel()); animations = [];
        }
      }
    } finally { if (own === token) show.removeAttribute('aria-busy'); }
  }
  const show = button('Show move', { onPress: () => { void play(); } });
  copy.append(show, node('p', '', diagram.text)); element.append(board, copy); draw(diagram.frames[0].before);
  return { element, dispose() { cancel(); show.removeAttribute('aria-busy'); } };
}
export function learningPanel(subject: LearnSubject, rules: GameRules, options: { pos?: Position; side?: Color; cardIndex?: number; close?: () => void; announce?: (line: string) => void; owner?: string } = {}) {
  const entry = learningEntry(subject, rules, options.pos, options.side, options.cardIndex), element = node('section', 'learn-panel');
  element.dataset.subject = entry.key; element.setAttribute('role', 'region'); element.setAttribute('aria-label', `All about the ${entry.name}`);
  const top = node('div', 'learn-top'), title = node('h3', '', entry.name);
  if (options.close) top.append(closeX(`Close ${entry.name} rule`, options.close));
  // `owner`: the game names whose power it is (reading decision 22); the Guide gives none.
  top.append(node('p', 'learn-kind', [options.owner ?? entry.kind, entry.king ? `${kingDisplayName(entry.king)} King` : '', entry.uses].filter(Boolean).join(' · ')), title, node('p', 'learn-short', entry.short));
  const demo = playDiagram(diagramFor(subject, options.side, rules), entry.name, options.announce ?? (() => {}));
  const rule = node('p', 'learn-rule', entry.full), limits = node('p', 'learn-limits', entry.limits), against = node('p', 'learn-against', entry.against);
  const body = node('div', 'learn-body');
  body.append(demo.element);
  if (entry.short !== entry.full) body.append(rule);
  body.append(node('h4', '', 'Limits'), limits, node('h4', '', 'Against it'), against);
  element.append(top, body);
  return { element, dispose: demo.dispose };
}
