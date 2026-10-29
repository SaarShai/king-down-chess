// A Workshop design for browser checks of a game link that holds a design. The Workshop is parked (docs/PARKED.md),
// but a game link with a design still loads its game (src/main.ts linkDesign). tools/lib/design-link.test.ts keeps
// WARD_CODE equal to designCode(WARD) (src/workshop/model.ts), so a change to the code format fails there.
export const WARD = { v: 1, kind: 'piece', id: 'ward', name: 'Old Ward', named: true, look: { body: 'token', auto: true, glow: null, army: 0, figure: 'ram-bastion' }, letter: 'U',
  squares: [{ x: 0, y: 1, mark: 'move' }, { x: 1, y: 1, mark: 'both' }, { x: -1, y: 1, mark: 'both' }], lines: ['ne', 'nw'], rules: [], from: [], updated: 1760000000000 };
export const WARD_CODE = 'eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjotMSwieSI6MSwibWFyayI6ImJvdGgifSx7IngiOjAsInkiOjEsIm1hcmsiOiJtb3ZlIn0seyJ4IjoxLCJ5IjoxLCJtYXJrIjoiYm90aCJ9XSwibGluZXMiOlsibmUiLCJudyJdLCJydWxlcyI6W10sIm5hbWUiOiJPbGQgV2FyZCIsImxvb2siOnsiYm9keSI6InRva2VuIiwiYXV0byI6dHJ1ZSwiZ2xvdyI6bnVsbCwiYXJteSI6MCwiZmlndXJlIjoicmFtLWJhc3Rpb24ifSwibGV0dGVyIjoiVSJ9';
/** A game link: each side's b-file knight is the design (the slot T), no moves yet. */
export const WARD_LINK = `?design=${WARD_CODE}&army=RTBQKBNR&moves=`;
