import { describe, expect, it } from 'vitest';
import { completeLesson, readLessonStore } from './lesson-store';

describe('lesson store', () => {
  it('adds a learned lesson and keeps every other field', () => {
    const store = Object.freeze({ done: Object.freeze(['Archer']), tricks: ['wall'], extra: { value: 3 } });
    expect(completeLesson(store, 'Beast')).toEqual({ done: ['Archer', 'Beast'], tricks: ['wall'], extra: { value: 3 } });
    expect(store.done).toEqual(['Archer']);
  });

  it('reads saved progress, keeps extra fields, and drops invalid lesson names', () => {
    expect(readLessonStore('{"done":["Archer",3,null],"tricks":["wall"]}')).toEqual({ done: ['Archer'], tricks: ['wall'] });
  });

  it('keeps a learned lesson once', () => {
    const store = { done: ['Archer'], tricks: ['wall'] };
    expect(completeLesson(store, 'Archer')).toEqual(store);
  });

  it.each([null, '{', 'null', '[]', '"Archer"'])('opens an empty shelf for an invalid store: %s', raw => {
    expect(readLessonStore(raw).done ?? []).toEqual([]);
  });

  it('keeps other fields when the saved done list is invalid', () => {
    expect(readLessonStore('{"done":"Archer","tricks":["wall"]}')).toEqual({ done: [], tricks: ['wall'] });
  });
});
