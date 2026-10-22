// The one command lane and the one epoch gate (design §1.2 and §2, ticket 19 S3). A write runs on the
// lane, first in first out and one at a time. A read runs beside the lane, and waits only when it is a
// read of the page board. Each job keeps the epoch it started in; a newer chat result or user command
// makes an older job stale, and an older job writes only what the older-job rules allow.
import { errorText, type Screen } from '../account-game/types';
import type { View } from '../match/protocol';
import type { KingChoice } from '../rules/rules';

/** A tool result, as the transport gives it. */
export type ToolResult = { isError?: boolean; content: { type: string; text?: string }[]; _meta?: Record<string, unknown>; structuredContent?: unknown };

/** One call's whole result. It is never `undefined`, and each promise settles once (design §2). */
export type Outcome =
  | { status: 'done'; result: ToolResult; view?: unknown }
  | { status: 'refused'; code: string; text: string; result: ToolResult; view?: unknown }
  | { status: 'failed'; code?: string; text: string }
  | { status: 'superseded' };

export type Kind = 'read' | 'write';

export type JobOptions = {
  origin?: Job;
  king?: KingChoice | null;
  /** A step of a start: its state.pending keeps the start's screen and quick start, also after the player leaves (design §5.2). */
  screen?: Screen;
  quick?: boolean;
  then?: (view: View, origin: Job) => Promise<unknown>;
  retain?: boolean;
  quiet?: boolean;
  route?: boolean;
  retry?: boolean;
  user?: boolean;
  mount?: boolean;
  initial?: boolean;
  board?: boolean;
  signal?: AbortSignal;
};

/** A call the player starts: not a poll, a mount, a programmatic write or a step of an earlier job (design §2). */
export const userCommand = (options: JobOptions) => options.user !== false && !options.quiet && !options.mount && !options.origin;

export type Job = {
  kind: Kind;
  name: string;
  args: Record<string, unknown>;
  options: JobOptions;
  epoch: number;
  /** A sticky write changes a game or the account; a newer chat result never detaches it. */
  sticky: boolean;
  detached: boolean;
  started: boolean;
  done: boolean;
  promise: Promise<Outcome>;
  resolve: (outcome: Outcome) => void;
  release: () => void;
};

/** A selection or a start: a newer chat result detaches it at once (design §2). */
export const DETACHABLE = ['kingdown_open', 'kingdown_resume', 'kingdown_join', 'kingdown_accept', 'kingdown_find', 'kingdown_create'];

/** The definitive refusals; every other error is `failed` (design §2 outcome map). */
export const REFUSALS = ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'INVALID_INPUT', 'NOT_ALLOWED', 'FORBIDDEN', 'WAITING', 'MATCH_TERMINAL', 'MATCH_LIMIT', 'MATCH_INCOMPATIBLE', 'MATCH_REMOVED', 'COMMAND_CONFLICT', 'NOT_FOUND', 'INVITE_UNAVAILABLE', 'RATE_LIMITED', 'RANKED_UNAVAILABLE'];

export const EMPTY: ToolResult = { content: [] };
export const resultText = (result: ToolResult) => result.content.filter(part => part.type === 'text').map(part => part.text ?? '').join(' ');
/** The code of a refusal or a failure (HANDLE_NEEDED is a failure with a code, design §2). */
export const resultCode = (result: ToolResult) => String(result._meta?.code ?? '');

