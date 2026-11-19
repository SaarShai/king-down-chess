import type { GameRules } from '../../game-rules';
import type { Pace, PaintedView } from '../../render/PaintedView';
import { K, NAMES, PLAIN_KINGS, colorOf, typeOf, type Position } from '../../rules/engine';
import type { LoadedPack } from './art';
import { dissolves, kings, loadMoment, pieces, playBow, playCollapse, type Army, type CollapseTarget } from './painted';

const captureKey = (kind: string, army: Army) => `collapse/${kind}/${army}`;
const bowKey = (king: string, army: Army) => `bow/${king}/${army}`;
const armyOf = (value: number): Army => colorOf(value) ? 'black' : 'white';
const kingOf = (rules: GameRules, side: 0 | 1) =>
  (rules.rules.kings[side]?.king ?? PLAIN_KINGS[side]).toLowerCase() as typeof kings[number];

export function boardMoments(layer: HTMLElement, view: PaintedView) {
  const captures = new Set<ReturnType<typeof playCollapse>>();
  let bow: ReturnType<typeof playBow> | undefined;
  let banks = new Map<string, LoadedPack | null>();
  let wanted: string[] = [], queued = false, disposed = false;

  function warm() {
    queued = false;
    if (disposed) return;
    const round = banks;
    for (const key of wanted) {
      if (round.has(key)) continue;
      round.set(key, null);
      void loadMoment(key).then(pack => { round.set(key, pack); }, () => { round.delete(key); });
    }
  }

  function preload(position: Position, rules: GameRules) {
    const keys = new Set<string>();
    for (const value of position.board) {
      if (!value) continue;
      const type = typeOf(value), kind = NAMES[type], army = armyOf(value);
      if (type === K) keys.add(bowKey(kingOf(rules, colorOf(value)), army));
      else if (pieces.some(piece => piece === kind)) keys.add(captureKey(kind, army));
    }
    wanted = [...keys];
    if (queued || wanted.every(key => banks.has(key))) return;
    queued = true;
    // The first draw and the host's reveal both run before the first art request.
    void view.ready().then(() => requestAnimationFrame(() => {
      if (typeof requestIdleCallback === 'function') requestIdleCallback(warm, { timeout: 800 });
      else setTimeout(warm, 0);
    }));
  }

  function target(square: number, motion: CollapseTarget['motion'], snapshot = false): CollapseTarget | undefined {
    const figure = view.momentFigure(square, snapshot);
    if (!figure) return;
    const scale = () => layer.getBoundingClientRect().width / 960;
    const from = figure.from;
    return {
      layer, motion,
      measure() {
        const k = scale();
        return { x: figure.x * k, y: figure.y * k, width: 0, height: 0, bodyHeight: figure.bodyHeight * k };
      },
      from: from && {
        image: from.image,
        get rect() {
          const k = scale(), { x, y, width, height } = from.rect;
          return { x: x * k, y: y * k, width: width * k, height: height * k };
        },
      },
      clock(draw) {
        const start = view.time;
        let id = requestAnimationFrame(tick);
        function tick() {
          id = requestAnimationFrame(tick);
          draw(view.time - start);
        }
        return () => cancelAnimationFrame(id);
      },
    };
  }

  function skipCaptures() {
    for (const capture of captures) capture.skip();
    captures.clear();
  }

  return {
    preload,
    resetArt() { banks = new Map(); },
    capture(square: number, kind: string, army: Army, pace: Exclude<Pace, 'off'>, replace: () => boolean) {
      const pack = banks.get(captureKey(kind, army));
      if (!pack) return;
      const box = target(square, pace, dissolves(kind));
      if (!box) return;
      let adopted = false;
      const capture = playCollapse(kind, army, { ...box, onReady: () => { adopted = replace(); } }, pack);
      if (!adopted) { capture.dispose(); return; }
      captures.add(capture);
      void capture.finished.then(() => captures.delete(capture));
    },
    bow(square: number, value: number, rules: GameRules, motion: CollapseTarget['motion']) {
      const king = kingOf(rules, colorOf(value)), army = armyOf(value), pack = banks.get(bowKey(king, army));
      if (!pack) return;
      const box = target(square, motion);
      if (!box) return;
      let adopted = false;
      const next = playBow(king, army, { ...box, onReady: () => { adopted = true; } }, pack);
      if (!adopted) { next.dispose(); return; }
      bow?.dispose();
      bow = next;
      return bow;
    },
    skipCaptures,
    skipBow() { bow?.skip(); },
    clearBow() { bow?.dispose(); bow = undefined; },
    dispose() { disposed = true; banks.clear(); this.clearBow(); skipCaptures(); },
  };
}
