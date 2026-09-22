import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ogreMaterial, prepareOgreGeometry } from '../../../src/render/OgreMaterial.ts';

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
    if (obj.isMesh) { prepareOgreGeometry(obj.geometry); materials.set(obj, { texture: obj.material, clay: ogreMaterial(obj.material) }); }
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
