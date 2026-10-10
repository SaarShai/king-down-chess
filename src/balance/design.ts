/** Reviewed records and checks. Do not refresh the pins without a source review. */
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { ALL_CARDS, BUILT, DEFAULT_RULES, KINGS, POWERS_BALANCED, RULES_2017, RULES_2021 } from '../rules/rules';
import { POOL } from '../rules/setup';
import { VALUES } from '../ai/eval';
import type { Rules } from '../rules/rules';
import { DIMENSIONS, RULE_DIMENSIONS, validateElement } from './schema';
import type { Approval, DesignElement, EffectDimensions, PieceDimensions } from './schema';

export interface Finding {
  code: string;
  severity: 'error' | 'warning';
  source: string;
  approval: Approval;
  message: string;
}
export interface Workbook {
  source: string;
  sha256: string;
  sheets: { name: string; cells: { cell: string; value: unknown }[] }[];
}
const workbookSchema = z.object({
  source: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sheets: z.array(z.object({ name: z.string().min(1), cells: z.array(z.object({ cell: z.string().regex(/^[A-Z]+[1-9]\d*$/), value: z.union([z.string(), z.number(), z.boolean(), z.null()]) })) })),
});
export function parseWorkbook(value: unknown): Workbook { return workbookSchema.parse(value); }

export interface RecordedVersion {
  sheet: string;
  cell: string;
  name: string;
  version: string;
  status: string;
  text: string;
  notes: string;
  source: string;
  element: DesignElement | null;
}
const SHARED = { conditions: [], isCondition: 'no', shackled: 'no', promotion: 'no', fromMove: null } as const;
const EFFECT: EffectDimensions = { ...SHARED, source: 'card', type: 'specialMove', rarity: 'common', uses: 1, turnCost: 'move', captures: 'never', targets: 'own', excludedTargets: ['king'], duration: 'instant', excludedResults: [], resultTypes: [], secondCapture: 'same', stopOnCapture: 'no', targetKind: 'piece' };
const PIECE: PieceDimensions = { ...SHARED, deployment: 'setup', movement: 'step1', shotPattern: null, capturePattern: 'same', hop: 'none', shield: 'none', handicap: 'none', control: [], trigger: [], zone: [] };
const PIECE_RULE_FLAGS: Readonly<Record<string, readonly (keyof Rules)[]>> = {
  P: ['promotionSet', 'pawnCapitalCapture'], N: [], B: [], R: [], Q: [], K: [],
  A: ['archerChecks', 'archerMove', 'archerShots'],
  L: ['paladinKamikaze', 'paladinChecks', 'paladinReturn', 'paladinJumpsFriends', 'paladinBlockedByEnemies'],
  G: ['guardNextToKing', 'guardImmune', 'guardCaptures', 'guardStep', 'guardDoubleFirst', 'guardNoSecondRank', 'guardNoCapital', 'guardReserve', 'guardCaptureLimit', 'guardCapitalStep'],
  M: ['maesterLongSwap', 'maesterKingSwapAnywhere', 'maesterSwapAny', 'maesterSwapEnemy', 'maesterStep'],
  S: ['beastChains', 'beastMove', 'beastCapture', 'beastCaptureForward'],
  O: ['ogreMode', 'ogreHop', 'ogreStep2', 'ogreNoCapture', 'ogreShoveFriends'], C: ['catapultCapture'], V: ['reaverStep'], T: [],
};
function pieceRecord(name: string, letter: string, dimensions: Partial<PieceDimensions>, approval: Approval = 'approved'): DesignElement {
  return { id: `piece:${letter}:shipped`, name, version: 'shipped', kind: 'piece', letter, approval,
    shipped: !['paused', 'rejected'].includes(approval), tested: false, sources: ['docs/RULES.md §3', 'docs/MATRIX.md A'], dimensions: { ...PIECE, ...dimensions }, rules: Object.fromEntries(PIECE_RULE_FLAGS[letter].map(key => [key, DEFAULT_RULES[key]])) };
}
function effectRecord(name: string, kind: 'kingPower' | 'card', dimensions: Partial<EffectDimensions>): DesignElement {
  const precise: Partial<EffectDimensions> = name === 'Sacrifice'
    ? { targetKind: 'pawn', excludedTargets: [], excludedResults: ['king', 'pawn', 'guard'] }
    : name === 'Morph' || name === 'MorphB'
      ? { excludedTargets: ['king', 'pawn', 'frozen'], excludedResults: ['king', 'pawn', 'ownType', 'secondBeast', 'secondGuard', ...(name === 'MorphB' ? ['queen' as const] : [])], resultTypes: name === 'Morph' ? ['Q', 'O', 'L', 'R', 'B', 'N', 'A', 'G', 'M', 'S'] : ['O', 'L', 'R', 'B', 'N', 'A', 'G', 'M', 'S'] }
      : name === 'MorphP' ? { targetKind: 'pawn', resultTypes: ['N', 'B'] }
      : name.startsWith('Growth') || name.startsWith('Mirror') || name === 'Rescue' ? { excludedTargets: [] } : {};
  return { id: `${kind}:${name}:shipped`, name, version: 'shipped', kind, approval: kind === 'kingPower' ? 'approved' : 'lab',
    shipped: kind === 'kingPower', tested: false, sources: ['docs/RULES.md §4–5', 'docs/MATRIX.md C.2'],
    dimensions: { ...EFFECT, ...dimensions, ...(name === 'RageB' ? { secondCapture: 'must' as const } : {}), ...(name.startsWith('Spawn') ? { targetKind: 'emptySquare' as const } : name.startsWith('Growth') ? { targetKind: 'pile' as const } : name === 'Rescue' ? { targetKind: 'mark' as const } : name.startsWith('Mirror') ? { targetKind: 'card' as const } : {}), ...precise, source: kind, uses: kind === 'card' ? 1 : dimensions.uses ?? null }, rules: kind === 'kingPower' ? { ...POWERS_BALANCED } : {} };
}

/** Original step version from the archived reserve study, not a current engine piece. */
const ARCHIVED_SQUIRE: DesignElement = {
  id: 'piece:E:archived-step', name: 'Squire', version: 'Base', kind: 'piece', letter: 'E',
  approval: 'dropped', shipped: false, tested: true,
  sources: ['docs/MATRIX.md A.3', 'docs/research/squire-drop-2026-09-24.md', 'docs/research/squire-depth3-2026-09-24.md', 'docs/research/squire-where-2026-09-24.md'],
  dimensions: { ...PIECE, deployment: 'reserveOnceAnyEmptySquare' }, rules: {},
};

