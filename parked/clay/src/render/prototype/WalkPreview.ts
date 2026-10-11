import * as THREE from 'three';

export type ClayCadence = 'smooth' | 'stopmotion';

export type WalkPreviewOptions = {
  pliable?: boolean;
  cadence?: ClayCadence;
  /** Bone names or patterns that must stay on their authored transform (ground ornaments, etc.). */
  groundedBones?: readonly (string | RegExp)[];
  /** Disable root squash for a profile whose base ornaments already touch the board. */
  squash?: boolean;
};

type SpringBone = {
  bone: THREE.Bone;
  kind: 'body' | 'arm' | 'cloth';
  previous: THREE.Euler;
  applied: THREE.Euler;
  offset: THREE.Euler;
  velocity: THREE.Euler;
};

const STEP = 1 / 12;

function angleDelta(current: number, previous: number): number {
  return Math.atan2(Math.sin(current - previous), Math.cos(current - previous));
}

/** Study playback of the baked foot-contact cycles; each figure owns its mixer.
 * Clay mode adds a small deterministic spring layer after the authored animation.
 * It only touches body, arm and cloth bones; thigh, shin and foot keys stay authored. */
export class WalkPreview {
  readonly mixer: THREE.AnimationMixer;
  readonly action: THREE.AnimationAction;
  private active = false;
  private settling = 0;
  private readonly pliable: boolean;
  private readonly cadence: ClayCadence;
  private readonly groundedBones: readonly (string | RegExp)[];
  private readonly squashEnabled: boolean;
  private readonly baseScale: THREE.Vector3;
  private readonly springs: SpringBone[] = [];
  private squash = 0;
  private squashVelocity = 0;
  private appliedSquash = 0;
  private stepAccumulator = 0;
  private impulseLife = 0;

  constructor(private figure: THREE.Object3D, clip: THREE.AnimationClip, options: WalkPreviewOptions = {}) {
    this.mixer = new THREE.AnimationMixer(figure);
    this.action = this.mixer.clipAction(clip);
    this.pliable = options.pliable ?? false;
    this.cadence = options.cadence ?? 'smooth';
    this.groundedBones = options.groundedBones ?? [];
    this.squashEnabled = options.squash ?? true;
    this.baseScale = figure.scale.clone();
    if (this.pliable) this.collectSprings();
  }

  private collectSprings(): void {
    this.figure.traverse(object => {
      if (!(object as THREE.Bone).isBone) return;
      const rawName = object.name;
      const name = rawName.toLowerCase();
      if (this.isGrounded(rawName)) return;
      let kind: SpringBone['kind'] | null = null;
      if (name === 'body' || name.endsWith('.body')) kind = 'body';
      else if (/^arm[._]?[lr]$/.test(name)) kind = 'arm';
      else if (/^(cloth|skirt)[._]?[lr]$/.test(name) || name === 'tail' || /^tail[._]?[lr]$/.test(name)) kind = 'cloth';
      if (!kind) return;
      const bone = object as THREE.Bone;
      this.springs.push({
        bone,
        kind,
        previous: bone.rotation.clone(),
        applied: new THREE.Euler(),
        offset: new THREE.Euler(),
        velocity: new THREE.Euler(),
      });
    });
  }

  private isGrounded(name: string): boolean {
    const compact = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return this.groundedBones.some(rule => {
      if (typeof rule === 'string') return compact === rule.toLowerCase().replace(/[^a-z0-9]/g, '');
      rule.lastIndex = 0;
      const matchesName = rule.test(name);
      rule.lastIndex = 0;
      if (matchesName) return true;
      const matchesCompact = rule.test(compact);
      rule.lastIndex = 0;
      return matchesCompact;
    });
  }

  play(): void {
    this.active = true;
    this.settling = 0;
    this.stepAccumulator = 0;
    this.action.reset().fadeIn(.22).play();
  }

  stop(): void {
    if (!this.active) return;
    this.action.fadeOut(.22);
    this.settling = .22;
  }

  private removeAppliedSecondary(): void {
    for (const spring of this.springs) {
      spring.bone.rotation.x -= spring.applied.x;
      spring.bone.rotation.y -= spring.applied.y;
      spring.bone.rotation.z -= spring.applied.z;
      spring.applied.set(0, 0, 0);
    }
    if (this.appliedSquash) {
      this.figure.scale.copy(this.baseScale);
      this.appliedSquash = 0;
    }
  }

