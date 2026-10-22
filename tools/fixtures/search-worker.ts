import { Engine, Game } from '../../src/game';
import { DEFAULT_RULES, POWERS_BALANCED, RULES_2017, parseKings } from '../../src/rules/rules';
import { fromFen, toFen, toLan } from '../../src/rules/setup';
import { setEvaluator } from '../../src/ai/eval';

setEvaluator('residual');

// Observe the real compiled worker without replacing its search or its message handling.
const NativeWorker = window.Worker;
const events: { kind: string; worker: number; data?: unknown }[] = [];
const workers: Worker[] = [];
class ObservedWorker extends NativeWorker {
  private serial: number;
  constructor(url: string | URL, options?: WorkerOptions) {
    super(url, options);
    this.serial = workers.push(this);
    events.push({ kind: 'spawn', worker: this.serial });
    this.addEventListener('message', event => events.push({ kind: 'reply', worker: this.serial, data: event.data }));
  }
  override postMessage(data: unknown): void {
    events.push({ kind: 'request', worker: this.serial, data: structuredClone(data) });
    super.postMessage(data);
  }
  override terminate(): void {
    events.push({ kind: 'terminate', worker: this.serial });
    super.terminate();
  }
}
window.Worker = ObservedWorker;
const probe = { Engine, Game, DEFAULT_RULES, POWERS_BALANCED, RULES_2017, parseKings, fromFen, toFen, toLan, events,
  stop: () => workers.forEach(worker => worker.terminate()),
  inline: () => { window.Worker = undefined as unknown as typeof Worker; },
};
declare global { interface Window { searchProbe: typeof probe } }
window.searchProbe = probe;