export const SHIPPED_ELEMENTS: readonly DesignElement[] = [
  pieceRecord('Pawn', 'P', { movement: 'pawn', capturePattern: 'pawn', conditions: ['zone'], promotion: 'yes', trigger: ['promoteLastRank'], zone: ['pawnRank', 'lastRank'] }),
  pieceRecord('Knight', 'N', { movement: 'knight', hop: 'any' }),
  pieceRecord('Bishop', 'B', { movement: 'bishop' }),
  pieceRecord('Rook', 'R', { movement: 'rook' }),
  pieceRecord('Queen', 'Q', { movement: 'queen' }),
  pieceRecord('King', 'K', { shield: 'neverTaken' }),
  pieceRecord('Archer', 'A', { capturePattern: 'shot', shotPattern: 'far2' }),
  pieceRecord('Paladin', 'L', { movement: 'queen', hop: 'friends', handicap: 'king', trigger: ['selfRemoveNonPawn'], conditions: ['capture'] }),
  pieceRecord('Guard', 'G', { capturePattern: 'none', shield: 'allButKing', handicap: 'all' }),
  pieceRecord('Maester', 'M', { control: ['swapFriend', 'swapKingHomeRank'], zone: ['homeRank'], conditions: ['zone', 'tagTeam'] }),
  pieceRecord('Beast', 'S', { capturePattern: 'chain', handicap: 'kingInChain', trigger: ['chain'], conditions: ['capture'] }),
  pieceRecord('Ogre', 'O', { control: ['pushFollow'] }),
  pieceRecord('Catapult', 'C', { movement: 'rook', capturePattern: 'lob', hop: 'oneEnemyScreen' }, 'paused'),
  pieceRecord('Reaver', 'V', { movement: 'knight', hop: 'any', control: ['stepAfterCapture'], conditions: ['capture'] }, 'paused'),
  pieceRecord('Templar', 'T', { control: ['queenInCapital'], zone: ['capital'], conditions: ['zone'] }, 'rejected'),
  effectRecord("Freeze", 'kingPower', {"type":"mark","turnCost":"freeThenMove","targets":"enemy","duration":"opponentNextTurn","uses":1}),
  effectRecord("Freeze", 'card', {"type":"mark","turnCost":"freeThenMove","targets":"enemy","duration":"opponentNextTurn","uses":1}),
  effectRecord("IceWall", 'kingPower', {"type":"mark","turnCost":"freeThenMove","duration":"opponentNextTurn","uses":2}),
  effectRecord("IceWall", 'card', {"type":"mark","turnCost":"freeThenMove","duration":"opponentNextTurn","uses":2}),
  effectRecord("Strike", 'kingPower', {"excludedTargets":["king","pawn"],"uses":1}),
  effectRecord("Strike", 'card', {"excludedTargets":["king","pawn"],"uses":1}),
  effectRecord("Haste", 'kingPower', {"type":"extraMove","turnCost":"extraMove","excludedTargets":[],"uses":1}),
  effectRecord("Haste", 'card', {"type":"extraMove","turnCost":"extraMove","excludedTargets":[],"uses":1}),
  effectRecord("Flight", 'kingPower', {"conditions":["zone"],"uses":1}),
  effectRecord("Flight", 'card', {"conditions":["zone"],"uses":1}),
  effectRecord("Sacrifice", 'kingPower', {"type":"arrival","conditions":["pieceLost"],"excludedTargets":["king","guard","pawn"],"promotion":"yes","uses":1}),
  effectRecord("Sacrifice", 'card', {"type":"arrival","conditions":["pieceLost"],"excludedTargets":["king","guard","pawn"],"promotion":"yes","uses":1}),
  effectRecord("March", 'kingPower', {"type":"alwaysOn","turnCost":null,"duration":"always","uses":null}),
  effectRecord("March", 'card', {"type":"specialMove","turnCost":"move","duration":"instant","uses":null}),
  effectRecord("Leap", 'kingPower', {"captures":"may","uses":3}),
  effectRecord("Leap", 'card', {"captures":"may","uses":3}),
  effectRecord("HolyLight", 'kingPower', {"type":"alwaysOn","turnCost":null,"captures":"may","excludedTargets":[],"duration":"always","conditions":["tagTeam"]}),
  effectRecord("Mercy", 'kingPower', {"type":"alwaysOn","turnCost":null,"captures":"may","excludedTargets":[],"duration":"always","conditions":["tagTeam"]}),
  effectRecord("DeathTouch", 'kingPower', {"type":"alwaysOn","turnCost":null,"captures":"must","targets":"enemy","duration":"always","conditions":["tagTeam"]}),
  effectRecord("Darkness", 'kingPower', {"type":"alwaysOn","turnCost":null,"captures":"may","excludedTargets":[],"duration":"always"}),
  effectRecord("Mimic", 'card', {"excludedTargets":["king","pawn"]}),
  effectRecord("Vault", 'card', {"captures":"may"}),
  effectRecord("Curse", 'card', {"targets":"enemy"}),
  effectRecord("SkyLift", 'card', {"excludedTargets":["king","pawn","ownType"]}),
  effectRecord("Salvation", 'card', {"type":"arrival","conditions":["pieceLost","zone"],"excludedTargets":["king","pawn","guard"]}),
  effectRecord("Rage", 'card', {"type":"extraMove","rarity":"legendary","turnCost":"extraMove","captures":"may","excludedTargets":[]}),
  effectRecord("RageB", 'card', {"type":"extraMove","turnCost":"extraMove","captures":"may","excludedTargets":[],"conditions":["capture"]}),
  effectRecord("Mirror", 'card', {"type":"copy","turnCost":"inherited","captures":"inherited","targets":"inherited","duration":"inherited","conditions":["cardPlayed"]}),
  effectRecord("MirrorB", 'card', {"type":"copy","turnCost":"inherited","captures":"inherited","targets":"inherited","duration":"inherited","conditions":["cardPlayed"]}),
  effectRecord("Firewall", 'card', {"type":"mark","turnCost":"freeThenMove","excludedTargets":[],"duration":"opponentNextTurn"}),
  effectRecord("FirewallB", 'card', {"targets":"either","conditions":["tagTeam"]}),
  effectRecord("EarthQuake", 'card', {"targets":"either"}),
  effectRecord("EarthQuakeB", 'card', {"targets":"either","conditions":["tagTeam"]}),
  effectRecord("Burn", 'card', {"captures":"must","excludedTargets":["king","pawn"],"conditions":["zone"]}),
  effectRecord("FireStarter", 'card', {"captures":"must","excludedTargets":["king","pawn"],"conditions":["zone"]}),
  effectRecord("Control", 'card', {"captures":"may","excludedTargets":["king","pawn","ownType"],"conditions":["tagTeam"]}),
  effectRecord("Rescue", 'card', {"type":"mark","turnCost":"freeThenMove","duration":"renewOpponentTurn","conditions":["ownLastMark"]}),
  effectRecord("Growth", 'card', {"type":"draw"}),
  effectRecord("GrowthB", 'card', {"type":"draw","turnCost":"freeThenMove"}),
  effectRecord("Rally", 'card', {"type":"extraMove","turnCost":"extraMove","excludedTargets":[]}),
  effectRecord("Morph", 'card', {"type":"promotion","promotion":"yes","excludedTargets":["king","pawn","ownType","secondBeast","frozen"]}),
  effectRecord("MorphB", 'card', {"type":"promotion","promotion":"yes","excludedTargets":["king","pawn","queen","ownType","secondBeast","frozen"]}),
  effectRecord("Spawn", 'card', {"type":"spawn","excludedTargets":[],"conditions":["zone"]}),
  effectRecord("SpawnK", 'card', {"type":"spawn","excludedTargets":[],"conditions":["tagTeam"]}),
  effectRecord("Spawn2", 'card', {"type":"spawn","excludedTargets":[],"conditions":["zone"]}),
  effectRecord("SpawnK2", 'card', {"type":"spawn","excludedTargets":[],"conditions":["tagTeam"]}),
  effectRecord("MorphP", 'card', {"type":"promotion","promotion":"yes","excludedTargets":["frozen"]}),
  effectRecord("MorphS", 'card', {"excludedTargets":["king","pawn","ownType","frozen"]}),
];

