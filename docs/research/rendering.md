# King Down Chess — Rendering / Game Stack Research

**Date:** 2026-09-13
**Scope:** browser web app (desktop + mobile), TypeScript, Node 26, "pixelized 3D" look.
**Method:** every version number below was read from the npm registry, PyPI, or GitHub
releases on 2026-09-13. Every three.js API in the code was compiled against
`three@0.186.0` + `@types/three@0.186.0` with `typescript@7.0.2` (`strict: true`), and the
GLSL was compiled in a real WebGL2 context. Unverified items are listed in
[Could not verify](#could-not-verify).

---

## (a) Recommendation

**Use plain three.js. No React, no engine, no particle library, no tween library.**

```bash
npm create vite@latest king-down-chess -- --template vanilla-ts
npm i three@0.186.0 zzfx@1.3.2
npm i -D @types/three@0.186.0 typescript@7.0.2 vite@8.3.0
```

| Package | Version | Why |
|---|---|---|
| `three` | **0.186.0** (2026-09-08) | Ships `RenderPixelatedPass` — pixelation **plus** normal/depth edge outlines — in the box. Also ships `VOXLoader` with greedy meshing. Zero runtime dependencies. |
| `@types/three` | **0.186.0** (2026-09-11) | three has no bundled types. Version-matched, and it types `three/addons/*` too. |
| `vite` | **8.3.0** (2026-09-10) | Rolldown-based since Vite 8. Requires Node `^20.19 \|\| >=22.12` — Node 26 is fine. |
| `typescript` | **7.0.2** (2026-07-08) | The Go-native compiler, GA 2026-07-08. ~10x faster type-checking. |
| `zzfx` | **1.3.2** | 870 bytes gzipped. The only dependency that earns its place. |

**Do not add:** React / R3F / drei, `@tweenjs/tween.js`, `gsap`, `motion`, `three-nebula`,
`three.quarks`, `postprocessing`, `howler`. Reasoning per item in [(b)](#b-comparison) and
[VFX & audio](#vfx-tweening-and-audio).

### Why three.js wins for *this specific* look

The visual target is the deciding factor, not general engine quality. "Chunky pixels **with
crisp outlines**" is a specific effect: you need the scene's **normal and depth buffers** to
detect edges, then downsample. three.js ships exactly that as
`RenderPixelatedPass` — it is the only engine on the list with a first-party pass that does
pixelation *and* normal/depth edge detection. Everywhere else you write it yourself.

Three further reasons:

1. **Pixelation makes the GPU cost collapse.** Verified from the r186 source: the pass sizes
   its render targets to `width/pixelSize x height/pixelSize`. At `pixelSize = 4` on a 1680px
   canvas you are rendering a **420x236** image. Mobile GPU load becomes a non-issue, which
   removes the usual reason to reach for a heavier engine.
2. **Measured bundle.** A complete render layer — three core + `EffectComposer` +
   `RenderPixelatedPass` + a custom palette/dither pass + `GLTFLoader` + `VOXLoader` +
   the animation and VFX code in [(c)](#c-starter-architecture) — built with Vite 8:
   **626 kB raw / 157 kB gzip / 127 kB brotli** (132 kB gzip before the two loaders are
   referenced). That is smaller than **every** alternative, Pixi.js included — and Pixi
   cannot do real 3D at all.
3. **Extensibility is a data problem, not an engine problem.** New pieces are files in a
   folder; new effects are keys in one object. See [(c)](#c-structuring-animations-and-vfx).

### The one real trade-off

`RenderPixelatedPass` **renders the scene twice per frame** (beauty pass, then a second pass
with `scene.overrideMaterial = MeshNormalMaterial` for edge detection). Verified in the r186
source. At a 420x236 internal resolution with ~35 low-poly objects this is irrelevant — but
it is why you should not also stack bloom, SSAO and shadows on top without measuring.

### Renderer: WebGL, not WebGPU (for now)

Use `THREE.WebGLRenderer`. It is **not deprecated** — I checked the r182→r186 migration
guide specifically, and there is no deprecation notice.

WebGPU is viable in 2026 and `WebGPURenderer` falls back automatically (verified in
`src/renderers/webgpu/WebGPURenderer.js`: when `forceWebGL` is unset it installs a
`getFallback` that returns a `WebGLBackend` and warns). But the WebGPU path uses a
*different* post-processing system — `RenderPipeline` + TSL nodes (`PostProcessing` was
renamed to `RenderPipeline` in r183) — and its pixelation equivalent is
`pixelationPass()` from `three/addons/tsl/display/PixelationPassNode.js`. Both exist and
both work; they are simply two separate code paths.

> **Lazy call:** ship WebGL. Your scene renders at 420x236 — WebGPU's advantage is draw-call
> throughput you will never approach. Revisit only if you later want thousands of particles.
> If you *do* want to keep the door open, write your own passes against the WebGL
> `EffectComposer` now and port them if the need ever appears; the port is one file.

---

## (b) Comparison

Sizes are **measured**, not quoted from memory: JS engines bundled with esbuild
(`--bundle --minify --format=esm --target=es2022`), then gzip -9 / brotli q11. The three.js
figure was reproduced independently twice — 132 kB gzip for the render stack, 157 kB once
`GLTFLoader` and `VOXLoader` are actually referenced.

| Option | Version (verified) | Size, small game | Built-in pixelation | `.vox` | iOS | Main drawback |
|---|---|---|---|---|---|---|
| **three.js** | **0.186.0** (2026-09-08) | **132 kB gz / 110 kB br** | ✅ WebGL **and** TSL | ✅ `VOXLoader` | ✅ | none for this job |
| Babylon.js | `@babylonjs/core` **9.26.0** | 244–342 kB gz | ❌ | ❌ | ✅ | 2.6x the size, and you still write both |
| PlayCanvas | **2.22.2** | 225–490 kB gz | ❌ | ❌ | ✅ | heaviest JS engine; cinematic-effect bias |
| Godot | **4.7.2-stable** (2026-08-18) | **6.77 MB br**, engine alone | n/a | n/a | ⚠️ open WebKit bugs | ~60x the size; live iOS bug surface |
| Unity Web | 6000.x | ~10 MB br ⚠️ 2024 data | n/a | n/a | Safari 15+ | proprietary, huge, wrong scale |
| Phaser 4 | **4.2.1** (2026-07-09) | n/a | n/a | n/a | ✅ | **not 3D**, and no maintained 3D plugin |
| Bevy + wgpu | **bevy 0.19.1**, wgpu 30.0.1 | **7.0 MB gz** | ❌ | ❌ | ⚠️ unverified | Rust toolchain; WebGPU **or** WebGL2, never both |
| Pixi.js (2.5D) | **8.20.1** | 163 kB gz | ✅ via `pixi-filters` | n/a (pre-render) | ✅ | *larger* than three.js, and you lose rotation |

### What three.js already ships that the others don't

| Need | three.js r186 file |
|---|---|
| Pixelation + normal/depth outlines (WebGL) | `postprocessing/RenderPixelatedPass.js` |
| Pixelation (WebGPU / TSL) | `tsl/display/PixelationPassNode.js` |
| Extra outline options | `tsl/display/OutlineNode.js`, `SobelOperatorNode.js` |
| Palette / LUT | `postprocessing/LUTPass.js`, `tsl/display/Lut3DNode.js` |
| Dither-adjacent | `shaders/HalftoneShader.js`, `postprocessing/DotScreenPass.js` |
| MagicaVoxel `.vox` | `loaders/VOXLoader.js` (greedy-meshed) |

Every other engine requires writing the pixelation shader **and** sourcing a `.vox` loader.

### Notes per option

**Babylon.js 9.26.0** (Babylon 9.0 shipped 2026-03-26) has an excellent, well-factored
post-process system — 30+ core effects plus the Frame Graph task system. But an enumeration
of `@babylonjs/core/PostProcesses/` and the whole `@babylonjs/post-processes` package found
**no pixelation post-process**. There is a `PosterizeBlock` for NodeMaterial and a
`bayerDitherFunctions` shader include, but those are material-level and internal, not
screen-space passes. `edgeDetectionPostProcess` would cover outlines and the 3D-LUT
`colorCorrectionPostProcess` would cover palette. No `.vox` loader exists
(`babylonjs-vox-loader` is not a real package). Measured floor: 244 kB gzip for a minimal
scene, 342 kB for a realistic one — Babylon's `Scene` drags in a lot.

**PlayCanvas 2.22.2** has the best WebGPU story of the lot: one bundle ships both backends
with a `deviceTypes` preference array and falls back at runtime (three.js needs the separate
`three/webgpu` entry). But its effect library — bloom, SSAO, DoF, TAA, vignette — aims at
*cinematic* looks, which is the exact opposite of chunky pixels. No pixelation, no `.vox`,
and the engine-only path is second-class next to the cloud editor. The 225 kB figure requires
the manual `AppBase` + explicit `componentSystems` tree-shaking path; the naive barrel import
is 490 kB.

**Godot 4.7.2-stable** — the size is disqualifying. Extracted from the actual shipping
`web_nothreads_release` template: `godot.wasm` is **37.68 MB raw / 9.59 MB gzip / 6.77 MB
brotli**, *before* your `.pck`. That is roughly 60x three.js for a board game, and it is
WebAssembly that must download *and* compile before first frame.

Credit where due: the **SharedArrayBuffer problem is solved**. Single-threaded export has
been the default since 4.3 and needs no COOP/COEP headers. But iOS is not clean. Open,
current WebKit issues: [#116750](https://github.com/godotengine/godot/issues/116750) (page
crash when playing audio during gameplay, updated 2026-02-25),
[#70621](https://github.com/godotengine/godot/issues/70621) (2 GB WASM memory cap → OOM on
iOS Safari, updated 2026-06-01),
[#95941](https://github.com/godotengine/godot/issues/95941) (`InputEventScreenDrag/Touch`
index bugs on iOS — directly relevant to a touch board game),
[#120302](https://github.com/godotengine/godot/issues/120302) (invisible particles). 47 open
issues match `platform:web` + iOS. "Use Chrome on iOS" is not a workaround — all iOS browsers
are WebKit. Godot's own docs still note Safari WebGL 2.0 issues other browsers lack.

**Unity WebGL** — ~10.7 MB brotli for an empty 3D/URP project. Proprietary, a full editor and
C# toolchain for a few hundred lines of TypeScript. Disqualified on "keep the stack minimal"
before size even matters.

**Phaser 4.2.1 is not 3D.** Its npm keywords are `2d`, `HTML5`, `WebGL`, `canvas`; Phaser 4's
headline is a rewritten **2D** WebGL renderer. Every "Phaser 3D" route turns out to be "run
three.js alongside Phaser": `enable3d` (`@enable3d/phaser-extension@0.26.1`) was last
published **2025-03-08**, is **Phaser 3 only**, and peer-pins `three@0.171.0` against today's
0.186.0. `@number10/jsx-three` is a UI-panels-onto-meshes bridge, not a renderer. If the
answer is "embed three.js", use three.js and drop the dead weight.

**Bevy 0.19.1 + wgpu 30.0.1** — Bevy's own hosted `3d-shapes` example measures **21.6 MB raw
/ 7.0 MB gzip**. More damaging than size: **you must choose WebGPU or WebGL2 at compile
time.** Bevy publishes two separate sites for this reason and
[bevyengine/bevy#13168](https://github.com/bevyengine/bevy/issues/13168) is still open. So
you either ship WebGL2 to everyone or ship ~7 MB twice and feature-detect. Add a Rust +
`wasm-bindgen` + `wasm-opt` loop against Vite's millisecond HMR, and an unstable API (0.19
landed a breaking scenes rework), and it is the wrong tool for a hobby board game.

**Pixi.js 8.20.1 does not even win on size** — 163 kB gzip versus three.js's 132 kB *with*
post-processing. And the 2.5D pre-rendered-sprite approach costs you the things a chess game
specifically wants:

- **Rotation is dead.** Every camera yaw needs a fresh pre-rendered sheet. 8 directions x 12
  piece types x 2 colours x N frames is a combinatorial asset explosion — and chess games
  always want to flip the board for the second player.
- **Camera tilt becomes baked art**, not a runtime parameter.
- **No dynamic lighting.** No hover highlight that actually lights the piece, no shadow that
  follows a moving piece; both get faked with extra sprites.
- **You hand-write isometric depth sorting**, and it will bite you on tall pieces.
- **Every art tweak means re-running the offline render pipeline.**

It is a legitimate fallback only if you commit to a permanently fixed camera. You almost
certainly won't — and it is bigger anyway.

### WebGPU browser support, September 2026

From [caniuse raw data](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgpu.json),
cross-checked against the [W3C implementation-status wiki](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status):
**~87% global** (83.99% full + 2.95% partial).

| Browser | Status |
|---|---|
| Chrome / Edge desktop | ✅ 113+ (Linux depends on hardware/drivers) |
| Chrome Android | ✅ 121+ on most GPUs; 139+ for Imagination on Android 16+ |
| **Safari iOS** | ✅ **26.0+** — the big 2026 change; 18.x and earlier is flag-only |
| Safari macOS | ⚠️ 26.0+ **partial** — only default on macOS 26 Tahoe |
| Firefox desktop | ⚠️ Windows 141+, macOS Apple Silicon 145+, all macOS 147+; **Linux still Nightly** |
| Firefox Android | ❌ not enabled through 153 |

The gaps — Firefox on Linux, Firefox on Android, pre-Tahoe macOS Safari — are why the
baseline stays WebGL2. three.js is the only option here that lets you add the WebGPU path
later without redoing the art, because `RenderPixelatedPass` and `PixelationPassNode` both
exist. Bevy structurally cannot.

### React Three Fiber — skip it

`@react-three/fiber@9.7.0` peer-requires `react >=19 <19.3` and pulls in 10 runtime
dependencies (`zustand`, `its-fine`, `scheduler`, `suspend-react`, `@babel/runtime`, …), plus
`@react-three/drei@10.7.8` on top.

R3F pays off when scene content is driven by React state that changes constantly. Here the
scene is 64 static tiles and ~32 pieces whose positions are owned by a rules engine and
animated imperatively by tweens. Reconciling that through React is pure overhead — and the
HUD is a plain DOM overlay, which needs no renderer at all. If you later want component
structure, a `PieceView` class gets you there with no dependency.



---

## (c) Starter architecture

Five files. Nothing here is a framework; it is the smallest thing that holds.

```
src/
  stage.ts    renderer, camera, composer, pixelation + palette passes, loaders
  pieces.ts   piece registry: procedural placeholder now, .glb later
  anim.ts     18-line tween engine + hop/slide/shake
  fx.ts       particle pool + the effect registry (the extension point)
  main.ts     wiring, render loop, input
index.html    <canvas> + a plain DOM overlay for the HUD
```

### Scene graph

```
scene
├─ boardGroup
│   ├─ tiles         InstancedMesh(BoxGeometry(1, 0.25, 1), 64)   — 1 draw call
│   └─ highlights    InstancedMesh(flat box, 64), additive         — 1 draw call, count = 0 when idle
├─ piecesGroup       one Object3D per live piece
├─ fxGroup
│   └─ debris        InstancedMesh(BoxGeometry(0.09³), 300)        — 1 draw call, all effects
└─ lights            HemisphereLight + one DirectionalLight (the only shadow caster)
```

Keep **one** directional light with shadows. Pixel art wants flat, readable lighting; a
second shadow-casting light doubles the shadow pass and buys nothing at this resolution.

### Camera

Use an **`OrthographicCamera`**. Perspective makes identical pieces different sizes on
different ranks, and it makes pixel size vary with depth — both fight the art style.

```ts
export const VIEW_SIZE = 11;          // world units visible vertically; 8 board + margin

export function makeCamera(aspect: number, viewSize = VIEW_SIZE): THREE.OrthographicCamera {
  const cam = new THREE.OrthographicCamera(
    (-viewSize * aspect) / 2, (viewSize * aspect) / 2, viewSize / 2, -viewSize / 2, 0.1, 100,
  );
  cam.position.set(0, 12, 14);        // ~40° tilt: high enough to read the board,
  cam.lookAt(0, 0, 0);                // low enough that pieces have presence
  return cam;
}
```

`position.set(0, 12, 14)` is a ~40.6° elevation. For a true isometric look use
`(0, 10, 10)` (35.26°) and rotate 45° in Y. Keep the camera **fixed** — a static camera is
the single biggest pixel-art quality win, because a moving camera makes pixels crawl. If you
later add rotation, snap the yaw to fixed steps rather than allowing free orbit.

### Mapping pieces to squares

One function, used by everything — board build, piece placement, VFX spawn points:

```ts
export const BOARD = 8;

export function squareToWorld(file: number, rank: number, y = 0): THREE.Vector3 {
  return new THREE.Vector3(file - (BOARD - 1) / 2, y, rank - (BOARD - 1) / 2);
}
```

One world unit per square, board centred on the origin, `y = 0` is the board surface.
`BOARD` is a constant so a variant board size is a one-line change.

Piece identity lives in the **game state**, not the scene graph. Keep
`Map<pieceId, THREE.Object3D>` for views and let the rules engine own
`Map<square, pieceId>`. The renderer never decides what is legal; it only plays back events.
Input goes the other way: raycast against a single invisible board plane, convert the hit
point back to `[file, rank]`, hand that to the rules engine.

### The pixelation pipeline

Pass order matters, and one ordering detail is load-bearing:

```
RenderPixelatedPass   renders the scene at w/px, does normal+depth edge outlines
OutputPass            tone mapping + linear → sRGB
palette + dither      LAST, so it quantises display-referred colour
```

The palette pass must run **after** `OutputPass`. Quantising linear values will not match a
palette picked by eye in sRGB, and any resample after quantisation un-quantises it.

```ts
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** Virtual resolution in "big pixels". The SNES was 256x224 — phones want that, desktop a bit more. */
export const virtualWidth = () => (window.innerWidth < 700 ? 256 : 420);

export function createStage(canvas: HTMLCanvasElement, scene: THREE.Scene, palette: number[]) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);                    // never supersample a pixel-art game
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoftShadowMap is deprecated since r182

  const camera = makeCamera(canvas.clientWidth / canvas.clientHeight);
  const composer = new EffectComposer(renderer);

  const pixelPass = new RenderPixelatedPass(4, scene, camera, {
    normalEdgeStrength: 0.4,
    depthEdgeStrength: 0.5,
  });
  composer.addPass(pixelPass);
  composer.addPass(new OutputPass());

  const palettePass = new ShaderPass(PALETTE_SHADER);
  palettePass.uniforms.tPalette.value = paletteTexture(palette);
  palettePass.uniforms.paletteSize.value = palette.length;
  composer.addPass(palettePass);

  const timer = new THREE.Timer();              // THREE.Clock is deprecated since r183
  timer.connect(document);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    // Integer pixel size, then snap the drawing buffer to an exact multiple of it, so every
    // virtual pixel is the same size. CSS stretches the last few px; `image-rendering:
    // pixelated` on the canvas keeps that crisp.
    const px = Math.max(1, Math.round(w / virtualWidth()));
    const bw = Math.floor(w / px) * px, bh = Math.floor(h / px) * px;
    renderer.setSize(bw, bh, false);
    composer.setSize(bw, bh);
    pixelPass.setPixelSize(px);
    palettePass.uniforms.pixelSize.value = px;
    const aspect = bw / bh;
    camera.left = (-VIEW_SIZE * aspect) / 2;
    camera.right = (VIEW_SIZE * aspect) / 2;
    camera.top = VIEW_SIZE / 2;
    camera.bottom = -VIEW_SIZE / 2;
    camera.updateProjectionMatrix();
  }
  resize();
  return { renderer, camera, composer, timer, resize, pixelPass };
}
```

```css
canvas { width: 100%; height: 100%; display: block; image-rendering: pixelated; }
```

Render loop:

```ts
renderer.setAnimationLoop(() => {
  timer.update();
  const dt = timer.getDelta();
  anim.update(dt);
  debris.update(dt);
  composer.render();
});
```

`THREE.Timer` also has `setTimescale()` — one call gives you slow-motion on a king capture.

### Dither + palette shader

**Verified by compiling in a real WebGL2 context.** The obvious implementation
(`const float BAYER[16] = float[16](...)`) **fails to compile**: array constructors are GLSL
ES 3.00 only, and `ShaderMaterial` defaults to ES 1.00. The exact error was
`'[]' : array constructor supported in GLSL ES 3.00 and above only`. The version below
compiles clean.

```ts
const PALETTE_SHADER = {
  uniforms: {
    tDiffuse:     { value: null as THREE.Texture | null },
    tPalette:     { value: null as THREE.Texture | null },
    paletteSize:  { value: 32 },
    pixelSize:    { value: 4 },
    ditherAmount: { value: 0.08 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform sampler2D tPalette;
    uniform float paletteSize; uniform float pixelSize; uniform float ditherAmount;
    varying vec2 vUv;

    // 4x4 ordered dither without arrays — GLSL ES 1.00 safe.
    float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
    float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }

    void main(){
      // Divide by pixelSize so the dither is chunky in VIRTUAL pixels, not screen pixels.
      // Without this the dither pattern is finer than the art and reads as noise.
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
};

export function paletteTexture(hex: number[]): THREE.DataTexture {
  const data = new Uint8Array(hex.length * 4);
  hex.forEach((h, i) => {
    data[i * 4] = (h >> 16) & 255; data[i * 4 + 1] = (h >> 8) & 255;
    data[i * 4 + 2] = h & 255;     data[i * 4 + 3] = 255;
  });
  const tex = new THREE.DataTexture(data, hex.length, 1, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
```

The brute-force nearest-colour loop is 64 iterations per pixel at 420x236 ≈ 6.3M texture
fetches per frame worst case — fine on any 2026 GPU, and you can drop the cap to 32.
Start with `ditherAmount` at `0.08`; above ~0.15 it reads as noise.

Palette source: [Lospec](https://lospec.com/palette-list) — DawnBringer 32
(`lospec.com/palette-list/dawnbringer-32`) is the canonical 32-colour ramp and exports as
`.hex`, which converts to the `number[]` above in one line.

> **Note on "16-bit":** 16-bit colour technically means RGB565 (65,536 colours) and will
> *not* look retro. The look you want is a hand-picked 32–64 colour ramp. Design the ramp,
> ignore the bit depth.

### Animation engine — 18 lines, no dependency

```ts
export type Ease = (t: number) => number;
export const outCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const inOutCubic: Ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Track = { t: number; dur: number; step: (k: number) => void; done: () => void };

export class Animator {
  private tracks: Track[] = [];

  /** Runs step(k) with k from 0..1 over `dur` seconds. Resolves when finished. */
  run(dur: number, step: (k: number) => void, ease: Ease = outCubic): Promise<void> {
    return new Promise((done) => {
      this.tracks.push({ t: 0, dur, step: (k) => step(ease(k)), done: () => done() });
    });
  }

  update(dt: number): void {
    for (let i = this.tracks.length - 1; i >= 0; i--) {
      const tr = this.tracks[i]!;
      tr.t += dt;
      const k = tr.dur <= 0 ? 1 : Math.min(1, tr.t / tr.dur);
      tr.step(k);
      if (k >= 1) { this.tracks.splice(i, 1); tr.done(); }
    }
  }

  get busy(): boolean { return this.tracks.length > 0; }
}
```

Promises are the point: sequencing reads as `await hop(); await burst();` with no callback
nesting and no scheduler. Removal is unconditional, so it cannot leak.

```ts
/** Arc a piece to `to`, with squash-stretch. The highest-value animation in the game. */
export function hop(anim: Animator, obj: THREE.Object3D, to: THREE.Vector3, dur = 0.3, height = 0.7) {
  const from = obj.position.clone();
  return anim.run(dur, (k) => {
    obj.position.lerpVectors(from, to, k);
    obj.position.y = THREE.MathUtils.lerp(from.y, to.y, k) + Math.sin(k * Math.PI) * height;
    const s = 1 + Math.sin(k * Math.PI) * 0.12;
    obj.scale.set(2 - s, s, 2 - s);               // stretch vertically, pinch horizontally
  }, inOutCubic).then(() => { obj.position.copy(to); obj.scale.set(1, 1, 1); });
}

/** Screen shake. Decays on its own, restores the camera. */
export function shake(anim: Animator, cam: THREE.Camera, amount = 0.25, dur = 0.3) {
  const base = cam.position.clone();
  return anim.run(dur, (k) => {
    const a = amount * (1 - k);
    cam.position.set(base.x + (Math.random() - 0.5) * a, base.y + (Math.random() - 0.5) * a, base.z);
  }).then(() => cam.position.copy(base));
}
```

### Particles — one pooled `InstancedMesh` for every effect

`InstancedMesh` beats `THREE.Points` here: `Points` renders camera-facing quads, so making
them look like tumbling cubes means writing cube projection in a shader. `InstancedMesh`
instances a real `BoxGeometry`, so debris rotates in 3D for free and matches the voxel blocks
already on screen.

```ts
type Particle = { p: THREE.Vector3; v: THREE.Vector3; life: number; max: number; spin: number; c: THREE.Color };

export class Debris {
  readonly mesh: THREE.InstancedMesh;
  private pool: Particle[];
  private live = 0;
  private dummy = new THREE.Object3D();

  constructor(cap = 300, size = 0.09) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(size, size, size), new THREE.MeshLambertMaterial(), cap,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.pool = Array.from({ length: cap }, () => ({
      p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, max: 0, spin: 0, c: new THREE.Color(),
    }));
  }

  burst(at: THREE.Vector3, n: number, color: THREE.Color, speed = 4): void {
    for (let i = 0; i < n && this.live < this.pool.length; i++) {
      const q = this.pool[this.live++]!;
      q.p.copy(at);
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      const s = speed * (0.5 + Math.random());
      q.v.set(Math.sin(ph) * Math.cos(th) * s, Math.abs(Math.cos(ph)) * s, Math.sin(ph) * Math.sin(th) * s);
      q.life = 0; q.max = 0.6 + Math.random() * 0.4;
      q.spin = (Math.random() - 0.5) * 10;
      q.c.copy(color);
    }
  }

  update(dt: number): void {
    for (let i = this.live - 1; i >= 0; i--) {
      const q = this.pool[i]!;
      q.life += dt;
      if (q.life >= q.max) {                       // swap-remove
        this.pool[i] = this.pool[--this.live]!;
        this.pool[this.live] = q;
        continue;
      }
      q.v.y -= 14 * dt;
      q.p.addScaledVector(q.v, dt);
      if (q.p.y < 0.04) { q.p.y = 0.04; q.v.y *= -0.4; q.v.x *= 0.8; q.v.z *= 0.8; }
      this.dummy.position.copy(q.p);
      this.dummy.rotation.set(q.life * q.spin, q.life * q.spin * 0.7, 0);
      this.dummy.scale.setScalar(0.6 + (1 - q.life / q.max) * 0.4);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      // Colour MUST be rewritten every frame: swap-remove rebinds particle -> slot.
      // Setting it only in burst() makes colours visibly jump as neighbours die.
      this.mesh.setColorAt(i, q.c);
    }
    this.mesh.count = this.live;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}
```

One pool, one draw call, fixed allocation, no GC churn — and it covers capture explosions,
the paladin burst, arrow impact sparks and spell VFX by varying `n`, `speed` and `color`.

### Structuring animations and VFX so new pieces are easy

This is the part that decides whether the project is still pleasant in six months.

**The rule: the renderer never asks *why*, only *what happened*.** The rules engine emits
plain events; the render layer maps each event kind to one async function. Adding a piece
power is adding **one key to one object**.

```ts
/** Everything an effect may touch. Add a field here and every effect gets it. */
export interface FxContext {
  anim: Animator;
  scene: THREE.Scene;
  camera: THREE.Camera;
  debris: Debris;
  world: (file: number, rank: number, y?: number) => THREE.Vector3;
  viewOf: (id: string) => THREE.Object3D;
}

/** Events the rules engine emits. Add a variant, then add its handler below. */
export type GameEvent =
  | { kind: 'move'; id: string; to: [number, number]; style?: 'hop' | 'slide' }
  | { kind: 'capture'; victim: string; at: [number, number] }
  | { kind: 'archerShot'; id: string; from: [number, number]; to: [number, number] }
  | { kind: 'paladinBurst'; at: [number, number] }
  | { kind: 'maesterSwap'; a: string; b: string };

/** THE extension point. One entry per effect. */
export const FX: {
  [K in GameEvent['kind']]: (e: Extract<GameEvent, { kind: K }>, c: FxContext) => Promise<void>
} = {
  move: async (e, c) => {
    const obj = c.viewOf(e.id);
    const to = c.world(e.to[0], e.to[1]);
    await (e.style === 'slide' ? slide(c.anim, obj, to) : hop(c.anim, obj, to));
  },

  capture: async (e, c) => {
    c.viewOf(e.victim).visible = false;
    shake(c.anim, c.camera, 0.3, 0.25);
    c.debris.burst(c.world(e.at[0], e.at[1], 0.4), 24, new THREE.Color(0xd94f4f));
    await c.anim.run(0.25, () => {});
  },

  archerShot: async (e, c) => {
    const arrow = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xf0e0a0 }),
    );
    const from = c.world(e.from[0], e.from[1], 0.6), to = c.world(e.to[0], e.to[1], 0.5);
    arrow.position.copy(from);
    arrow.lookAt(to);
    c.scene.add(arrow);
    await c.anim.run(0.22, (k) => arrow.position.lerpVectors(from, to, k));
    c.scene.remove(arrow);
    arrow.geometry.dispose();
  },

  paladinBurst: async (e, c) => {
    shake(c.anim, c.camera, 0.6, 0.45);
    c.debris.burst(c.world(e.at[0], e.at[1], 0.5), 64, new THREE.Color(0xffd866), 5);
    await c.anim.run(0.35, () => {});
  },

  maesterSwap: async (e, c) => {
    const a = c.viewOf(e.a), b = c.viewOf(e.b);
    const pa = a.position.clone(), pb = b.position.clone();
    await Promise.all([hop(c.anim, a, pb, 0.35, 1.1), hop(c.anim, b, pa, 0.35, 1.1)]);
  },
};

export function playEvent(e: GameEvent, c: FxContext): Promise<void> {
  return (FX[e.kind] as (ev: GameEvent, c: FxContext) => Promise<void>)(e, c);
}
```

Three properties fall out of this for free:

- **Chain captures** (the beast) are `for (const step of chain) await playEvent(step, ctx)`.
  No special-casing — sequencing is just `await` in a loop.
- **Exhaustiveness is compiler-enforced.** The mapped type over `GameEvent['kind']` means
  adding an event variant without a handler is a **type error**, not a silent no-op.
- **Spells and king powers later** are new `GameEvent` variants plus new `FX` keys. No
  existing code changes.

---

## (d) Asset pipeline

**Recommendation: procedural placeholders today → hand-built voxels in Goxel as the real
asset → ship `.glb`, keep `.vox` as the editable source. Use voxelisation as a tracing aid,
never as an asset generator.**

### Why not "voxelise the miniature sculpts"

It is the appealing answer and it does not work as a one-shot. Auto-voxelising a detailed
miniature produces:

| Voxel height | Result |
|---|---|
| 8–16 | Abstract token. Archer, Maester and Beast all read as the same lump. |
| **24–32** | **The realistic target.** Silhouette survives; faces, weapons and trim do not. |
| 48–64 | Detail returns, but it stops reading as pixel art and starts reading as low-res 3D. |

Specific failures on miniature sculpts: thin features (sword blades, bow strings, staffs,
capes) fall below one voxel and vanish or break into noise; heads become blobs because a face
needs ~6 voxels across and at 28 tall the head is ~5; and if the mesh's symmetry plane is not
aligned to a voxel boundary, left and right come out different.

And the thing that actually matters: **a chess piece is read by silhouette from a near-fixed
camera.** A hand-built 28-voxel piece that exaggerates its identifying feature reads better
than a faithful 64-voxel auto-voxelisation. Fidelity to the sculpt is not the goal.

Budget roughly 1–3 h per piece the first time, 30–60 min once a shared base and body block
exist. Twelve pieces ≈ 1–2 weeks part-time.

### Route C — procedural placeholders (do this first)

Zero tools, zero pipeline, pieces on the board this afternoon. Each piece is 3–6 boxes merged
into one geometry, so it is one draw call and still reads at 28px tall.

```ts
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Box = [number, number, number, number, number, number];  // x,y,z,w,h,d
const BASE: Box[] = [[0, 0.06, 0, 0.62, 0.12, 0.62]];

export const PLACEHOLDER: Record<PieceType, Box[]> = {
  pawn:    [...BASE, [0, 0.30, 0, 0.30, 0.36, 0.30], [0, 0.56, 0, 0.34, 0.22, 0.34]],
  archer:  [...BASE, [0, 0.36, 0, 0.30, 0.48, 0.30], [0.26, 0.52, 0, 0.08, 0.46, 0.08]],
  paladin: [...BASE, [0, 0.38, 0, 0.36, 0.52, 0.36], [-0.28, 0.44, 0, 0.10, 0.40, 0.30]],
  beast:   [...BASE, [0, 0.26, 0, 0.52, 0.30, 0.70], [0, 0.44, -0.26, 0.32, 0.26, 0.26]],
  // ...one line per piece
};
```

**The seam that makes everything else easy.** Placeholder and final art live behind one
function, so pieces upgrade one at a time, in any order, with no code change:

```ts
export async function loadPiece(type: PieceType, color: THREE.ColorRepresentation): Promise<THREE.Object3D> {
  try {
    const gltf = await new GLTFLoader().loadAsync(`/pieces/${type}.glb`);
    return gltf.scene;
  } catch {
    return buildPlaceholder(type, color);
  }
}
```

Drop `public/pieces/archer.glb` into the folder and the archer upgrades. That is the whole
"easy to add new piece models over time" story.

### Route A — hand-built voxels (the real asset)

| Tool | Version | License | Verdict on macOS |
|---|---|---|---|
| **Goxel** | 0.15.1 (tag 2024-07-28, commits 2026-07-21) | GPL-3.0 | **Use this.** Mac-native, exports `.vox`, `.obj`, `.gltf`; `.glb` export landed 2026-07-21 (post-release, so build from source or export `.gltf`). |
| MagicaVoxel | **mac: 0.99.6.2, 2020-09-27** | freeware | Best UX, but the **macOS build has been frozen for 6 years**. Windows is 0.99.7.2 (asset updated 2025-10-31). Use it only if you have a Windows box. |
| Blockbench | 5.1.6 (2026-07-25) | GPL-3.0 | Very actively maintained. Imports `.vox` via a plugin, exports glTF/GLB — but does not export `.vox`. |
| VoxEdit | — | proprietary, free | The one voxel editor with built-in rigging + animation. Tied to the Sandbox ecosystem. |
| Avoyd | 0.26 / 0.28β | proprietary, paid | Does **not** import meshes, so it does not solve voxelisation. |

```bash
brew install --cask goxel        # 0.15.1, GPL-3.0, Mac-native
```

`.vox` format limits, from the official spec: **256 palette entries** (the `RGBA` chunk is
exactly 256x4 bytes) and a **256³ model cap** (`XYZI` stores x, y, z, colour index as one
byte each). At 32³ with 32 colours you are using ~0.2% of the budget.

### Route B — voxelisation as a tracing aid

**Use vengi `voxconvert`.** It is the only tool that is current, MIT-licensed, and covers
STL → `.vox` → `.glb` end to end in one binary.

- Version **0.5.0** (2026-04-18), MIT, repo pushed 2026-09-03.
- **Not on npm and not in Homebrew** — `@vengi/*`, `vengi`, `three-vox` and `magica-voxel-ts`
  do not exist as packages. Install from GitHub releases.

```bash
cd ~/tools
curl -LO https://github.com/vengi-voxel/vengi/releases/download/v0.5.0/mac-vengi-voxconvert-app.zip
unzip mac-vengi-voxconvert-app.zip
xattr -dr com.apple.quarantine vengi-voxconvert.app          # Gatekeeper
VOXCONVERT="$PWD/vengi-voxconvert.app/Contents/MacOS/vengi-voxconvert"
```

Voxelise at **2–3x the target height** to get an accurate volumetric reference, then trace it
by hand in Goxel at 28–32:

```bash
# reference pass — deliberately over-resolved, this is a tracing guide
"$VOXCONVERT" \
  -set voxformat_voxelsize 96 \
  -set voxformat_voxelizemode 0 \
  -set voxformat_fillhollow true \
  --input sculpts/archer.stl --output ref/archer.vox --force
```

Batch export the finished pieces to `.glb` (this is the build step):

```bash
mkdir -p glb
for f in voxels/*.vox; do
  n=$(basename "$f" .vox)
  "$VOXCONVERT" -set voxformat_mergequads true -set voxformat_reusevertices true \
    --input "$f" --output "glb/$n.glb" --force
done
```

Key cvars (verified against `docs/Configuration.md` at tag v0.5.0):

| cvar | Meaning |
|---|---|
| `voxformat_voxelsize` | Voxels on the largest axis (0 = disabled). Single-mesh exports only. |
| `voxformat_voxelizemode` | `0` high quality (Sierpinski subdivision), `1` faster (may leave gaps) |
| `voxformat_fillhollow` | Fill the interior of closed objects. **Set it explicitly** — the docs disagree on its default. |
| `voxformat_targetcolors` | Target colour count after voxelisation (new in 0.5.0) — your quantiser |
| `voxformat_createpalette` | `false` = snap to the `palette` cvar instead of deriving one |
| `voxformat_mesh_simplify` | Decimate the input mesh before voxelising — useful for high-poly sculpts |
| `voxformat_mergequads`, `_reusevertices` | Mesh-export optimisation |

Alternatives, all rejected: **trimesh** 5.1.0 (MIT, excellent, but `VoxelGrid.export()` only
writes binvox and `as_boxes()` on a solid 28³ piece emits ~264k triangles — use it only if
you want the numpy grid); **open3d** 0.19.0 (surface-only, no interior fill, no `.vox`,
20-month-old wheels); **binvox** 1.38/1.39 (no colour, no `.vox`, and not open source —
"you are not allowed to charge others for the program"); **obj2voxel** (dead since 2021).

### Runtime loading — add nothing

three.js r186's `VOXLoader` is better than every npm alternative. Verified from the r186
source and typings:

- **`buildMesh()` is a real greedy mesher** (landed in r182, PR #32489) — one
  `BufferGeometry` per chunk with vertex colours and a `MeshStandardMaterial`. Not
  box-per-voxel, not instanced.
- **`parse()` returns `{ chunks, scene }`**, not an array, and preserves the `.vox` scene
  graph with node names.
- **`VOXMesh` and `VOXData3DTexture` are deprecated** — use `buildMesh()` /
  `buildData3DTexture()`. This one bit me: the obvious `new VOXMesh(chunk)` from older
  tutorials is wrong on r186.

```ts
import { VOXLoader, buildMesh } from 'three/addons/loaders/VOXLoader.js';

const { chunks, scene: voxScene } = await new VOXLoader().loadAsync('/models/pawn.vox');
scene.add(voxScene);                                   // easiest — keeps named hierarchy
// or per chunk: for (const c of chunks) group.add(buildMesh(c));
```

npm voxel packages checked and rejected: `vox-reader` 4.0.1 (parser only, superseded),
`voxel-mesh` 0.3.0 (**dead since 2013**), `threejs-vox-loader` 2.0.0 (**GPL-3.0** — licence
risk for a game you may ship), `parse-magica-voxel` (stale + GPL), `@voxel-tool/*` (MIT and
genuinely ambitious, but 1 GitHub star and weeks old). `three-vox` and `magica-voxel-ts`
**do not exist**.

**Greedy meshing is a non-question at your scale.** A solid 28-tall piece is ~4–8k triangles
naive, a few hundred to ~1.5k greedy; 32 pieces worst case is ~256k static triangles, which
a 2026 GPU does not notice. You get greedy meshing free from the loader anyway. The number
worth watching is draw calls, not triangles.

### Ship `.glb`, keep `.vox` as source

Converting offline means the runtime loads only `GLTFLoader`, there is no `.vox` parse and
mesh build on the main thread, and the output is inspectable in any glTF viewer.

The one argument for `.vox` at runtime is two-colour teams — a `.vox` is palette-indexed, so
one file plus two palettes gives both sides free. That is ~5 lines on the `.glb` side
(remap `geometry.attributes.color` at load, or tint via a material uniform), so it does not
justify the extra loader. **`.vox` is the PSD, `.glb` is the PNG.**

### Animation for voxel pieces

| Approach | Verdict |
|---|---|
| Per-frame voxel model swaps | **Reject.** 12 pieces x ~4 actions x 8 frames = 384 models. |
| **Rigid-part rigs** | **The right ceiling.** Name parts (`head`, `arm_l`) in Goxel; `VOXLoader` reads `nTRN` `_name` onto `object.name`, and the names survive the `.glb` export. Then `getObjectByName('bow')` and animate its transform. |
| **Tween-only, whole piece** | **The right start.** |

Be honest about the requirement: slide, knight L-hop, capture lunge, spawn, death — **five
transform animations on a whole `Object3D`**. Rigging buys nothing for any of them. The
squash-stretch in `hop()` is the highest-value animation in the game and it is two keyframes
of `scale`.

The upgrade path costs nothing: name the parts in the source `.vox` now, and rigid-part
rigging unlocks later with no pipeline change — same file, same loader, just more handles.

**Skeletal/skinned animation does not make sense for voxel meshes.** Skinning blends vertices
across bones, which *warps* geometry — cubes shear, faces stop being axis-aligned, and the
blocky silhouette that is the entire point of the style is destroyed. Worse, after greedy
meshing the geometry has few vertices, sitting at merged-rectangle corners, so per-vertex
weights are close to meaningless. Rigid parenting **is** the voxel equivalent of a skeleton.

### Palette

Bake it offline — `.vox` is palette-indexed by design, so quantisation is native:

```bash
-set voxformat_createpalette false -set palette "$PWD/kdc-palette.png"   # snap to a fixed ramp
-set voxformat_targetcolors 48                                          # or let vengi pick N
```

One palette PNG drives every piece; change it, re-run the batch loop, everything updates.
Build it from a Lospec palette. The runtime LUT in [(c)](#dither--palette-shader) is then
only needed for *live* swaps (team colours, a check flash, damage states).

```bash
brew install imagemagick pngquant
magick in.png -dither None -remap kdc-palette.png out.png   # force an exact palette
pngquant 48 --nofs in.png                                   # derive an N-colour palette
```

---

## VFX, tweening and audio

| Need | Take | Cost |
|---|---|---|
| Hops, slides, lunges, shake, tile glow | **Hand-rolled `Animator`** | 18 lines |
| Explosions, debris, arrows, kamikaze | **Hand-rolled `InstancedMesh` pool** | ~45 lines |
| SFX generation | **`zzfx@1.3.2`** — the only dependency | **870 B gzip** |
| Audio playback | **Web Audio directly** | ~15 lines |

**Total: ~78 lines and one sub-kilobyte dependency.** Every library alternative costs
7–28 kB gzip (or a 4.7 MB transitive dependency) *and* still needs comparable glue code.

### Why each library was rejected

- **`@tweenjs/tween.js` 25.0.0** — last published **2024-07-26**, default branch last
  committed 2025-01-11, an open "Free project maintainer offer" issue. Worse, it has a
  verified footgun: `Group.update(time, preserve)` defaults `preserve = true`, and the
  removal branch is `if (tween.update(...) === false && !preserve) this.remove(tween)`.
  **Finished tweens are never removed from the group** — a game that spawns a tween per move
  grows unboundedly unless you call `group.remove()` in every `onComplete`. The `preserve`
  parameter that would fix it is itself deprecated. 7.1 kB gzip to hand-write the cleanup you
  were trying to avoid.
- **`gsap` 3.15.0** — genuinely free for commercial use since 3.13.0 (2025-04-30); the former
  Club GreenSock plugins really do ship in the public npm tarball. The only restriction is
  not building a competing no-code animation builder, which is irrelevant here. But the npm
  `license` field is **free text, not an SPDX identifier**, so licence scanners flag it as
  unknown — and it is 28.4 kB gzip to move a piece 8 units.
- **`motion` 13.2.0** — the best *library* here, MIT, actively maintained, and the only one
  with a first-class three.js binding (`animate.addEffect(threeEffect)`). But `motion`'s ESM
  entry is a 35-byte shim re-exporting `framer-motion/dom`, a **4.7 MB hard dependency**. A
  DOM/React animation engine used for 5% of its surface.
- **`three-nebula` 13.2.0** — **correction: it is not abandoned.** It published 2026-09-12
  and has shipped a TypeScript rewrite, a WebGPU/TSL renderer, seeded determinism and nested
  emitters since August 2026. Peer range `>=0.122.0 <1.0.0` covers r186 with no pinning
  problem. It is simply a full VFX engine for what needs to be eight flying cubes — and at
  1,804 weekly downloads you would be an early adopter of the v13 line.
- **`three.quarks` 0.17.1** — solid, MIT, batched, mesh particles, and a visual editor at
  `quarks.art/create`. The better pick *if* you were buying a particle engine.
- **`postprocessing` 6.39.5** (pmndrs) — actively maintained and has a `PixelationEffect`,
  but that effect is a plain screen-space downsample with **no normal/depth edge outlines**,
  which is the exact feature you want. It also pins `three: ">= 0.168.0 < 0.187.0"`, so every
  three.js release is a potential blocker. Skip.
- **`howler` 2.2.4** — **zero code commits since 2023-09-19**; the only commits since are
  README and BACKERS edits. 417 open issues. No `module`/`types`/`exports` fields. It existed
  to paper over 2014-era codec bugs that no longer exist. Not the 2026 default.
- **`THREE.Audio` / `PositionalAudio`** — skip. The board is 8x8 in front of a fixed camera;
  3D panning on a capture is inaudible, and it costs a `PannerNode` per sound plus per-frame
  listener matrix updates.

### Audio: Web Audio directly

```ts
const ctx = new AudioContext();
const buffers = new Map<string, AudioBuffer>();

export async function load(name: string, url: string) {
  buffers.set(name, await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer()));
}

export function play(name: string, vol = 1, rate = 1) {
  const src = ctx.createBufferSource();
  src.buffer = buffers.get(name)!;
  src.playbackRate.value = rate;          // free pitch variation per capture
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(g).connect(ctx.destination);
  src.start();
}

// Must run inside a real user-gesture handler — this rule has NOT been relaxed on iOS.
addEventListener('pointerdown', function unlock() { void ctx.resume(); }, { once: true });
```

Two iOS notes: the **silent/ringer switch still mutes Web Audio** (HTML5 `<audio>` is exempt,
Web Audio is not), and Safari's **Audio Session API** now lets you opt out:

```ts
if ('audioSession' in navigator) (navigator as any).audioSession.type = 'playback';
```

That is an Editor's Draft, Safari-only, absent on iOS 16 and earlier — feature-detect it and
treat it as progressive enhancement. For a chess game, respecting the mute switch is arguably
correct anyway, so skip the classic silent-`<audio>` polyfill.

### SFX: ZzFX

`ZzFXMicro.min.js` is **1,222 bytes raw / 870 bytes gzip**, MIT, proper ESM
(`import { zzfx } from 'zzfx'`). A sound is a one-line array literal with no asset file:

```ts
zzfx(...[,,925,.04,.3,.6,1,.3,,6.27,-184,.09,.17]);   // capture explosion
```

Workflow: open the designer at <https://killedbyapixel.github.io/ZzFX>, turn knobs, copy the
array, paste. ZzFX creates its own `AudioContext`, so call `zzfxX.resume()` on first gesture.
It ships no types — add a one-line `declare module 'zzfx'`.

`jsfxr` 1.4.1 (Unlicense, 8.7 kB gzip) is a fair alternative whose named presets
(`explosion`, `hitHurt`, `laserShoot`) map suspiciously well onto this game, but it is 10x
the size for the same result.

---

## (e) Mobile performance

The pixelation pass is the performance strategy, not a cost. A few concrete numbers:

- **Internal resolution.** `RenderPixelatedPass` renders at `width/pixelSize`. On a 390pt
  iPhone with `setPixelRatio(1)` and `virtualWidth() = 256`, `pixelSize = 2` gives a
  **195x~420** internal buffer. The SNES ran 256x224; you are in authentic territory, and
  the fragment cost is negligible.
- **Never call `setPixelRatio(devicePixelRatio)`.** On a DPR-3 phone that is a 9x fragment
  cost to render an image you are about to throw away. `setPixelRatio(1)` plus
  `image-rendering: pixelated` is both faster *and* more correct for this art style.
- **`antialias: false`.** MSAA on a pixel-art game is wasted bandwidth and actively fights
  the look.
- **Budget the second scene draw.** The pass draws the scene twice. Keep the scene cheap:
  one `InstancedMesh` for tiles, one for highlights, one for all debris, one merged geometry
  per piece. Target well under ~60 draw calls.
- **One shadow-casting light**, and keep `shadow.mapSize` at 1024. Use `THREE.PCFShadowMap` —
  `PCFSoftShadowMap` is deprecated for `WebGLRenderer` since r182 and PCF is now soft anyway.
- **The HUD stays DOM.** A plain absolutely-positioned DOM overlay renders at full native DPR
  while the 3D canvas renders at 195px — so text is crisp *and* cheap. This is a real
  advantage over in-canvas UI, and it is the main reason not to reach for React/R3F.
- **Touch input:** use Pointer Events, raycast against one invisible board plane rather than
  per-piece meshes, and add `touch-action: none` to the canvas so the browser does not eat
  drags. Make tap targets a full square — a 195px-wide virtual screen means a square is
  ~20 virtual px, so hit-testing must happen in world space, not screen space.
- **Thermal reality:** cap to 60 fps (`setAnimationLoop` already syncs to vsync) and pause
  the loop on `document.hidden`. A chess game is idle most of the time — consider rendering
  on demand (only when an animation is active or the board changed). That alone roughly
  eliminates battery drain between moves, and it is ~5 lines.

---

## Reconciliation with the code already in this repo

`src/` was written in parallel with this research and **independently converged on the same
stack** — `three@^0.186.0`, `@types/three@^0.186.0`, `typescript@^7.0.2`, `vite@^8.3.0`,
`EffectComposer` + `RenderPixelatedPass` + `OutputPass`, `mergeGeometries` for procedural
voxel pieces, and a hand-rolled `Tweens` + `Debris` pair with no animation or particle
dependency. That is this report's recommendation, already built. Four concrete deltas:

1. **`src/render/renderer.ts:43` uses `new THREE.Clock()`**, read at line 191.
   `Clock` is **deprecated since r183** and logs
   `Clock: This module has been deprecated. Please use THREE.Timer instead.` Replace with
   `THREE.Timer` + `timer.connect(document)`, then `timer.update()` / `timer.getDelta()` in
   the loop. `Timer` also gives you `setTimescale()` — free slow-motion on a king capture.
2. **No palette/dither pass exists yet.** The composer stops at `OutputPass`, so the limited
   palette and dithering half of the art direction is not implemented. The verified shader in
   [(c)](#dither--palette-shader) drops in as a `ShaderPass` after `OutputPass` — and note
   the array-constructor trap, which is the obvious way to write it and does not compile.
3. **`tools/voxelize.py` defaults to `--height 14`.** Per [(d)](#why-not-voxelise-the-miniature-sculpts),
   14 voxels is in the "abstract token" band — Archer, Maester and Beast will not be
   tellable apart at that resolution. Raise the default to **24–32**, and treat the output as
   a tracing reference rather than a finished asset. The script is trimesh-based and emits
   JSON; if you later want real `.vox` or `.glb` files, vengi `voxconvert` does it in one
   command and trimesh cannot write `.vox` at all.
4. **`src/render/fx.ts` `Debris` is fine as written.** It assigns instance slots from a ring
   cursor, so the particle↔slot binding is stable and setting the colour once in `burst()` is
   correct. The per-frame `setColorAt` rule in [(c)](#particles--one-pooled-instancedmesh-for-every-effect)
   applies only to the swap-remove variant. The trade-off of the ring is that a large burst
   can overwrite still-live particles from an earlier one; at `max = 400` that is unlikely to
   be visible.

Also worth setting if shadows get enabled: `renderer.shadowMap.type = THREE.PCFShadowMap`.
`PCFSoftShadowMap` is deprecated for `WebGLRenderer` since r182, and PCF is now soft anyway.

## Could not verify

- **The r186 release date from the GitHub releases *page*** initially returned "September 8,
  **2024**". The GitHub API gives `published_at: 2026-09-08T19:16:16Z`, which matches the npm
  publish time. The API value is correct; the page scrape was wrong.
- **Unity 2026 build sizes** — the only credible measurements found are for Unity 6.0.23
  (October 2024). Treat ~10 MB brotli as an order of magnitude, not a current figure.
- **Unity WebGPU status** — the 6000.7 manual mentions WebGL 2 only. Blog posts claiming
  WebGPU shipped in "Unity 6.6 / Unity 7 LTS" are unsourced, and the same pages state
  demonstrably wrong Safari and Firefox versions. Disregarded.
- **Bevy on iOS Safari** — no first-party statement found. Bevy compile times were not
  benchmarked, and its 7.0 MB gzip is an official CI example build, not a `-Oz` + LTO +
  `wasm-opt` build, which would be smaller by an unknown margin.
- **Godot's brotli figure** — 6.77 MB is brotli q11 applied to the extracted `godot.wasm`;
  Godot's own hosting may compress differently.
- **Avoyd's exact stable version and price** — its changelog URL 404s and the homepage shows
  neither.
- **binvox 1.38 vs 1.39** — the homepage and a search snippet disagree. Moot; it is rejected.
- **The binary path inside `vengi-voxconvert.app`** — inferred from the standard macOS bundle
  layout. Check with `find vengi-voxconvert.app -type f -perm +111`.
- **`voxformat_fillhollow`'s default** — the docs summary says `true`, the cvar table gives no
  default. Set it explicitly.
- **Lospec palette licensing terms** — palettes are community-submitted; check before
  shipping one verbatim.
- **A claimed "September 2026" MagicaVoxel update** on a download-aggregator site is **not**
  corroborated by ephtracy's GitHub releases. Treat it as false.
- **Tree-shaken size of a vanilla `motion` `animate()` import** — not measured; its entry is a
  re-export shim over `framer-motion/dom`, so the real figure depends on the bundler.

---

## (f) Sources

**three.js**
- [three.js releases](https://github.com/mrdoob/three.js/releases) · [r186 tag](https://github.com/mrdoob/three.js/releases/tag/r186) · [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- [`RenderPixelatedPass.js` (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/postprocessing/RenderPixelatedPass.js) · [docs](https://threejs.org/docs/pages/RenderPixelatedPass.html)
- [`VOXLoader.js` (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/loaders/VOXLoader.js) · greedy meshing PR [#32489](https://github.com/mrdoob/three.js/pull/32489) · scene-graph PR [#32488](https://github.com/mrdoob/three.js/pull/32488)
- [`PixelationPassNode.js` (TSL/WebGPU)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/PixelationPassNode.js)
- [`WebGPURenderer.js`](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/WebGPURenderer.js)
- Examples: [webgl_postprocessing_pixel](https://threejs.org/examples/#webgl_postprocessing_pixel) · [webgpu_postprocessing_pixel](https://threejs.org/examples/#webgpu_postprocessing_pixel)
- [What's New in Three.js (2026)](https://www.utsubo.com/blog/threejs-2026-what-changed)

**Toolchain**
- [Vite 8.0 announcement](https://vite.dev/blog/announcing-vite8) · [Rolldown-powered Vite 8 beta](https://voidzero.dev/posts/announcing-vite-8-beta)
- [TypeScript 7.0 released (InfoQ)](https://www.infoq.com/news/2026/08/typescript-7-released/) · [The Register: TypeScript 7.0 stable](https://www.theregister.com/devops/2026/07/09/speedier-type-checks-in-typescript-70-as-first-stable-go-release-ships/5268828)
- [npm registry](https://registry.npmjs.org/) — all version and publish-date figures

**Competing engines**
- [Babylon.js 9.0 announcement](https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0/) · [Babylon post-process docs](https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses)
- [PlayCanvas post effects](https://developer.playcanvas.com/user-manual/graphics/posteffects/) · [custom render passes](https://developer.playcanvas.com/user-manual/graphics/posteffects/cameraframe/custom-passes/) · [standalone engine](https://developer.playcanvas.com/user-manual/engine/standalone/)
- [Godot releases](https://github.com/godotengine/godot/releases) · [exporting for web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html) · [4.3 web export report](https://godotengine.org/article/progress-report-web-export-in-4-3/) · iOS issues [#116750](https://github.com/godotengine/godot/issues/116750), [#70621](https://github.com/godotengine/godot/issues/70621), [#95941](https://github.com/godotengine/godot/issues/95941), [#120302](https://github.com/godotengine/godot/issues/120302)
- [Unity 6000.7 browser compatibility](https://docs.unity3d.com/6000.7/Documentation/Manual/webgl-browsercompatibility.html) · [Unity build-size measurements (Aras Pranckevičius)](https://gist.github.com/aras-p/740c2d4f9977ce92b7de72b1394dd365)
- [Phaser 4 renderer](https://phaser.io/news/2026/04/phaser-4-renderer-faster-cleaner-and-built-for-modern-games) · [Phaser 4 review](https://gamefromscratch.com/phaser-4-released/) · [enable3d](https://enable3d.io/)
- [Bevy 0.19](https://bevy.org/news/bevy-0-19/) · [bevy#13168 WebGL2 + WebGPU in one wasm](https://github.com/bevyengine/bevy/issues/13168) · [Bevy Cheat Book: WASM size optimisation](https://bevy-cheatbook.github.io/platforms/wasm/size-opt.html)
- [Pixi.js](https://pixijs.com/) · [caniuse: WebGPU](https://caniuse.com/webgpu) · [W3C GPU for the Web implementation status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)

**Asset pipeline**
- [vengi voxconvert usage](https://vengi-voxel.github.io/vengi/voxconvert/Usage/) · [examples](https://vengi-voxel.github.io/vengi/voxconvert/Examples/) · [configuration cvars](https://vengi-voxel.github.io/vengi/Configuration/) · [voxelization](https://vengi-voxel.github.io/vengi/Voxelization/) · [formats](https://vengi-voxel.github.io/vengi/Formats/)
- [MagicaVoxel releases (ephtracy)](https://github.com/ephtracy/ephtracy.github.io/releases) · [.vox format spec](https://github.com/ephtracy/voxel-model) · [Homebrew cask](https://formulae.brew.sh/cask/magicavoxel)
- [Goxel](https://github.com/guillaumechereau/goxel) · [Blockbench](https://www.blockbench.net/) · [Avoyd](https://www.avoyd.com/) · [VoxEdit FAQ](https://docs.sandbox.game/en/creator/voxedit/faqs-voxedit)
- [trimesh voxel.creation docs](https://trimesh.org/trimesh.voxel.creation.html) · [open3d](http://www.open3d.org/) · [binvox](https://www.patrickmin.com/binvox/)
- [Lospec palette list](https://lospec.com/palette-list) · [DawnBringer 32](https://lospec.com/palette-list/dawnbringer-32)
- [Voxel Art: Reducing the Greebles](https://www.gamedeveloper.com/design/voxel-art-reducing-the-greebles) · [Voxelart Styles in Video Games](https://www.gamedeveloper.com/art/voxelart-styles-in-video-games)

**VFX / audio**
- [three-nebula](https://github.com/creativelifeform/three-nebula) · [three.quarks](https://github.com/Alchemist0823/three.quarks) · [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing)
- [GSAP standard licence](https://gsap.com/community/standard-license/) · [GSAP becomes free (Webflow)](https://webflow.com/blog/gsap-becomes-free) · [Motion three.js docs](https://motion.dev/docs/three)
- [ZzFX designer](https://killedbyapixel.github.io/ZzFX) · [ZzFX repo](https://github.com/KilledByAPixel/ZzFX) · [jsfxr / sfxr.me](https://sfxr.me)
- [MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) · [MDN AudioSession.type](https://developer.mozilla.org/docs/Web/API/AudioSession/type) · [Unlock Web Audio in Safari](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos)
