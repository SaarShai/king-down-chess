import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { ogreMaterial, prepareOgreGeometry } from './OgreMaterial';
import { CAST } from './prototype/CastCatalog';
import { ensureSurfaceUv, materialForLook, softenClayNormals, type ClayLook } from './prototype/ClayLook';

const sources = new Map<string, Promise<THREE.Group>>();
const materials = new Map<string, THREE.Material>();

/** Accepted board cast, shared geometry/materials and an independent skeleton/mixer per piece. */
export class ClayFigure {
  readonly mixer: THREE.AnimationMixer;
  private actions: Map<string, THREE.AnimationAction>;

  static async load(name: string, side: number, look: ClayLook = 'handmade'): Promise<ClayFigure> {
    if (!sources.has(name)) sources.set(name, new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
      .loadAsync(`${import.meta.env.BASE_URL}prototype/models/board-${name}.glb`)
      .then(gltf => { gltf.scene.animations = gltf.animations; return gltf.scene; })
      .catch(error => { sources.delete(name); throw error; }));
    const model = clone(await sources.get(name)!) as THREE.Group;
    if (look === 'handmade' && name !== 'ogre') softenClayNormals(model);
    const palette: Record<string, number> = side === 0
      ? { army: 0xdcc9a2, shade: 0x958365, light: 0xf2e2c0, ink: 0x514638 }
      : { army: 0x485875, shade: 0x28374c, light: 0x839abc, ink: 0x192335 };
    const accent = CAST.find(c => c.key === name)!.accent;
    model.traverse(o => {
      if (!(o as THREE.Mesh).isMesh) return;
      const mesh = o as THREE.Mesh;
      const layer = mesh.morphTargetDictionary?.ClayLayer;
      if (layer !== undefined && mesh.morphTargetInfluences) mesh.morphTargetInfluences[layer] = look === 'handmade' ? 1 : 0;
      ensureSurfaceUv(mesh.geometry);
      if (name === 'ogre') prepareOgreGeometry(mesh.geometry);
      const paint = (original: THREE.Material): THREE.Material => {
        const vertexColors = mesh.geometry.hasAttribute('color');
        const key = `${name}:${side}:${look}:${original.uuid}:${vertexColors}`;
        if (!materials.has(key)) materials.set(key, name === 'ogre'
          ? ogreMaterial(original as THREE.MeshStandardMaterial, side, look)
          : materialForLook({ color: original.name.startsWith('accent') ? accent : palette[original.name] ?? palette.army,
            role: original.name, vertexColors, look }));
        return materials.get(key)!;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(paint) : paint(mesh.material);
      mesh.frustumCulled = false;
    });
    model.userData.design = name;
    return new ClayFigure(model);
  }

  private constructor(readonly model: THREE.Group) {
    this.mixer = new THREE.AnimationMixer(model);
    this.actions = new Map(model.animations.map(clip => [clip.name, this.mixer.clipAction(clip)]));
  }

  sample(clip: 'Walk' | 'Shove', phase: number): void {
    const action = this.actions.get(clip);
    if (!action) return;
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