export const DOCUMENT_PINS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "docs/MATRIX.md": {
    "# King Down — ability matrix (started 2026-09-14)": "d4f37ecad6355080b92394158548098b3d27cff01e414294d20129f0430c388f",
    "## A. Pieces": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "### A.0 Basic patterns (context for the grid below)": "5fe1e37adb5ba4a85dfd614f4527a49ebac588e9371b139daffbe4f20e05296f",
    "### A.1 Abilities × pieces": "40881fb47f579836a7ccaa7ac50b3f99424f97c66b891acbffc85023572fd991",
    "### A.2 Where each ability lives in the engine (`src/rules/engine.ts`)": "3784616072342a5769c82533dd88c73a4de23ea71fae47c298d0e591acc4e03a",
    "### A.3 Pieces outside the random pool (status 2026-10-06)": "414993cf78e766de18f591a1fcc0ee13352ad02913d9fe9911419ad482b25f84",
    "## B. Board": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "### B.1 Zones × rules": "2ce33e2e0c5420712acdb71fa0841313e03a965796e53699be1b7e40d86011ca",
    "### B.2 Capital — the four centre tiles": "0d5521ae2badcd1038a347de45e13819deb3577731160d7550801db4c9b09510",
    "### B.3 Code rule axes": "ac0425d19821baf94e7237c38bdc6d58fafee5cb33d98b046c5d8c13744f2bf4",
    "## C. King powers and cards": "7f6fb3bcd760ffc3fdead81a41fd3de0e6328892f8976aa7ed4a83339d072e22",
    "### C.1 Schema: the properties of every power or card": "7a92f25f01195381c3a41c4de457bd0fa59c6a8f07d520914df7fc03cbf2441a",
    "### C.2 Each power and card": "7fb382574356f6e9b2a9017f86b2b1235a6433dc9175c78ec597b17d5ab1ec1f",
    "### C.3 Ideas: the 2014 cards not built (2026-10-06)": "d618936ad8544902178a0366b3aa6df0bbbc8f20d1630df26a6b711fcbcd3f7c",
    "## D. Conditions, shackles and promotion (owner, 2026-10-06)": "4e318d16fb95d2dae01191f9a84de318137d3dcdbcfe1f1c18310f3f22e193b7",
    "### D.1 Conditions (triggers)": "3cb3825280e00cb250c69555b827a863262f5e337c9c0efbe1acb75ae4356578",
    "### D.2 Shackled: nerfed until a condition": "2c027057cd0f9a0da859a4eb440661e1984d39aa9c77fa339817c1825c06667a",
    "### D.3 Promotion: a new type on a condition": "3a3f2d7fbc4a5d58030e142481ebf8df6e7dd435ed6d6511669890d5a87f3404",
    "### D.4 Powers and cards with a condition": "f44f5ff16464094f4fab23ab04f0bc8b2109ff0c3b3a041ff8ebccc2c00fa6d3",
    "### D.5 Spawn: a new piece comes onto the board (owner, 2026-10-06)": "320c6dda4644ed928709d8dd6864badad78bdb118f380cd6b693aedcb4bc859a",
    "## Workshop (build 1a, 2026-10-06)": "991e8ade6d92b1eb72e507fece97468d434e009b17a3929d8e064c4fff14849d"
  },
  "docs/RULES.md": {
    "# King Down Chess — current rules and dated decisions": "f905b6f0547a30a4e2b4afe44d947b721150eac69ec17dc00a155d1322cbc4db",
    "## 1. Base rules": "e5ec441e544e9912eacd2a9261ef44f1a2fb9eecb43ae19cf8a64976ee1c39b6",
    "## 2. Setup (Chess960-style)": "30867c09e79cc4aee72964d8e1a3dd2e6063a63684ea9fa1e8e28c36e9ec5d07",
    "## 3. Pieces": "8bbfdf85044c43e9c2a6012506c950aee12dcabe02c1123ce0badf0ca15eebae",
    "## 4. Kings' powers mode (all twelve built; the balanced readings are the official rules)": "0e170e2507cade103aaada4bfd30d9bb00aa8782a1a5a736d357ca3cf0c9cfb1",
    "## 5. Card / spell effects (documented, not yet enabled)": "de5b83ad092b776cd9f8ce92f6b2316ede57229bff0bef4c1821a630145abfbd",
    "## 6. Decisions (2026-09-13, chosen for balance and fun)": "fd67475729af37c7501d1a41c790ff86b20989e1da96ca4607b0d6d3f4a1190f",
    "### First measured evidence (2026-09-13, provisional) — superseded by §6.8": "17ec3107221657cc6acd94c806ecf0729f4131e48711471efaf6ac6ee7406524"
  }
};

