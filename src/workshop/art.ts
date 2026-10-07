/**
 * The Workshop's art as HTML strings (docs/WORKSHOP.md §5.1, §5.4): the bare figure from the approved
 * Workshop cast, and the thermometer. The decoration is aria-hidden.
 */
import { figureUrl } from './figures';
import { type StageLook } from './look';
import { pawns } from './text';
import { bandOf, type Verdict } from './judge';

/** The figure of the approved cast, in the army's colour. */
export const figureHtml = (l: Pick<StageLook, 'figure' | 'army'>, cls = 'ws-fig'): string =>
  `<img class="${cls}" src="${figureUrl(l.figure, l.army)}" alt="" decoding="async" />`;

/** The whole model (§5.1): the figure alone. The caller wraps it in an aria-hidden stage. */
export function modelHtml(l: StageLook): string {
  return `<div class="ws-model ws-bare">${figureHtml(l)}</div>`;
}

/* ---- the thermometer (§2.4 W3): 0–10 pawns, the fair band shaded; its value text has the words of the summary ---- */

export function gaugeHtml(v: Verdict): string {
  const value = Math.min(10, Math.max(0, v.worth.point));
  return `<div class="ws-gauge ws-thermometer" role="meter" aria-label="Estimated worth in pawns" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${+value.toFixed(1)}" aria-valuetext="about ${pawns(v.worth.point)}, ${bandOf(v).toLowerCase()}"><span class="ws-temp-scale" aria-hidden="true"><span>10+</span><span>5</span><span>0</span></span><span class="ws-temp-tube" aria-hidden="true"><span class="ws-temp-fair"></span><span class="ws-temp-fill" style="height:${value * 10}%"></span></span><span class="ws-temp-bulb" aria-hidden="true"></span></div>`;
}
