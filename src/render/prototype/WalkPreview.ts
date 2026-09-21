import * as THREE from 'three';

export type ClayCadence = 'smooth' | 'stopmotion';

export type WalkPreviewOptions = {
  pliable?: boolean;
  cadence?: ClayCadence;
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
    this.baseScale = figure.scale.clone();
    if (this.pliable) this.collectSprings();
  }

  private collectSprings(): void {
    this.figure.traverse(object => {
      if (!(object as THREE.Bone).isBone) return;
      const name = object.name.toLowerCase();
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
    const stiffness = 18;
    const damping = 8.5;
    for (const spring of this.springs) {
      const current = spring.bone.rotation;
      const drive = new THREE.Vector3(
        angleDelta(current.x, spring.previous.x) / dt,
        angleDelta(current.y, spring.previous.y) / dt,
        angleDelta(current.z, spring.previous.z) / dt,
      );
      spring.previous.copy(current);
      const lag = spring.kind === 'cloth' ? .11 : spring.kind === 'arm' ? .075 : .028;
      const target = spring.kind === 'cloth'
        ? new THREE.Vector3(-drive.x * lag, -drive.y * lag * .55, -drive.z * lag)
        : spring.kind === 'arm'
          ? new THREE.Vector3(-drive.x * lag * .7, -drive.y * lag, -drive.z * lag)
          : new THREE.Vector3(-drive.x * lag, 0, -drive.z * lag * .5);
      spring.velocity.x += (target.x - spring.offset.x) * stiffness * dt;
      spring.velocity.y += (target.y - spring.offset.y) * stiffness * dt;
      spring.velocity.z += (target.z - spring.offset.z) * stiffness * dt;
      const drag = Math.exp(-damping * dt);
      spring.velocity.x *= drag;
      spring.velocity.y *= drag;
      spring.velocity.z *= drag;
      spring.offset.x = THREE.MathUtils.clamp(spring.offset.x + spring.velocity.x * dt, -.16, .16);
      spring.offset.y = THREE.MathUtils.clamp(spring.offset.y + spring.velocity.y * dt, -.12, .12);
      spring.offset.z = THREE.MathUtils.clamp(spring.offset.z + spring.velocity.z * dt, -.16, .16);
      this.applySpringOffset(spring);
    }

    // The target pulses at footfall, then recovers. Inverse square-root widening keeps
    // approximate volume while the model's origin stays on the board plane.
    const phase = (this.action.time / this.action.getClip().duration) % 1;
    const targetSquash = -0.038 * Math.max(0, Math.sin(phase * Math.PI * 2));
    this.squashVelocity += (targetSquash - this.squash) * 15 * dt;
    this.squashVelocity *= Math.exp(-10 * dt);
    this.squash += this.squashVelocity * dt;
    const y = Math.max(.9, 1 + this.squash);
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
   * not a collision solver; it always returns to the exact imported pose. */
  poke(): void {
    if (!this.pliable || this.active) return;
    this.impulseLife = .62;
    for (const spring of this.springs) {
      const amount = spring.kind === 'cloth' ? .42 : spring.kind === 'arm' ? .25 : .12;
      spring.velocity.x += amount;
      spring.velocity.z -= amount * .45;
    }
    this.squashVelocity -= .34;
  }

  private updateImpulse(dt: number): void {
    if (this.impulseLife <= 0) return;
    const drag = Math.exp(-9 * dt);
    for (const spring of this.springs) {
      spring.velocity.x *= drag;
      spring.velocity.y *= drag;
      spring.velocity.z *= drag;
      spring.offset.x += spring.velocity.x * dt;
      spring.offset.y += spring.velocity.y * dt;
      spring.offset.z += spring.velocity.z * dt;
      const settle = Math.exp(-3.5 * dt);
      spring.offset.x *= settle;
      spring.offset.y *= settle;
      spring.offset.z *= settle;
      this.applySpringOffset(spring);
    }
    this.squashVelocity *= Math.exp(-10 * dt);
    this.squash += this.squashVelocity * dt;
    this.squash *= Math.exp(-4 * dt);
    const y = Math.max(.9, 1 + this.squash);
    const xz = 1 / Math.sqrt(y);
    this.figure.scale.set(this.baseScale.x * xz, this.baseScale.y * y, this.baseScale.z * xz);
    this.appliedSquash = this.squash;
    this.impulseLife -= dt;
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
