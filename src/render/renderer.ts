/** three.js board view: pixelated post-process, voxel pieces, picking, move animations. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Color, LETTERS, Move, N, O, Position, PieceType, colorOf, file, rank, typeOf } from '../rules/engine';
import { ARMY, TARGET_HEIGHT, pieceGeometry } from './voxels';
import { Debris, Tweens, easeOut, labelSprite, linear } from './fx';
import { PALETTES, createPalettePass, paletteTexture } from './palette';
import { hasSprite, spriteMesh } from './sprites';
import { STYLES, type Style } from './styles';
import { OgreFigure } from './OgreFigure';
import type { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const tileCenter = (sq: number): THREE.Vector3 => new THREE.Vector3(file(sq) - 3.5, 0, 3.5 - rank(sq));

export interface Highlights {
  selected?: number | null;
  moves?: number[];
  captures?: number[];
  swaps?: number[];
  /** Squares holding a piece an Ogre may shove (occupied, never a capture). */
  shoves?: number[];
  last?: number[];
  check?: number | null;
}

const LIGHT = 0xefebe3, DARK = 0x6f6b65;
const BG_BRIGHT = 0xe9e6df, BG_TORCH = 0x120e0a;

/** Rim thickness in world units; the board shows ~95 px per unit at 900 px tall, so ~2 px. */
const RIM = 0.04;
/** Tile block height when `style.boardSide` is unset. */
const SIDE = 0.3;

/** The one default pose: `resetView()` tweens back here, `flip()` mirrors its azimuth.
 *  ~54° elevation: a 1.3-unit king projects shorter than a tile is deep, so no piece covers the one behind it. */
const CAM_HOME = { elev: 54.2, azim: 0 };
const CAM_RADIUS = 13.5;
const CAM_TARGET = new THREE.Vector3(0, 0.45, 0);
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/** Nearest-filtered 32×32 white square with a 1-texel dark ring — one art pixel of tile edge at pixelSize 3. */
function edgeTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 32;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = '#3a3a3a'; // multiplies the tile colour down to near-black
  ctx.fillRect(0, 0, 32, 1); ctx.fillRect(0, 31, 32, 1); ctx.fillRect(0, 0, 1, 32); ctx.fillRect(31, 0, 1, 32);
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Five greys per material, darkest first: mortar, crack, base, grain, bevel highlight. Hand-picked,
 *  then the base nudged until each tile's mean linear luminance matches the photo it replaces
 *  (light 0.653, dark 0.033, frame 0.212 — see docs/research/tiles-proc/README.md). */
const STONE = {
  light: [0x93, 0xba, 0xdd, 0xe6, 0xf0],
  dark: [0x1e, 0x29, 0x35, 0x3c, 0x45],
  frame: [0x48, 0x66, 0x84, 0x91, 0xa1],
};

/** Procedural pixel stone: one 64×64 flagstone with a mortar seam, seeded grain, a few darker
 *  flecks and two hairline cracks. Deterministic, so every square of a colour draws the same tile. */
