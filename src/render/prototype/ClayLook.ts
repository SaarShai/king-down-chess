import * as THREE from 'three';

/** Live material looks for the visual study. The two clay options share the same
 * colour roles, so a look can move across a whole roster without repainting a mesh. */
export type ClayLook = 'current' | 'plasticine' | 'handmade';

export const CLAY_LOOKS: readonly ClayLook[] = ['current', 'plasticine', 'handmade'];

export const CLAY_LOOK_LABELS: Record<ClayLook, string> = {
  current: 'Current refined',
  plasticine: 'Polished plasticine',
  handmade: 'Handmade clay',
};

export const CLAY_LOOK_COPY: Record<ClayLook, string> = {
  current: 'The existing refined study material and pixel comparison.',
  plasticine: 'A smooth studio plasticine read: broad light, satin wax response and very fine rolled texture.',
  handmade: 'A warmer hand worked clay read: quiet lumps, softer shadows and a slightly chalkier surface.',
};

type ClaySpec = {
  bumpScale: number;
  roughness: number;
  roughnessVariation: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  sheenRoughness: number;
  sheenColor: number;
  noiseScale: number;
  seed: number;
  shadowOpacity: number;
  background: number;
  hemiIntensity: number;
  hemiColor: number;
  groundColor: number;
  sunIntensity: number;
  sunPosition: [number, number, number];
};

const SPECS: Record<Exclude<ClayLook, 'current'>, ClaySpec> = {
  plasticine: {
    bumpScale: 0.018,
    roughness: 0.76,
    roughnessVariation: 0.12,
    clearcoat: 0.08,
    clearcoatRoughness: 0.42,
    sheen: 0.11,
    sheenRoughness: 0.68,
    sheenColor: 0xe5bea1,
    noiseScale: 1.35,
    seed: 31,
    shadowOpacity: 0.92,
    background: 0x282f31,
    hemiIntensity: 2.0,
    hemiColor: 0xfff0d7,
    groundColor: 0x716d69,
    sunIntensity: 1.35,
    sunPosition: [-4.5, 8, 6.5],
  },
  handmade: {
    bumpScale: 0.032,
    roughness: 0.9,
    roughnessVariation: 0.16,
    clearcoat: 0.015,
    clearcoatRoughness: 0.72,
    sheen: 0.2,
    sheenRoughness: 0.82,
    sheenColor: 0xc8b49d,
    noiseScale: 1.95,
    seed: 73,
    shadowOpacity: 0.82,
    background: 0x332d29,
    hemiIntensity: 1.82,
    hemiColor: 0xffe8c8,
    groundColor: 0x625b55,
    sunIntensity: 1.08,
    sunPosition: [-3.3, 7.2, 4.2],
  },
};

type ClayTextures = { bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture };
const textureCache = new Map<ClayLook, ClayTextures>();

/** The source-derived study GLBs are mesh-only and intentionally have no UVs. Generate a
 * stable local projection once so the procedural maps affect their surfaces instead of
 * silently sampling the origin. Existing author UVs are preserved for future roster pieces. */
