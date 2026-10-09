/** The design axes. A source record stays separate from a game rule. */
import type { Rules } from '../rules/rules';

export const DIMENSIONS = {
  resultTypes: ['P', 'N', 'B', 'R', 'Q', 'K', 'A', 'L', 'G', 'M', 'S', 'O', 'C', 'V', 'T'],
  excludedResults: ['king', 'pawn', 'guard', 'queen', 'ownType', 'secondBeast'],
  excludedTargets: ['king', 'pawn', 'guard', 'queen', 'ownType', 'secondBeast', 'frozen'],
  source: ['kingPower', 'card', 'both'],
  type: ['alwaysOn', 'mark', 'extraMove', 'specialMove', 'arrival', 'copy', 'draw', 'promotion', 'spawn'],
  rarity: ['common', 'legendary'],
  turnCost: ['move', 'freeThenMove', 'extraMove'],
  captures: ['may', 'must', 'never'],
  targets: ['own', 'enemy', 'either'],
  duration: ['instant', 'opponentNextTurn', 'always'],
  conditions: ['zone', 'tagTeam', 'turnN', 'capture', 'pieceLost', 'cardPlayed', 'materialBehind', 'ownLastMark'],
  isCondition: ['no', 'yes'],
  shackled: ['no', 'yes'],
  promotion: ['no', 'yes'],
  shotPattern: ['classic', 'plusDiag2', 'ring2', 'forward3', 'plusDiagFwd2', 'plusDiagFwd2Clear', 'fwd2NoBack', 'fwd2NoSide', 'far2', 'over2', 'over23'],
  secondCapture: ['same', 'may', 'must', 'never'],
  stopOnCapture: ['no', 'yes'],
  targetKind: ['piece', 'pawn', 'emptySquare', 'pile', 'mark', 'card'],
  movement: ['pawn', 'knight', 'bishop', 'rook', 'queen', 'step1', 'step2', 'forward', 'forwardBack', 'diagonal', 'straight', 'none'],
  capturePattern: ['same', 'pawn', 'shot', 'none', 'adjacent', 'chain', 'lob'],
  hop: ['none', 'any', 'friends', 'enemies', 'oneEnemyScreen'],
  shield: ['none', 'allButKing', 'neverTaken'],
  handicap: ['none', 'king', 'all', 'kingInChain'],
  control: ['none', 'swapFriend', 'swapKingHomeRank', 'pushFollow', 'pushStay', 'stepAfterCapture', 'queenInCapital'],
  trigger: ['none', 'selfRemoveNonPawn', 'selfRemoveAlways', 'chain', 'promoteLastRank'],
  zone: ['none', 'homeRank', 'pawnRank', 'ownHalf', 'lastRank', 'capital', 'kingNeighbour'],
} as const;

type Choice<K extends keyof typeof DIMENSIONS> = typeof DIMENSIONS[K][number];
export type Condition = Choice<'conditions'>;
export interface SharedDimensions {
  conditions: readonly Condition[];
  isCondition: Choice<'isCondition'>;
  shackled: Choice<'shackled'>;
  promotion: Choice<'promotion'>;
  fromMove: number | null;
}
export interface EffectDimensions extends SharedDimensions {
  source: Choice<'source'>;
  type: Choice<'type'>;
  rarity: Choice<'rarity'>;
  uses: number | null;
  turnCost: Choice<'turnCost'> | null;
  captures: Choice<'captures'> | null;
  targets: Choice<'targets'> | null;
  excludedTargets: readonly Choice<'excludedTargets'>[];
  excludedResults: readonly Choice<'excludedResults'>[];
  resultTypes: readonly Choice<'resultTypes'>[];
  secondCapture: Choice<'secondCapture'>;
  stopOnCapture: Choice<'stopOnCapture'>;
  targetKind: Choice<'targetKind'>;
  duration: Choice<'duration'> | null;
}
export interface PieceDimensions extends SharedDimensions {
  movement: Choice<'movement'>;
  shotPattern: Choice<'shotPattern'> | null;
  capturePattern: Choice<'capturePattern'>;
  hop: Choice<'hop'>;
  shield: Choice<'shield'>;
  handicap: Choice<'handicap'>;
  control: readonly Choice<'control'>[];
  trigger: readonly Choice<'trigger'>[];
  zone: readonly Choice<'zone'>[];
}
export type Approval = 'approved' | 'lab' | 'paused' | 'setAside' | 'idea' | 'unresolved' | 'rejected' | 'dropped';
interface RecordInfo {
  id: string;
  name: string;
  version: string;
  approval: Approval;
  shipped: boolean;
  tested: boolean;
  sources: readonly string[];
  /** Source text that the current matrix axes cannot express. Never discard it. */
  unmapped?: Readonly<Record<string, string>>;
}
export type DesignElement = RecordInfo & (
  | { kind: 'piece'; letter: string; dimensions: PieceDimensions; rules: Partial<Rules> }
  | { kind: 'kingPower' | 'card'; dimensions: EffectDimensions; rules: Partial<Rules> }
  | { kind: 'rule'; flag: keyof Rules; dimensions: { value: Rules[keyof Rules] } }
  | { kind: 'globalRule'; axis: keyof typeof GLOBAL_RULE_DIMENSIONS; dimensions: { value: string | number | boolean } }
);

