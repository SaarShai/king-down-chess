/** Billboard pieces for the HD-2D style: one pre-rendered plane per piece, turned at the camera. */
import * as THREE from 'three';
import { A, B, Color, G, K, type KingName, L, M, N, P, PieceType, Q, R, S } from '../rules/engine';
import { TARGET_HEIGHT } from './voxels';

/** The renderer billboards each plane at the camera every frame, so no fixed lean here. */
const params = new URLSearchParams(location.search);
/** Sprite set under `public/sprites/`: painted-* sets carry the colour-guide accents. */
const ARMY = params.get('army') || 'painted-blue-red';
/** Sprite art has more headroom than the voxel model, so give it a little more height. */
const SCALE = 1.15 * (Number(params.get('spriteScale')) || 1);

/** Lab-only types have no art; `spriteMesh` falls back to a voxel box for anything missing here. */
const FILE: Partial<Record<PieceType, string>> = {
  [P]: 'pawn', [N]: 'knight', [B]: 'bishop', [R]: 'rook', [Q]: 'queen', [K]: 'king',
  [A]: 'archer', [L]: 'paladin', [G]: 'guard', [M]: 'maester', [S]: 'beast',
};

/**
 * Kings with their own sprite in the painted-* sets (tools/sprites-painted.py). Spirit and Shadow
 * have none yet: they, and every king in the other sets, use the set's plain `king-w`/`king-b`.
 */
const KING_SPRITE: Partial<Record<KingName, string>> = { Frost: 'king-frost', Flame: 'king-ember', Stratus: 'king-celestial', Mud: 'king-gaya' };

/** Is there sprite art for this type? No, for a lab-only piece; the renderer then draws a box. */
export const hasSprite = (t: PieceType): boolean => FILE[t] !== undefined;

const loader = new THREE.TextureLoader();
const textures = new Map<string, Promise<THREE.Texture>>();

/** Sprite art is ~192 px tall over ~120 screen px, so one art pixel is ~5 source pixels. */
const DILATE = 5;

/**
 * Thick outline for a sprite plane: dilate the alpha by drawing the art 8× on a ring, flatten the
 * union to the outline colour, then stamp the original on top. One texture, no extra draw calls.
 */
function outlined(img: CanvasImageSource & { width: number; height: number }, color: number): HTMLCanvasElement {
  const r = DILATE, cv = document.createElement('canvas');
  cv.width = img.width + 2 * r;
  cv.height = img.height + 2 * r;
  const ctx = cv.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.drawImage(img, r + Math.round(Math.cos(a) * r), r + Math.round(Math.sin(a) * r));
  }
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(img, r, r);
  return cv;
}

/** The art in grey, so a material colour can paint it in a side's clay (`spriteMesh`'s `tint`). */
function grey(img: HTMLImageElement): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = img.width;
  cv.height = img.height;
  const ctx = cv.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, cv.width, cv.height), d = px.data;
  for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2];
  ctx.putImageData(px, 0, 0);
  return cv;
}

function texture(t: PieceType, c: Color, outline?: number, king?: KingName, src?: string, tinted?: boolean): Promise<THREE.Texture> {
  const own = t === K && king && ARMY.startsWith('painted-') ? KING_SPRITE[king] : undefined;
  const name = src ?? `${own ?? FILE[t]}-${c ? 'b' : 'w'}`;
  const key = `${name}${outline == null ? '' : `:${outline}`}${tinted ? ':grey' : ''}`;
  let p = textures.get(key);
  if (!p) {
    p = loader.loadAsync(src ?? `${import.meta.env.BASE_URL}sprites/${ARMY}/${name}.png`).then(img => {
      let tex: THREE.Texture = img;
      if (outline != null) {
        tex = new THREE.CanvasTexture(outlined(img.image as HTMLImageElement, outline));
        img.dispose();
      } else if (tinted) {
        tex = new THREE.CanvasTexture(grey(img.image as HTMLImageElement));
        img.dispose();
      }
      tex.magFilter = tex.minFilter = src ? THREE.LinearFilter : THREE.NearestFilter; // a painted figure, not pixel art
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
    textures.set(key, p);
  }
  return p;
}

const planes = new Map<string, THREE.PlaneGeometry>();

/** Plane whose pivot is its bottom edge, so the sprite stands on the tile. Cached per size. */
function plane(w: number, h: number): THREE.PlaneGeometry {
  const key = `${w.toFixed(3)}:${h.toFixed(3)}`;
  let g = planes.get(key);
  if (!g) {
    g = new THREE.PlaneGeometry(w, h);
    g.translate(0, h / 2, 0);
    planes.set(key, g);
  }
  return g;
}

/**
 * One piece billboard (`src`: an image in place of the set's sprite; `tint`: a colour that paints the art, made grey first). The texture may still be loading — the mesh is hidden until it lands,
 * then takes its width from the image aspect. The renderer billboards it at the camera every frame.
 */
export function spriteMesh(t: PieceType, c: Color, outline?: number, king?: KingName, src?: string, tint?: THREE.ColorRepresentation): THREE.Object3D {
  const h = TARGET_HEIGHT[t] * SCALE;
  const mat = new THREE.MeshBasicMaterial({ alphaTest: 0.5, transparent: false, side: THREE.DoubleSide, visible: false, color: tint ?? 0xffffff });
  const mesh = new THREE.Mesh(plane(h, h), mat);
  void texture(t, c, outline, king, src, tint != null).then(tex => {
    const img = tex.image as { width: number; height: number };
    mesh.geometry = plane((h * img.width) / img.height, h);
    mat.map = tex;
    mat.visible = true;
    mat.needsUpdate = true;
  }).catch(() => {}); // a missing sprite leaves the square empty rather than breaking the board
  return mesh;
}
