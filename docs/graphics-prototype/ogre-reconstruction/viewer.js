import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { materialForLook } from '../../../src/render/prototype/ClayLook.ts';

const canvas = document.querySelector('canvas');
const status = document.querySelector('#status');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x39312b);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 20);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 0.22;
controls.maxDistance = 4;
scene.add(new THREE.HemisphereLight(0xffead6, 0x665348, 1.1));
for (const [x, y, z, intensity] of [[-2, 3, 3, 2.5], [3, 1, 1, 0.65], [0, 2, -3, 1.5]]) {
  const light = new THREE.DirectionalLight(0xfff1db, intensity);
  light.position.set(x, y, z);
  scene.add(light);
}
const materials = new Map();
let look = 'clay';
// Reuse the cast's pressed-clay material; retain only subtle colour variation and eyes.
function clayMaterial(original) {
  const material = materialForLook({ color: 0xdcc7a7, role: 'army', look: 'handmade' });
  material.bumpScale = 0.018;
  material.map = original.map;
  const pressed = material.onBeforeCompile;
  const cacheKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => cacheKey + '-ogre-colour-v2';
  material.onBeforeCompile = shader => {
    pressed(shader);
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
        float eye = smoothstep(.22, .34, vClayPosition.y) * (1. - smoothstep(.015, .12, pigment));
        float cuff = smoothstep(mix(2.4, 1.5, clayPad), mix(3.5, 1.85, clayPad), paint.r / max(paint.g, .001))
          * smoothstep(mix(4., 1.9, clayPad), mix(6., 2.8, clayPad), paint.r / max(paint.b, .001))
          * smoothstep(.003, .012, paint.r)
          * smoothstep(.30, .34, abs(vClayPosition.x))
          * (1. - smoothstep(.09, .12, vClayPosition.y));
        vec3 body = diffuse * mix(vec3(1.), paint, mix(.18, .92, eye));
        diffuseColor.rgb = mix(body, clayAccent, cuff);
      #endif
    `);
  };
  return material;
}
function applyLook() {
  for (const [mesh, pair] of materials) mesh.material = pair[look];
  for (const id of ['texture', 'clay']) document.querySelector(`#${id}`).setAttribute('aria-pressed', String(look === id));
  if (materials.size) status.textContent = look === 'clay'
    ? 'Repaired fingertips · warm ivory clay + terracotta pads'
    : 'Repaired fingertips · original-colour comparison';
}
function showView(side = 0, straight = false) {
  const direction = side ? new THREE.Vector3(side * .22, .10, .48)
    : new THREE.Vector3(straight ? 0 : 1.25, straight ? .03 : .55, 2);
  const extent = side ? .32 : 1.05;
  const distance = extent * .61 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(camera.aspect, 1));
  controls.target.set(side * .4, side ? -.17 : 0, side ? .10 : 0);
  camera.position.copy(controls.target).add(direction.normalize().multiplyScalar(distance));
  controls.update();
}
document.querySelector('#front').onclick = () => {
  document.querySelector('#view').value = '0';
  showView(0, true);
};
for (const name of ['texture', 'clay']) {
  document.querySelector(`#${name}`).onclick = () => {
    look = name;
    applyLook();
  };
}
document.querySelector('#view').onchange = event => {
  showView(Number(event.target.value));
};
try {
  const gltf = await new GLTFLoader().loadAsync('./clay-refinement/ogre-repaired.glb');
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const center = box.getCenter(new THREE.Vector3());
  gltf.scene.position.sub(center);
  gltf.scene.traverse(obj => {
    if (obj.isMesh) materials.set(obj, { texture: obj.material, clay: clayMaterial(obj.material) });
  });
  scene.add(gltf.scene);
  applyLook();
  showView(Number(document.querySelector('#view').value));
} catch (error) {
  status.textContent = `Could not load the model: ${error.message}`;
}
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  const previous = Math.min(camera.aspect, 1);
  camera.aspect = innerWidth / innerHeight;
  camera.position.sub(controls.target).multiplyScalar(previous / Math.min(camera.aspect, 1)).add(controls.target);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
