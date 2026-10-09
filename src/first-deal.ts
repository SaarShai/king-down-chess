/** Seed 83 of the draw in force. The first game keeps this army if the pool changes. */
export const FIRST_DEAL = 'QRNAKBBS';

/** Start-up stores an empty game before Start; only a move or the deal key ends the first visit. */
export const isFirstVisit = (dealt: boolean, moves: number): boolean => !dealt && moves === 0;