  private updateSecondary(dt: number): void {
    if (!this.pliable || dt <= 0) return;
    // Keep the spring critically damped enough for 12 fps while allowing a visible
    // overshoot at 60 fps. The input is clamped so a hidden-tab resume cannot explode it.
    const step = Math.min(.08, dt);
    const stiffness = 28;
    const damping = 7.2;
    for (const spring of this.springs) {
      const current = spring.bone.rotation;
      const driveX = angleDelta(current.x, spring.previous.x) / step;
      const driveY = angleDelta(current.y, spring.previous.y) / step;
      const driveZ = angleDelta(current.z, spring.previous.z) / step;
      spring.previous.copy(current);
      const lag = spring.kind === 'cloth' ? .19 : spring.kind === 'arm' ? .14 : .045;
      const targetX = THREE.MathUtils.clamp(-driveX * lag, -.34, .34);
      const targetY = THREE.MathUtils.clamp(-driveY * lag * (spring.kind === 'cloth' ? .55 : 1), -.26, .26);
      const targetZ = THREE.MathUtils.clamp(-driveZ * lag, -.34, .34);
      spring.velocity.x += (targetX - spring.offset.x) * stiffness * step;
      spring.velocity.y += (targetY - spring.offset.y) * stiffness * step;
      spring.velocity.z += (targetZ - spring.offset.z) * stiffness * step;
      const drag = Math.exp(-damping * step);
      spring.velocity.x *= drag;
      spring.velocity.y *= drag;
      spring.velocity.z *= drag;
      spring.offset.x = THREE.MathUtils.clamp(spring.offset.x + spring.velocity.x * step, -.22, .22);
      spring.offset.y = THREE.MathUtils.clamp(spring.offset.y + spring.velocity.y * step, -.16, .16);
      spring.offset.z = THREE.MathUtils.clamp(spring.offset.z + spring.velocity.z * step, -.22, .22);
      this.applySpringOffset(spring);
    }

    // The target pulses at footfall, then recovers. Inverse square-root widening keeps
    // approximate volume while the model's origin stays on the board plane.
    const phase = (this.action.time / this.action.getClip().duration) % 1;
    if (this.squashEnabled) {
      const targetSquash = -0.075 * Math.max(0, Math.sin(phase * Math.PI * 2));
      this.squashVelocity += (targetSquash - this.squash) * 22 * step;
      this.squashVelocity *= Math.exp(-5.6 * step);
      this.squash += this.squashVelocity * step;
      this.applySquash();
    }
  }

  private applySquash(): void {
    const y = Math.max(.86, 1 + this.squash);
    const xz = 1 / Math.sqrt(y);
    this.figure.scale.set(this.baseScale.x * xz, this.baseScale.y * y, this.baseScale.z * xz);
    this.appliedSquash = this.squash;
  }

  private applySpringOffset(spring: SpringBone): void {
    spring.bone.rotation.x += spring.offset.x;
    spring.bone.rotation.y += spring.offset.y;
    spring.bone.rotation.z += spring.offset.z;
    spring.applied.copy(spring.offset);
  }

  /** Give an idle clay figure one small, damped nudge. This is an authored spring impulse,
   * not a collision solver; it always returns to the exact imported pose. The same impulse
   * can be applied during a walk so a live preview does not make the control a no-op. */
  poke(): void {
    if (!this.pliable) return;
    if (!this.active) this.impulseLife = 1.6;
    for (const spring of this.springs) {
      const amount = spring.kind === 'cloth' ? 1.15 : spring.kind === 'arm' ? .78 : .36;
      spring.velocity.x += amount;
      spring.velocity.z -= amount * .45;
    }
    if (this.squashEnabled) this.squashVelocity -= .95;
  }

  private updateImpulse(dt: number): void {
    if (this.impulseLife <= 0) return;
    // Small integration steps make the idle poke a damped spring with an actual
    // rebound across rest, including when a frame takes longer than 1/60 second.
    let remaining = Math.min(.25, dt);
    while (remaining > 1e-6) {
      const step = Math.min(1 / 120, remaining);
      remaining -= step;
      const drag = Math.exp(-8 * step);
      for (const spring of this.springs) {
        for (const axis of ['x', 'y', 'z'] as const) {
          spring.velocity[axis] = (spring.velocity[axis] - spring.offset[axis] * 90 * step) * drag;
          spring.offset[axis] += spring.velocity[axis] * step;
        }
      }
      if (this.squashEnabled) {
        this.squashVelocity = (this.squashVelocity - this.squash * 90 * step) * drag;
        this.squash += this.squashVelocity * step;
      }
      this.impulseLife -= step;
    }
    for (const spring of this.springs) this.applySpringOffset(spring);
    if (this.squashEnabled) this.applySquash();
    if (this.impulseLife <= 0) this.reset();
  }

  update(dt: number): void {
    if (!this.active && this.impulseLife <= 0) return;
    if (!this.active) {
      this.removeAppliedSecondary();
      this.updateImpulse(dt);
    } else if (this.cadence === 'stopmotion') {
      this.stepAccumulator += Math.min(.25, dt);
      if (this.stepAccumulator >= STEP) {
        const advance = this.stepAccumulator - (this.stepAccumulator % STEP);
        this.stepAccumulator %= STEP;
        this.removeAppliedSecondary();
        this.mixer.update(advance);
        this.updateSecondary(advance);
      }
    } else {
      this.removeAppliedSecondary();
      this.mixer.update(dt);
      this.updateSecondary(dt);
    }
    if (this.settling > 0 && (this.settling -= dt) <= 0) this.reset();
  }

  reset(): void {
    this.removeAppliedSecondary();
    this.mixer.stopAllAction();
    this.active = false;
    this.settling = 0;
    this.squash = 0;
    this.squashVelocity = 0;
    this.stepAccumulator = 0;
    this.impulseLife = 0;
    for (const spring of this.springs) {
      spring.offset.set(0, 0, 0);
      spring.velocity.set(0, 0, 0);
      spring.previous.copy(spring.bone.rotation);
    }
  }

  dispose(): void {
    this.reset();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}