export function ensureSurfaceUv(geometry: THREE.BufferGeometry): void {
  if (geometry.getAttribute('uv')) return;
  const position = geometry.getAttribute('position');
  if (!position) return;
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const bounds = geometry.boundingBox!;
  const size = bounds.getSize(new THREE.Vector3());
  const safeX = Math.max(size.x, 1e-4), safeZ = Math.max(size.z, 1e-4), safeY = Math.max(size.y, 1e-4);
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    // A blended XZ/Y projection avoids a single vertical seam on the rounded studies.
    uv[i * 2] = ((x - bounds.min.x) / safeX + (z - bounds.min.z) / safeZ) * .72;
    uv[i * 2 + 1] = ((y - bounds.min.y) / safeY) * 1.28;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function noise(seed: number, x: number, y: number): number {
  const a = Math.sin((x + seed * 1.73) * 0.089 + Math.cos((y - seed) * 0.061));
  const b = Math.sin((x * 0.29 + y * 0.17 + seed) * 0.63);
  const c = Math.sin((x * 0.91 - y * 0.52 + seed * 0.43) * 1.73);
  return a * 0.56 + b * 0.28 + c * 0.16;
}

function makeTexture(kind: 'bump' | 'roughness', spec: ClaySpec): THREE.CanvasTexture {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(size, size);
  const data = image.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const broad = noise(spec.seed, x / spec.noiseScale, y / spec.noiseScale);
      const fine = noise(spec.seed + 19, x * 1.7, y * 1.7);
      // The handmade ramp carries a stable, broad finger/tool sweep in addition to the
      // grain. It is deliberately low amplitude so the sculpted silhouette stays legible.
      const tool = spec.seed > 50 ? Math.sin((x * .17 + y * .04 + spec.seed) * 1.4) * .6 : 0;
      const value = kind === 'bump'
        ? 128 + broad * 16 + fine * 5 + tool * 8
        : 190 + broad * spec.roughnessVariation * 90 + fine * 8 + tool * 12;
      const at = (y * size + x) * 4;
      const v = Math.max(0, Math.min(255, Math.round(value)));
      data[at] = v;
      data[at + 1] = v;
      data[at + 2] = v;
      data[at + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

function texturesFor(look: Exclude<ClayLook, 'current'>): ClayTextures {
  const cached = textureCache.get(look);
  if (cached) return cached;
  const spec = SPECS[look];
  const textures = { bumpMap: makeTexture('bump', spec), roughnessMap: makeTexture('roughness', spec) };
  textureCache.set(look, textures);
  return textures;
}

export type ClayMaterialOptions = {
  color: THREE.ColorRepresentation;
  role?: string;
  vertexColors?: boolean;
  look?: ClayLook;
  currentGradientMap?: THREE.Texture;
};

/** Construct a material without changing the mesh's geometry or feature colours. */
export function materialForLook({ color, role = '', vertexColors = false, look = 'current', currentGradientMap }: ClayMaterialOptions): THREE.Material {
  if (look === 'current') {
    const current = vertexColors
      ? new THREE.MeshStandardMaterial({ color, vertexColors: true, roughness: 0.78, metalness: 0 })
      : new THREE.MeshToonMaterial({ color, gradientMap: currentGradientMap });
    current.name = role;
    current.userData.clayLook = look;
    return current;
  }

  const spec = SPECS[look];
  const textures = texturesFor(look);
  const clay = new THREE.MeshPhysicalMaterial({
    color,
    vertexColors,
    metalness: 0,
    roughness: spec.roughness,
    roughnessMap: textures.roughnessMap,
    bumpMap: textures.bumpMap,
    bumpScale: spec.bumpScale,
    clearcoat: spec.clearcoat,
    clearcoatRoughness: spec.clearcoatRoughness,
    sheen: spec.sheen,
    sheenRoughness: spec.sheenRoughness,
    sheenColor: spec.sheenColor,
  });
  clay.name = role;
  clay.userData.clayLook = look;
  return clay;
}

export type ClayLightingTarget = {
  scene: THREE.Scene;
  hemi?: THREE.HemisphereLight;
  sun?: THREE.DirectionalLight;
  shadowMat?: THREE.MeshBasicMaterial;
};

/** Set the soft studio rig used by both clay looks. `view` is intentionally duck typed so
 * the prototype can use the existing renderer's private light rig without production changes. */
export function applyLookLighting(target: ClayLightingTarget, look: ClayLook): void {
  if (look === 'current') {
    target.scene.background = new THREE.Color(0x141c29);
    if (target.hemi) {
      target.hemi.intensity = 1.6;
      target.hemi.color.setHex(0xfff2d9);
      target.hemi.groundColor.setHex(0x59657b);
    }
    if (target.sun) {
      target.sun.intensity = 2;
      target.sun.position.set(-4, 10, 6);
    }
    if (target.shadowMat) target.shadowMat.opacity = 1;
    return;
  }
  const spec = SPECS[look];
  target.scene.background = new THREE.Color(spec.background);
  if (target.hemi) {
    target.hemi.intensity = spec.hemiIntensity;
    target.hemi.color.setHex(spec.hemiColor);
    target.hemi.groundColor.setHex(spec.groundColor);
  }
  if (target.sun) {
    target.sun.intensity = spec.sunIntensity;
    target.sun.position.set(...spec.sunPosition);
  }
  if (target.shadowMat) target.shadowMat.opacity = spec.shadowOpacity;
}

export function lookSpec(look: ClayLook): Readonly<ClaySpec> | null {
  return look === 'current' ? null : SPECS[look];
}
