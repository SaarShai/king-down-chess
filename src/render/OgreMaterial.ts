import * as THREE from 'three';
import { materialForLook, type ClayLook } from './prototype/ClayLook';

// Reuse the cast's pressed-clay material; retain only subtle colour variation and eyes.
export function ogreMaterial(original: THREE.MeshStandardMaterial, side = 0, look: ClayLook = 'handmade'): THREE.Material {
  const material = materialForLook({ color: side === 0 ? 0xdcc7a7 : 0x485875, role: 'army', look }) as THREE.MeshStandardMaterial | THREE.MeshToonMaterial;
  if ('bumpScale' in material) material.bumpScale = look === 'handmade' ? .018 : .006;
  material.name = original.name;
  material.map = original.map;
  const pressed = material.onBeforeCompile;
  const cacheKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => cacheKey + '-ogre-colour-v3';
  material.onBeforeCompile = (shader, renderer) => {
    pressed.call(material, shader, renderer);
    shader.vertexShader = 'attribute vec3 ogreBindPosition; varying vec3 vOgrePosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvOgrePosition = ogreBindPosition;');
    shader.fragmentShader = 'varying vec3 vOgrePosition;\n' + shader.fragmentShader;
    shader.uniforms.clayAccent = { value: new THREE.Color(0xc46e43) };
    shader.uniforms.clayPad = { value: original.name === 'accent1' ? 1 : 0 };
    shader.fragmentShader = 'uniform vec3 clayAccent; uniform float clayPad;\n' + shader.fragmentShader;
    // Sample the original cuff boundary per texel: face-level paint assignments
    // alone leave triangular teeth along the rolled edge at close range.
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      #ifdef USE_MAP
        vec3 paint = sampledDiffuseColor.rgb;
        float pigment = dot(paint, vec3(.2126, .7152, .0722));
        float eye = smoothstep(.22, .34, vOgrePosition.y) * (1. - smoothstep(.015, .12, pigment));
        float cuff = smoothstep(mix(2.4, 1.5, clayPad), mix(3.5, 1.85, clayPad), paint.r / max(paint.g, .001))
          * smoothstep(mix(4., 1.9, clayPad), mix(6., 2.8, clayPad), paint.r / max(paint.b, .001))
          * smoothstep(.003, .012, paint.r)
          * smoothstep(.30, .34, abs(vOgrePosition.x))
          * (1. - smoothstep(.09, .12, vOgrePosition.y));
        vec3 body = diffuse * mix(vec3(1.), paint, mix(.18, .92, eye));
        diffuseColor.rgb = mix(body, clayAccent, cuff);
      #endif
    `);
  };
  return material;
}

/** Preserve pigment coordinates when capture effects bake and split the surface. */
export function prepareOgreGeometry(geometry: THREE.BufferGeometry): void {
  if (!geometry.hasAttribute('ogreBindPosition')) geometry.setAttribute('ogreBindPosition', geometry.getAttribute('position').clone());
}
