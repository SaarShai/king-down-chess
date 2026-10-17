// Layout assert messages (ticket 25 a): a "fits at" fault names the measured boxes,
// so a reader can tell a real overflow from a frame-timing flake.
const n = (v) => (typeof v === 'number' ? String(Math.round(v * 10) / 10) : String(v));
export function boxText(name, box) {
  return `${name} {left ${n(box.left)}, right ${n(box.right)}, top ${n(box.top)}, bottom ${n(box.bottom)}, width ${n(box.width)}}`;
}
export function layoutMessage(what, width, element, frame, extra = '') {
  return `${what} fits at ${width}px: ${boxText('element', element)}; ${boxText('frame', frame)}${extra ? `; ${extra}` : ''}`;
}
