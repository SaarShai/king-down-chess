import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { fixtureService } from '../../tools/plugin-protocol-fixture';
import { createMuseServer, type MuseGames } from './tools';

type Fixture = ReturnType<typeof fixtureService>;
type Data = Record<string, any>;
const open: { client: Client; fixture: Fixture }[] = [];
afterEach(async () => { for (const { client, fixture } of open.splice(0)) { await client.close(); await fixture.close(); } });

/** A real v2 client against the real server, in process: the transport's fetch is the handler's fetch. */
async function connect(games?: (fixture: Fixture) => MuseGames) {
  const fixture = fixtureService(), toolTry = vi.fn(async () => {});
  const port: MuseGames = games?.(fixture) ?? { create: fixture.create, command: fixture.command, view: fixture.view, inbox: fixture.inbox, previewDraft: fixture.previewDraft, toolTry };
  const handler = createMcpHandler(() => createMuseServer({ games: port, actorId: 'alice', publicOrigin: 'https://kingdown.test' }));
  const client = new Client({ name: 'muse-tools-test', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL('https://kingdown.test/muse/mcp'), { fetch: (url, init) => handler.fetch(new Request(url, init)) }));
  open.push({ client, fixture });
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const result = await client.callTool({ name, arguments: args }) as { content: { type: string; text: string }[]; structuredContent: Data; isError?: boolean };
    return { text: result.content[0].text, data: result.structuredContent, error: !!result.isError };
  };
  return { client, fixture, call, toolTry };
}
const words = (text: string) => text.split('\n')[0].split(/\s+/).length;

