import * as THREE from 'three';

export type LocomotionKind = 'stride' | 'shuffle' | 'flow';
export type MotionChoice = 'character' | 'shuffle' | 'flow';
export function characterMotion(key: string): LocomotionKind {
  if (key === 'guard' || key === 'archer') return 'stride';
  return key === 'queen' || key === 'bishop' || key.startsWith('king-') ? 'flow' : 'shuffle';
}
export const MOTION_COPY: Record<LocomotionKind, string> = {
  stride: 'Articulated steps, with a steady body and restrained ground scuffs.',
  shuffle: 'A weighted shuffle: the sculpt rocks over its contact edge while clay gathers beneath it.',
  flow: 'A low clay wave leads the figure forward; the robe and upper silhouette stay composed.',
};

/** Rigid silhouette motion and a small travelling clay contact patch. No skin
 * weights or shader displacement: beauty and contours use the same transforms. */
export class ClayLocomotion {
  readonly patch: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  private readonly basePosition: THREE.Vector3;
  private readonly baseRotation: THREE.Quaternion;
  private readonly support: THREE.Vector3[] = [];
  private readonly minY: number;
  private readonly centre: THREE.Vector3;
  private readonly radius: THREE.Vector2;
  private readonly delta = new THREE.Quaternion();
  private readonly angles = new THREE.Euler();
  private readonly point = new THREE.Vector3();

  constructor(private figure: THREE.Object3D, readonly kind: LocomotionKind) {
    this.basePosition = figure.position.clone();
    this.baseRotation = figure.quaternion.clone();
    // SkinnedMesh.updateMatrixWorld also refreshes its bind inverse. The generic
    // updateWorldMatrix path leaves cloned rigs in their previous parent space.
    figure.parent!.updateMatrixWorld(true);
    const inverse = figure.parent!.matrixWorld.clone().invert(), points: THREE.Vector3[] = [];
    const bounds = new THREE.Box3();
    let color = new THREE.Color(0xdcc9a2);
    figure.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const army = materials.find(m => m.name === 'army') as THREE.MeshStandardMaterial | undefined;
      if (army) color = army.color.clone();
      const matrix = inverse.clone().multiply(mesh.matrixWorld);
      for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
        const p = mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(matrix);
        bounds.expandByPoint(p); points.push(p);
      }
    });
    this.minY = bounds.min.y - this.basePosition.y;
    const footprint = new THREE.Box3();
    for (const p of points) if (p.y < bounds.min.y + .10) {
      footprint.expandByPoint(p); this.support.push(p.sub(this.basePosition));
    }
    this.centre = footprint.getCenter(new THREE.Vector3()); this.centre.y = .008;
    const size = footprint.getSize(new THREE.Vector3());
    this.radius = new THREE.Vector2(Math.max(.13, size.x * .5 + .045), Math.max(.13, size.z * .5 + .04));
    const geometry = new THREE.BufferGeometry(), positions = new Float32Array((1 + 4 * 32) * 3), indices: number[] = [];
    for (let ring = 0; ring < 4; ring++) for (let a = 0; a < 32; a++) {
      const here = 1 + ring * 32 + a, next = 1 + ring * 32 + (a + 1) % 32;
      if (!ring) indices.push(0, next, here);
      else indices.push(here - 32, next - 32, here, here, next - 32, next);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setIndex(indices);
    const material = new THREE.MeshStandardMaterial({ color, roughness: .98, metalness: 0, transparent: true, opacity: 0, depthWrite: false });
    this.patch = new THREE.Mesh(geometry, material); this.patch.name = 'Clay contact wave'; this.patch.frustumCulled = false;
    figure.parent!.add(this.patch); this.patch.visible = false;
  }

  update(phase: number, weight: number): void {
    this.resetTransform();
    if (this.kind !== 'stride') {
      const flow = this.kind === 'flow';
      this.angles.set((flow ? -.016 : -.008) * weight, Math.sin(phase) * .016 * weight, Math.sin(phase) * (flow ? .008 : .024) * weight);
      this.delta.setFromEuler(this.angles);
      this.figure.quaternion.copy(this.delta).multiply(this.baseRotation);
      let floor = Infinity;
      for (const p of this.support) floor = Math.min(floor, this.point.copy(p).applyQuaternion(this.delta).y);
      this.figure.position.y += this.minY - floor;
      this.figure.position.x += Math.sin(phase) * (flow ? .008 : .013) * weight;
    }
    this.patch.visible = weight > .001;
    const flow = this.kind === 'flow', stride = this.kind === 'stride';
    this.patch.material.opacity = weight * (stride ? .16 : flow ? .95 : .38);
    this.patch.position.copy(this.centre);
    const attr = this.patch.geometry.attributes.position;
    attr.setXYZ(0, 0, flow ? .055 : .012, 0);
    for (let ring = 1; ring <= 4; ring++) for (let a = 0; a < 32; a++) {
      const angle = a / 32 * Math.PI * 2, r = ring / 4;
      // The leading lobe gathers, rolls under the body, and releases at the heel.
      const wave = Math.sin(angle * 3) * .035 + Math.sin(phase) * Math.sin(angle) * .12;
      const heel = Math.pow(Math.max(0, -Math.sin(angle)), 4);
      const x = Math.cos(angle) * this.radius.x * r * (1 + wave * weight) * (1 - (flow ? .25 : 0) * heel * weight);
      const z = Math.sin(angle) * (this.radius.y + (flow ? .08 : .025) * weight) * r * (1 + wave * weight)
        - (flow ? .19 : 0) * heel * r * weight * (.75 + .25 * Math.sin(phase - .8));
      const y = (flow ? .065 : .018) * (1 - r * r) * (1 + Math.sin(phase - r * Math.sin(angle) * 3) * .28) * weight;
      attr.setXYZ(1 + (ring - 1) * 32 + a, x, y, z);
    }
    attr.needsUpdate = true; this.patch.geometry.computeVertexNormals();
  }

  private resetTransform(): void { this.figure.position.copy(this.basePosition); this.figure.quaternion.copy(this.baseRotation); }
  reset(): void { this.resetTransform(); this.patch.visible = false; }
  dispose(): void { this.reset(); this.patch.removeFromParent(); this.patch.geometry.dispose(); this.patch.material.dispose(); }
}
