import { lessonShelf, type LessonStore } from './lesson-shelf';
import { completeLesson, readLessonStore, type LessonProgress } from './lesson-store';
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
    <button id="learn" type="button" class="shelf-next primary" ${next ? `data-lesson="${next.lesson}"` : 'data-play-game'}>${next ? `Learn the ${next.name}` : 'Play a game'}</button>
    <p class="shelf-safe">Lessons never change your saved game.</p>
  </section>`;
}

export function progress(): LessonProgress {
  try { return readLessonStore(localStorage.getItem('kingdown.lessons')); }
  catch { return {}; }
}

export function recordLesson(name: string): void {
  try {
    const store = progress(), next = completeLesson(store, name);
    if (next !== store) localStorage.setItem('kingdown.lessons', JSON.stringify(next));
  } catch { /* The lesson still works when the store is off. */ }
}

export function refreshLessonShelf(): void {
  renderLessonShelf(document.getElementById('lesson-shelf')!, progress());
}

export function initLessonShelf(start: (lesson: number) => void, play: () => void): void {
  document.getElementById('lesson-shelf')!.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.dataset.lesson != null) start(Number(button.dataset.lesson));
    else if (button.hasAttribute('data-play-game')) {
      (document.getElementById('rules') as HTMLDialogElement).close();
      play();
    }
  });
}