const RULE_TYPES: Readonly<Record<string, string>> = {
  "archerChecks": "boolean",
  "beastChains": "boolean",
  "guardImmune": "boolean",
  "guardCaptures": "GuardCaptures",
  "guardStep": "1 | 2",
  "guardDoubleFirst": "GuardDoubleFirst",
  "guardNoSecondRank": "boolean",
  "guardNoCapital": "boolean",
  "guardNextToKing": "boolean",
  "guardReserve": "GuardReserve",
  "capitalSanctuary": "boolean",
  "capitalNoCapture": "boolean",
  "guardCapitalStep": "boolean",
  "pawnCapitalCapture": "boolean",
  "guardCaptureLimit": "0 | 1",
  "archerMove": "ArcherMove",
  "archerShots": "ArcherShots",
  "beastMove": "BeastMove",
  "beastCapture": "BeastCapture",
  "beastCaptureForward": "boolean",
  "maesterLongSwap": "boolean",
  "maesterKingSwapAnywhere": "boolean",
  "maesterSwapAny": "boolean",
  "maesterSwapEnemy": "boolean",
  "maesterStep": "1 | 2",
  "paladinKamikaze": "PaladinKamikaze",
  "paladinChecks": "boolean",
  "deathTouchMoves": "boolean",
  "paladinReturn": "boolean",
  "paladinJumpsFriends": "boolean",
  "paladinBlockedByEnemies": "boolean",
  "secondPlayerDoubleFirstTurn": "boolean",
  "ogreHop": "boolean",
  "ogreStep2": "boolean",
  "ogreMode": "OgreMode",
  "ogreNoCapture": "boolean",
  "ogreShoveFriends": "OgreShoveFriends",
  "strikeMode": "StrikeMode",
  "strikeCaptures": "boolean",
  "freezeUses": "number",
  "iceWallUses": "number",
  "hasteSecond": "HasteSecond",
  "hasteCaptures": "boolean",
  "hasteApart": "boolean",
  "hasteNoThreat": "boolean",
  "hasteNoForward": "boolean",
  "hasteNoCheck": "boolean",
  "markFree": "boolean",
  "freezeQuiet": "boolean",
  "markTurns": "1 | 2",
  "mercyCaptures": "boolean",
  "mercyAura": "boolean",
  "strikePawns": "boolean",
  "sacrificeBehind": "boolean",
  "holyLightTakesPawns": "boolean",
  "holyLightAura": "boolean",
  "holyLightShelter": "boolean",
  "holyLightShelterOrtho": "boolean",
  "mercyAuraOrtho": "boolean",
  "mercyAuraPawns": "boolean",
  "mercyAuraPawnsTake": "boolean",
  "mercyTakesPawns": "boolean",
  "mercyNoJump": "boolean",
  "holyLightKnights": "boolean",
  "darknessMoves": "boolean",
  "darknessKeep": "boolean",
  "darknessTakeAhead": "boolean",
  "darknessStepDiag": "boolean",
  "darknessShelter": "boolean",
  "darknessShelterPawnsTake": "boolean",
  "darknessPawnArmor": "boolean",
  "darknessAuraPawns": "boolean",
  "darknessKingStep2": "boolean",
  "darknessKingStepSafe": "boolean",
  "darknessKingStepTakes": "boolean",
  "deathTouchReach": "boolean",
  "deathTouchReachOrtho": "boolean",
  "deathTouchReachNoBack": "boolean",
  "deathTouchReachForwardBack": "boolean",
  "deathTouchReachPieces": "boolean",
  "strikeUses": "number",
  "hasteUses": "number",
  "flightUses": "number",
  "sacrificeUses": "number",
  "marchUses": "number",
  "leapUses": "number",
  "reaverStep": "ReaverStep",
  "catapultCapture": "CatapultCapture",
  "kings": "readonly [KingChoice | null, KingChoice | null]",
  "hands": "readonly [readonly CardName[], readonly CardName[]]",
  "piles": "readonly [readonly CardName[], readonly CardName[]]",
  "fromMove": "Readonly<Partial<Record<CardName, number>>>",
  "bishopsOppositeColours": "boolean",
  "promotionSet": "PromotionSet",
  "fiftyMove": "boolean",
  "threefold": "boolean",
  "insufficientMaterial": "boolean"
};
const CLI_CHOICES: Readonly<Record<string, readonly (string | number)[]>> = {"promotionSet":["anyNonKing","standard","anyNonKingNoFairy","anyNonKingNoGuard"],"guardCaptures":["none","pawns","any"],"guardStep":[1,2],"guardDoubleFirst":["off","slide","leap"],"guardReserve":["off","rank1","rank12","any"],"guardCaptureLimit":[0,1],"archerMove":["ortho","any","fwdBack"],"archerShots":["classic","plusDiag2","ring2","forward3","plusDiagFwd2","plusDiagFwd2Clear","fwd2NoBack","fwd2NoSide","far2","over2","nearOver2","fwdNearOver2"],"beastMove":["forward","any","diagFwdBack"],"beastCapture":["adjacent","diagForward","diagonal"],"maesterStep":[1,2],"paladinKamikaze":["always","nonPawn","never"],"ogreMode":["repel","push"],"ogreShoveFriends":["both","enemies","friends"],"strikeMode":["move","capture"],"freezeUses":[0,1,2,3,4,5,6],"iceWallUses":[0,1,2,3,4,5,6],"hasteSecond":["any","quiet"],"markTurns":[1,2],"strikeUses":[0,1,2,3,4,5,6],"hasteUses":[0,1,2,3,4,5,6],"flightUses":[0,1,2,3,4,5,6],"sacrificeUses":[0,1,2,3,4,5,6],"marchUses":[0,1,2,3,4,5,6],"leapUses":[0,1,2,3,4,5,6],"reaverStep":["any","ortho"],"catapultCapture":["stay","land"]};
const SOURCE_TYPE_ALIASES: Readonly<Record<string, string>> = {"PromotionSet":"'anyNonKing' | 'standard' | 'anyNonKingNoFairy' | 'anyNonKingNoGuard'","ArcherMove":"'ortho' | 'any' | 'fwdBack'","ArcherShots":"'classic' | 'plusDiag2' | 'ring2' | 'forward3' | 'plusDiagFwd2' | 'plusDiagFwd2Clear' | 'fwd2NoBack' | 'fwd2NoSide' | 'far2' | 'over2' | 'nearOver2' | 'fwdNearOver2'","GuardCaptures":"'none' | 'pawns' | 'any'","GuardDoubleFirst":"'off' | 'slide' | 'leap'","GuardReserve":"'off' | 'rank1' | 'rank12' | 'any'","BeastMove":"'forward' | 'any' | 'diagFwdBack'","BeastCapture":"'adjacent' | 'diagForward' | 'diagonal'","PaladinKamikaze":"'always' | 'nonPawn' | 'never'","OgreMode":"'repel' | 'push'","OgreShoveFriends":"'both' | 'enemies' | 'friends'","ReaverStep":"'any' | 'ortho'","CatapultCapture":"'stay' | 'land'","StrikeMode":"'move' | 'capture'","HasteSecond":"'any' | 'quiet'","KingName":"'Frost' | 'Flame' | 'Stratus' | 'Mud' | 'Spirit' | 'Shadow'","PowerName":"| 'Freeze' | 'IceWall' | 'Strike' | 'Haste' | 'Flight' | 'Sacrifice' | 'March' | 'Leap' | 'HolyLight' | 'Mercy' | 'DeathTouch' | 'Darkness'","CardName":"PowerName | 'Mimic' | 'Vault' | 'Curse' | 'SkyLift' | 'Salvation' | 'Rage' | 'RageB' | 'Mirror' | 'MirrorB' | 'Firewall' | 'FirewallB' | 'EarthQuake' | 'EarthQuakeB' | 'Burn' | 'FireStarter' | 'Control' | 'Rescue' | 'Growth' | 'GrowthB' | 'Rally' | 'Morph' | 'MorphB' | 'Spawn' | 'SpawnK' | 'Spawn2' | 'SpawnK2' | 'MorphP' | 'MorphS'"};
const BALANCED_READING: Partial<Rules> = {"markFree":true,"freezeUses":1,"hasteCaptures":false,"strikePawns":false,"strikeCaptures":false,"mercyAura":true,"mercyAuraPawnsTake":true,"mercyTakesPawns":true,"marchUses":0,"holyLightTakesPawns":true,"holyLightShelter":true,"holyLightShelterOrtho":true,"darknessMoves":true,"darknessKingStep2":true,"deathTouchReach":true,"deathTouchReachOrtho":true,"deathTouchReachForwardBack":true};

export const DECLARED_TARGETS = [
  { name: 'Archer', target: 'far2', source: 'owner prompt; Pieces!C8:F8', code: 'archerShots=far2', docs: 'docs/RULES.md §3, §6.16; docs/MATRIX.md A.0', approval: 'approved' },
  { name: 'Guard start', target: 'next to its king', source: 'owner prompt; Pieces!G9:J9; Rules!C20', code: 'guardNextToKing=true', docs: 'docs/RULES.md §2; docs/MATRIX.md A.0', approval: 'approved' },
  { name: 'Paladin', target: 'back in the random pool', source: 'owner prompt; Pieces!F13; Rules!D2', code: 'POOL=QOLRRBBNNAAGMMS', docs: 'docs/RULES.md §2, §6.18; docs/MATRIX.md A.3', approval: 'approved' },
  { name: 'Death Touch', target: 'T2: two-square reach forward and back only', source: 'owner prompt; King powers!D12:G12; Card matrix!M10', code: 'POWERS_BALANCED.deathTouchReachForwardBack=true', docs: 'docs/RULES.md §4; docs/MATRIX.md C.2', approval: 'approved' },
  { name: 'Hand size', target: 'four starting cards', source: 'owner prompt; docs/QUEUE.md deal-c4k', code: 'hands has no fixed size', docs: 'Rules!C18; Cards!E2; docs/MATRIX.md B.3', approval: 'approved' },
] as const;

