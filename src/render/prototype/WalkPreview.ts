import * as THREE from 'three';
import { ClayLocomotion, type LocomotionKind } from './ClayLocomotion';

export type ClayCadence = 'smooth' | 'stopmotion';
export type WalkPreviewOptions = { pliable?: boolean; cadence?: ClayCadence; motion?: LocomotionKind };
const STEP = 1 / 12;

/** Articulated steps only for suitable sculpts. Other figures keep their imported
 * shape and move through contact, rocking and a low travelling clay wave. */
export class WalkPreview {
  readonly mixer: THREE.AnimationMixer;
  readonly action: THREE.AnimationAction;
  readonly kind: LocomotionKind;
  readonly locomotion: ClayLocomotion | null;
  private active = false;
  private settling = 0;
  private readonly pliable: boolean;
  private readonly cadence: ClayCadence;
  private readonly baseScale: THREE.Vector3;
  private stepAccumulator = 0;
  private impulseLife = 0;
  private squash = 0;
  private squashVelocity = 0;

  constructor(private figure: THREE.Object3D, clip: THREE.AnimationClip, options: WalkPreviewOptions = {}) {
    this.kind = options.motion ?? 'stride';
    this.mixer = new THREE.AnimationMixer(figure);
    // An empty clip supplies the same playback/fade/cadence clock without applying
    // the unsuitable limb weights to a broad or closed source sculpt.
    this.action = this.mixer.clipAction(this.kind === 'stride' ? clip : new THREE.AnimationClip(this.kind, Math.max(1.7, clip.duration * 1.2), []));
    this.pliable = options.pliable ?? false;
    this.cadence = options.cadence ?? 'smooth';
    this.baseScale = figure.scale.clone();
    this.locomotion = this.kind !== 'stride' || this.pliable ? new ClayLocomotion(figure, this.kind) : null;
  }

  play(): void {
    this.reset(); this.active = true;
    this.action.reset().fadeIn(.3).play();
  }
  stop(): void {
    if (!this.active) return;
    this.action.fadeOut(.3); this.settling = .3;
  }

  /** Squash is an explicit poke only, never a footfall or locomotion input. */
  poke(): void { if (this.pliable) { this.impulseLife = 1.6; this.squashVelocity -= .95; } }
  private updateImpulse(dt: number): void {
    if (this.impulseLife <= 0) return;
    let remaining = Math.min(.25, dt);
    while (remaining > 1e-6) {
      const step = Math.min(1 / 120, remaining); remaining -= step;
      this.squashVelocity = (this.squashVelocity - this.squash * 90 * step) * Math.exp(-8 * step);
      this.squash += this.squashVelocity * step; this.impulseLife -= step;
    }
    if (this.impulseLife <= 0) { this.squash = 0; this.squashVelocity = 0; }
    const y = Math.max(.86, 1 + this.squash), xz = 1 / Math.sqrt(y);
    this.figure.scale.set(this.baseScale.x * xz, this.baseScale.y * y, this.baseScale.z * xz);
  }

  update(dt: number): void {
    if (!this.active && this.impulseLife <= 0) return;
    let advance = Math.min(.25, dt);
    if (this.cadence === 'stopmotion') {
      this.stepAccumulator += advance;
      if (this.stepAccumulator < STEP) return;
      advance = this.stepAccumulator - this.stepAccumulator % STEP;
      this.stepAccumulator %= STEP;
    }
    this.figure.scale.copy(this.baseScale);
    if (this.active) {
      this.mixer.update(advance);
      const phase = this.action.time / this.action.getClip().duration * Math.PI * 2;
      this.locomotion?.update(phase, this.action.getEffectiveWeight());
    }
    this.updateImpulse(advance);
    if (this.settling > 0 && (this.settling -= advance) <= 0) this.reset();
  }

  reset(): void {
    this.mixer.stopAllAction(); this.locomotion?.reset(); this.figure.scale.copy(this.baseScale);
    this.active = false; this.settling = 0; this.stepAccumulator = 0;
    this.impulseLife = 0; this.squash = 0; this.squashVelocity = 0;
  }
  dispose(): void { this.reset(); this.locomotion?.dispose(); this.mixer.uncacheRoot(this.figure); }
}
