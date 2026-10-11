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
  handmade: 'Coloured clay pressed onto the sculpt, with softly rounded edges, thumbprints and a dry matte surface.',
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
    bumpScale: 0.075,
    roughness: 0.99,
    roughnessVariation: 0.16,
    clearcoat: 0,
    clearcoatRoughness: 0.72,
    sheen: 0,
    sheenRoughness: 0.82,
    sheenColor: 0xc8b49d,
    noiseScale: 1.95,
    seed: 73,
    shadowOpacity: 0.82,
    background: 0x332d29,
    hemiIntensity: 0.85,
    hemiColor: 0xffe8c8,
    groundColor: 0x625b55,
    sunIntensity: 2.8,
    sunPosition: [-6, 4.5, 5],
  },
};

type ClayTextures = { bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture };
const textureCache = new Map<ClayLook, ClayTextures>();
const softGeometry = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

/** Round the lighting across the sculpt's hard normal seams. Weld by position
 * across paint primitives, so shoulder/hood colour boundaries do not become seams.
 * Positions and skin weights remain the original buffers; only normals differ. */
export function softenClayNormals(figure: THREE.Object3D): void {
  const meshes: THREE.Mesh[] = [];
  figure.traverse(object => { if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh); });
  const sums = new Map<string, THREE.Vector3>();
  const key = (position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, i: number) =>
    `${Math.round(position.getX(i) * 1e6)},${Math.round(position.getY(i) * 1e6)},${Math.round(position.getZ(i) * 1e6)}`;
  if (meshes.some(mesh => !softGeometry.has(mesh.geometry))) {
    for (const mesh of meshes) {
      const { position, normal } = mesh.geometry.attributes;
      for (let i = 0; i < position.count; i++) {
        const id = key(position, i), sum = sums.get(id) ?? new THREE.Vector3();
        sum.x += normal.getX(i); sum.y += normal.getY(i); sum.z += normal.getZ(i);
        sums.set(id, sum);
      }
    }
    for (const sum of sums.values()) sum.normalize();
    for (const mesh of meshes) {
      const original = mesh.geometry;
      if (softGeometry.has(original)) continue;
      const geometry = new THREE.BufferGeometry();
      for (const [name, attribute] of Object.entries(original.attributes)) geometry.setAttribute(name, attribute);
      geometry.setIndex(original.index);
      geometry.groups = original.groups.map(group => ({ ...group }));
      geometry.morphAttributes = original.morphAttributes;
      geometry.morphTargetsRelative = original.morphTargetsRelative;
      const { position, normal } = original.attributes;
      const values = new Float32Array(normal.count * 3), n = new THREE.Vector3();
      for (let i = 0; i < normal.count; i++) {
        n.fromBufferAttribute(normal, i).lerp(sums.get(key(position, i))!, .85).normalize().toArray(values, i * 3);
      }
      geometry.setAttribute('normal', new THREE.BufferAttribute(values, 3));
      softGeometry.set(original, geometry);
    }
  }
  for (const mesh of meshes) mesh.geometry = softGeometry.get(mesh.geometry)!;
}

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
      const value = kind === 'bump'
        ? 128 + broad * 16 + fine * 5
        : 190 + broad * spec.roughnessVariation * 90 + fine * 8;
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

/** Periodic pressed-clay relief. Broad oval depressions and fingerprint arcs
 * carry the material identity; fine grain alone disappears at board size. */
