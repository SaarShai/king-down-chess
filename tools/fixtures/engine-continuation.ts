import type { MatchSetup } from '../../src/match/index';
import type { Status } from '../../src/rules/engine';

// These rows describe archive features. They do not grant browser support.
export const ARCHIVE_CAPABILITIES = [
  { hex: '2675a7e6e32d635615350089a490902f4842ae26a7866d7123c6d95b49c60c5b', classic: false, cards: false },
  { hex: 'a6f9ebec5f0f2d5ff0a7b24e726e196fd27821a5133176bcfda26b70de9b75cd', classic: false, cards: false },
  { hex: 'a5750f9695e8f3cc341a69fb02bd709eed142ce7a36b2c69eaedd612fe1f5d16', classic: true, cards: true },
  { hex: 'bab22e94d4df81591374763a7f3abe703c30534f80ce771ee3fe7e095dcec7da', classic: true, cards: true },
  { hex: 'e668782a46ed3661312f39a8d246c19722686054317a4c9a35da31d726dabcb6', classic: true, cards: true },
] as const;

export interface ContinuationCase {
  name: string;
  setup: MatchSetup;
  actions: string[];
  status?: Status;
  followups?: boolean;
  automaticPass?: boolean;
}
const haste = '7k/p7/8/8/8/8/8/R5K1 w - - 0 1';
const freeze = '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1';

export const ORDINARY_CASES: ContinuationCase[] = [
  { name: 'full history', setup: {}, actions: ['e2-e4', 'e7-e5', 'Ng1-f3', 'Nb8-c6', 'Bf1-c4', 'Ng8-f6', 'd2-d3', 'Bf8-c5', 'Nb1-c3', 'd7-d6', 'Bc1-e3', 'Bc8-e6'] },
  { name: 'Beast chain', setup: { fen: 'k7/8/8/4r3/3p4/4S3/8/4K3 w - - 0 1' }, actions: ['Se3xd4xe5'] },
  { name: 'Haste and automatic pass', setup: { kings: 'Flame:Haste,none', fen: haste }, actions: ['Ra1-a4!H', '--'], followups: true, automaticPass: true },
  { name: 'Haste and explicit pass', setup: { kings: 'Flame:Haste,none', fen: haste }, actions: ['Ra1-a4!H', '--'] },
  { name: 'free Freeze', setup: { kings: 'Frost:Freeze,none', fen: freeze }, actions: ['!F:d5', 'a2-a3'], followups: true },
  { name: 'king capture', setup: { fen: '7k/8/8/8/8/8/8/K6R w - - 0 1' }, actions: ['Rh1xh8'], status: 'checkmate' },
  { name: 'checkmate', setup: { fen: '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1' }, actions: ['Qf7-g7'], status: 'checkmate' },
  { name: 'stalemate', setup: { fen: '7k/8/6Q1/8/8/8/8/K7 w - - 0 1' }, actions: ['Qg6-f7'], status: 'stalemate' },
  { name: 'draw50', setup: { fen: '7k/8/8/8/8/8/8/K6R w - - 99 1' }, actions: ['Rh1-h2'], status: 'draw50' },
  { name: 'repetition', setup: {}, actions: Array(2).fill(['Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8']).flat(), status: 'drawRepetition' },
];
export const CLASSIC_CASES: ContinuationCase[] = [
  { name: 'castling', setup: { classic: true, fen: '4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1' }, actions: ['O-O'] },
  { name: 'en passant', setup: { classic: true, fen: '7k/8/8/8/3pP3/8/8/K7 b - e3 0 3' }, actions: ['d4xe3'] },
];
export const CARD_CASES: ContinuationCase[] = [
  { name: 'ordered hand and Haste', setup: { hand: ['Haste', 'Freeze', 'Rally', 'MirrorB'], fen: haste }, actions: ['Ra1-a4!H', '--'], followups: true },
  { name: 'Rally', setup: { hand: ['Rally'], fen: '4k3/8/p7/8/8/2p5/8/RN2K3 w - - 0 1' }, actions: ['Ra1-a5!J', 'Nb1-d2'], followups: true },
  { name: 'Mirror B Freeze', setup: { kings: 'Spirit:Mercy,none', hand: ['MirrorB', 'Freeze', 'Haste', 'Rally'], fen: freeze }, actions: ['!F:d5!Z', '--'], followups: true },
];

export const PRE_ENGINE_RECOVERY_STATES = ['waiting', 'setup'].map(status => ({ status, state: null, engine: null }));
export const RECOVERY_RECEIPT = { id: 'recovery-turn-1', expectedRevision: 0, lan: 'e2-e4' };