export type RuleDimension<K extends keyof Rules = keyof Rules> = {
  allowed: readonly Rules[K][];
  default: Rules[K];
  /** Structured fields have a domain, rather than a finite list. */
  domain?: 'kingPair' | 'cardPair' | 'cardMoveMap';
};

/** Fixed choices from the reviewed source. Changes require a review of this table. */
export const RULE_DIMENSIONS = {
  archerChecks: { allowed: [false,true], default: true },
  beastChains: { allowed: [false,true], default: true },
  guardImmune: { allowed: [false,true], default: true },
  guardCaptures: { allowed: ["none","pawns","any"], default: "none" },
  guardStep: { allowed: [1,2], default: 1 },
  guardDoubleFirst: { allowed: ["off","slide","leap"], default: "off" },
  guardNoSecondRank: { allowed: [false,true], default: false },
  guardNoCapital: { allowed: [false,true], default: false },
  guardReserve: { allowed: ["off","rank1","rank12"], default: "off" },
  capitalSanctuary: { allowed: [false,true], default: false },
  capitalNoCapture: { allowed: [false,true], default: false },
  guardCapitalStep: { allowed: [false,true], default: false },
  pawnCapitalCapture: { allowed: [false,true], default: false },
  guardCaptureLimit: { allowed: [0,1], default: 0 },
  archerMove: { allowed: ["ortho","any","fwdBack"], default: "any" },
  archerShots: { allowed: ["classic","plusDiag2","ring2","forward3","plusDiagFwd2","plusDiagFwd2Clear","fwd2NoBack","fwd2NoSide"], default: "plusDiagFwd2" },
  beastMove: { allowed: ["forward","any","diagFwdBack"], default: "any" },
  beastCapture: { allowed: ["adjacent","diagForward","diagonal"], default: "adjacent" },
  beastCaptureForward: { allowed: [false,true], default: true },
  maesterLongSwap: { allowed: [false,true], default: true },
  maesterKingSwapAnywhere: { allowed: [false,true], default: false },
  maesterSwapAny: { allowed: [false,true], default: false },
  maesterSwapEnemy: { allowed: [false,true], default: false },
  maesterStep: { allowed: [1,2], default: 1 },
  paladinKamikaze: { allowed: ["always","nonPawn","never"], default: "nonPawn" },
  paladinChecks: { allowed: [false,true], default: false },
  deathTouchMoves: { allowed: [false,true], default: false },
  paladinReturn: { allowed: [false,true], default: false },
  paladinJumpsFriends: { allowed: [false,true], default: true },
  paladinBlockedByEnemies: { allowed: [false,true], default: true },
  secondPlayerDoubleFirstTurn: { allowed: [false,true], default: false },
  ogreHop: { allowed: [false,true], default: false },
  ogreStep2: { allowed: [false,true], default: false },
  ogreMode: { allowed: ["repel","push"], default: "push" },
  ogreNoCapture: { allowed: [false,true], default: false },
  ogreShoveFriends: { allowed: ["both","enemies","friends"], default: "both" },
  strikeMode: { allowed: ["move","capture"], default: "move" },
  strikeCaptures: { allowed: [false,true], default: true },
  freezeUses: { allowed: [0,1,2,3,4,5,6], default: 2 },
  iceWallUses: { allowed: [0,1,2,3,4,5,6], default: 2 },
  hasteSecond: { allowed: ["any","quiet"], default: "any" },
  hasteCaptures: { allowed: [false,true], default: true },
  hasteApart: { allowed: [false,true], default: false },
  hasteNoThreat: { allowed: [false,true], default: false },
  hasteNoForward: { allowed: [false,true], default: false },
  hasteNoCheck: { allowed: [false,true], default: false },
  markFree: { allowed: [false,true], default: false },
  freezeQuiet: { allowed: [false,true], default: false },
  markTurns: { allowed: [1,2], default: 1 },
  mercyCaptures: { allowed: [false,true], default: false },
  mercyAura: { allowed: [false,true], default: false },
  strikePawns: { allowed: [false,true], default: true },
  sacrificeBehind: { allowed: [false,true], default: false },
  holyLightTakesPawns: { allowed: [false,true], default: false },
  holyLightAura: { allowed: [false,true], default: false },
  darknessKeep: { allowed: [false,true], default: false },
  holyLightKnights: { allowed: [false,true], default: false },
  holyLightShelter: { allowed: [false,true], default: false },
  holyLightShelterOrtho: { allowed: [false,true], default: false },
  mercyAuraOrtho: { allowed: [false,true], default: false },
  mercyAuraPawns: { allowed: [false,true], default: false },
  mercyAuraPawnsTake: { allowed: [false,true], default: false },
  mercyTakesPawns: { allowed: [false,true], default: false },
  mercyNoJump: { allowed: [false,true], default: false },
  darknessMoves: { allowed: [false,true], default: false },
  darknessTakeAhead: { allowed: [false,true], default: false },
  darknessStepDiag: { allowed: [false,true], default: false },
  darknessShelter: { allowed: [false,true], default: false },
  darknessShelterPawnsTake: { allowed: [false,true], default: false },
  darknessPawnArmor: { allowed: [false,true], default: false },
  darknessAuraPawns: { allowed: [false,true], default: false },
  darknessKingStep2: { allowed: [false,true], default: false },
  darknessKingStepSafe: { allowed: [false,true], default: false },
  darknessKingStepTakes: { allowed: [false,true], default: false },
  deathTouchReach: { allowed: [false,true], default: false },
  deathTouchReachOrtho: { allowed: [false,true], default: false },
  deathTouchReachNoBack: { allowed: [false,true], default: false },
  deathTouchReachForwardBack: { allowed: [false,true], default: false },
  deathTouchReachPieces: { allowed: [false,true], default: false },
  strikeUses: { allowed: [0,1,2,3,4,5,6], default: 1 },
  hasteUses: { allowed: [0,1,2,3,4,5,6], default: 1 },
  flightUses: { allowed: [0,1,2,3,4,5,6], default: 1 },
  sacrificeUses: { allowed: [0,1,2,3,4,5,6], default: 1 },
  marchUses: { allowed: [0,1,2,3,4,5,6], default: 3 },
  leapUses: { allowed: [0,1,2,3,4,5,6], default: 3 },
  reaverStep: { allowed: ["any","ortho"], default: "ortho" },
  catapultCapture: { allowed: ["stay","land"], default: "stay" },
  kings: { allowed: [], default: [null,null], domain: "kingPair" },
  hands: { allowed: [], default: [[],[]], domain: "cardPair" },
  piles: { allowed: [], default: [[],[]], domain: "cardPair" },
  fromMove: { allowed: [], default: {}, domain: "cardMoveMap" },
  bishopsOppositeColours: { allowed: [false,true], default: true },
  promotionSet: { allowed: ["anyNonKing","standard","anyNonKingNoFairy","anyNonKingNoGuard"], default: "standard" },
  fiftyMove: { allowed: [false,true], default: true },
  threefold: { allowed: [false,true], default: true },
  insufficientMaterial: { allowed: [false,true], default: true },

} as const satisfies { [K in keyof Rules]: RuleDimension<K> };

