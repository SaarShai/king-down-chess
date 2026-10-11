/** Palette quantisation + ordered dither pass (runs last, after OutputPass). DawnBringer 32 by default. */
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const DB32 = [
  0x000000, 0x222034, 0x45283c, 0x663931, 0x8f563b, 0xdf7126, 0xd9a066, 0xeec39a, 0xfbf236, 0x99e550, 0x6abe30, 0x37946e,
  0x4b692f, 0x524b24, 0x323c39, 0x3f3f74, 0x306082, 0x5b6ee1, 0x639bff, 0x5fcde4, 0xcbdbfc, 0xffffff, 0x9badb7, 0x847e87,
  0x696a6a, 0x595652, 0x76428a, 0xac3232, 0xd95763, 0xd77bba, 0x8f974a, 0x8a6f30,
];

/** Endesga 32 — saturated, high-contrast; the flat-colour look of reference A. */
export const ENDESGA32 = [
  0xbe4a2f, 0xd77643, 0xead4aa, 0xe4a672, 0xb86f50, 0x733e39, 0x3e2731, 0xa22633, 0xe43b44, 0xf77622, 0xfeae34, 0xfee761,
  0x63c74d, 0x3e8948, 0x265c42, 0x193c3e, 0x124e89, 0x0099db, 0x2ce8f5, 0xffffff, 0xc0cbdc, 0x8b9bb4, 0x5a6988, 0x3a4466,
  0x262b44, 0x181425, 0xff0044, 0x68386c, 0xb55088, 0xf6757a, 0xe8b796, 0xc28569,
];

/** Warm sand / ochre / olive ramp for reference C: 12 sand steps, 7 greys, 5 olives, 4 rusts, 4 shade blues. */
export const WARM32 = [
  0x110f0d, 0x241d18, 0x3a2e24, 0x513f30, 0x6b543f, 0x8a6c4f, 0xa88a63, 0xc4a878, 0xdcc48d, 0xeedaa6, 0xf7ecc8, 0xfff8e3,
  0x2b2a26, 0x45443c, 0x605e53, 0x7c7a6d, 0x9a9887, 0xb8b6a3, 0xd4d2c0,
  0x2f3a22, 0x46542f, 0x5f6f3c, 0x7d8c4d, 0x9caa64,
  0x5a2f22, 0x7d4429, 0xa35f2f, 0xc8813c,
  0x243043, 0x3a4a63, 0x566b88, 0x7a91ad,
];

export const PALETTES: Record<string, number[]> = { db32: DB32, endesga32: ENDESGA32, warm: WARM32 };

export function paletteTexture(hex: number[]): THREE.DataTexture {
  const data = new Uint8Array(hex.length * 4);
  hex.forEach((h, i) => data.set([(h >> 16) & 255, (h >> 8) & 255, h & 255, 255], i * 4));
  const tex = new THREE.DataTexture(data, hex.length, 1, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createPalettePass(palette: number[] = DB32, pixelSize = 2, ditherAmount = 0.03): ShaderPass {
  const pass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      tPalette: { value: paletteTexture(palette) },
      paletteSize: { value: palette.length },
      pixelSize: { value: pixelSize },
      ditherAmount: { value: ditherAmount },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform sampler2D tPalette;
      uniform float paletteSize; uniform float pixelSize; uniform float ditherAmount;
      varying vec2 vUv;
      // 4x4 ordered dither without arrays (GLSL ES 1.00 safe)
      float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
      float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
      void main(){
        vec2 px = floor(gl_FragCoord.xy / pixelSize);
        vec3 col = texture2D(tDiffuse, vUv).rgb;
        col = clamp(col + (bayer4(px) - 0.5) * ditherAmount, 0.0, 1.0);
        float bestD = 1e9; vec3 best = col;
        for (int i = 0; i < 64; i++) {
          if (float(i) >= paletteSize) break;
          vec3 pc = texture2D(tPalette, vec2((float(i) + 0.5) / paletteSize, 0.5)).rgb;
          vec3 d = col - pc; float dd = dot(d, d);
          if (dd < bestD) { bestD = dd; best = pc; }
        }
        gl_FragColor = vec4(best, 1.0);
      }`,
  });
  return pass;
}
