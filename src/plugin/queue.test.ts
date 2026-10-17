// The one command lane and the one epoch gate (design §1.2 and §2, ticket 19 S3). The bodies stand in for a
// transport call: each one is a promise the test holds and releases, so the order and the detach are facts.
import { describe, expect, it } from 'vitest';
import { createQueue, type Job } from './queue';

const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));
function deferred() { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; }
const body = (order: string[], name: string) => async () => { order.push(name); return { status: 'done' as const, result: { content: [] } }; };

describe('the command queue', () => {
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