export function createQueue() {
  let epoch = 0, closed = false;
  /** The write that holds the lane now. */
  let running: Job | undefined;
  /** The writes that wait for the lane, in order. */
  const line: Job[] = [];
  /** The reads in flight. They run beside the lane. */
  const reads = new Set<Job>();
  /** The mount job of the newest chat result. */
  let mount: Job | undefined;
  /** The page-board reads that wait for an idle lane. */
  const idleWaiters: (() => void)[] = [];
  /** The writes and retained reads whose body has not ended. A mount never resends one of these (design §5.3). */
  let inFlight = 0;

  const make = (kind: Kind, name: string, args: Record<string, unknown>, options: JobOptions): Job => {
    let resolve!: (outcome: Outcome) => void;
    return {
      kind, name, args, options, epoch: options.origin?.epoch ?? epoch,
      sticky: kind === 'write' && !DETACHABLE.includes(name),
      detached: false, started: false, done: false,
      promise: new Promise<Outcome>(settle => { resolve = settle; }),
      resolve, release: () => {},
    };
  };
  /** Ends a job once. A detached job keeps running, but its later work writes nothing (the epoch gate). */
  function settle(job: Job, outcome: Outcome) {
    if (job.done) return;
    job.done = true; job.resolve(outcome);
    if (running === job) { running = undefined; pump(); flushIdle(); }
  }
  const detach = (job: Job) => { if (!job.done) { job.detached = true; if (!job.started) job.release(); settle(job, { status: 'superseded' }); } };
  /** Wakes every page-board read that waits for an idle lane. */
  function flushIdle() { if (!running) idleWaiters.splice(0).forEach(resolve => resolve()); }
  /** Starts the next waiting write; a detached one gives up its place. */
  function pump() {
    while (!running) {
      const job = line.shift();
      if (!job) return;
      if (job.detached || job.done) continue;
      running = job; job.started = true; job.release();
    }
  }
  /** A newer chat result: a new epoch, and every older read and detachable write detaches at once. */
  function chatResult(initial = false): Job {
    // A teardown already ran: the mount job is settled at once, so a late result never hangs a caller (design §2, close).
    if (closed) { const job = make('read', 'mount', {}, { mount: true, initial }); settle(job, { status: 'superseded' }); return job; }
    epoch++;
    for (const job of [...reads]) if (job.epoch < epoch) detach(job);
    for (const job of line) if (!job.sticky) detach(job);
    if (running && !running.sticky) detach(running);
    const job = make('read', 'mount', {}, { mount: true, initial });
    mount = job;
    return job;
  }
  /** A user command: a new epoch, and every older read detaches. A write is untouched (design §2). */
  function command(kind: Kind, name: string, args: Record<string, unknown>, options: JobOptions = {}): Job {
    if (closed) { const job = make(kind, name, args, options); settle(job, { status: 'superseded' }); return job; }
    if (userCommand(options)) { epoch++; for (const job of [...reads]) if (job.epoch < epoch) detach(job); }
    return make(kind, name, args, options);
  }
  /** Runs one job's body. A write waits for the lane; a read of the page board waits for an idle lane. */
  async function run(job: Job, body: (job: Job) => Promise<Outcome | void>): Promise<Outcome> {
    if (closed || job.done) return job.promise;
    const retainedRead = job.kind === 'read' && job.options.retain;
    if (job.kind === 'write') {
      inFlight++;
      await new Promise<void>(resolve => { job.release = resolve; line.push(job); pump(); });
      if (job.detached || job.done) { inFlight--; return job.promise; }
    } else {
      if (retainedRead) inFlight++;
      // The read joins the set before it waits, so a newer chat result or a teardown detaches it also while it waits
      // for the lane (design §2 and §7.6 F4).
      reads.add(job);
      if (job.options.board && !job.detached && !closed) await laneIdle();
      if (job.detached || closed) { reads.delete(job); if (retainedRead) inFlight--; return job.promise; }
    }
    // The body runs on its own: a detached job settles at once (the epoch gate), and the body's later work writes
    // nothing. So the caller reads the outcome from the job, never from the body's return.
    void (async () => {
      try { settle(job, (await body(job)) ?? { status: 'done', result: EMPTY }); }
      catch (error) { settle(job, { status: 'failed', text: errorText(error) }); }
      finally { if (job.kind === 'write' || retainedRead) inFlight--; if (job.kind === 'read') reads.delete(job); if (mount === job && job.done) mount = undefined; }
    })();
    return job.promise;
  }
  /** A read of the page board waits until the lane is idle (design §2). */
  const laneIdle = () => running ? new Promise<void>(resolve => idleWaiters.push(resolve)) : Promise.resolve();
  function close() {
    closed = true;
    for (const job of [...reads]) detach(job);
    for (const job of line) detach(job);
    // The write that holds the lane stops too. Its transport call cannot be recalled, but its body writes nothing more
    // (the app's `late()` reads `closed`), so no render and no widget write follows the teardown (design §7.6 F4).
    if (running) detach(running);
    if (mount && !mount.done) detach(mount);
    flushIdle();
  }
  return {
    /** A current job is of the newest epoch and not detached. Only it writes a route, a board or a screen. */
    current: (job: Job) => !closed && job.epoch === epoch && !job.detached,
    /** The older-job rules let a write settle its own pending and show its own refusal. */
    writing: () => !!running,
    /** A write or retained read still in flight: a mount never resends it in this frame (design §5.3). */
    inflight: () => inFlight > 0,
    mounting: () => !!mount && !mount.done && mount.epoch === epoch,
    /** The mount job of the newest chat result; a mount's `initial` flag marks the first one. */
    mountJob: () => mount && mount.epoch === epoch ? mount : undefined,
    closed: () => closed,
    epoch: () => epoch,
    command, chatResult, run, close,
    /** The lane is idle when no write holds it. */
    idle: laneIdle,
  };
}
