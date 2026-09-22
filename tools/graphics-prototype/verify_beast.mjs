/** Check the deformed surface, not just valid skin weights or bone keyframes.
 * Optional GLB argument exercises the same checks against an earlier asset. */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const out = process.env.BEAST_CHECK_OUT || 'docs/graphics-prototype/beast-verification';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [], results = [];
page.on('pageerror', e => errors.push(e.message));
if (process.argv[2]) {
  const body = await readFile(process.argv[2]);
  await page.route('**/rebuilt-beast.glb', route => route.fulfill({ contentType: 'model/gltf-binary', body }));
}
try {
  for (const [look, cadence] of [['current', 'smooth'], ['handmade', 'smooth'], ['handmade', 'stopmotion']]) {
    await page.goto(`http://localhost:5190/?study&variant=rebuilt&scene=character&character=beast&pixels=0.5&contours=adaptive&look=${look}&cadence=${cadence}`);
    await page.waitForFunction(() => window.study);
    const metrics = await page.evaluate(() => {
      const entries = study.entries;
      const e = entries[0], w = e.walk;
      w.reset(); e.visual.updateMatrixWorld(true);
      const meshes = [];
      e.visual.traverse(m => { if (m.isSkinnedMesh) meshes.push(m); });
      const positions = () => meshes.map(m => {
        m.skeleton.update();
        const v = m.position.clone();
        return Array.from({ length: m.geometry.attributes.position.count }, (_, i) => m.getVertexPosition(i, v).clone());
      });
      const rest = positions(), edges = [], fixedEdges = [];
      meshes.forEach((m, k) => {
        const index = m.geometry.index, n = index ? index.count : rest[k].length;
        for (let i = 0; i < n; i += 3) for (let j = 0; j < 3; j++) {
          const a = index ? index.getX(i + j) : i + j;
          const b = index ? index.getX(i + (j + 1) % 3) : i + (j + 1) % 3;
          const length = rest[k][a].distanceTo(rest[k][b]);
          if (length < .005) continue;
          const edge = { k, a, b, length }; edges.push(edge);
          // Head/shoulders, and the low hanging hands in front of the legs.
          const fixed = v => v.y > .62 || (v.z > .255 && v.y > .245 && v.y < .44);
          if (fixed(rest[k][a]) && fixed(rest[k][b])) fixedEdges.push(edge);
        }
      });
      const ratios = [];
      let maxFeatureError = 0, minFloor = Infinity, maxFloor = -Infinity, footTravel = 0;
      w.play();
      // Warm through the fade-in, then sample a complete cycle at small timesteps.
      const duration = w.action.getClip().duration, dt = duration / 192;
      for (let f = 0; f < 384; f++) {
        w.update(dt);
        if (f < 192 || f % 4 !== 3) continue;
        e.visual.updateMatrixWorld(true);
        const pose = positions();
        for (const edge of edges) ratios.push(pose[edge.k][edge.a].distanceTo(pose[edge.k][edge.b]) / edge.length);
        for (const edge of fixedEdges) maxFeatureError = Math.max(maxFeatureError, Math.abs(pose[edge.k][edge.a].distanceTo(pose[edge.k][edge.b]) / edge.length - 1));
        let floor = Infinity;
        for (let k = 0; k < pose.length; k++) for (let i = 0; i < pose[k].length; i++) {
          const v = pose[k][i]; floor = Math.min(floor, v.y);
          if (rest[k][i].y < .07 && rest[k][i].z > -.26) footTravel = Math.max(footTravel, v.distanceTo(rest[k][i]));
        }
        minFloor = Math.min(minFloor, floor); maxFloor = Math.max(maxFloor, floor);
      }
      ratios.sort((a, b) => a - b);
      let loopError = 0;
      for (const track of w.action.getClip().tracks) for (let i = 0; i < track.getValueSize(); i++) {
        loopError = Math.max(loopError, Math.abs(track.values[i] - track.values[track.values.length - track.getValueSize() + i]));
      }
      w.reset(); e.visual.updateMatrixWorld(true);
      const reset = positions(); let resetError = 0;
      for (let k = 0; k < rest.length; k++) for (let i = 0; i < rest[k].length; i++) resetError = Math.max(resetError, rest[k][i].distanceTo(reset[k][i]));
      return { minRatio: ratios[0], maxRatio: ratios.at(-1), p99: ratios[Math.floor(ratios.length * .99)], samples: ratios.length,
        maxFeatureError, minFloor, maxFloor, footTravel, loopError, resetError, armies: entries.length };
    });
    const checks = {
      noTearingOrCollapsedFolds: metrics.maxRatio < 2.5 && metrics.minRatio > .3 && metrics.p99 < 1.2,
      handsAndHeadKeepTheirShape: metrics.maxFeatureError < .001,
      feetStillStep: metrics.footTravel > .035,
      loopAndReset: metrics.loopError < .0001 && metrics.resetError < .000001,
      bothArmies: metrics.armies === 2,
    };
    results.push({ look, cadence, ...metrics, checks });
    if (look === 'handmade' && cadence === 'smooth') {
      for (const angle of [0, Math.PI / 2, Math.PI]) {
        for (const phase of [0, .25, .5, .75]) {
          await page.evaluate(({ angle, phase }) => {
            const target = view.controls.target;
            view.camera.position.copy(target).add(target.clone().set(2, 3.7, 10).applyAxisAngle(view.camera.up, angle));
            view.controls.update();
            for (const e of study.entries) {
              e.walk.reset(); e.walk.play();
              const dt = e.walk.action.getClip().duration / 192;
              for (let i = 0; i < 192 * (1 + phase); i++) e.walk.update(dt);
              // Keep the sampled pose still while capturing it.
              e.walk.active = false;
              e.visual.updateMatrixWorld(true);
            }
            view.composer.render();
          }, { angle, phase });
          await page.screenshot({ path: `${out}/angle-${Math.round(angle * 180 / Math.PI)}-phase-${phase}.png` });
        }
      }
    }
  }
} finally {
  await browser.close();
}
const passed = errors.length === 0 && results.every(r => Object.values(r.checks).every(Boolean));
await writeFile(`${out}/results.json`, JSON.stringify({ passed, results, errors }, null, 2) + '\n');
console.log(JSON.stringify({ passed, results, errors }, null, 2));
if (!passed) process.exitCode = 1;
