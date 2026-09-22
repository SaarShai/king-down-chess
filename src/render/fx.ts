/** Tiny tween scheduler and a voxel-debris particle burst (InstancedMesh). */
import * as THREE from 'three';

export type Ease = (t: number) => number;
export const easeOut: Ease = t => 1 - (1 - t) ** 3;
export const easeInOut: Ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const linear: Ease = t => t;

const labelMats = new Map<string, THREE.SpriteMaterial>();

/** Letter chip that floats over a piece: black on paper, 2 px border. One texture per letter. */
export function labelSprite(letter: string, size = 0.32): THREE.Sprite {
  let mat = labelMats.get(letter);
  if (!mat) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 32;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#151515';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#f1e9d6';
    ctx.fillRect(2, 2, 28, 28);
    ctx.fillStyle = '#151515';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 16, 17);
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    mat = new THREE.SpriteMaterial({ map: tex });
    labelMats.set(letter, mat);
  }
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(size); // ortho camera: sizeAttenuation keeps this a fixed world size
  return s;
}

interface Tween { t: number; dur: number; ease: Ease; update: (k: number) => void; resolve: () => void }

export class Tweens {
  private list: Tween[] = [];
  constructor() {
    // rAF stops in a hidden tab, so a tween started or running there would never resolve and the game
    // loop (which awaits animations) would stall. Finish everything instantly while hidden.
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) this.flush(); });
  }
  /** Runs `update(k)` with eased k ∈ [0,1] every frame for `dur` seconds; resolves when done (update(1) guaranteed). */
  add(dur: number, update: (k: number) => void, ease: Ease = easeInOut): Promise<void> {
    if (typeof document !== 'undefined' && document.hidden) { update(1); return Promise.resolve(); }
    return new Promise(resolve => this.list.push({ t: 0, dur, ease, update, resolve }));
  }
  /** Jump every pending tween to its end state and resolve it. */
  flush(): void {
    const pending = this.list; this.list = [];
    for (const tw of pending) { tw.update(1); tw.resolve(); }
  }
  wait(dur: number): Promise<void> { return this.add(dur, () => {}, linear); }
  step(dt: number): void {
    for (const tw of [...this.list]) {
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      tw.update(tw.ease(k));
      if (k >= 1) { this.list.splice(this.list.indexOf(tw), 1); tw.resolve(); }
    }
  }
}

export class Debris {
  readonly mesh: THREE.InstancedMesh;
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private cursor = 0;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private p = new THREE.Vector3();

  constructor(parent: THREE.Object3D, readonly max = 400) {
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), new THREE.MeshLambertMaterial(), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.visible = false;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    for (let i = 0; i < max; i++) this.mesh.setMatrixAt(i, this.m.makeScale(0, 0, 0));
    this.mesh.setColorAt(0, new THREE.Color(0xffffff)); // allocates instanceColor
    parent.add(this.mesh);
  }

  burst(at: THREE.Vector3, colors: number[], count = 28, speed = 3): void {
    const c = new THREE.Color();
    for (let n = 0; n < count; n++) {
      const i = this.cursor = (this.cursor + 1) % this.max;
      this.pos.set([at.x + (Math.random() - 0.5) * 0.3, at.y + Math.random() * 0.6, at.z + (Math.random() - 0.5) * 0.3], i * 3);
      const a = Math.random() * Math.PI * 2, r = (0.4 + Math.random() * 0.6) * speed;
      this.vel.set([Math.cos(a) * r, 2 + Math.random() * speed, Math.sin(a) * r], i * 3);
      this.life[i] = 0.6 + Math.random() * 0.5;
      this.mesh.setColorAt(i, c.setHex(colors[n % colors.length]));
    }
    this.mesh.instanceColor!.needsUpdate = true;
  }

  step(dt: number): void {
    let changed = false, liveEnd = 0;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      changed = true;
      const o = i * 3;
      this.vel[o + 1] -= 12 * dt;
      this.pos[o] += this.vel[o] * dt; this.pos[o + 1] += this.vel[o + 1] * dt; this.pos[o + 2] += this.vel[o + 2] * dt;
      if (this.pos[o + 1] < 0.035) { this.pos[o + 1] = 0.035; this.vel[o + 1] *= -0.35; this.vel[o] *= 0.6; this.vel[o + 2] *= 0.6; }
      this.life[i] -= dt;
      if (this.life[i] > 0) liveEnd = i + 1;
      const k = Math.max(0, Math.min(1, this.life[i] / 0.3));
      this.m.compose(this.p.set(this.pos[o], this.pos[o + 1], this.pos[o + 2]), this.q, this.s.setScalar(k));
      this.mesh.setMatrixAt(i, this.m);
    }
    // Trim the unused tail; dead slots inside the bounded ring remain zero-size.
    this.mesh.count = liveEnd;
    this.mesh.visible = liveEnd > 0;
    if (changed) this.mesh.instanceMatrix.needsUpdate = true;
  }
}
