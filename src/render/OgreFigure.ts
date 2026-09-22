import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { ogreMaterial, prepareOgreGeometry } from './OgreMaterial';

let source: Promise<THREE.Group> | undefined;
const materials = new Map<string, THREE.Material>();

/** Shared board asset, independent skeleton/mixer per piece. No load on Ogre-free boards. */
export class OgreFigure {
  readonly mixer: THREE.AnimationMixer;
  private actions: Map<string, THREE.AnimationAction>;

  static async load(side: number): Promise<OgreFigure> {
    source ??= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
      .loadAsync(`${import.meta.env.BASE_URL}prototype/models/board-ogre.glb`)
      .then(gltf => { gltf.scene.animations = gltf.animations; return gltf.scene; })
      .catch(error => { source = undefined; throw error; });
    const model = clone(await source) as THREE.Group;
    model.traverse(o => {
      if (!(o as THREE.Mesh).isMesh) return;
      const m = o as THREE.Mesh;
      prepareOgreGeometry(m.geometry);
      const paint = (original: THREE.Material): THREE.Material => {
        const key = `${side}:${original.uuid}`;
        if (!materials.has(key)) materials.set(key, ogreMaterial(original as THREE.MeshStandardMaterial, side));
        return materials.get(key)!;
      };
      m.material = Array.isArray(m.material) ? m.material.map(paint) : paint(m.material);
      m.frustumCulled = false;
    });
    return new OgreFigure(model);
  }

  private constructor(readonly model: THREE.Group) {
    this.mixer = new THREE.AnimationMixer(model);
    this.actions = new Map(model.animations.map(clip => [clip.name, this.mixer.clipAction(clip)]));
  }

  sample(clip: 'Walk' | 'Shove', phase: number): void {
    const action = this.actions.get(clip)!;
    action.setLoop(THREE.LoopOnce, 1).play();
    action.clampWhenFinished = true;
    action.paused = false;
    action.time = Math.min(.999999, phase) * action.getClip().duration;
    // Ease into/out of the authored gait so a one-square move returns to rest.
    action.setEffectiveWeight(clip === 'Walk'
      ? THREE.MathUtils.smoothstep(phase, 0, .12) * (1 - THREE.MathUtils.smoothstep(phase, .88, 1)) : 1);
    this.mixer.update(0);
  }

  reset(): void { this.mixer.stopAllAction(); this.model.rotation.y = 0; }

  dispose(): void {
    this.reset();
    this.mixer.uncacheRoot(this.model);
    const skeletons = new Set<THREE.Skeleton>();
    this.model.traverse(o => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) skeletons.add((o as THREE.SkinnedMesh).skeleton); });
    for (const skeleton of skeletons) skeleton.dispose();
  }
}
