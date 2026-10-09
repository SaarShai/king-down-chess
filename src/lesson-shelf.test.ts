import { describe, expect, it } from 'vitest';
import { lessonShelf } from './lesson-shelf';

describe('lesson shelf', () => {
  it('shows six pieces in shelf order and starts with the Archer', () => {
    const shelf = lessonShelf({});
    expect(shelf.pieces.map(p => [p.name, p.lesson, p.status])).toEqual([
      ['Archer', 0, 'Next'],
      ['Beast', 3, ''],
      ['Maester', 2, ''],
      ['Ogre', 4, ''],
      ['Guard', 1, ''],
      ['Paladin', 5, 'Bonus'],
    ]);
    expect(shelf.next?.name).toBe('Archer');
  });

  it('marks saved lessons Learned and selects the first gap in shelf order', () => {
    const store = Object.freeze({
      done: Object.freeze(['Archer', 'Maester', 'Ogre', 'Archer', 'Old lesson']),
      tricks: Object.freeze(['wall']),
    });
    const shelf = lessonShelf(store);
    expect(shelf.pieces.map(p => [p.name, p.status])).toEqual([
      ['Archer', 'Learned'], ['Beast', 'Next'], ['Maester', 'Learned'],
      ['Ogre', 'Learned'], ['Guard', ''], ['Paladin', 'Bonus'],
    ]);
    expect(shelf.next?.lesson).toBe(3);
    expect(store).toEqual({ done: ['Archer', 'Maester', 'Ogre', 'Archer', 'Old lesson'], tricks: ['wall'] });
  });

  it('offers the Paladin last and keeps its Bonus mark', () => {
    const shelf = lessonShelf({ done: ['Guard', 'Ogre', 'Maester', 'Beast', 'Archer'] });
    expect(shelf.next).toMatchObject({ name: 'Paladin', lesson: 5, status: 'Bonus' });
  });

  it('offers play after all six lessons are learned', () => {
    const shelf = lessonShelf({ done: ['Paladin', 'Guard', 'Ogre', 'Maester', 'Beast', 'Archer'] });
    expect(shelf.next).toBeNull();
    expect(shelf.pieces.map(p => p.status)).toEqual(['Learned', 'Learned', 'Learned', 'Learned', 'Learned', 'Learned']);
  });

  it('keeps an early gap as Next when the bonus is already learned', () => {
    const shelf = lessonShelf({ done: ['Paladin'] });
    expect(shelf.next?.name).toBe('Archer');
    expect(shelf.pieces[5].status).toBe('Learned');
  });

  it('gives each figure one short rule line for the current lessons', () => {
    expect(lessonShelf({}).pieces.map(p => p.line)).toEqual([
      'Shoots without moving', 'Can bite again after a bite', 'Swaps with a friend',
      'Shoves a neighbour', 'Only a king takes it', 'Jumps its own pieces',
    ]);
  });
});
