import { LESSONS } from '../../lessons';
import { renderLessonShelf, progress, recordLesson } from '../../lesson-shelf-ui';
import { describeMove } from '../../move-text';
import { clickPath, marksModel } from '../../marks-model';
import { PaintedView } from '../../render/PaintedView';
import { toLan } from '../../rules/setup';
import { colorOf, K, sqName, typeOf } from '../../rules/engine';
import { boardSheet, closeBoardSheet } from './board';
import { art } from '../art';
import { lessonAttempt, lessonMoves, lessonPosition, withLessonRules } from './guide-model';
import './guide.css';

let view: PaintedView, canvas: HTMLDivElement;
const button = (words: string, click: () => void) => {
  const node = document.createElement('button'); node.textContent = words; node.onclick = click; return node;
};
export function guide() {
  const shelf = document.createElement('div');
  renderLessonShelf(shelf, progress());
  shelf.querySelectorAll<HTMLImageElement>('.shelf-figure img').forEach(image => {
    image.src = art(`ui/pieces/${image.closest<HTMLElement>('[data-piece]')!.dataset.piece}-w.webp`);
  });
  shelf.onclick = event => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-lesson], [data-play-game]');
    if (target?.dataset.lesson != null) lesson(Number(target.dataset.lesson));
    else if (target?.hasAttribute('data-play-game')) closeBoardSheet();
  };
  boardSheet('Guide', shelf, ...shelf.querySelector('[data-play-game]') ? [] : [button('Return to game', closeBoardSheet)]);
  document.getElementById('board-sheet')!.classList.add('board-guide');
}
function lesson(index: number) {
  const current = LESSONS[index], position = lessonPosition(index), moves = lessonMoves(index);
  const body = document.createElement('div'), task = document.createElement('p'), choices = document.createElement('div');
  body.className = 'plugin-lesson'; task.id = 'lesson-task'; task.setAttribute('role', 'status'); task.textContent = current.task;
  choices.className = 'lesson-choices'; choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', 'Lesson moves');
  if (!view) {
    canvas = document.createElement('div'); canvas.id = 'lesson-board'; canvas.setAttribute('role', 'group'); canvas.tabIndex = 0;
    view = new PaintedView(canvas, { floor: null, webInk: true }); view.setPace('off'); view.setCoords(true); view.canDrag = () => false;
  }
  let done = false;
  const attempt = (move: typeof moves[number]) => {
    if (done) return;
    const result = lessonAttempt(index, move); done = result.done;
    task.textContent = done ? current.done : current.task;
    choices.replaceChildren();
    withLessonRules(() => { view.sync(result.position); view.highlight({}); });
    if (done) {
      recordLesson(current.name);
      choices.append(button(index + 1 < LESSONS.length ? 'Next lesson' : 'Guide', () => index + 1 < LESSONS.length ? lesson(index + 1) : guide()));
    }
  };
  const select = (square: number) => {
    if (done) return;
    const own = moves.filter(move => move.from === square);
    const targets = moves.filter(move => move.from === selected && bites.every((at, i) => clickPath(move)[i] === at) && clickPath(move)[bites.length] === square);
    if (targets.length === 1) { attempt(targets[0]); return; }
    if (targets.length > 1) {
      bites.push(square);
      withLessonRules(() => view.highlight({ ...marksModel(targets, bites), selected }));
      choices.replaceChildren(...targets.map(move => button(withLessonRules(() => describeMove(position, move)), () => attempt(move)))); return;
    }
    selected = square; bites = [];
    withLessonRules(() => view.highlight({ ...marksModel(own), selected: square }));
    choices.replaceChildren(...own.map(move => {
      const option = button(withLessonRules(() => describeMove(position, move)), () => attempt(move));
      option.dataset.lessonMove = toLan(position, move); return option;
    }));
  };
  let selected: number | undefined, bites: number[] = [];
  view.onSquareClick = select;
  let cursor = position.board.findIndex(piece => piece !== 0 && colorOf(piece) === 0 && typeOf(piece) !== K);
  const cursorLabel = () => canvas.setAttribute('aria-label', `Lesson board, ${sqName(cursor)}. Enter selects a square.`);
  cursorLabel();
  canvas.onkeydown = event => {
    const offset = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: 8, ArrowDown: -8 } as Record<string, number>)[event.key];
    if (offset) { event.preventDefault(); cursor = Math.max(0, Math.min(63, cursor + offset)); view.setPreview(cursor); cursorLabel(); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(cursor); }
  };
  body.append(task, canvas, choices);
  boardSheet(current.name, body, button('Guide', guide), button('Return to game', closeBoardSheet));
  document.getElementById('board-sheet')!.classList.add('board-guide');
  withLessonRules(() => { view.sync(position); view.highlight({}); });
  void view.ready();
}
