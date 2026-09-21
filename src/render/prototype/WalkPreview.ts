import * as THREE from 'three';

/** Study playback of the baked foot-contact cycles; each figure owns its mixer. */
export class WalkPreview {
  readonly mixer: THREE.AnimationMixer;
  readonly action: THREE.AnimationAction;
  private active = false;
  private settling = 0;

  constructor(figure: THREE.Object3D, clip: THREE.AnimationClip) {
    this.mixer = new THREE.AnimationMixer(figure);
    this.action = this.mixer.clipAction(clip);
  }

  play() {
    this.active = true;
    this.settling = 0;
    this.action.reset().fadeIn(.22).play();
  }

  stop() {
    if (!this.active) return;
    this.action.fadeOut(.22);
    this.settling = .22;
  }

  update(dt: number) {
    if (!this.active) return;
    this.mixer.update(dt);
    if (this.settling > 0 && (this.settling -= dt) <= 0) this.reset();
  }

  reset() {
    this.mixer.stopAllAction();
    this.active = false;
    this.settling = 0;
  }

  dispose() {
    this.reset();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}
