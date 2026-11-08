import './card-motion.css';
import { fragment, VERTEX } from './shader';
import { mapOf } from './tag';

/**
 * Quiet motion on a card painting. <card-motion> sits on the <img> and draws only the moving parts; the still picture
 * under it is the art for reduced motion, a hidden tab, an off-screen card and any device without WebGL2.
 * One WebGL context draws every card, because a page may hold only a few contexts. Time is one shared clock,
 * so a card keeps its place in the loop when the board rebuilds its coins.
 */
const recipes = import.meta.glob<string>('./recipes/*.ts', { eager: true, import: 'default' });
export const LOOP_SECONDS = 8;
const FRAME_MS = 1000 / 30, SLOW_MS = 24, MAX_SIDE = 720, MAX_SCALE = 2;

interface Program { program: WebGLProgram; box: WebGLUniformLocation | null; window: WebGLUniformLocation | null; t: WebGLUniformLocation | null; size: WebGLUniformLocation | null }
interface Picture { texture: WebGLTexture; width: number; height: number }
let gl: WebGL2RenderingContext | null | undefined, surface: HTMLCanvasElement, seen: IntersectionObserver | undefined;
const programs = new Map<string, Program | null>(), pictures = new Map<string, Picture | null>(), loading = new Set<string>();
const live = new Set<CardMotion>(), shown = new Set<CardMotion>();
let raf = 0, last = -Infinity, lastTick = 0, pace = 16, frozen: number | undefined, draws = 0, drawMs = 0, compiledThisFrame = false;

function context() {
  if (gl !== undefined) return gl;
  surface = document.createElement('canvas');
  gl = surface.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  // shortcut: a lost context leaves the still art until the next page load; restore it if phones show this often.
  surface.addEventListener('webglcontextlost', () => { gl = null; for (const card of live) card.clear(); });
  return gl;
}

function programOf(card: string): Program | null | undefined {
  if (programs.has(card)) return programs.get(card);
  // One compile in a frame, so a screen full of new cards does not stall.
  if (compiledThisFrame) return undefined;
  compiledThisFrame = true;
  const g = gl!;
  const part = (kind: number, source: string) => { const s = g.createShader(kind)!; g.shaderSource(s, source); g.compileShader(s); return s; };
  const program = g.createProgram()!, fragmentPart = part(g.FRAGMENT_SHADER, fragment(recipes[`./recipes/${card}.ts`]));
  g.attachShader(program, part(g.VERTEX_SHADER, VERTEX)); g.attachShader(program, fragmentPart); g.linkProgram(program);
  let made: Program | null = null;
  if (g.getProgramParameter(program, g.LINK_STATUS)) {
    made = { program, box: g.getUniformLocation(program, 'box'), window: g.getUniformLocation(program, 'window'), t: g.getUniformLocation(program, 't'), size: g.getUniformLocation(program, 'size') };
    g.useProgram(program);
    g.uniform1i(g.getUniformLocation(program, 'art'), 0); g.uniform1i(g.getUniformLocation(program, 'map'), 1);
  } else console.error(`card motion ${card}: ${g.getShaderInfoLog(fragmentPart)}`);
  programs.set(card, made);
  return made;
}

function load(url: string) {
  if (pictures.has(url) || loading.has(url)) return;
  loading.add(url);
  // CORS mode: the plugin serves its art from another origin, and WebGL refuses a picture without it.
  const image = new Image(); image.crossOrigin = 'anonymous'; image.src = url;
  void image.decode().then(() => {
    const g = gl; if (!g) return;
    const texture = g.createTexture()!;
    g.bindTexture(g.TEXTURE_2D, texture);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, g.RGBA, g.UNSIGNED_BYTE, image);
    g.generateMipmap(g.TEXTURE_2D);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    pictures.set(url, { texture, width: image.naturalWidth, height: image.naturalHeight });
  }).catch(() => { pictures.set(url, null); }).finally(() => { loading.delete(url); if (frozen !== undefined) seek(frozen); });
}

const allowed = () => !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.pace !== 'off' && document.getElementById('app-root')?.dataset.uiMotion !== 'off';
const clock = () => performance.now() / 1000 / LOOP_SECONDS % 1;

function wake() {
  if (frozen === undefined && !allowed()) { for (const card of live) card.clear(); return; }
  // Only a card that can draw loads its pictures: with reduced motion or a hidden tab, no fetch and no texture upload.
  for (const card of shown) card.load();
  if (frozen === undefined && !raf && shown.size) raf = requestAnimationFrame(tick);
}
function tick(now: number) {
  raf = 0;
  if (frozen !== undefined) return;
  if (!allowed() || !shown.size) { wake(); return; }
  // A device that falls behind draws at half rate: the game keeps its frames before the cards keep theirs.
  pace += (Math.min(now - lastTick, 200) - pace) * .05; lastTick = now;
  if (now - last >= (pace > SLOW_MS ? FRAME_MS * 2 : FRAME_MS) - 2) {
    last = now; compiledThisFrame = false;
    const start = performance.now(), phase = clock();
    for (const card of shown) card.draw(phase);
    draws++; drawMs += performance.now() - start;
  }
  raf = requestAnimationFrame(tick);
}

