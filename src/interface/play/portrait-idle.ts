import { createCharacterRuntime } from '../../render/painted/character-runtime.mjs';
import { PIECE_STILLS } from '../../render/painted/piece-stills.mjs';

/** Play the figure's first idle clip one time, `delay` ms from now, over its still picture. Without the figure package the still stays. */
export function portraitIdle(image: HTMLImageElement, calm: () => boolean, delay: number): () => void {
  const match = image.getAttribute('src')?.match(/\/([^/]+)-([wb])\.webp$/);
  if (!match || calm()) return () => {};
  const character = match[1], army = match[2] === 'w' ? 'white' : 'black';
  const still = PIECE_STILLS[character]?.[army];
  if (!still) return () => {};
  const canvas = document.createElement('canvas'), due = performance.now() + delay;
  canvas.className = 'play-portrait-idle'; canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d'), query = matchMedia('(prefers-reduced-motion: reduce)');
  const requests = new AbortController();
  const runtime = createCharacterRuntime({ fetcher: url => fetch(url, { signal: requests.signal }) });
  let disposed = false, frame = 0, start = 0, clip = '', timer: ReturnType<typeof setTimeout>;
  function draw(now: number) {
    if (disposed) return;
    const at = Math.max(0, now - start);
    const body = runtime.rest(character, army, at, true) as { image: HTMLImageElement; pivot: number[]; bank: string; canvasSize: number[] } | null;
    // A figure can have more than one idle clip: the next one ends this play.
    if (!ctx || calm() || document.hidden || !image.isConnected || !body || clip && body.bank !== clip || at >= runtime.idleDuration(character, army)) { stop(); return; }
    if (!clip) { clip = body.bank; [canvas.width, canvas.height] = body.canvasSize; image.after(canvas); image.style.visibility = 'hidden'; }
    // The picture keeps its box: the canvas lies over it, with the figure at the same place and size.
    const k = Math.min(image.clientWidth / still.size[0], image.clientHeight / still.size[1]);
    canvas.style.width = `${canvas.width * k}px`;
    canvas.style.left = `${image.offsetLeft + (image.clientWidth - still.size[0] * k) / 2 + (still.pivot[0] - body.pivot[0]) * k}px`;
    canvas.style.top = `${image.offsetTop + (image.clientHeight - still.size[1] * k) / 2 + (still.pivot[1] - body.pivot[1]) * k}px`;
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(body.image, 0, 0);
    frame = requestAnimationFrame(draw);
  }
  function stop() {
    if (disposed) return;
    disposed = true; clearTimeout(timer); cancelAnimationFrame(frame); query.removeEventListener('change', stop);
    runtime.dispose(); requests.abort(); canvas.remove(); image.style.visibility = '';
  }
  query.addEventListener('change', stop);
  void runtime.ready().then(() => runtime.warm(character, army, true)).then(() => {
    if (disposed) return;
    timer = setTimeout(() => { start = performance.now(); frame = requestAnimationFrame(draw); }, Math.max(0, due - performance.now()));
  }).catch(stop);
  return stop;
}