describe('Muse tools', () => {
  it('lists six tools with their classes and output schemas', async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    const hints = Object.fromEntries(tools.map(t => [t.name, [t.annotations?.readOnlyHint, t.annotations?.destructiveHint, t.annotations?.idempotentHint, t.annotations?.openWorldHint]]));
    expect(hints).toEqual({
      kingdown_games: [true, false, true, false], kingdown_view: [true, false, true, false], kingdown_explain: [true, false, true, false],
      kingdown_new_game: [false, false, true, false], kingdown_move: [false, false, true, false], kingdown_end: [false, true, true, false],
    });
    for (const t of tools) { expect(t.outputSchema?.type).toBe('object'); expect(t.description).not.toMatch(/use this/i); }
  });

  it('plays a game by words: the computer replies in the same call, and a retry or a stale revision plays nothing', async () => {
    const { call, toolTry } = await connect();
    const made = await call('kingdown_new_game', { request_id: 'game-0001', level: 'beginner' });
    expect(made.error).toBe(false);
    expect(made.text).toMatch(/^New game against the computer\. You are White\. Your move\./);
    expect(made.data).toMatchObject({ against: 'computer', colour: 'white', your_turn: true, computer: [], level: 'beginner', link: `https://kingdown.test/g/${made.data.game_id}` });
    expect(made.data.back_rank).toMatch(/^Back rank from a to h: /);
    expect(toolTry).toHaveBeenCalledWith('alice', 'kingdown_create');
    // The same request ID gives the same game.
    expect((await call('kingdown_new_game', { request_id: 'game-0001', level: 'beginner' })).data.game_id).toBe(made.data.game_id);

    const move = { game_id: made.data.game_id, expected_revision: made.data.revision, said: 'pawn e4' };
    const played = await call('kingdown_move', move);
    expect(played.data).toMatchObject({ result: 'played', you: ['White pawn e2 to e4.'], your_turn: true });
    expect(played.data.computer).toHaveLength(1);
    expect(played.text).toMatch(/^You: White pawn e2 to e4\. Computer: Black .+ Your move\./);
    expect(words(played.text)).toBeLessThan(30);
    expect(toolTry).toHaveBeenCalledWith('alice', 'kingdown_computer');

    const view = await call('kingdown_view');
    expect(view.data).toMatchObject({ found: true, game_id: made.data.game_id, revision: played.data.revision, fen: played.data.fen, last_move: `Computer: ${played.data.computer[0]}` });
    expect(view.data.fen).not.toBe(made.data.fen);
    expect(view.text).toContain(view.data.grid);

    // A resend after a lost reply carries the old revision: nothing plays twice.
    for (const retry of [move, { game_id: made.data.game_id, expected_revision: made.data.revision, said: 'pawn d4' }]) {
      const again = await call('kingdown_move', retry);
      expect(again.data).toMatchObject({ result: 'changed', revision: played.data.revision, fen: played.data.fen });
      expect(again.text).toMatch(/^The game changed, so nothing was played\. You: White pawn e2 to e4\. Computer: /);
    }
  });

  it('returns choices for an ambiguous phrase and a reason for no fit, and plays nothing', async () => {
    const { call } = await connect();
    const made = await call('kingdown_new_game', { request_id: 'game-0002', level: 'beginner', classic: true });
    const many = await call('kingdown_move', { game_id: made.data.game_id, expected_revision: made.data.revision, said: 'pawn' });
    expect(many.data).toMatchObject({ result: 'choices', revision: made.data.revision, move_ids: [] });
    expect(many.data.choices).toHaveLength(4);
    expect(many.data.choices[0]).toMatchObject({ number: 1, move_ids: [expect.any(String)] });
    expect(many.text.split('\n')[1]).toBe(`1. ${many.data.choices[0].words}`);
    const none = await call('kingdown_move', { game_id: made.data.game_id, expected_revision: made.data.revision, said: 'banana' });
    expect(none.data).toMatchObject({ result: 'refused', reason: 'Some words are not move words. Say a piece and a square, for example "knight to f3".' });
    // An exact ID from a choice plays.
    const picked = await call('kingdown_move', { game_id: made.data.game_id, expected_revision: made.data.revision, move_ids: many.data.choices[0].move_ids });
    expect(picked.data).toMatchObject({ result: 'played', you: [many.data.choices[0].words] });
    expect(await call('kingdown_move', { game_id: made.data.game_id, expected_revision: picked.data.revision })).toEqual({ error: true, text: 'Say a move, or send move IDs.', data: { code: 'INVALID_INPUT' } });
  });

  it('holds a Haste turn as pending until it is complete', async () => {
    const { call, fixture } = await connect();
    const id = await fixture.seedPosition({ kings: 'Flame:Haste,none', fen: '7k/8/8/8/8/8/8/R5K1 w - - 0 1' }, false);
    const start = (await call('kingdown_view', { game_id: id })).data;
    const first = await call('kingdown_move', { game_id: id, expected_revision: start.revision, said: 'rook a7 haste' });
    expect(first.data).toMatchObject({ result: 'pending', revision: start.revision, move_ids: [expect.stringMatching(/!H$/)] });
    expect(first.text).toMatch(/Your turn goes on\. Say the next move, or pass\./);
    expect(first.data.choices.length).toBeLessThanOrEqual(6);
    expect(first.data.choices.at(-1).words).toMatch(/without the Haste second move/);
    const done = await call('kingdown_move', { game_id: id, expected_revision: start.revision, move_ids: first.data.move_ids, said: 'pass' });
    expect(done.data).toMatchObject({ result: 'played', your_turn: true });
    expect(done.data.you).toHaveLength(2);
    expect(done.data.computer.length).toBeGreaterThan(0);
  });

  it('starts a game with king powers as Black: the setup ends and the computer moves first', async () => {
    const { call } = await connect();
    const made = await call('kingdown_new_game', { request_id: 'game-0003', level: 'beginner', colour: 'black', king_powers: true });
    expect(made.error).toBe(false);
    expect(made.data).toMatchObject({ colour: 'black', your_turn: true });
    expect(made.data.computer).toHaveLength(1);
    expect(made.text).toMatch(/^New game against the computer\. You are Black\. Computer: White .+ Your move\.$/m);
  });

  it('explains without a game', async () => {
    const { call } = await connect();
    expect((await call('kingdown_explain', { topic: 'knight' })).text).toMatch(/^Knight: /);
    const unknown = await call('kingdown_explain', { topic: 'banana' });
    expect(unknown).toMatchObject({ error: false, data: { known: false } });
    expect(unknown.data.pieces).toContain('archer');
    expect(unknown.text).not.toContain('banana');
    expect((await call('kingdown_view')).data).toEqual({ found: false });
  });

  it('shows a game against a person with no position and no legal moves, and refuses a move in it', async () => {
    const { call, fixture } = await connect();
    const person = await fixture.seedPosition({}, true);
    await call('kingdown_new_game', { request_id: 'game-0004', level: 'beginner' });
    const list = await call('kingdown_games');
    expect(list.data.games.map((g: Data) => [g.against, g.your_turn])).toEqual([['computer', true], ['person', false]]);
    expect(list.data.games[1]).toEqual({ game_id: person, against: 'person', colour: 'black', status: 'playing', your_turn: false, move: 1, link: `https://kingdown.test/g/${person}` });
    expect(list.text.split('\n')[0]).toBe('You have 2 games. Your turn against the computer, move 1.');
    const view = await call('kingdown_view', { game_id: person });
    expect(view.text.split('\n')[0]).toBe(`This game is against a person. Play it on kingdown.test: https://kingdown.test/g/${person}`);
    expect(Object.keys(view.data).sort()).toEqual(['against', 'colour', 'found', 'game_id', 'link', 'move', 'status', 'your_turn']);
    expect(JSON.stringify(view)).not.toContain((await fixture.view('alice', person)).fen.split(' ')[0]);
    const move = await call('kingdown_move', { game_id: person, expected_revision: 0, said: 'e5' });
    expect(move).toMatchObject({ error: true, data: { code: 'PERSON_GAME' } });
    expect((await call('kingdown_explain', { topic: 'e2', game_id: person })).data.known).toBe(false);
  });

  it('resigns a computer game; a retry with the old revision changes nothing', async () => {
    const { call } = await connect();
    const made = await call('kingdown_new_game', { request_id: 'game-0005', level: 'beginner' });
    const ended = await call('kingdown_end', { action: 'resign', expected_revision: made.data.revision, game_id: made.data.game_id });
    expect(ended.text.split('\n')[0]).toBe('Resignation. You lose.');
    expect(ended.data).toMatchObject({ result: 'ended', status: 'finished', ending: 'Resignation. You lose.' });
    expect((await call('kingdown_end', { action: 'resign', expected_revision: made.data.revision, game_id: made.data.game_id })).data).toMatchObject({ result: 'changed', revision: ended.data.revision });
    expect((await call('kingdown_end', { action: 'abort', expected_revision: ended.data.revision, game_id: made.data.game_id })).data).toEqual({ code: 'MATCH_TERMINAL' });
    expect((await call('kingdown_games')).data.games).toEqual([]);
  });

  it('maps service errors to fixed sentences and a code', async () => {
    const { call } = await connect(fixture => ({ create: fixture.create, command: fixture.command, view: fixture.view, inbox: fixture.inbox, previewDraft: fixture.previewDraft,
      toolTry: async () => { const { MatchServiceError } = await import('../match/service'); throw new MatchServiceError('RATE_LIMITED', 429, 'raw service text'); } }));
    const refused = await call('kingdown_new_game', { request_id: 'game-0006' });
    expect(refused).toEqual({ error: true, text: 'Too many requests. Wait one minute, then try again.', data: { code: 'RATE_LIMITED' } });
  });
});
