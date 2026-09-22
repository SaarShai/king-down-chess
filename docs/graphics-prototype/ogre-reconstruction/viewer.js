import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector('canvas');
const status = document.querySelector('#status');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x222b30);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 20);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 0.9;
controls.maxDistance = 4;
scene.add(new THREE.HemisphereLight(0xfff3df, 0x35414e, 2));
for (const [x, y, z, intensity] of [[-2, 3, 3, 3], [3, 1, 1, 1], [0, 2, -3, 2]]) {
  const light = new THREE.DirectionalLight(0xfff1db, intensity);
  light.position.set(x, y, z);
  scene.add(light);
}
const clay = new THREE.MeshStandardMaterial({ color: 0xbeb5a4, roughness: 0.9 });
const materials = new Map();
function front() {
  camera.position.set(0, 0.03, 2.3);
  controls.target.set(0, 0, 0);
  controls.update();
}
document.querySelector('#front').onclick = front;
for (const name of ['texture', 'clay']) {
  document.querySelector(`#${name}`).onclick = () => {
    for (const [mesh, original] of materials) mesh.material = name === 'clay' ? clay : original;
    for (const id of ['texture', 'clay']) document.querySelector(`#${id}`).setAttribute('aria-pressed', String(name === id));
  };
}
try {
  const gltf = await new GLTFLoader().loadAsync('./trellis-trial/ogre-original.glb');
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const center = box.getCenter(new THREE.Vector3());
  gltf.scene.position.sub(center);
  gltf.scene.traverse(obj => {
    if (obj.isMesh) materials.set(obj, obj.material);
  });
  scene.add(gltf.scene);
  front();
  camera.position.set(1.25, 0.55, 2);
  controls.update();
  status.textContent = 'Actual exported mesh · 36,888 triangles · no animation yet';
} catch (error) {
  status.textContent = `Could not load the model: ${error.message}`;
}
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