function stoneTexture(shades: number[], seed: number): THREE.CanvasTexture {
  const N = 64, cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const ctx = cv.getContext('2d')!;
  const use = (i: number): void => { ctx.fillStyle = `rgb(${shades[i]},${shades[i]},${shades[i]})`; };
  const rnd = (): number => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

  use(0); ctx.fillRect(0, 0, N, N);         // mortar; the flagstone leaves it as a 2 px seam
  use(2); ctx.fillRect(2, 2, N - 4, N - 4);
  // Grain in 4 px blocks — one shade up, one down. 2 px blocks land on the pixel pass's own
  // frequency at pixelSize 2 and read as static; 4 px reads as mottled stone and holds still.
  for (let y = 2; y < N - 2; y += 4) {
    for (let x = 2; x < N - 2; x += 4) {
      const r = rnd();
      if (r > 0.72) { use(3); ctx.fillRect(x, y, 4, 4); } else if (r < 0.13) { use(1); ctx.fillRect(x, y, 4, 4); }
    }
  }
  use(0);
  for (let i = 0; i < 9; i++) ctx.fillRect(4 + Math.floor(rnd() * (N - 10)), 4 + Math.floor(rnd() * (N - 10)), 1, 1);
  for (let c = 0; c < 2; c++) {             // hairline crack: a 1 px walk in from one edge
    let x = 10 + Math.floor(rnd() * (N - 20)), y = c ? N - 4 : 3;
    for (let i = 0; i < 24; i++) { ctx.fillRect(x, y, 1, 1); x += Math.round(rnd() * 2 - 1); y += c ? -1 : 1; }
  }
  use(4); ctx.fillRect(2, 2, N - 4, 1); ctx.fillRect(N - 3, 2, 1, N - 4);    // bevel: light from the top right
  use(1); ctx.fillRect(2, N - 4, N - 4, 2); ctx.fillRect(2, 2, 2, N - 4);    // shadow on the other two, as the photo has

  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const glyphMats = new Map<string, THREE.MeshBasicMaterial>();
/** Board-frame coordinate glyph: pale ink with a dark drop shadow, so it reads on the stone
 *  frame and on the flat dark one alike. 16×16, NearestFilter, alpha-tested (no blend sorting). */
function glyphMat(ch: string): THREE.MeshBasicMaterial {
  let m = glyphMats.get(ch);
  if (!m) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 16;
    const ctx = cv.getContext('2d')!;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1611';
    ctx.fillText(ch, 9, 10);
    ctx.fillStyle = '#e7dcc2';
    ctx.fillText(ch, 8, 9);
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5 });
    glyphMats.set(ch, m);
  }
  return m;
}

/** Soft contact shadow: a radial black-to-clear disc laid flat under a piece. */
function shadowTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

export class BoardRenderer {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  readonly world = new THREE.Group();
  /** `shift` lets the caller prefer a shove over the capture on the same occupied square. */
  onSquareClick: (sq: number, shift: boolean) => void = () => {};
  onSquareHover: (sq: number | null) => void = () => {};

  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private pixelPass: RenderPixelatedPass;
  private palettePass: ShaderPass;
  private tiles: THREE.Mesh<THREE.BoxGeometry, THREE.MeshLambertMaterial>[] = [];
  private pieces = new Map<number, THREE.Group>();
  private markers = new THREE.Group();
  private tweens = new Tweens();
  private debris: Debris;
  private lambertMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  private toonMats = new Map<number, THREE.MeshToonMaterial>();
  private pieceMat: THREE.Material = this.lambertMat;
  private style: Style = Object.values(STYLES)[0];
  private labels = false;
  private lastPos: Position | null = null;
  private positionVersion = 0;
  private flipped = false;
  private markerGeo = new THREE.BoxGeometry(0.22, 0.12, 0.22);
  private moveMat = new THREE.MeshLambertMaterial({ color: 0x5fd35f, emissive: 0x1f6f1f });
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private shake = 0;
  private shakeOff = new THREE.Vector3();
  private timer = new THREE.Timer();
  private controls: OrbitControls;
  /** Inverted hull: the pixel pass's edge term is a multiply, so it can never outline a dark piece. */
  private outlineMat = new THREE.MeshBasicMaterial({ color: 0x151515, side: THREE.BackSide });
  private frame3d: THREE.Mesh<THREE.BoxGeometry, THREE.MeshLambertMaterial>;
  private coords = new THREE.Group();
  private hemi = new THREE.HemisphereLight(0xfff2dd, 0x2b2140, 1.6);
  private sun = new THREE.DirectionalLight(0xffffff, 2.2);
  private torches = new THREE.Group();
  private edgeTex = edgeTexture();
  private shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  private shadowGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  private stone: Record<string, THREE.Texture> = {};
  private proc: Record<string, THREE.Texture> = {};
  private tap: PointerEvent | null = null; // pointerdown that may still turn into a click
  private hovered: number | null = null;
  private highlights: Highlights = {};

  constructor(private container: HTMLElement, private readonly options: { ogreModel?: boolean } = {}) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    container.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(BG_BRIGHT);
    this.scene.add(this.world);
    this.camera.position.copy(CAM_TARGET).add(this.camOffset());

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(CAM_TARGET);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.rotateSpeed = 0.6;
    this.controls.minPolarAngle = 0.25;   // never look straight down…
    this.controls.maxPolarAngle = 1.25;   // …nor from below the board plane
    this.controls.minZoom = 0.7;
    this.controls.maxZoom = 3;
    this.controls.screenSpacePanning = false; // pan slides along the board plane
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.update();

