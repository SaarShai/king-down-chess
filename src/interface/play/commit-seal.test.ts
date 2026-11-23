import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseSync, transformSync } from 'rolldown/utils';
import { expect, it, vi } from 'vitest';

const filename = new URL('./main.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const declarations = parseSync(filename.pathname, source).program.body
  .filter(node => node.type === 'FunctionDeclaration' && ['finish', 'passTurn'].includes(node.id?.name ?? ''));
// Run the play screen's real End turn and turn hand-off with stub collaborators.
const page = transformSync(filename.pathname, declarations.map(node => source.slice(node.start, node.end)).join('\n')).code;

function screen({ online = false, free = false, end = 'playing' } = {}) {
  const seal = vi.fn(), edgeLight = vi.fn(), noop = () => {};
  const game = { history: [], pos: {}, status: 'playing', context: { inCheck: () => false, status: () => end } };
  const scope: Record<string, unknown> = {
    seal, edgeLight, cue: noop, pulse: noop, later: noop, streak: noop, at: noop, onFrame: noop,
    controls: { finish: {} }, seatRings: [{}, {}], nodes: { state: {}, title: {} },
    onlineActive: online, people: { controller: { send: async () => true } },
    gameHelp: undefined, arrangement: undefined, ended: false, thinking: false, choice: [], writer: { blocked: false }, playingAction: null, fault: null,
    freeText: () => free ? 'Haste is spent. Move again, or End turn.' : '',
    draft: { canFinish: true, position: {}, commit: () => { game.status = end; return [{}]; } },
    game, board: undefined, skipBoard: noop, turnText: noop, turnActions: noop, clearChoice: noop, save: noop,
    showResult: noop, finalCheckCue: noop, reply: async () => {}, announce: noop, text: { sent: '' },
  };
  runInNewContext(page, scope, { filename: filename.pathname });
  return { scope, seal, edgeLight, finish: scope.finish as () => Promise<void>, passTurn: scope.passTurn as (out: boolean) => void };
}

it('seals the player own End turn, offline and online', async () => {
  for (const online of [false, true]) {
    const { finish, seal, edgeLight } = screen({ online });
    await finish();
    expect(seal, online ? 'online' : 'offline').toHaveBeenCalledOnce();
    expect(edgeLight).not.toHaveBeenCalled();
  }
});

it('does not seal an End turn after a free action alone, or a turn that ends the game', async () => {
  for (const options of [{ free: true }, { end: 'checkmate' }, { online: true, end: 'checkmate' }, { online: true, free: true }]) {
    const { finish, seal } = screen(options);
    await finish();
    expect(seal, JSON.stringify(options)).not.toHaveBeenCalled();
  }
});

it('does not seal the turn that comes back from the opponent', () => {
  const { passTurn, seal } = screen();
  passTurn(false);
  expect(seal).not.toHaveBeenCalled();
});
