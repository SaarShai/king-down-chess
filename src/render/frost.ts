import { colorOf, markKind, type Color, type Position } from '../rules/engine';
import { LEG } from './legend';
const n = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const moon = (x: number, y: number, size: number, color: string, width: number) =>
  `<svg x="${n(x)}" y="${n(y)}" width="${n(size)}" height="${n(size)}" viewBox="0 0 24 24" overflow="visible"><path d="M15.5 4a8.5 8.5 0 1 0 4.8 13.6A7 7 0 0 1 15.5 4z" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function frozenPieces(pos: Position | null): { sq: number; turns: number }[] {
  return (pos?.marks ?? []).flatMap((mark, by) => {
    const code = mark && pos!.board[mark.sq], turns = mark?.left ?? 1;
    return mark && !mark.all && code && turns > 0 && colorOf(code) !== by
      && markKind(colorOf(code), by as Color, mark.ward) === 'frozen' ? [{ sq: mark.sq, turns }] : [];
  });
}

export const FROST_DEFS = '<radialGradient id="kdm-frost"><stop offset="0" stop-color="rgb(127,178,255)" stop-opacity=".6"/><stop offset=".55" stop-color="rgb(127,178,255)" stop-opacity=".35"/><stop offset="1" stop-color="rgb(127,178,255)" stop-opacity="0"/></radialGradient>'
  + '<pattern id="kdm-crystal" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 3.5h7M3.5 0v7" stroke="rgba(255,255,255,.55)" stroke-width=".6"/></pattern>';

/** Freeze on a square (frostOverlay, baseRing and ringPips, marks.js:573-595): the frost and a blue ring under the piece, and
 *  over it one moon pip for each turn left. */
export function frost(x: number, y: number, s: number, turns: number): [string, string] {
  const cx = x + s / 2, cy = y + 0.9 * s, rx = 0.36 * s, ry = 0.11 * s, d = clamp(0.17 * s, 10, 15);
  const under = `<rect x="${n(x + 1)}" y="${n(y + 1)}" width="${n(s - 2)}" height="${n(s - 2)}" rx="${n(0.06 * s)}" fill="url(#kdm-frost)"/>`
    + `<rect x="${n(x + 0.12 * s)}" y="${n(y + 0.12 * s)}" width="${n(0.76 * s)}" height="${n(0.76 * s)}" rx="${n(0.1 * s)}" fill="url(#kdm-crystal)" opacity=".8"/>`
    + `<rect x="${n(x + 2)}" y="${n(y + 2)}" width="${n(s - 4)}" height="${n(s - 4)}" rx="${n(0.06 * s)}" fill="none" stroke="rgba(227,240,255,.9)" stroke-width="1.5"/>`
    + `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="rgba(127,178,255,.25)" stroke="${LEG.power}" stroke-width="3.5"/><ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="none" stroke="${LEG.powerMid}" stroke-width="2"/>`;
  const over = Array.from({ length: turns }, (_, i) => {
    const px = cx + (i - (turns - 1) / 2) * (d + 2), py = cy + 0.11 * s;
    return `<circle cx="${n(px)}" cy="${n(py)}" r="${n(d / 2)}" fill="#e3f0ff" stroke="${LEG.power}" stroke-width="1.5"/>` + moon( px - d * 0.34, py - d * 0.34, d * 0.68, LEG.power, 2.6);
  }).join('');
  return [under, over];
}