    this.sun.position.set(-4, 10, 6);
    this.scene.add(this.hemi, this.sun, this.torches);
    // Four warm points just outside the board corners; only lit when style.lights === 'torch'.
    // decay 1.4 (not the physical 2) on a 2.4-high mount: at 1.6 with square falloff a corner
    // square got ~40× the centre — white pieces blown out there, silhouettes in the middle.
    for (const [x, z] of [[-4.8, -4.8], [4.8, -4.8], [-4.8, 4.8], [4.8, 4.8]]) {
      const p = new THREE.PointLight(0xffa851, 0, 16, 1.4);
      p.position.set(x, 2.4, z);
      this.torches.add(p);
    }
    this.torches.visible = false;

    this.frame3d = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.5, 8.9), new THREE.MeshLambertMaterial({ color: 0x2b2a28 }));
    this.frame3d.position.y = -0.4;
    this.world.add(this.frame3d, this.coords);
    // a–h and 1–8, flat on the frame. userData.axis: 'f' = file letter, 'r' = rank number.
    const glyphGeo = new THREE.PlaneGeometry(0.34, 0.34).rotateX(-Math.PI / 2);
    for (let i = 0; i < 8; i++) {
      const f = new THREE.Mesh(glyphGeo, glyphMat('abcdefgh'[i]));
      f.position.x = i - 3.5;
      f.userData.axis = 'f';
      const r = new THREE.Mesh(glyphGeo, glyphMat(`${i + 1}`));
      r.position.z = 3.5 - i;
      r.userData.axis = 'r';
      this.coords.add(f, r);
    }
    this.placeCoords();
    for (let sq = 0; sq < 64; sq++) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(1, SIDE, 1), new THREE.MeshLambertMaterial({ color: (file(sq) + rank(sq)) % 2 ? LIGHT : DARK }));
      tile.position.copy(tileCenter(sq)).setY(-SIDE / 2);
      tile.userData.sq = sq;
      this.tiles.push(tile);
      this.world.add(tile);
    }
    this.world.add(this.markers);
    this.debris = new Debris(this.world);

    this.composer = new EffectComposer(this.renderer);
    this.pixelPass = new RenderPixelatedPass(2, this.scene, this.camera, { normalEdgeStrength: 0.05, depthEdgeStrength: 0.3 });
    this.composer.addPass(this.pixelPass);
    this.composer.addPass(new OutputPass());
    this.palettePass = createPalettePass();
    this.composer.addPass(this.palettePass);

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    const el = this.renderer.domElement;
    el.addEventListener('pointermove', e => this.hover(this.pick(e)));
    el.addEventListener('pointerdown', e => { this.tap = this.tap ? null : e; }); // a second finger cancels the tap
    el.addEventListener('pointerup', e => this.onUp(e));
    el.addEventListener('pointercancel', () => { this.tap = null; });
    el.addEventListener('pointerleave', () => this.hover(null));
    this.timer.connect(document);
    this.renderer.setAnimationLoop(() => this.frame());
  }

  setPixelSize(n: number): void { this.pixelPass.setPixelSize(n); this.palettePass.uniforms.pixelSize.value = n; }
  setPalette(on: boolean, dither = 0.08): void { this.palettePass.enabled = on; this.palettePass.uniforms.ditherAmount.value = dither; }
  setEdges(normal: number, depth: number): void { this.pixelPass.normalEdgeStrength = normal; this.pixelPass.depthEdgeStrength = depth; }
  /** Letter chips over every piece — the last resort when two silhouettes still read alike. */
  setLabels(on: boolean): void {
    this.labels = on;
    for (const g of this.pieces.values()) (g.userData.label as THREE.Sprite).visible = on;
  }

  /** Swap the quantisation ramp the palette pass snaps to. */
  setPaletteColors(hex: number[]): void {
    (this.palettePass.uniforms.tPalette.value as THREE.DataTexture).dispose();
    this.palettePass.uniforms.tPalette.value = paletteTexture(hex);
    this.palettePass.uniforms.paletteSize.value = hex.length;
  }

  /** Switch art style: post-process knobs, board, lights, camera, and voxel-vs-sprite pieces. */
  applyStyle(style: Style): void {
    const mat = style.shading === 'toon' ? this.toonMat(style.toonBands ?? 4) : this.lambertMat;
    const old = this.style;
    const dirty = mat !== this.pieceMat || style.pieces !== old.pieces || style.outline !== old.outline
      || style.pieceScale !== old.pieceScale || style.spriteOutline !== old.spriteOutline
      || style.shadow !== old.shadow || style.rim !== old.rim || style.outlineColor !== old.outlineColor
      || style.pixelSize !== old.pixelSize;
    this.style = style;
    this.pieceMat = mat;
    this.outlineMat.color.setHex(style.outlineColor ?? 0x151515);
    this.setPixelSize(style.pixelSize);
    this.setPalette(style.palette, style.dither);
    this.setPaletteColors(PALETTES[style.paletteName ?? 'db32']);
    this.setEdges(style.normalEdge, style.depthEdge);
    this.setCoords(style.coords ?? true);
    this.applyBoard();
    this.applyLights();
    this.applyCamera();
    if (dirty && this.lastPos) this.rebuild(this.lastPos);
  }

  /** Tile top (flat / 1-px ring / stone albedo) and the block height that shows the side faces. */
  private applyBoard(): void {
    const kind = this.style.tiles ?? 'flat', torch = this.style.lights === 'torch';
    if (kind === 'stone' && !this.stone.light) {
      const load = (f: string): THREE.Texture => {
        const t = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}textures/${f}`);
        t.magFilter = t.minFilter = THREE.NearestFilter;
        t.generateMipmaps = false;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      };
      this.stone = { light: load('white_tile_1.jpg'), dark: load('black_tile_1.jpg'), frame: load('board_texture1.jpg') };
    }
    if (kind === 'stoneProc' && !this.proc.light) {
      this.proc = { light: stoneTexture(STONE.light, 7), dark: stoneTexture(STONE.dark, 11), frame: stoneTexture(STONE.frame, 3) };
    }
    // Both stone kinds take the same albedo knock-back and frame tint; only the maps differ.
    const maps = kind === 'stone' ? this.stone : kind === 'stoneProc' ? this.proc : null;
    const side = this.style.boardSide ?? SIDE;
    for (const tile of this.tiles) {
      const sq = tile.userData.sq as number;
      const light = (file(sq) + rank(sq)) % 2 === 1;
      const m = tile.material;
      m.map = kind === 'edged' ? this.edgeTex : maps ? maps[light ? 'light' : 'dark'] : null;
      // Torch: the stone albedo is knocked back a third. Full-bright sand under a lifted ambient
      // out-glares the ivory army and flattens the torch pools; the pieces keep the extra light.
      m.color.setHex(maps ? (torch ? 0xc2b5a3 : 0xffffff) : light ? LIGHT : DARK);
      m.needsUpdate = true;
      tile.scale.y = side / SIDE;
      tile.position.y = -side / 2;
    }
    this.frame3d.material.map = maps ? maps.frame : null;
    this.frame3d.material.color.setHex(maps ? (torch ? 0x6f6a60 : 0x8a8478) : 0x2b2a28);
    this.frame3d.material.needsUpdate = true;
    this.frame3d.position.y = -side - 0.1;
    this.placeCoords();
  }

  /** File letters on the near frame edge, rank numbers on the left one — for whichever side is
   *  looking, turned to face it. The board never rotates, so only these 16 quads move. */
  private placeCoords(): void {
    const s = this.flipped ? -1 : 1;
    for (const g of this.coords.children) {
      g.position.y = this.frame3d.position.y + 0.26; // frame box is 0.5 tall: top + 1 hair
      if (g.userData.axis === 'f') g.position.z = 4.22 * s;
      else g.position.x = -4.22 * s;
      g.rotation.y = this.flipped ? Math.PI : 0;
    }
  }

  /** Show or hide the board coordinates (a future checkbox in the style panel). */
  setCoords(on: boolean): void { this.coords.visible = on; }

  /** 'torch' drops the ambient and turns on four warm corner points over a dark background. */
  private applyLights(): void {
    const torch = this.style.lights === 'torch';
    // The torch fill was 0.35 and every piece more than ~2 tiles from a corner lost its paint — the
    // dark army went to silhouette. 0.58 warm sky + 0.4 sun is the floor that keeps piece identity
    // mid-board; the mood survives because the torches still put ~3× that on the corner squares
    // (and applyBoard knocks the stone albedo back so the floor does not eat the lift).
    this.hemi.intensity = torch ? 0.58 : 1.6;
    this.hemi.color.setHex(torch ? 0xffd9a8 : 0xfff2dd);
    this.hemi.groundColor.setHex(torch ? 0x3a2a3a : 0x2b2140);
    this.sun.intensity = torch ? 0.4 : 2.2;
    this.torches.visible = torch;
    for (const p of this.torches.children as THREE.PointLight[]) p.intensity = torch ? 10 : 0;
    (this.scene.background as THREE.Color).setHex(torch ? BG_TORCH : BG_BRIGHT);
  }

  /** Camera offset from CAM_TARGET for the style's pose (degrees → spherical). */
  private camOffset(): THREE.Vector3 {
    const c = this.style.camera ?? CAM_HOME;
    return new THREE.Vector3().setFromSphericalCoords(
      CAM_RADIUS, THREE.MathUtils.degToRad(90 - c.elev), THREE.MathUtils.degToRad(c.azim));
  }

  /** Snap to the style's pose (styleboard shots need it settled before the first frame). */
  private applyCamera(): void {
    const off = this.camOffset();
    if (this.flipped) off.set(-off.x, off.y, -off.z);
    this.controls.target.copy(CAM_TARGET);
    this.camera.position.copy(CAM_TARGET).add(off);
    this.camera.zoom = this.style.camera?.zoom ?? 1;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  /** Banded toon material; the gradient map is N grey steps sampled with NearestFilter. */
  private toonMat(bands: number): THREE.MeshToonMaterial {
    let m = this.toonMats.get(bands);
    if (!m) {
      const steps = new Uint8Array(bands);
      for (let i = 0; i < bands; i++) steps[i] = Math.round(((i + 1) / bands) * 255);
      const gradientMap = new THREE.DataTexture(steps, bands, 1, THREE.RedFormat);
      gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter;
      gradientMap.needsUpdate = true;
      m = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
      this.toonMats.set(bands, m);
    }
    return m;
  }

  /** View from black's side: orbit to the opposite azimuth. The world never rotates, so picking is unaffected. */
  flip(black: boolean): void {
    if (black === this.flipped) return;
    this.flipped = black;
    this.placeCoords();
    const to = this.offset();
    to.theta += Math.PI;
    void this.tweenTo(to, this.controls.target.clone(), this.camera.zoom);
  }

  /** Back to the default pose (mirrored when viewing as black). */
  resetView(): void {
    const home = new THREE.Spherical().setFromVector3(this.camOffset());
    if (this.flipped) home.theta += Math.PI;
    void this.tweenTo(home, CAM_TARGET.clone(), this.style.camera?.zoom ?? 1);
  }

  /** Page position of a tile centre, in CSS pixels. Used by tools/styleboard2.mjs to aim the crops. */
  screenOf(sq: number): { x: number; y: number } {
    const v = tileCenter(sq).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  }

  /** Camera position relative to the orbit target, in spherical coords. */
  private offset(): THREE.Spherical {
    return new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
  }

  /** Tween the orbit (arc, never a straight line through the board), the target and the ortho zoom. */
  private tweenTo(to: THREE.Spherical, target: THREE.Vector3, zoom: number, dur = 0.4): Promise<void> {
    const from = this.offset(), t0 = this.controls.target.clone(), z0 = this.camera.zoom, off = new THREE.Vector3();
    const d = to.theta - from.theta;
    to.theta = from.theta + Math.atan2(Math.sin(d), Math.cos(d)); // shortest way round (a flip stays a clean +π)
    return this.tweens.add(dur, k => {
      off.setFromSphericalCoords(lerp(from.radius, to.radius, k), lerp(from.phi, to.phi, k), lerp(from.theta, to.theta, k));
      this.controls.target.lerpVectors(t0, target, k);
      this.camera.position.copy(this.controls.target).add(off);
      this.camera.zoom = lerp(z0, zoom, k);
      this.camera.updateProjectionMatrix();
    }, easeOut);
  }

  /** Drop every piece mesh and rebuild (after switching model sets). */
  rebuild(pos: Position): void {
    for (const g of this.pieces.values()) this.removeFigure(g);
    this.pieces.clear();
    this.sync(pos);
  }

  /** Reconcile piece meshes with a position (only squares that differ are rebuilt). */
  sync(pos: Position): void {
    this.lastPos = pos;
    this.positionVersion++;
    for (const g of this.pieces.values()) (g.userData.ogre as OgreFigure | undefined)?.reset();
    for (let sq = 0; sq < 64; sq++) {
      const code = pos.board[sq];
      const cur = this.pieces.get(sq);
      if (cur && cur.userData.code === code && cur.position.distanceTo(tileCenter(sq)) < 0.01) continue;
      if (cur) { this.removeFigure(cur); this.pieces.delete(sq); }
      if (code) this.pieces.set(sq, this.spawn(sq, typeOf(code), colorOf(code)));
    }
  }

  private removeFigure(g: THREE.Group): void {
    (g.userData.ogre as OgreFigure | undefined)?.dispose();
    this.world.remove(g);
  }

  /** `style.rim` is in art pixels; one art pixel = pixelSize screen px = that many world units here. */
  private rimWorld(): number {
    if (this.style.rim == null) return RIM;
    const h = this.renderer.domElement.height || 900;
    return (this.style.rim * this.style.pixelSize * (this.camera.top - this.camera.bottom)) / (h * this.camera.zoom);
  }

  private spawn(sq: number, t: PieceType, c: Color): THREE.Group {
    const g = new THREE.Group();
    let top = TARGET_HEIGHT[t] * 1.15; // sprite art has extra headroom (sprites.ts SCALE)
    if (t === O && this.options.ogreModel !== false) {
      if (c === 1) g.rotation.y = Math.PI;
      top = 1.3 * (this.style.pieceScale ?? 1);
      g.userData.ogreReady = OgreFigure.load(c).then(figure => {
        if (g.parent !== this.world) { figure.dispose(); return; }
        figure.model.scale.setScalar(this.style.pieceScale ?? 1);
        g.userData.ogre = figure;
        g.add(figure.model);
      }).catch(error => console.error('Could not load Ogre', error));
    } else if (this.style.pieces === 'sprite' && hasSprite(t)) {
      g.add(spriteMesh(t, c, this.style.spriteOutline ? (this.style.outlineColor ?? 0x151515) : undefined));
      g.userData.sprite = true;
    } else {
      const geo = pieceGeometry(t, c);
      if (!geo.boundingBox) geo.computeBoundingBox();
      const s = this.style.pieceScale ?? 1;
      top = geo.boundingBox!.max.y * s;
      const mesh = new THREE.Mesh(geo, this.pieceMat);
      mesh.scale.setScalar(s);
      g.add(mesh);
      if (this.style.outline) {
        // Grown by a fixed world offset per axis, not a uniform scale: a piece is ~3× taller than
        // it is wide, so one scale factor that gives a 1.5 px side rim puts a 4 px hat on the head.
        const rim = this.rimWorld();
        const b = geo.boundingBox!, e = b.getSize(new THREE.Vector3()).multiplyScalar(0.5);
        const hull = new THREE.Mesh(geo, this.outlineMat);
        hull.scale.set(s + rim / e.x, s + rim / e.y, s + rim / e.z);
        hull.position.y = ((b.max.y + b.min.y) / 2) * (s - hull.scale.y);
        g.add(hull);
      }
      if (c === 1) g.rotation.y = Math.PI;
    }
    if (this.style.shadow) {
      // After the piece: the frame loop billboards children[0], which must stay the piece itself.
      const disc = new THREE.Mesh(this.shadowGeo, this.shadowMat);
      disc.scale.setScalar(0.8);
      disc.position.y = 0.02;
      g.add(disc);
      g.userData.shadow = disc;
    }
    const label = labelSprite(LETTERS[t]);
    label.position.y = top + 0.25;
    label.visible = this.labels;
    g.userData.label = label;
    g.add(label);
    g.position.copy(tileCenter(sq));
    g.userData.code = t | (c << 4);
    this.world.add(g);
    return g;
  }

  highlight(h: Highlights): void {
    this.highlights = h;
    for (const tile of this.tiles) tile.material.emissive.setHex(0);
    const set = (sqs: number[] | undefined, hex: number) => sqs?.forEach(sq => this.tiles[sq].material.emissive.setHex(hex));
    set(h.last, 0x2a3f6a);
    set(h.captures, 0x8a1f1f);
    set(h.swaps, 0x3f3f9a);
    set(h.shoves, 0x8a5a10); // amber: a shove target is occupied like a capture, but nothing is taken
    if (h.check != null) set([h.check], 0xaa1010);
    if (h.selected != null) set([h.selected], 0x7a6a10);
    if (this.hovered != null && !this.tiles[this.hovered].material.emissive.getHex()) set([this.hovered], 0x2a2a2a);
    this.markers.clear();
    for (const sq of h.moves ?? []) {
      const m = new THREE.Mesh(this.markerGeo, this.moveMat);
      m.position.copy(tileCenter(sq)).setY(0.06);
      this.markers.add(m);
    }
  }

  /** Animate a move on the pre-move board; call sync(newPos) afterwards. */
  async animateMove(pos: Position, m: Move): Promise<void> {
    const version = this.positionVersion;
    const current = () => version === this.positionVersion;
    const mover = this.pieces.get(m.from);
    if (!mover) return;
    const t = typeOf(pos.board[m.from]);
    const burst = (sq: number) => {
      const g = this.pieces.get(sq);
      if (!g) return;
      this.pieces.delete(sq);
      this.removeFigure(g);
      const pal = ARMY[colorOf(g.userData.code as number)];
      this.debris.burst(tileCenter(sq).setY(0.2), [pal.m, pal.s, pal.a]);
      this.shake = Math.max(this.shake, 0.12);
    };
    await mover.userData.ogreReady;
    if (!current()) return;
    if (m.shove) {
      // The shoved piece moves; under `push` the Ogre follows onto the square it left. No capture,
      // no debris. The engine's `m.to` is the Ogre's own square under `repel` and the shove source
      // under `push`, so the renderer reads `m.shove` and never the mode.
      const shoved = this.pieces.get(m.shove.from);
      const ogre = mover.userData.ogre as OgreFigure | undefined;
      if (ogre) {
        const direction = tileCenter(m.shove.from).sub(tileCenter(m.from));
        ogre.model.rotation.y = Math.atan2(direction.x, direction.z) - mover.rotation.y;
        const a = tileCenter(m.shove.from), b = tileCenter(m.shove.to);
        await this.tweens.add(1.6, k => {
          if (!current()) return;
          ogre.sample('Shove', k);
          if (shoved) shoved.position.lerpVectors(a, b, THREE.MathUtils.smoothstep(k, .32, .58));
        }, linear);
        if (!current()) return;
        ogre.reset();
      }
      if (shoved) {
        if (!ogre) await this.hop(shoved, m.shove.from, m.shove.to, 0.28, 0.25);
        if (!current()) return;
        this.pieces.delete(m.shove.from);
        this.pieces.set(m.shove.to, shoved);
      }
      if (m.to !== m.from) {
        await this.hop(mover, m.from, m.to, 0.28, 0.2);
        if (!current()) return;
        this.pieces.delete(m.from);
        this.pieces.set(m.to, mover);
      }
    } else if (m.to === m.from) {
      await this.arrow(m.from, m.captures[0]);
      if (!current()) return;
      burst(m.captures[0]);
    } else if (m.swap) {
      const other = this.pieces.get(m.to)!;
      await Promise.all([this.hop(mover, m.from, m.to, 0.45, 0.7), this.hop(other, m.to, m.from, 0.45, 0.4)]);
      if (!current()) return;
      this.pieces.set(m.to, mover);
      this.pieces.set(m.from, other);
    } else if (m.captures.length > 1) {
      let at = m.from;
      for (const v of m.captures) { await this.hop(mover, at, v, 0.22, 0.35); if (!current()) return; burst(v); at = v; }
      this.pieces.delete(m.from);
      this.pieces.set(m.to, mover);
    } else {
      await this.hop(mover, m.from, m.to, 0.35, t === N ? 1 : 0.35);
      if (!current()) return;
      if (m.captures.length) burst(m.captures[0]);
      this.pieces.delete(m.from);
      this.pieces.set(m.to, mover);
      if (m.selfRemove) { await this.tweens.wait(0.15); if (!current()) return; burst(m.to); this.shake = 0.25; }
    }
  }

  private async hop(g: THREE.Object3D, from: number, to: number, dur: number, height: number): Promise<void> {
    const version = this.positionVersion;
    await g.userData.ogreReady;
    if (version !== this.positionVersion) return;
    const a = tileCenter(from), b = tileCenter(to);
    const ogre = g.userData.ogre as OgreFigure | undefined;
    if (ogre) {
      const direction = b.clone().sub(a);
      ogre.model.rotation.y = Math.atan2(direction.x, direction.z) - g.rotation.y;
      await this.tweens.add(Math.max(dur, .85), k => {
        if (version !== this.positionVersion) return;
        g.position.lerpVectors(a, b, k);
        ogre.sample('Walk', k);
      }, linear);
      if (version === this.positionVersion) ogre.reset();
      return;
    }
    return this.tweens.add(dur, k => {
      if (version !== this.positionVersion) return;
      g.position.lerpVectors(a, b, k);
      g.position.y = Math.sin(k * Math.PI) * height;
      // The figure rises; its contact shadow stays on the board.
      const shadow = g.userData.shadow as THREE.Mesh | undefined;
      if (shadow) shadow.position.y = 0.02 - g.position.y;
    });
  }

  private arrow(from: number, to: number): Promise<void> {
    const a = tileCenter(from).setY(0.5), b = tileCenter(to).setY(0.4);
    const arrow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), new THREE.MeshLambertMaterial({ color: 0x7a4b2a }));
    arrow.position.copy(a);
    arrow.lookAt(b);
    this.world.add(arrow);
    return this.tweens.add(0.28, k => {
      arrow.position.lerpVectors(a, b, k);
      arrow.position.y += Math.sin(k * Math.PI) * 0.4;
      if (k >= 1) {
        this.world.remove(arrow);
        arrow.geometry.dispose();
        arrow.material.dispose();
      }
    }, linear);
  }

  private frame(): void {
    this.timer.update();
    const dt = Math.min(0.05, this.timer.getDelta());
    this.tweens.step(dt);
    this.debris.step(dt);
    this.controls.update(dt);
    // Sprites are billboards: the plane's pivot is its bottom edge, so copying the camera
    // quaternion stands it on the tile and leans it back at the camera from any angle.
    for (const g of this.pieces.values()) if (g.userData.sprite) g.children[0].quaternion.copy(this.camera.quaternion);
    this.shakeOff.set(0, 0, 0);
    if (this.shake > 0.001) {
      this.shakeOff.set((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake, 0);
      this.shake *= 0.85;
    }
    this.camera.position.add(this.shakeOff);
    this.composer.render();
    this.camera.position.sub(this.shakeOff); // shake is an offset, never part of the orbit
  }

  private resize(): void {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    const aspect = w / h, size = 9.4; // frustum only — camera.zoom (OrbitControls) survives a resize
    const vw = aspect >= 1 ? size * aspect : size, vh = aspect >= 1 ? size : size / aspect;
    this.camera.left = -vw / 2; this.camera.right = vw / 2; this.camera.top = vh / 2; this.camera.bottom = -vh / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  private pick(e: PointerEvent): number | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objects: THREE.Object3D[] = [...this.tiles, ...this.pieces.values()];
    for (const hit of this.raycaster.intersectObjects(objects, true)) {
      let o: THREE.Object3D | null = hit.object;
      while (o) {
        if (o.userData.sq != null) return o.userData.sq as number;
        for (const [sq, g] of this.pieces) if (g === o) return sq;
        o = o.parent;
      }
    }
    return null;
  }

  /** Select only on a click: anything past 6 px was an OrbitControls drag. */
  private onUp(e: PointerEvent): void {
    const d = this.tap;
    this.tap = null;
    if (e.button !== 0 || d?.pointerId !== e.pointerId) return;
    if (Math.hypot(e.clientX - d.clientX, e.clientY - d.clientY) > 6) return;
    const sq = this.pick(e);
    if (sq != null) this.onSquareClick(sq, e.shiftKey);
  }

  private hover(sq: number | null): void {
    if (sq === this.hovered) return;
    this.hovered = sq;
    this.highlight(this.highlights);
    this.onSquareHover(sq);
  }
}

export { easeOut };
