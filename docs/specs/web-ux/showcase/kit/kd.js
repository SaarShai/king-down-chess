// The KD engine as an ES module: import KD from '../../kit/kd.js';
// It loads kit/kd-engine.js (built by kit/build-engine.mjs), which sets globalThis.KD, and adds
// KD.think(): the computer's move in a Web Worker, so the page stays smooth while it thinks.
import './kd-engine.js';

const KD = globalThis.KD;
if (!KD) throw new Error('kit/kd.js: kit/kd-engine.js did not load. Run: node docs/specs/web-ux/showcase/kit/build-engine.mjs');

const ENGINE_URL = new URL('./kd-engine.js', import.meta.url).href;
let worker = null, broken = false, nextId = 0;
const waiting = new Map();

function getWorker() {
  if (worker || broken) return worker;
  try {
    const src = `importScripts(${JSON.stringify(ENGINE_URL)});
onmessage = e => {
  const { id, game, opts } = e.data;
  let lan = null, error = null;
  try { const s = KD.deserialize(game); const m = KD.ai(s, opts); lan = m ? m.lan : null; }
  catch (x) { error = String(x && x.message || x); }
  postMessage({ id, lan, error });
};`;
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = e => { const w = waiting.get(e.data.id); if (w) { waiting.delete(e.data.id); w(e.data); } };
    worker.onerror = () => { broken = true; worker = null; for (const w of waiting.values()) w({ fallback: true }); waiting.clear(); };
  } catch { broken = true; worker = null; }
  return worker;
}

/**
 * The computer's move for the side to move, as a Promise of a KD.legal() move (null when the game is over).
 * opts: { level: 'beginner' | 'casual' | 'club' | 'strong', ms } (ms: thinking time, 300 to 800 is plenty).
 * It thinks in a worker; where a worker cannot start it thinks on the page after a short pause.
 */
KD.think = function think(state, opts = {}) {
  const { level = 'beginner', ms = 500 } = opts;
  const pick = lan => (lan ? KD.legal(state).find(m => m.lan === lan) ?? null : null);
  const local = () => new Promise(r => setTimeout(() => r(KD.ai(state, { level, ms })), 30));
  const w = getWorker();
  if (!w) return local();
  return new Promise(resolve => {
    const id = ++nextId;
    const timer = setTimeout(() => { waiting.delete(id); resolve(local()); }, ms + 4000);
    waiting.set(id, reply => {
      clearTimeout(timer);
      if (reply.fallback || reply.error) resolve(local());
      else resolve(pick(reply.lan) ?? local());
    });
    w.postMessage({ id, game: KD.serialize(state), opts: { level, ms } });
  });
};

export default KD;
export { KD };
