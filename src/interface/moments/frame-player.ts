import { frameAt, type LoadedPack } from './art';

interface Rect { x: number; y: number; width: number; height: number }
export interface MomentTarget {
  layer: HTMLElement;
  /** In layer CSS pixels. The bottom centre of the rectangle is the feet point. */
  measure(): Rect & { bodyHeight: number };
  motion: 'normal' | 'fast' | 'reduce';
  /** Subscribe to elapsed milliseconds from the start of playback. Return an unsubscribe function. */
  clock?: (draw: (elapsed: number) => void) => () => void;
  /** Hide the original figure when the painted effect takes over. */
  onReady?(): void;
}
export interface CollapseTarget extends MomentTarget {
  /** The old pose and its rectangle in layer CSS pixels. Supply it for pawn, bishop and archer. */
  from?: { image: CanvasImageSource; rect: Rect };
}

/** Each pose uses the same scale and feet point. */
export function playFrames(target: MomentTarget, { bank, image }: LoadedPack) {
  const canvas = document.createElement('canvas');
  canvas.className = 'moment-frames';
  canvas.width = canvas.height = bank.size;
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', pointerEvents: 'none' });
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  function place() {
    const box = target.measure();
    const scale = box.bodyHeight / bank.body;
    const left = box.x + box.width / 2 - bank.pivot[0] * scale;
    const top = box.y + box.height - bank.pivot[1] * scale;
    const size = bank.size * scale;
    Object.assign(canvas.style, { left: `${left}px`, top: `${top}px`, width: `${size}px`, height: `${size}px` });
    return { scale, left, top };
  }
  const draw = (elapsed: number, alpha = 1, from?: CollapseTarget['from'], mix = 1) => {
    const { scale, left, top } = place();
    const { size, columns } = bank;
    const frame = frameAt(bank, elapsed);
    canvas.dataset.frame = String(frame);
    canvas.style.opacity = String(alpha);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    if (from && mix < 1) {
      const { x, y, width, height } = from.rect;
      ctx.globalAlpha = 1 - mix;
      ctx.drawImage(from.image, (x - left) / scale, (y - top) / scale, width / scale, height / scale);
      // Add the two weighted poses so an opaque overlap stays opaque.
      ctx.globalCompositeOperation = 'lighter';
    }
    ctx.globalAlpha = mix;
    ctx.drawImage(image, frame % columns * size, Math.floor(frame / columns) * size, size, size, 0, 0, size, size);
    ctx.restore();
  };
  target.layer.append(canvas);
  window.addEventListener('resize', place);
  return { draw, remove() { window.removeEventListener('resize', place); canvas.remove(); } };
}
