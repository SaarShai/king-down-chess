import { readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSync, Visitor } from 'rolldown/utils';

const root = resolve(import.meta.dirname, '..');
const blocked: Record<string, Set<string>> = Object.fromEntries(Object.entries({
  'rules/rules': 'RULES setRules playedDesign ruleDiff',
  'rules/engine': 'RULES setRules playedDesign ruleDiff nameOf theName aName overShots guardMayLand powerOf powerUses handOf heldCount cardAt spend canSpend markKind drawsOnLost tracksLast lapsing holdsTurn keepsLost canCapture genPiece makeMove moverAt isAttacked inCheck genPowerMoves filterMarks filterHeld genHasteFollowUp filterFree genGuardDrops epAfter genClassic freePass pseudoMoves legalMoves insufficientMaterial materialDraw status perft',
  'rules/setup': 'randomBackRank waitGuards startPosition fromFen',
  'ai/search': 'search searchLegal resetSearchState',
  'rules/position-key': 'positionKey hashBoard',
  'read': 'pieceTitle reachOf pieceGuide readText teachNote pieceStates whyNot readTap unmarkedTap guideTypes',
  'move-text': 'checkCause checkersOf describeMove threatsIn',
  'marks-model': 'railsOf',
  'cursor-text': 'cursorText',
  'previously': 'previouslyTurn',
  'ceremony-game': 'ceremonyMoveLabel',
  'render/frost': 'frozenPieces',
  'workshop/powers': 'withRules',
  'workshop/moves': 'tryBoard',
}).map(([path, names]) => [`src/${path}.ts`, new Set(names.split(' '))]));

// These pure implementations are called only through GameRules; they are not product entry points.
const internal = new Set([
  'src/game-rules.ts', 'src/match/worker.ts',
  'src/read.ts', 'src/move-text.ts', 'src/marks-model.ts', 'src/cursor-text.ts',
  'src/previously.ts', 'src/ceremony-game.ts', 'src/render/frost.ts',
]);
function violations(file: string, source: string): string[] {
  const faults: string[] = [];
  const tree = parseSync(file, source);
  if (tree.errors.length) throw new Error(`Cannot inspect ${file}: ${JSON.stringify(tree.errors)}`);
  const check = (specifier: string, names: string[]) => {
    if (!specifier.startsWith('.')) return;
    const target = relative(root, resolve(dirname(resolve(root, file)), specifier)).replace(/\.ts$/, '') + '.ts';
    const denied = blocked[target];
    if (denied) for (const name of names) if (name === '*' || denied.has(name)) faults.push(`${file}: ${name} from ${target}`);
  };
  new Visitor({
    ImportDeclaration(node) {
      if (node.importKind === 'type') return;
      check(node.source.value, node.specifiers.filter(e => e.type !== 'ImportSpecifier' || e.importKind !== 'type')
        .map(e => e.type === 'ImportSpecifier' ? e.imported.type === 'Identifier' ? e.imported.name : e.imported.value : '*'));
    },
    ExportNamedDeclaration(node) {
      if (node.exportKind === 'type' || !node.source) return;
      check(node.source.value, node.specifiers.filter(e => e.exportKind !== 'type')
        .map(e => e.local.type === 'Identifier' ? e.local.name : e.local.value));
    },
    ExportAllDeclaration(node) {
      if (node.exportKind !== 'type') check(node.source.value, ['*']);
    },
    ImportExpression(node) {
      if (node.source.type === 'Literal' && typeof node.source.value === 'string') check(node.source.value, ['*']);
    },
  }).visit(tree.program);
  return faults;
}
function files(dir: string): string[] {
  return readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap(entry => {
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? files(path) : path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : [];
  });
}
describe('product game boundary', () => {
  it('rejects direct, aliased, namespace, dynamic and re-export bypasses but permits pure facts and types', () => {
    expect(violations('src/example.ts', "import { legalMoves as moves, type Position, parseSq } from './rules/engine';")).toHaveLength(1);
    expect(violations('src/example.ts', "import * as rules from './rules/engine';")).toHaveLength(1);
    expect(violations('src/example.ts', "export { RULES as active } from './rules/rules';")).toHaveLength(1);
    expect(violations('src/example.ts', "void import('./ai/search');")).toHaveLength(1);
    expect(violations('src/example.ts', "import type { Rules } from './rules/rules'; import { parseSq, P } from './rules/engine';")).toEqual([]);
    expect(violations('src/example.ts', "import { shortMove } from './move-text'; import { searchOwned } from './ai/search';")).toEqual([]);
    expect(violations('src/example.ts', "import { positionKey } from './rules/position-key';")).toHaveLength(1);
  });
  it('keeps owned rules independent of search and evaluation', () => {
    const source = readFileSync(resolve(root, 'src/game-rules.ts'), 'utf8'), imports: string[] = [];
    new Visitor({ ImportDeclaration(node) {
      if (node.importKind !== 'type') imports.push(node.source.value);
    } }).visit(parseSync('src/game-rules.ts', source).program);
    expect(imports.filter(path => path.startsWith('./ai/'))).toEqual([]);
  });
  it('keeps ambient engine and helper operations inside the owned boundary', () => {
    const product = files('src').filter(file => !internal.has(file) && !/^src\/(rules|ai|sim)\//.test(file));
    expect(product.flatMap(file => violations(file, readFileSync(resolve(root, file), 'utf8')))).toEqual([]);
  });
});