// Node tests import this module through the card face; they have no DOM.
class CardMotion extends (typeof HTMLElement === 'undefined' ? Object as unknown as typeof HTMLElement : HTMLElement) {
  canvas?: HTMLCanvasElement;
  private paint?: CanvasRenderingContext2D | null;
  connectedCallback() {
    if (typeof IntersectionObserver === 'undefined' || !recipes[`./recipes/${this.dataset.motion}.ts`] || !context()) return;
    seen ??= new IntersectionObserver(entries => {
      for (const entry of entries) {
        const card = entry.target as CardMotion;
        if (entry.isIntersecting) shown.add(card); else { shown.delete(card); card.clear(); }
      }
      wake();
    });
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.style.cssText = 'display:block;width:100%;height:100%;border-radius:inherit';
      this.paint = this.canvas.getContext('2d');
      // Closed: the page and its checks mean the board when they ask for "canvas".
      this.attachShadow({ mode: 'closed' }).append(this.canvas);
    }
    live.add(this); seen.observe(this);
    // The board rebuilds its coins often: draw now, or the moving parts snap to the still art for a frame.
    if (frozen !== undefined) this.draw(frozen); else if (allowed()) this.draw(clock());
  }
  disconnectedCallback() { live.delete(this); shown.delete(this); seen?.unobserve(this); }
  load() { load(this.dataset.painting!); load(mapOf(this.dataset.motion!)!); }
  clear() { if (this.canvas) this.paint?.clearRect(0, 0, this.canvas.width, this.canvas.height); }
  draw(phase: number) {
    const g = gl, canvas = this.canvas, paint = this.paint, art = pictures.get(this.dataset.painting!), map = pictures.get(mapOf(this.dataset.motion!)!);
    if (!g || !canvas || !paint || !art || !map) return;
    // Layout size, so a coin's deal or press transform does not change the drawing.
    const cssWidth = this.offsetWidth, cssHeight = this.offsetHeight;
    if (!cssWidth || !cssHeight) return;
    const program = programOf(this.dataset.motion!);
    if (!program) return;
    const scale = Math.min(devicePixelRatio || 1, MAX_SCALE, MAX_SIDE / Math.max(cssWidth, cssHeight));
    const width = Math.max(1, Math.round(cssWidth * scale)), height = Math.max(1, Math.round(cssHeight * scale));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    if (surface.width < width || surface.height < height) { surface.width = Math.max(surface.width, width); surface.height = Math.max(surface.height, height); }
    // The box shows the painting with object-fit: cover, centred. A thumbnail is itself that centred window. The map has the painting's shape.
    const ratio = map.width / map.height, boxRatio = cssWidth / cssHeight;
    const w = boxRatio > ratio ? 1 : boxRatio / ratio, h = boxRatio > ratio ? ratio / boxRatio : 1;
    const shape = art.width / art.height, tw = shape > ratio ? 1 : shape / ratio, th = shape > ratio ? ratio / shape : 1;
    g.viewport(0, 0, width, height);
    g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT);
    g.useProgram(program.program);
    g.uniform4f(program.box, (1 - w) / 2, (1 - h) / 2, w, h);
    g.uniform4f(program.window, (1 - tw) / 2, (1 - th) / 2, 1 / tw, 1 / th);
    g.uniform1f(program.t, phase); g.uniform1f(program.size, cssWidth);
    g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, art.texture);
    g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, map.texture);
    g.drawArrays(g.TRIANGLES, 0, 3);
    paint.clearRect(0, 0, width, height);
    paint.drawImage(surface, 0, surface.height - height, width, height, 0, 0, width, height);
  }
}

/** Hold the loop at one phase for a check or a capture; undefined lets it run. Loads every card, seen or not. */
export function seek(phase: number | undefined) {
  frozen = phase;
  if (phase === undefined) { wake(); return; }
  for (const card of live) { card.load(); compiledThisFrame = false; card.draw(phase); }
}
export const motionState = () => ({ live: live.size, shown: shown.size, running: raf !== 0, gl: Boolean(gl), compiled: [...programs].map(([card, made]) => [card, Boolean(made)]), draws, drawMs });

if (typeof customElements !== 'undefined' && !customElements.get('card-motion')) {
  customElements.define('card-motion', CardMotion);
  document.addEventListener('visibilitychange', wake);
  if (typeof matchMedia !== 'undefined') matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', wake);
  new MutationObserver(wake).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['data-pace', 'data-ui-motion'] });
}