function normalize(text: string): string { return text.replace(/\s+/g, ' ').trim(); }
export function documentSections(text: string): Map<string, string> {
  const starts = [...text.matchAll(/^#{1,3} .+$/gm)];
  return new Map(starts.map((match, i) => [match[0], normalize(text.slice(match.index! + match[0].length, starts[i + 1]?.index ?? text.length))]));
}
function sha(text: string): string { return createHash('sha256').update(text).digest('hex'); }
const equal = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
function issue(code: string, source: string, message: string, approval: Approval = 'unresolved', severity: Finding['severity'] = 'error'): Finding {
  return { code, source, message, approval, severity };
}

/** A table parser, with no dependence on word presence outside the requested section. */
export function matrixTable(text: string, heading: string): string[][] {
  const starts = [...text.matchAll(/^#{1,3} .+$/gm)];
  const index = starts.findIndex(m => m[0].startsWith(heading));
  if (index < 0) return [];
  const section = text.slice(starts[index].index! + starts[index][0].length, starts[index + 1]?.index ?? text.length);
  return section.split('\n').filter(line => line.trim().startsWith('|')).map(line => line.trim().slice(1, -1).split('|').map(s => s.trim())).filter(row => !row.every(cell => /^[-: ]+$/.test(cell)));
}

/** Parse the source declaration, including types and CLI choices. Comments do not count. */
export function sourceContract(source: string): { types: Record<string, string>; choices: Record<string, unknown[]>; aliases: Record<string, string> } {
  const types: Record<string, string> = {}, choices: Record<string, unknown[]> = {}, aliases: Record<string, string> = {};
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const body = clean.match(/export interface Rules\s*\{([\s\S]*?)^\}/m)?.[1] ?? '';
  for (const match of body.replace(/\/\/.*$/gm, '').matchAll(/\b(\w+)(\??)\s*:\s*([^;]+);/g)) types[match[1]] = `${match[2] ? '[optional] ' : ''}${normalize(match[3])}`;
  const choiceBody = clean.match(/const CHOICES[^=]*=\s*\{([\s\S]*?)^\}/m)?.[1] ?? '';
  for (const match of choiceBody.replace(/\/\/.*$/gm, '').matchAll(/\b(\w+):\s*(\[[^\]]*\])/g)) {
    try { choices[match[1]] = JSON.parse(match[2].replace(/'/g, '"')) as unknown[]; }
    catch { choices[match[1]] = ['unparsed source choices']; }
  }
  for (const match of clean.matchAll(/export type (\w+)\s*=\s*([^;]+);/g)) aliases[match[1]] = normalize(match[2]);
  return { types, choices, aliases };
}

function statusApproval(status: string): Approval {
  if (status === 'Approved' || status === 'Legendary') return 'approved';
  if (status === 'Testing') return 'lab';
  if (status === 'Rejected') return 'rejected';
  if (status === 'Dropped') return 'dropped';
  return 'unresolved';
}
function column(index: number): string {
  let name = '';
  for (let n = index; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + (n - 1) % 26) + name;
  return name;
}
const canonical = (name: string): string => name.replace(/\s+/g, '');
function globalRecord(name: string, axis: Extract<DesignElement, { kind: 'globalRule' }>['axis'], value: string | number | boolean): DesignElement {
  return { id: `globalRule:${axis}`, name, version: 'recorded', kind: 'globalRule', axis, dimensions: { value }, approval: 'unresolved', shipped: false, tested: false, sources: [] };
}
function sourceRule(name: string, flag: keyof Rules, value: Rules[keyof Rules]): DesignElement {
  return { id: `rule:${flag}`, name, version: 'recorded', kind: 'rule', flag, dimensions: { value }, approval: 'unresolved', shipped: false, tested: false, sources: [] };
}
const GLOBAL_RECORDS: Readonly<Record<string, DesignElement>> = {
  'Random back rank (Chess960-style)': globalRecord('Random back rank', 'pool', POOL),
  'Bishops on opposite colours': sourceRule('Bishops on opposite colours', 'bishopsOppositeColours', true),
  'One guard per army': globalRecord('One guard per army', 'guardLimit', 1),
  'One beast per army': globalRecord('One beast per army', 'beastLimit', 'oneInArmy'),
  'Castling': globalRecord('Castling', 'castling', false),
  'En passant': globalRecord('En passant', 'enPassant', false),
  'Promotion set': sourceRule('Promotion set', 'promotionSet', 'standard'),
  '50-move draw': sourceRule('50-move draw', 'fiftyMove', true),
  'Threefold repetition': sourceRule('Threefold repetition', 'threefold', true),
  'Insufficient material': sourceRule('Insufficient material', 'insufficientMaterial', true),
  'Check / checkmate / stalemate': globalRecord('Check / checkmate / stalemate', 'check', 'chess'),
  'First move': sourceRule('First move', 'secondPlayerDoubleFirstTurn', false),
  'Maester swap and king safety': globalRecord('Maester swap and king safety', 'kingSafety', 'required'),
  "Kings' powers mode": sourceRule("Kings' powers mode", 'kings', [null, null]),
  'Power use counts': sourceRule('Power use counts', 'freezeUses', 1),
  'Card mode': sourceRule('Card mode', 'hands', [[], []]),
  'Hand size': globalRecord('Hand size', 'handSize', 4),
  'Deal pool': globalRecord('Deal pool', 'cardDeal', 'undecided'),
  'Guard start square': globalRecord('Guard start square', 'guardStart', 'nextKing'),
  'Turn countdown': globalRecord('Turn countdown', 'countdown', 'undecided'),
  'Arrange mode': globalRecord('Arrange mode', 'arrange', 'undecided'),
  'Piece balance criteria': globalRecord('Piece balance criteria', 'pieceBalance', 'sixCriteria'),
  '?rules=2017 / ?rules=2021 presets': globalRecord('Presets', 'preset', '2017'),
};

/** Each version stays separate. A missing model is an audit failure, never a guessed mapping. */
export function mapWorkbookVersions(workbook: Workbook): RecordedVersion[] {
  const records: RecordedVersion[] = [];
  for (const sheet of workbook.sheets) {
    if (!['Pieces', 'Cards', 'King powers', 'Rules'].includes(sheet.name)) continue;
    const cells = new Map(sheet.cells.map(c => [c.cell, String(c.value)]));
    const rows = [...new Set(sheet.cells.map(c => Number(c.cell.replace(/[A-Z]/g, ''))))].filter(row => row > 1).sort((a, b) => a - b);
    for (const row of rows) {
      const power = sheet.name === 'King powers', global = sheet.name === 'Rules';
      const name = cells.get(`${power ? 'B' : 'A'}${row}`);
      if (!name) continue;
      const source = cells.get(`${power ? 'AJ' : sheet.name === 'Pieces' ? 'W' : global ? 'E' : 'S'}${row}`) ?? '';
      for (let start = global ? 2 : power ? 4 : 3; start <= (global ? 2 : power ? 32 : sheet.name === 'Pieces' ? 19 : 15); start += 4) {
        const cell = `${column(start)}${row}`, version = global ? 'Base' : cells.get(cell);
        if (!version) continue;
        const status = cells.get(`${column(global ? 2 : start + 1)}${row}`) ?? '';
        const text = cells.get(`${column(global ? 3 : start + 2)}${row}`) ?? '';
        const notes = cells.get(`${column(global ? 4 : start + 3)}${row}`) ?? '';
        const record: RecordedVersion = { sheet: sheet.name, cell, name, version, status, text, notes, source, element: null };
        record.element = mapVersion(record);
        records.push(...splitCombinedVersion(record));
      }
    }
  }
  return records;
}

function splitCombinedVersion(record: RecordedVersion): RecordedVersion[] {
  const e = record.element;
  if (!e) return [record];
  const split = (versions: readonly [string, Partial<Rules>][]): RecordedVersion[] => versions.map(([version, rules]) => {
    const element = { ...e, id: `${e.id}:${version}`, version, ...(e.kind === 'piece' || e.kind === 'card' || e.kind === 'kingPower' ? { rules: { ...e.rules, ...rules } } : {}) } as DesignElement;
    delete element.unmapped;
    if (element.kind === 'piece' && record.name === 'Archer') element.dimensions = { ...element.dimensions, shotPattern: version as PieceDimensions['shotPattern'] };
    return { ...record, version, element };
  });
  if (record.name === 'Archer' && record.version.includes('PlusDiagFwd2Clear')) return split([
    ['plusDiagFwd2Clear', { archerShots: 'plusDiagFwd2Clear' }], ['fwd2NoBack', { archerShots: 'fwd2NoBack' }], ['fwd2NoSide', { archerShots: 'fwd2NoSide' }],
  ]);
  if (record.name === 'Guard' && record.version.startsWith('Reserve')) return split([['rank1', { guardReserve: 'rank1' }], ['rank12', { guardReserve: 'rank12' }]]);
  if (record.name === 'Catapult') return split([['stay', { catapultCapture: 'stay' }], ['land', { catapultCapture: 'land' }]]);
  if (record.name === 'Reaver') return split([['any', { reaverStep: 'any' }], ['ortho', { reaverStep: 'ortho' }]]);
  if (record.name === 'Rage' && record.version.includes('trims') && e.kind === 'card') return ['quiet', 'stopOnTake'].map(version => {
    const element: DesignElement = { ...e, id: `${e.id}:${version}`, version, dimensions: { ...e.dimensions, secondCapture: version === 'quiet' ? 'never' : 'may', stopOnCapture: version === 'stopOnTake' ? 'yes' : 'no' } };
    delete element.unmapped;
    return { ...record, version, element };
  });
  return [record];
}

function mapVersion(record: RecordedVersion): DesignElement | null {
  const { name, version, sheet, cell, status, notes } = record;
  const id = `${sheet}:${cell}:${canonical(name)}:${version}`;
  let base: DesignElement | undefined;
  let rules: Partial<Rules> = {};
  let unmapped: Record<string, string> | undefined;
  if (sheet === 'Rules') base = GLOBAL_RECORDS[name];
  else if (name === 'Card mode') base = globalRecord(name, 'handSize', 4);
  else if (sheet === 'Pieces') {
    base = name === 'Squire' && version === 'Base' ? ARCHIVED_SQUIRE : SHIPPED_ELEMENTS.find(e => e.kind === 'piece' && e.name === name);
    if (name === 'Archer') {
      if (version === 'Far2' || version === 'Over2' || version === 'Over23') {
        const pattern = version.toLowerCase() as 'far2' | 'over2' | 'over23';
        if (base?.kind === 'piece') { const otherRules = { ...base.rules }; if (pattern === 'over23') delete otherRules.archerShots; else otherRules.archerShots = pattern; base = { ...base, dimensions: { ...base.dimensions, shotPattern: pattern }, rules: otherRules }; }
      }
      else if (version === 'PlusDiagFwd2') { rules = { archerShots: 'plusDiagFwd2' }; if (base?.kind === 'piece') base = { ...base, dimensions: { ...base.dimensions, shotPattern: 'plusDiagFwd2' } }; }
      else unmapped = { archerShots: 'This cell combines three readings: plusDiagFwd2Clear, fwd2NoBack, fwd2NoSide. Split them before a single experiment uses this record.' };
    }
    if (name === 'Guard') {
      if (version === 'Starts next to the king') base = sourceRule(name, 'guardNextToKing', true);
      else if (version === 'Drop on any empty square') base = sourceRule(name, 'guardReserve', 'any');
      else if (version === 'Morph questions') { base = globalRecord(name, 'beastLimit', 'extraByArrival'); }
      else if (version !== 'Base') { rules = { guardReserve: 'rank1' }; unmapped = { guardReserve: 'This cell combines rank1 and rank12. They are two distinct rule values.' }; }
    }
    if (name === 'Catapult') unmapped = { catapultCapture: 'Base combines stay and land. Both were tested; the workbook does not split them.' };
    if (name === 'Reaver') unmapped = { reaverStep: 'Base combines any and ortho. Both were tested; the workbook does not split them.' };
  } else {
    let key = canonical(name);
    if (version !== 'Base' && version !== 'As released' && sheet === 'Cards' && !version.includes('trims')) key = canonical(version);
    base = SHIPPED_ELEMENTS.find(e => e.kind === (sheet === 'Cards' ? 'card' : 'kingPower') && e.name === key);
    if (sheet === 'Cards' && version.includes('trims')) unmapped = { captures: 'quiet and stopOnTake are two tested readings outside the shipped Rules fields. The workbook combines them.' };
    if (name === 'Death Touch') {
      const patches: Readonly<Record<string, Partial<Rules>>> = {
        'T2 (no sideways reach)': { deathTouchReach: true, deathTouchReachOrtho: true, deathTouchReachForwardBack: true },
        'Never backward': { deathTouchReach: true, deathTouchReachOrtho: true, deathTouchReachNoBack: true },
        'Never backward + takes pieces only': { deathTouchReach: true, deathTouchReachOrtho: true, deathTouchReachNoBack: true, deathTouchReachPieces: true },
        'T3 (reach takes pieces only)': { deathTouchReach: true, deathTouchReachOrtho: true, deathTouchReachPieces: true },
        'Next to it only (T5)': { deathTouchReach: false },
        'Next to it + takes by moving (T5m)': { deathTouchReach: false, deathTouchMoves: true },
        'Diagonal reach': { deathTouchReach: true, deathTouchReachOrtho: false },
        'As released': { deathTouchReach: true, deathTouchReachOrtho: true },
      };
      rules = { deathTouchMoves: false, deathTouchReachNoBack: false, deathTouchReachForwardBack: false, deathTouchReachPieces: false, ...patches[version] };
      if (!(version in patches)) unmapped = { version: `No reviewed Death Touch patch for ${version}` };
    }
  }
  if (!base) return null;
  const approval = statusApproval(status);
  const tested = (name === 'Squire' && base.tested) || /(?:\d(?:[.,]\d+)?\s*(?:%|±|pawns?|Elo)|measured|depth [34])/i.test(notes);
  const shipped = sheet === 'Pieces'
    ? (version === 'Base' && base.shipped) || (name === 'Archer' && version === 'Far2') || (name === 'Guard' && ['Starts next to the king', 'Morph questions'].includes(version))
    : name === 'Death Touch' ? version === 'T2 (no sideways reach)' : base.shipped && ['Base', 'As released'].includes(version);
  const result: DesignElement = { ...base, id, version, approval, shipped, tested, sources: [`workbook:${sheet}!${cell}`, record.source, ...(name === 'Squire' ? base.sources : [])], ...(unmapped ? { unmapped } : {}) };
  if ('rules' in result) result.rules = { ...('rules' in base ? base.rules : {}), ...rules };
  return result;
}

const PRICE_PIN = 'a551c975ff29d1ef052c8d0292eda0f9c2720b59ee7fb662984b26c4af035965';

export interface AuditInput {
  matrixDoc: string;
  rulesDoc: string;
  rulesSource: string;
  workbook?: Workbook;
  pool?: string;
  prices?: Record<number, number>;
  defaults?: Readonly<Rules>;
  balanced?: Readonly<Partial<Rules>>;
}
export function auditDesign(input: AuditInput): Finding[] {
  const findings: Finding[] = [];
  if ((input.pool ?? POOL) !== 'QOLRRBBNNAAGMMS') findings.push(issue('POOL_DRIFT', 'src/rules/setup.ts', 'Review the pool change before changing the target.', 'approved'));
  if (sha(JSON.stringify(input.prices ?? VALUES)) !== PRICE_PIN) findings.push(issue('PRICE_DRIFT', 'src/ai/eval.ts VALUES', 'Review the evaluation prices before changing the target.', 'approved'));
  for (const [path, text] of [['docs/MATRIX.md', input.matrixDoc], ['docs/RULES.md', input.rulesDoc]] as const) {
    const actual = documentSections(text), expected = DOCUMENT_PINS[path];
    for (const [heading, pin] of Object.entries(expected)) {
      if (!actual.has(heading)) findings.push(issue('DOCUMENT_SECTION_REMOVED', `${path}: ${heading}`, 'A reviewed section is absent. Review its schema and records.'));
      else if (sha(actual.get(heading)!) !== pin) findings.push(issue('DOCUMENT_DRIFT', `${path}: ${heading}`, 'The recorded section changes. Review its dimensions, readings and approval before changing its pin.'));
    }
    for (const heading of actual.keys()) if (!(heading in expected)) findings.push(issue('DOCUMENT_SECTION_ADDED', `${path}: ${heading}`, 'A new section has no reviewed schema record.'));
  }
  const contract = sourceContract(input.rulesSource);
  for (const [key, alias] of Object.entries(SOURCE_TYPE_ALIASES)) if (contract.aliases[key] !== alias) findings.push(issue('RULE_ALIAS_TYPE_DRIFT', `src/rules/rules.ts: ${key}`, `Expected ${alias}; got ${contract.aliases[key] ?? 'removed'}.`));
  for (const [key, type] of Object.entries(RULE_TYPES)) {
    if (contract.types[key] !== type) findings.push(issue('RULE_TYPE_DRIFT', `src/rules/rules.ts: Rules.${key}`, `Expected ${type}; got ${contract.types[key] ?? 'removed'}.`));
  }
  for (const key of Object.keys(contract.types)) if (!(key in RULE_DIMENSIONS)) findings.push(issue('RULE_NOT_IN_SCHEMA', `src/rules/rules.ts: Rules.${key}`, 'The source rule has no typed design axis.'));
  for (const [key, choices] of Object.entries(CLI_CHOICES)) if (!equal(choices, contract.choices[key])) findings.push(issue('RULE_CHOICE_DRIFT', `src/rules/rules.ts: CHOICES.${key}`, `Expected ${JSON.stringify(choices)}; got ${JSON.stringify(contract.choices[key])}.`));
  for (const key of Object.keys(contract.choices)) if (!(key in CLI_CHOICES)) findings.push(issue('RULE_CHOICE_ADDED', `src/rules/rules.ts: CHOICES.${key}`, 'The CLI adds an unreviewed axis or choices.'));
  const defaults = input.defaults ?? DEFAULT_RULES;
  for (const [key, dimension] of Object.entries(RULE_DIMENSIONS)) {
    if (!equal(defaults[key as keyof Rules], dimension.default)) findings.push(issue('RULE_DEFAULT_DRIFT', `src/rules/rules.ts: DEFAULT_RULES.${key}`, `Expected ${JSON.stringify(dimension.default)}; got ${JSON.stringify(defaults[key as keyof Rules])}.`));
    if (!new RegExp(`\\b${key}\\b`).test(input.matrixDoc)) findings.push(issue('RULE_ABSENT_FROM_MATRIX', `src/rules/rules.ts: Rules.${key}; docs/MATRIX.md`, 'This code rule flag has no named matrix axis or reading.', 'lab'));
  }
  for (const alias of ['kingWhite', 'kingBlack']) if (!new RegExp(`\\b${alias}\\b`).test(input.matrixDoc)) findings.push(issue('RULE_ALIAS_ABSENT_FROM_MATRIX', `src/rules/rules.ts: parseRule(${alias}); docs/MATRIX.md`, 'This CLI rule flag is absent from the matrix.', 'lab'));
  if (!equal(input.balanced ?? POWERS_BALANCED, BALANCED_READING)) findings.push(issue('BALANCED_READING_DRIFT', 'src/rules/rules.ts: POWERS_BALANCED', 'The official power readings change. Review the typed records and the rule documents.', 'approved'));
  const c1 = matrixTable(input.matrixDoc, '### C.1');
  const properties = c1.slice(1).map(row => row[0]);
  const expectedProperties = ['Source', 'Type', 'Rarity', 'Uses', 'Turn cost', 'Captures', 'Targets', 'Target kind', 'Excluded targets', 'Excluded results', 'Result types', 'Second capture', 'Stop on capture', 'Duration', 'Has a condition', 'Is a condition', 'Shackled', 'Promotion', 'fromMove'];
  if (!equal(properties, expectedProperties)) findings.push(issue('MATRIX_DIMENSIONS_DRIFT', 'docs/MATRIX.md C.1', `Expected ${expectedProperties.join(', ')}; got ${properties.join(', ')}.`));
  const c2 = matrixTable(input.matrixDoc, '### C.2');
  const names = new Set(c2.slice(1).map(row => canonical(row[0])));
  for (const name of [...BUILT, ...ALL_CARDS]) if (!names.has(name)) findings.push(issue('ELEMENT_ABSENT_FROM_MATRIX', 'src/rules/rules.ts: BUILT/ALL_CARDS; docs/MATRIX.md C.2', `${name} has no matrix row.`, 'lab'));
  for (const name of names) if (!SHIPPED_ELEMENTS.some(e => canonical(e.name) === name)) findings.push(issue('MATRIX_ELEMENT_NOT_IN_SCHEMA', 'docs/MATRIX.md C.2', `${name} has no typed element.`, 'lab'));
  for (const element of SHIPPED_ELEMENTS) for (const message of validateElement(element)) findings.push(issue('ELEMENT_DOES_NOT_FIT', element.sources.join('; '), message, element.approval));
  findings.push(...knownSourceGaps(input));
  if (input.workbook) {
    for (const record of mapWorkbookVersions(input.workbook)) {
      const source = `workbook:${record.sheet}!${record.cell}`;
      if (!record.element) findings.push(issue('VERSION_NOT_MAPPED', source, `${record.name}, ${record.version}: the workbook has no complete typed mapping. ${record.text}`, statusApproval(record.status)));
      else {
        for (const message of validateElement(record.element)) findings.push(issue('VERSION_DOES_NOT_FIT', source, message, record.element.approval));
        if (record.element.kind === 'piece' && ['over2', 'over23'].includes(record.element.dimensions.shotPattern ?? '') && !new RegExp(`\\b${record.element.dimensions.shotPattern}\\b`).test(documentSections(input.matrixDoc).get('### A.0 Basic patterns (context for the grid below)') ?? '')) findings.push(issue('VERSION_ABSENT_FROM_MATRIX', `${source}; docs/MATRIX.md A.0–1; src/rules/rules.ts ArcherShots`, `${record.version} has no matrix reading. ${record.element.dimensions.shotPattern === 'over23' ? 'It also has no current code rule choice; its source is claude/archer-reach:rules.ts.' : 'It is a current code lab choice.'}`, record.element.approval));
      }
    }
    const cellText = (sheet: string, cell: string): string => String(input.workbook!.sheets.find(s => s.name === sheet)?.cells.find(c => c.cell === cell)?.value ?? '');
    if (!cellText('Rules', 'C2').includes(POOL)) findings.push(issue('WORKBOOK_POOL_CONFLICT', 'workbook:Rules!C2', 'The approved pool must match the current pool, including Paladin.', 'approved'));
    if (/six/i.test(cellText('Rules', 'C18')) || /six/i.test(cellText('Cards', 'E2'))) findings.push(issue('WORKBOOK_HAND_SIZE_CONFLICT', 'owner prompt; workbook:Rules!C18; workbook:Cards!E2', 'The owner selects four cards (docs/QUEUE.md deal-c4k). The workbook still states six. Code hands stays variable; card mode stays in the lab.', 'approved'));
    if (/never has two beasts/i.test(cellText('Rules', 'C5'))) findings.push(issue('WORKBOOK_BEAST_LIMIT_CONFLICT', 'workbook:Rules!C5; workbook:Pieces!N9; docs/MATRIX.md C.2 Morph', 'The starting army has at most one Beast. Morph cannot create a Beast while that side has one. Salvation or Sacrifice may return a captured Beast even if that gives the side a second Beast.', 'approved'));
  }
  return findings;
}

function knownSourceGaps(input: AuditInput): Finding[] {
  const findings: Finding[] = [];
  const properties = new Map(matrixTable(input.matrixDoc, '### C.1').slice(1).map(row => [row[0], row[1] ?? '']));
  const effects = new Map(matrixTable(input.matrixDoc, '### C.2').slice(1).map(row => [canonical(row[0]), row]));
  const has = (property: string, words: readonly string[]): boolean => words.every(word => (properties.get(property) ?? '').includes(word));
  const gap = (missing: boolean, code: string, source: string, message: string, approval: Approval = 'lab'): void => {
    if (missing) findings.push(issue(code, source, message, approval));
  };
  gap(input.matrixDoc.includes('The other six\npowers and every card remain'), 'STALE_MATRIX_STATUS', 'docs/MATRIX.md: introduction; C.2', 'The introduction says six powers and every card are not built. C.2 and the source show they are built.', 'approved');
  gap(input.rulesDoc.includes("Kings' powers in §4 are optional lab rules"), 'STALE_RULES_STATUS', 'docs/RULES.md: introduction; §4', 'The introduction labels powers as lab rules. Section 4 records the official shipped mode.', 'approved');
  gap(input.matrixDoc.includes('The random pool is `QORRBBNNAAGMMS`'), 'STALE_MATRIX_POOL', 'docs/MATRIX.md A.3; docs/RULES.md §2; src/rules/setup.ts POOL', 'A.3 lists the old pool without the Paladin. The current pool is QOLRRBBNNAAGMMS.', 'approved');
  const morph = effects.get('Morph')?.[6] ?? '';
  gap(!/paladin/i.test(morph) || !/second Guard/.test(morph), 'MATRIX_MORPH_READING_GAP', 'docs/MATRIX.md C.2 Morph; docs/RULES.md §6 decisions 23, 25; src/rules/engine.ts MORPH_TYPES', 'The matrix result list omits Paladin or the second-Guard limit. The current code includes both.');
  gap(!has('Has a condition', ['a piece lost', 'material behind', 'own last mark']), 'MATRIX_CONDITION_GAP', 'docs/MATRIX.md C.1 Has a condition; D.1', 'The condition axis must include piece lost, material behind and own last mark.');
  gap(!has('Turn cost', ['none (always-on)']), 'MATRIX_NULL_TURN_COST_GAP', 'docs/MATRIX.md C.1 Turn cost; C.2 Holy Light, Mercy, Death Touch, Darkness', 'Always-on powers have no turn cost. C.1 must list this value.', 'approved');
  gap(!['Turn cost', 'Captures', 'Targets', 'Duration'].every(property => has(property, ['inherited from the copied card'])), 'MATRIX_COPY_GAP', 'docs/MATRIX.md C.1; C.2 Mirror, MirrorB', 'The copy rows inherit turn cost, captures, targets and duration. Each axis must allow inherited values.');
  gap(!has('Second capture', ['same as Captures', 'may', 'must', 'never']), 'MATRIX_CAPTURE_STAGE_GAP', 'docs/MATRIX.md C.1 Second capture; C.2 RageB', 'A separate second-capture axis must express may on the first move and must on the second.');
  gap(!has('Target kind', ['pile', 'prior mark', 'empty square']), 'MATRIX_TARGET_DOMAIN_GAP', 'docs/MATRIX.md C.1 Target kind; C.2 Growth, Rescue, Spawn', 'Target kinds must include pile, prior mark and empty square.');
  gap(!has('Duration', ['renew an earlier mark for one more opponent turn']), 'MATRIX_DURATION_GAP', 'docs/MATRIX.md C.1 Duration; C.2 Rescue', 'Rescue renews an earlier mark for one more turn. The duration axis must state renewal.');
  const flight = matrixTable(input.matrixDoc, '### A.1').find(row => row.some(cell => /Flight/.test(cell)));
  gap(!!flight && /Arriving|Arrival/i.test(flight[0]), 'FLIGHT_ABILITY_CONFLICT', 'docs/MATRIX.md A.1 1b; C.2 Flight; docs/RULES.md §4 Flight', 'Flight moves an existing piece. Its ability row must say special move, not arrival.', 'approved');
  gap(/No king-power reading changes how other pieces move/.test(input.rulesDoc)
    && ['March', 'Darkness'].some(name => /pawn/i.test(effects.get(name)?.[2] ?? '')), 'KING_MOVEMENT_RULE_CONFLICT', 'docs/RULES.md §4; docs/MATRIX.md C.2 March, Darkness', 'The blanket rule conflicts with approved March and Darkness effects. The approved limit applies to new movement changes when adjusting a king power for balance. Keep existing approved effects.', 'approved');
  return findings;
}

/** Complete built-in versions, with the engine presets kept separate. */
export const PRESET_VERSIONS = { default: DEFAULT_RULES, printed2017: RULES_2017, concept2021: RULES_2021, balancedPowers: { ...DEFAULT_RULES, ...POWERS_BALANCED } } as const;
export const DESIGN_ELEMENTS = SHIPPED_ELEMENTS;
export const KING_POWER_PAIRS = KINGS;
export const MATRIX_DIMENSIONS = DIMENSIONS;
