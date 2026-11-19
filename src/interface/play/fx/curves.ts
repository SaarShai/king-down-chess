import type { Curve } from './index';

function bezier(x1: number, y1: number, x2: number, y2: number): Curve {
  const axis = (t: number, a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  return x => {
    if (x === 0 || x === 1) return x;
    let low = 0, high = 1;
    for (let i = 0; i < 16; i++) {
      const t = (low + high) / 2;
      if (axis(t, x1, x2) < x) low = t;
      else high = t;
    }
    return axis((low + high) / 2, y1, y2);
  };
}

export const ease = {
  EASE: bezier(.2, .8, .2, 1),
  OVER: bezier(.2, .9, .3, 1.25),
  lin: (t: number) => t,
  out2: (t: number) => 1 - (1 - t) ** 2,
  out3: (t: number) => 1 - (1 - t) ** 3,
  in2: (t: number) => t ** 2,
  in3: (t: number) => t ** 3,
  io3: (t: number) => t < .5 ? 4 * t ** 3 : 1 - 4 * (1 - t) ** 3,
  back: (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
};

export class Spring {
  to: number;
  v = 0;
  constructor(public x = 0, private k = 300, private d = 20) { this.to = x; }

  step(deltaMs: number): number {
    for (let left = deltaMs; left > 0;) {
      const ms = Math.min(left, 8), dt = ms / 1000;
      this.v -= (this.k * (this.x - this.to) + this.d * this.v) * dt;
      this.x += this.v * dt;
      left -= ms;
    }
    if (this.still) this.snap(this.to);
    return this.x;
  }

  get still(): boolean { return Math.abs(this.x - this.to) < .0015 && Math.abs(this.v) < .02; }
  snap(x: number): void { this.x = this.to = x; this.v = 0; }
}
