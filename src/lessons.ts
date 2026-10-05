/** Six one-move lessons, one per King Down piece: the piece's signature move in a tiny position (White to move). */
import { G, typeOf, type Move, type Position } from './rules/engine';

export interface Lesson {
  name: string;
  fen: string;
  /** What to do; shown again after a wrong move. */
  task: string;
  goal: (pre: Position, m: Move) => boolean;
  /** Shown after the goal move: the rule behind it. */
  done: string;
}

export const LESSONS: readonly Lesson[] = [
  {
    name: 'Archer',
    // The official Archer (2026-10-05): she shoots f4 over the knight; b4 has nothing in front of it.
    fen: '7k/8/8/8/1p1ANp2/8/8/K7 w - - 0 1',
    task: 'Tap your archer, then the marked enemy pawn. She shoots it over your knight, without moving.',
    goal: (_, m) => m.to === m.from && m.captures.length > 0,
    done: 'An archer never captures by moving onto a piece. She shoots 2 squares straight or diagonally forward, only over a piece of either side. The pawn on b4 is safe: nothing stands between.',
  },
  {
    name: 'Guard',
    fen: 'k3r3/8/8/8/8/8/3G4/4K3 w - - 0 1',
    task: 'The rook gives check. Block it with your guard.',
    goal: (pre, m) => typeOf(pre.board[m.from]) === G,
    done: 'Only a king can capture a guard, so the rook cannot break this wall. A guard never captures.',
  },
  {
    name: 'Maester',
    fen: '7k/8/8/8/3MN3/8/8/K7 w - - 0 1',
    task: 'Tap your maester, then your own knight. They trade places.',
    goal: (_, m) => !!m.swap,
    done: 'A maester swaps with a friendly neighbour, and captures an adjacent enemy.',
  },
  {
    name: 'Beast',
    fen: '7k/8/3n4/3n4/3S4/8/8/K7 w - - 0 1',
    task: 'Tap your beast, then the knight on d5, then the knight on d6: two captures in one move.',
    goal: (_, m) => m.captures.length >= 2,
    done: 'After each bite the beast may bite again from its new square. A chain never continues onto a king.',
  },
  {
    name: 'Ogre',
    fen: '7k/8/8/3n4/3O4/8/8/K7 w - - 0 1',
    task: 'Tap your ogre, then the enemy knight, and choose Push.',
    goal: (_, m) => !!m.shove,
    done: 'The ogre shoves a neighbour one square away and steps into its place. A shove is not a capture; kings are never shoved.',
  },
  {
    name: 'Paladin',
    fen: '7k/8/3p4/8/8/3N4/3P4/K2L4 w - - 0 1',
    task: 'Your paladin moves like a queen and jumps over its own pieces. Take the pawn on d6.',
    goal: (_, m) => m.captures.length > 0,
    done: 'Taking a pawn is safe. Taking any other piece also removes the paladin.',
  },
];
