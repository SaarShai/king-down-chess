// Shot contract (every file in shots/ follows it):
//   export async function create(params, env) -> draw(t)
//   env = { fx, over, layer, W, H, dur }: fx/over are 2D contexts of full-frame canvases below/above
//   the DOM `layer` (for CSS 3D cards). draw(t) renders local time t in [0, dur] and must be pure in t.
// Load art in create(); draw() must never await. Finish with runtime.finish(ctx, t) for grain + letterbox.
import { W, H, finish } from '../runtime.mjs';
export async function create(params, { fx }) {
  return t => { fx.clearRect(0, 0, W, H); fx.fillStyle = '#111'; fx.fillRect(0, 0, W, H); finish(fx, t); };
}
