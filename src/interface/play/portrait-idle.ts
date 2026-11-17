import { createCharacterRuntime } from '../../render/painted/character-runtime.mjs';
import { PIECE_STILLS } from '../../render/painted/piece-stills.mjs';
/** Use the figure's existing idle clips. Its clock is separate from the board limit. */
export function portraitIdle(image: HTMLImageElement, calm: () => boolean): () => void {
  let disposed = false, frame = 0, timer: ReturnType<typeof setTimeout>, start = 0;
  const match = image.getAttribute('src')?.match(/\/([^/]+)-([wb])\.webp$/);
  if (!match || calm()) return () => {};
  const character = match[1], army = match[2] === 'w' ? 'white' : 'black';
  const meta = PIECE_STILLS[character]?.[army];
  if (!meta) return () => {};
  const canvas = document.createElement('canvas'); canvas.width = meta.size[0]; canvas.height = meta.size[1]; canvas.className = `${image.className} play-portrait-idle`; canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d')!, query = matchMedia('(prefers-reduced-motion: reduce)');
  const runtime = createCharacterRuntime();
  const restore = () => { canvas.remove(); image.style.display = ''; };
  const pause = () => { restore(); timer = setTimeout(play, 4000 + Math.random() * 12000); };
  function draw(now: number) {
    if (disposed || !image.isConnected) { stop(); return; }
    if (calm() || document.hidden) { restore(); if (!disposed) pause(); return; }
    if (now - start >= runtime.idleDuration(character, army)) { pause(); return; }
    const body = runtime.rest(character, army, now - start, true) as { image: HTMLImageElement; pivot: number[] } | null;
    if (body) {
      image.after(canvas); image.style.display = 'none'; ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(body.image, meta.pivot[0] - body.pivot[0], meta.pivot[1] - body.pivot[1]);
    }
    frame = requestAnimationFrame(draw);
  }
  function play() { if (!disposed && !calm()) { start = performance.now(); frame = requestAnimationFrame(draw); } }
  const changed = () => { if (query.matches) { cancelAnimationFrame(frame); restore(); } else pause(); };
  query.addEventListener('change', changed);
  void runtime.ready().then(() => runtime.warm(character, army)).then(() => { if (!disposed) pause(); }).catch(() => {});
  function stop() { disposed = true; clearTimeout(timer); cancelAnimationFrame(frame); query.removeEventListener('change', changed); runtime.dispose(); restore(); }
  return stop;
}
