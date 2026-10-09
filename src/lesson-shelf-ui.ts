import { lessonShelf, type LessonStore } from './lesson-shelf';
import './lesson-shelf.css';

/** The Guide binds data-lesson to the kept lesson flow when it mounts this shelf. */
export function renderLessonShelf(container: HTMLElement, store: LessonStore): void {
  const { pieces, next } = lessonShelf(store);
  container.innerHTML = `<section class="lesson-shelf" aria-label="Lessons">
    <h3>Six new pieces</h3>
    <p class="shelf-intro">About a minute each, in any order.</p>
    <ul class="shelf-list" role="list">${pieces.map(p => {
      const piece = p.name.toLowerCase(), line = p.line;
      return `<li><button type="button" class="shelf-piece" data-piece="${piece}" data-lesson="${p.lesson}" data-status="${p.status}"
        aria-label="${p.name}: ${line}.${p.status ? ` ${p.status}.` : ''}">
        <span class="shelf-figure"><img src="${import.meta.env.BASE_URL}ui/pieces/${piece}-w.webp" alt="" decoding="async"></span>
        <span class="shelf-name">${p.name}</span><span class="shelf-line">${line}</span>
        <span class="shelf-status">${p.status === 'Learned' ? '<span aria-hidden="true">✓ </span>' : ''}${p.status}</span>
      </button></li>`;
    }).join('')}</ul>
    <button type="button" class="shelf-next primary" ${next ? `data-lesson="${next.lesson}"` : 'data-play-game'}>${next ? `Learn the ${next.name}` : 'Play a game'}</button>
    <p class="shelf-safe">Lessons never change your saved game.</p>
  </section>`;
}
