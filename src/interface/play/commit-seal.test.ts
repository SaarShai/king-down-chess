import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseSync, transformSync } from 'rolldown/utils';
import { expect, it, vi } from 'vitest';

const filename = new URL('./main.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const declarations = parseSync(filename.pathname, source).program.body
  .filter(node => node.type === 'FunctionDeclaration' && ['finish', 'passTurn', 'endSeal', 'playReply', 'closeStaleDialogs'].includes(node.id?.name ?? ''));
// Run the play screen's real End turn and turn hand-off with stub collaborators.
const page = transformSync(filename.pathname, declarations.map(node => source.slice(node.start, node.end)).join('\n')).code;

function screen({ online = false, free = false, end = 'playing' } = {}) {
  const cancel = vi.fn(), seal = vi.fn(() => ({ cancel, finish: () => {} })), edgeLight = vi.fn(), noop = () => {};
  const plate = { dataset: {} as Record<string, string>, style: new Map<string, string>() };
  const style = { setProperty: (key: string, value: string) => plate.style.set(key, value), removeProperty: (key: string) => plate.style.delete(key) };
  const game = { history: [], pos: {}, status: 'playing', context: { inCheck: () => false, status: () => end } };
  const scope: Record<string, unknown> = {
    seal, edgeLight, cue: noop, pulse: noop, later: noop, streak: noop, at: noop, onFrame: noop,
    controls: { finish: { dataset: plate.dataset, style } }, sealing: [], SEAL_MS: 420, tween: () => ({ cancel: noop }), detail: { querySelectorAll: () => [] },
    screen: { dataset: {} }, beat: undefined, generation: 0, boardReplay: { play: () => Promise.resolve() }, gameDialog: undefined, resignDialog: undefined, seatRings: [{}, {}], nodes: { state: {}, title: {} },
    onlineActive: online, people: { controller: { send: async () => true } },
    gameHelp: undefined, arrangement: undefined, ended: false, thinking: false, choice: [], writer: { blocked: false }, playingAction: null, fault: null,
    freeText: () => free ? 'Haste is spent. Move again, or End turn.' : '',
    draft: { canFinish: true, position: {}, commit: () => { game.status = end; return [{}]; } },
    game, board: undefined, skipBoard: noop, turnText: noop, turnActions: noop, clearChoice: noop, save: noop,
    showResult: noop, finalCheckCue: noop, reply: async () => {}, announce: noop, text: { sent: '' },
  };
  runInNewContext(page, scope, { filename: filename.pathname });
  return { scope, seal, cancel, plate, edgeLight, finish: scope.finish as () => Promise<void>, passTurn: scope.passTurn as (out: boolean, sealed?: boolean) => void };
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

it('clears the seal, its line and the plate shade when a reply plays or the turn comes back before 420 ms', async () => {
  for (const back of ['reply', 'turn'] as const) {
    const { scope, finish, cancel, plate, passTurn } = screen();
    await finish();
    expect(plate.dataset.sealed, back).toBe('');
    if (back === 'reply') void (scope.playReply as (steps: unknown[], view: unknown) => Promise<void>)([], {}); else passTurn(false);
    expect(cancel, back).toHaveBeenCalledOnce();
    expect(plate.dataset.sealed, back).toBeUndefined();
    expect(plate.style.has('--wait-shade'), back).toBe(false);
  }
});

it('clears the online seal when the server result ends the game (a repetition the position alone does not show)', async () => {
  const { scope, finish, cancel, plate } = screen({ online: true });
  await finish();
  (scope.closeStaleDialogs as () => void)();
  expect(cancel).toHaveBeenCalledOnce();
  expect(plate.dataset.sealed).toBeUndefined();
});

it('keeps the brass plate and its shade for the seal only: an End turn with no seal marks nothing', () => {
  const { passTurn, plate } = screen();
  passTurn(true, false);
  expect(plate.dataset.sealed).toBeUndefined();
  expect(plate.style.size).toBe(0);
});
