// The one command lane and the one epoch gate (design §1.2 and §2, ticket 19 S3). The bodies stand in for a
// transport call: each one is a promise the test holds and releases, so the order and the detach are facts.
import { describe, expect, it } from 'vitest';
import { createQueue, resultText, type Job } from './queue';

const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));
function deferred() { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; }
const body = (order: string[], name: string) => async () => { order.push(name); return { status: 'done' as const, result: { content: [] } }; };

describe('the command queue', () => {
  it('lets a user read take the epoch but keeps polls and job steps in their epoch', async () => {
    const queue = createQueue(), hold = deferred();
    const first = queue.command('read', 'kingdown_get', {});
    const done = queue.run(first, async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    const newer = queue.command('read', 'kingdown_get', {});
    await expect(done).resolves.toEqual({ status: 'superseded' });
    expect(queue.current(first)).toBe(false);
    expect(queue.current(newer)).toBe(true);
    queue.command('read', 'kingdown_get', {}, { quiet: true });
    queue.command('read', 'kingdown_games', {}, { user: false });
    queue.command('read', 'kingdown_get', {}, { origin: newer });
    expect(queue.current(newer)).toBe(true);
    hold.resolve();
  });

  it('keeps a retained start read in flight after a chat result detaches it', async () => {
    const queue = createQueue(), hold = deferred();
    const job = queue.command('read', 'kingdown_get', {}, { retain: true });
    const done = queue.run(job, async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    queue.chatResult();
    await expect(done).resolves.toEqual({ status: 'superseded' });
    expect(queue.inflight()).toBe(true);
    hold.resolve(); await tick();
    expect(queue.inflight()).toBe(false);
  });

  it('keeps the start epoch through its follow-up writes and reads', async () => {
    const queue = createQueue();
    const origin = queue.command('write', 'kingdown_create', {});
    const choose = queue.command('write', 'kingdown_choose', {}, { origin });
    expect(queue.current(origin)).toBe(true);
    expect(choose.epoch).toBe(origin.epoch);
    queue.chatResult();
    const read = queue.command('read', 'kingdown_get', {}, { origin });
    expect(read.epoch).toBe(origin.epoch);
    expect(queue.current(origin)).toBe(false);
    expect(queue.current(choose)).toBe(false);
    expect(queue.current(read)).toBe(false);
  });

  it('runs writes on the lane, first in first out and one at a time', async () => {
    const queue = createQueue(), order: string[] = [], first = deferred(), second = deferred();
    const a = queue.command('write', 'kingdown_move', {}), b = queue.command('write', 'kingdown_move', {});
    const done = queue.run(a, async () => { order.push('a start'); await first.promise; order.push('a end'); return { status: 'done', result: { content: [] } }; });
    const next = queue.run(b, async () => { order.push('b start'); await second.promise; order.push('b end'); return { status: 'done', result: { content: [] } }; });
    await tick();
    expect(order).toEqual(['a start']);
    expect(queue.writing()).toBe(true);
    first.resolve(); await done; await tick();
    expect(order).toEqual(['a start', 'a end', 'b start']);
    second.resolve(); await next;
    expect(order).toEqual(['a start', 'a end', 'b start', 'b end']);
    expect(queue.writing()).toBe(false);
  });

  it('runs a read beside the lane, and makes a page-board read wait for an idle lane', async () => {
    const queue = createQueue(), order: string[] = [], hold = deferred();
    const write = queue.command('write', 'kingdown_move', {});
    const lane = queue.run(write, async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    void queue.run(queue.command('read', 'kingdown_games', {}), body(order, 'read'));
    const board = queue.run(queue.command('read', 'kingdown_get', {}, { board: true }), body(order, 'board read'));
    await tick();
    expect(order).toEqual(['read']);
    hold.resolve(); await lane;
    await expect(board).resolves.toEqual({ status: 'done', result: { content: [] } });
    expect(order).toEqual(['read', 'board read']);
  });

  it('detaches an older read at once on a new chat result and gives it superseded', async () => {
    const queue = createQueue(), hold = deferred();
    const read = queue.command('read', 'kingdown_games', {});
    const running = queue.run(read, async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    await tick();
    expect(queue.current(read)).toBe(true);
    const mount = queue.chatResult(true);
    expect(mount.options.initial).toBe(true);
    expect(queue.mounting()).toBe(true);
    expect(queue.current(read)).toBe(false);
    await expect(running).resolves.toEqual({ status: 'superseded' });
    hold.resolve();
  });

  it('drops an older detachable write that waits for the lane, and runs a sticky one', async () => {
    const queue = createQueue(), hold = deferred();
    const running = queue.run(queue.command('write', 'kingdown_move', {}), async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    await tick();
    const selection = queue.run(queue.command('write', 'kingdown_resume', {}), body([], 'resume'));
    const sticky = queue.run(queue.command('write', 'kingdown_resign', {}), body([], 'resign'));
    await tick();
    queue.chatResult();
    await expect(selection).resolves.toEqual({ status: 'superseded' });
    hold.resolve(); await running; await tick();
    await expect(sticky).resolves.toEqual({ status: 'done', result: { content: [] } });
  });

  it('lets a user command take the epoch, so an older read is detached and a write is not', async () => {
    const queue = createQueue(), hold = deferred();
    const readJob = queue.command('read', 'kingdown_games', {});
    const read = queue.run(readJob, async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    await tick();
    const command = queue.command('write', 'kingdown_move', {});
    await expect(read).resolves.toEqual({ status: 'superseded' });
    expect(queue.current(readJob)).toBe(false);
    expect(queue.current(command)).toBe(true);
    hold.resolve();
  });

  it('keeps a sticky write current in its own epoch and older, not detached, after a chat result', async () => {
    const queue = createQueue(), hold = deferred();
    const sticky = queue.command('write', 'kingdown_move', {});
    const running = queue.run(sticky, async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    await tick();
    expect(queue.current(sticky)).toBe(true);
    queue.chatResult();
    // A chat result changes the epoch but never detaches a sticky write: it still settles its own pending and refusal.
    expect(queue.current(sticky)).toBe(false);
    expect(sticky.detached).toBe(false);
    hold.resolve();
    await expect(running).resolves.toEqual({ status: 'done', result: { content: [] } });
  });

  it('settles every call once with an outcome and never gives undefined', async () => {
    const queue = createQueue();
    const done = queue.run(queue.command('read', 'kingdown_get', {}), async () => undefined);
    await expect(done).resolves.toEqual({ status: 'done', result: { content: [] } });
    const failed = queue.run(queue.command('read', 'kingdown_get', {}), async () => { throw new Error('The reply was lost.'); });
    await expect(failed).resolves.toEqual({ status: 'failed', text: 'The reply was lost.' });
    const both = await Promise.all([done, failed]);
    expect(both.every(outcome => outcome !== undefined)).toBe(true);
  });

  it('closes the queue: each later call is superseded and the mount stops', async () => {
    const queue = createQueue(), hold = deferred();
    const mount = queue.chatResult();
    const running = queue.run(mount, async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    await tick();
    queue.close();
    expect(queue.closed()).toBe(true);
    expect(queue.mounting()).toBe(false);
    await expect(running).resolves.toEqual({ status: 'superseded' });
    const later = queue.run(queue.command('write', 'kingdown_move', {}), body([], 'move'));
    await expect(later).resolves.toEqual({ status: 'superseded' });
    hold.resolve();
  });

  it('detaches the write that holds the lane when the queue closes', async () => {
    const queue = createQueue(), hold = deferred();
    const job = queue.command('write', 'kingdown_move', {});
    const running = queue.run(job, async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    await tick();
    expect(queue.writing()).toBe(true);
    queue.close();
    // The lane is free and the job is detached, so its body writes nothing more (design §7.6 F4).
    expect(queue.writing()).toBe(false);
    expect(job.detached).toBe(true);
    await expect(running).resolves.toEqual({ status: 'superseded' });
    hold.resolve();
  });

  it('settles a chat result that comes after the queue closed', async () => {
    const queue = createQueue();
    queue.close();
    const mount = queue.chatResult(true);
    expect(queue.mounting()).toBe(false);
    await expect(queue.run(mount, body([], 'mount'))).resolves.toEqual({ status: 'superseded' });
  });

  it('makes no call for a page-board read that waits for the lane when a chat result comes', async () => {
    const queue = createQueue(), hold = deferred();
    const running = queue.run(queue.command('write', 'kingdown_move', {}), async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    await tick();
    let ran = false;
    const read = queue.command('read', 'kingdown_get', {}, { board: true });
    const done = queue.run(read, async () => { ran = true; return { status: 'done', result: { content: [] } }; });
    await tick();
    queue.chatResult(true);
    hold.resolve(); await running; await tick();
    await expect(done).resolves.toEqual({ status: 'superseded' });
    expect(ran).toBe(false);
  });

  it('makes no call for a page-board read that waits for the lane when the queue closes', async () => {
    const queue = createQueue(), hold = deferred();
    const running = queue.run(queue.command('write', 'kingdown_move', {}), async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    await tick();
    let ran = false;
    const done = queue.run(queue.command('read', 'kingdown_get', {}, { board: true }), async () => { ran = true; return { status: 'done', result: { content: [] } }; });
    await tick();
    queue.close();
    hold.resolve(); await running; await tick();
    await expect(done).resolves.toEqual({ status: 'superseded' });
    expect(ran).toBe(false);
  });

  it('counts a write in flight after a chat result detached it, until its body ends', async () => {
    const queue = createQueue(), hold = deferred();
    const write = queue.command('write', 'kingdown_create', {});
    const started = queue.run(write, async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    await tick();
    expect(queue.inflight()).toBe(true);
    queue.chatResult();
    // The lane is free, but the transport call still waits: a mount never resends this command (design §5.3).
    expect(queue.writing()).toBe(false);
    expect(queue.inflight()).toBe(true);
    hold.resolve(); await started; await tick();
    expect(queue.inflight()).toBe(false);
  });

  it('counts no read as a write in flight, and drops a write that a chat result detached before it started', async () => {
    const queue = createQueue(), hold = deferred();
    void queue.run(queue.command('read', 'kingdown_get', {}), body([], 'read'));
    await tick();
    expect(queue.inflight()).toBe(false);
    queue.run(queue.command('write', 'kingdown_move', {}), async () => { await hold.promise; return { status: 'done', result: { content: [] } }; });
    const queued = queue.command('write', 'kingdown_resume', {});
    const waiting = queue.run(queued, body([], 'resume'));
    await tick();
    queue.chatResult();
    await expect(waiting).resolves.toEqual({ status: 'superseded' });
    // The write that holds the lane is still in flight; the one that never started is not.
    expect(queue.inflight()).toBe(true);
    hold.resolve(); await tick();
    expect(queue.inflight()).toBe(false);
  });

  it('runs a queued job body once, and its outcome is read by the caller', async () => {
    const queue = createQueue();
    const ran: Job[] = [];
    const job = queue.command('write', 'kingdown_move', {});
    const outcome = await queue.run(job, async current => { ran.push(current); return { status: 'refused', code: 'STALE_REVISION', text: 'The board changed.', result: { content: [] } }; });
    expect(ran).toEqual([job]);
    expect(outcome).toEqual({ status: 'refused', code: 'STALE_REVISION', text: 'The board changed.', result: { content: [] } });
    expect(job.done).toBe(true);
  });
});


describe('board result text', () => {
  it('reads the full private error notice', () => {
    const message = 'You have 5 games with rowan. Finish one to accept this invitation.';
    expect(resultText({ isError: true, content: [{ type: 'text', text: 'The game limit is reached. See the board for details.' }], _meta: { code: 'FRIEND_GAME_LIMIT', message } })).toBe(message);
  });
  it.each([undefined, null, 5, {}])('reads public text when the private notice is not a string: %s', message => {
    expect(resultText({ isError: true, content: [{ type: 'text', text: 'Retry.' }, { type: 'image' }, { type: 'text', text: 'Reload.' }], _meta: { code: 'FRIEND_GAME_LIMIT', message } })).toBe('Retry. Reload.');
  });
  it.each([
    ['INVALID_MOVE', 'This move is not available. Choose another move.', 'This move is no longer available. Reload and choose a move.'],
    ['STALE_REVISION', 'Your opponent moved. Check the board.', 'Reload the game and retry.'],
  ])('keeps the board text for %s', (code, text, message) => {
    expect(resultText({ isError: true, content: [{ type: 'text', text }], _meta: { code, message } })).toBe(text);
  });
  it('keeps the public text of a successful result', () => {
    expect(resultText({ content: [{ type: 'text', text: 'Game ready.' }], _meta: { message: 'Private data.' } })).toBe('Game ready.');
  });
});