function handmadeTextures(): ClayTextures {
  const size = 256;
  const canvases = [document.createElement('canvas'), document.createElement('canvas')];
  const data = canvases.map(canvas => {
    canvas.width = canvas.height = size;
    return canvas.getContext('2d')!.createImageData(size, size);
  });
  const prints = [[.26, .30, .30, .18, -.52], [.76, .75, .22, .31, .42]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + .5) / size, v = (y + .5) / size;
    let height = .57 + .025 * Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI * 4);
    for (const [cx, cy, rx, ry, angle] of prints) {
      const dx = u - cx - Math.round(u - cx), dy = v - cy - Math.round(v - cy);
      const a = (dx * Math.cos(angle) - dy * Math.sin(angle)) / rx;
      const b = (dx * Math.sin(angle) + dy * Math.cos(angle)) / ry;
      const r = Math.hypot(a, b) * (1 + .065 * Math.sin(Math.atan2(b, a) * 3));
      const press = Math.exp(-r * r * 2.4);
      const lip = Math.exp(-Math.pow(r - 1, 2) * 38);
      const ridges = Math.sin(r * 62 + a * 2) * .009 * Math.exp(-r * r * 3);
      height += -.29 * press + .045 * lip + ridges;
    }
    // A few shallow dragging traces cross the rolled areas between thumbprints.
    const sweep = Math.sin((u + .07 * Math.sin(v * Math.PI * 2)) * Math.PI * 6);
    height -= .016 * Math.pow(Math.max(0, sweep), 18);
    const at = (y * size + x) * 4;
    const values = [Math.round(255 * height), Math.round(248 + 6 * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI * 2))];
    data.forEach((image, i) => {
      image.data[at] = image.data[at + 1] = image.data[at + 2] = values[i];
      image.data[at + 3] = 255;
    });
  }
  const maps = canvases.map((canvas, i) => {
    canvas.getContext('2d')!.putImageData(data[i], 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  });
  return { bumpMap: maps[0], roughnessMap: maps[1] };
}

/** Map across the sculpt's bind-space XYZ, including material boundaries. The
 * coordinates follow the rig; the physical-height gradient is stable under zoom. */
function pressedClayShader(material: THREE.MeshPhysicalMaterial, accent: boolean): void {
  material.customProgramCacheKey = () => `pressed-clay-v3-${accent}`;
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vClayPosition; varying vec3 vClayNormal;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvClayPosition = position; vClayNormal = normal;');
    shader.fragmentShader = 'varying vec3 vClayPosition; varying vec3 vClayNormal;\n' + shader.fragmentShader;
    const height = `
      float pressedHeight(vec3 p) {
        vec3 w = pow(abs(normalize(vClayNormal)), vec3(6.));
        w /= max(.0001, w.x + w.y + w.z);
        p = p * 2.6 + ${accent ? 'vec3(.37, .61, .19)' : 'vec3(0.)'};
        return dot(w, vec3(texture2D(bumpMap, p.yz).r,
                           texture2D(bumpMap, p.zx).r,
                           texture2D(bumpMap, p.xy).r));
      }
      vec2 dHdxy_fwd() {
        float h = pressedHeight(vClayPosition);
        float span = max(length(dFdx(vClayPosition)), length(dFdy(vClayPosition)));
        float curvature = max(length(dFdx(vClayNormal)), length(dFdy(vClayNormal))) / max(span, .00001);
        float strength = mix(1., .18, smoothstep(7., 32., curvature));
        return strength * bumpScale * vec2(pressedHeight(vClayPosition + dFdx(vClayPosition)) - h,
                                pressedHeight(vClayPosition + dFdy(vClayPosition)) - h);
      }
    `;
    const chunk = THREE.ShaderChunk.bumpmap_pars_fragment
      .replace(/vec2 dHdxy_fwd\(\) \{[\s\S]*?\n\t\}/, height)
      .replace('normalize( dFdx( surf_pos.xyz ) )', 'dFdx( surf_pos.xyz )')
      .replace('normalize( dFdy( surf_pos.xyz ) )', 'dFdy( surf_pos.xyz )');
    shader.fragmentShader = shader.fragmentShader.replace('#include <bumpmap_pars_fragment>', chunk);
    // The generic roughness map multiplies roughness down. Keep this look dry,
    // and sample in the same sculpt space as the impressions rather than old UVs.
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
      'float roughnessFactor = .95 + .04 * texture2D(roughnessMap, vClayPosition.xy * 2.6).g;');
  };
}

function texturesFor(look: Exclude<ClayLook, 'current'>): ClayTextures {
  const cached = textureCache.get(look);
  if (cached) return cached;
  const spec = SPECS[look];
  const textures = look === 'handmade' ? handmadeTextures() : { bumpMap: makeTexture('bump', spec), roughnessMap: makeTexture('roughness', spec) };
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
      : new THREE.MeshToonMaterial({ color, gradientMap: currentGradientMap ?? null });
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
  if (look === 'handmade') {
    clay.specularIntensity = .22;
    // Separate lumps carry their own impressions rather than continuing a
    // fingerprint straight across the colour seam. Reuse the same texture.
    if (role === 'accent1') clay.bumpScale *= .75;
    pressedClayShader(clay, role === 'accent1');
  }
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