export const GLOBAL_RULE_DIMENSIONS = {
  pool: ['QORRBBNNAAGMMS', 'QORRBBNNAAGMMSS', 'QOLRRBBNNAAGMMS'],
  guardStart: ['random', 'nextKing', 'reserveAny'],
  guardLimit: [1, 2],
  beastLimit: ['oneInArmy', 'oneAlways', 'extraByArrival'],
  castling: [false], enPassant: [false],
  handSize: [0, 2, 3, 4, 6],
  check: ['chess'], kingSafety: ['required'],
  pieceBalance: ['sixCriteria', 'criterion4b'],
  cardDeal: ['undecided'], countdown: ['undecided'], arrange: ['undecided'],
  preset: ['2017', '2021', 'default'],
} as const;

export function validateElement(element: DesignElement): string[] {
  const errors: string[] = [];
  const dimensions = element.dimensions as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(dimensions)) {
    if (!(key in DIMENSIONS) && !['uses', 'fromMove', 'value'].includes(key)) errors.push(`${element.id}: unknown dimension ${key}`);
    if (key in DIMENSIONS) {
      const allowed = DIMENSIONS[key as keyof typeof DIMENSIONS] as readonly unknown[];
      for (const v of Array.isArray(value) ? value : [value]) {
        if (v !== null && !allowed.includes(v)) errors.push(`${element.id}: ${key}=${String(v)} is outside the matrix`);
      }
    }
  }
  if (element.kind === 'globalRule') {
    if (!(GLOBAL_RULE_DIMENSIONS[element.axis] as readonly unknown[]).includes(element.dimensions.value)) errors.push(`${element.id}: ${element.axis}=${String(element.dimensions.value)} is outside the rule axis`);
  } else if (element.kind === 'rule') {
    const spec = RULE_DIMENSIONS[element.flag];
    if (!('domain' in spec) && !(spec.allowed as readonly unknown[]).includes(element.dimensions.value)) errors.push(`${element.id}: ${element.flag}=${String(element.dimensions.value)} is outside the rule axis`);
  } else {
    const required = ['conditions', 'isCondition', 'shackled', 'promotion', 'fromMove', ...(element.kind === 'piece'
      ? ['movement', 'shotPattern', 'capturePattern', 'hop', 'shield', 'handicap', 'control', 'trigger', 'zone']
      : ['source', 'type', 'rarity', 'uses', 'turnCost', 'captures', 'targets', 'excludedTargets', 'excludedResults', 'resultTypes', 'duration', 'secondCapture', 'stopOnCapture', 'targetKind'])];
    for (const key of required) if (!(key in dimensions)) errors.push(`${element.id}: missing ${key}`);
    const d = element.dimensions;
    if (d.fromMove !== null && (!Number.isSafeInteger(d.fromMove) || d.fromMove < 1)) errors.push(`${element.id}: fromMove needs a positive whole move`);
    if (d.fromMove !== null && element.kind === 'kingPower' && element.dimensions.type === 'alwaysOn') errors.push(`${element.id}: an always-on power cannot have fromMove`);
    if (element.kind !== 'piece' && element.dimensions.uses !== null && (!Number.isSafeInteger(element.dimensions.uses) || element.dimensions.uses < 1)) errors.push(`${element.id}: uses needs a positive whole count or null for always on`);
    if (element.kind === 'card' && element.dimensions.uses !== 1) errors.push(`${element.id}: every card has one use`);
  }
  if ('rules' in element) for (const [key, value] of Object.entries(element.rules)) {
    const dimension = RULE_DIMENSIONS[key as keyof Rules];
    if (!dimension) errors.push(`${element.id}: unknown rule ${key}`);
    else if (!('domain' in dimension) && !(dimension.allowed as readonly unknown[]).includes(value)) errors.push(`${element.id}: ${key}=${String(value)} is outside the code rule axis`);
  }
  for (const [key, text] of Object.entries(element.unmapped ?? {})) errors.push(`${element.id}: ${key} does not fit: ${text}`);
  return errors;
}
