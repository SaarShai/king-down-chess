// A real recorded game: the King Down computer player on both sides (Club as White, Casual as Black),
// random army seed 274 (back rank SKMGAOBN). White wins by checkmate on move 34.
// It has Beast chains, Archer shots, Ogre shoves and Maester swaps. Moves as KD LAN, oldest first.
export const GAME = {
  army: 'SKMGAOBN',
  white: 'Club',
  black: 'Casual',
  lans: [
    'b2-b3', 'c7-c6', 'Mc1<>c2', 'd7-d6', 'Of1>g2-h3', 'b7-b5', 'Sa1-b2', 'e7-e6', 'Nh1-g3', 'e6-e5',
    'Sb2-c3', 'g7-g5', 'Sc3-b4', 'Nh8-g6', 'Sb4xb5xc6xd6', 'Mc8-c7', 'Sd6-d5', 'Ae8-d7', 'Sd5-e4', 'Of8-g7',
    'Og2>g3-g4', 'Gd8-e7', 'Ng4xe5', 'Ad7-e6', 'Se4-d4', 'Ae6-f6', 'Ne5-g4', 'Af6*d4', 'Ng4xf6', 'Og7xf6',
    'Mc2<>d1', 'Of6>g5-h4', 'Og3-f3', 'a7-a6', 'e2-e4', 'a6-a5', 'Ae1-e2', 'Mc7-d7', 'Ae2-e3', 'Og5>g6-g7',
    'Ae3-f4', 'Md7-e6', 'Af4*h4', 'Og6-h5', 'Md1<>d2', 'Ge7-e8', 'Of3>e4-d5', 'Me6-d7', 'Af4-e5', 'Oh5-h4',
    'Ae5*g7', 'f7-f5', 'Oe4>d5-c6', 'Md7-c7', 'Od5-c5', 'Mc7-b7', 'Ae5-d6', 'Kb8-c8', 'Ad6-d7', 'Kc8-c7',
    'Ad7*b7', 'f5-f4', 'Ad7-d6', 'Kc7-c8', 'Oc5-b6', 'Bg8-e6', 'Ob6-c7',
  ],
  // Key moments, worked out beforehand with the app's own rule (src/moment.ts keyMoments: a move that
  // gives away 2 pawns or more), scored by the computer player's search at depth 5 and 4.
  // Ply 11 (Black's g7-g5) gave away about 3 pawns; the search prefers c6-c5.
  moments: [{ ply: 11, loss: 315, better: 'c6-c5' }],
};
