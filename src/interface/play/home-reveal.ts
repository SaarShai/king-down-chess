import { inApp } from '../../platform';
import { reducedMotion } from './fx';

type RevealVariant = 'portrait' | 'square' | 'wide';

export function revealVariant(width: number, height: number): RevealVariant {
  const aspect = width / height;
  if (aspect <= 0.78) return 'portrait';
  return aspect <= 1.25 ? 'square' : 'wide';
}

/** The wide Home layout of menus.css: the painting fills a desktop window. */
export const WIDE_HOME = '(min-width: 1200px) and (min-aspect-ratio: 3/2) and (hover: hover) and (pointer: fine)';

export const revealVideo = (variant: RevealVariant, codec: 'av1' | 'hevc' | 'h264' = 'h264') => `/interface/reveal/${variant}${codec === 'h264' ? '' : `-${codec}`}.mp4`;
export const revealPoster = (variant: RevealVariant) => `/interface/reveal/hero-${variant}.webp`;

// AV1 is smallest. HEVC is next. H.264 plays on the remaining browsers.
const av1 = 'video/mp4; codecs="av01.0.08M.08"';
const hevc = 'video/mp4; codecs="hvc1.1.6.L120.90"';
const codecs = ['av1', 'hevc', 'h264'] as const;
// The film plays once in each page session: later Home views show the still. A reload starts a new session.
let played = false;

/** `art.dataset.frame`: the shape that the picture and the film are framed for. `framed`: a resize changed it. */
export function homeReveal(art: HTMLElement, framed: () => void) {
  const replay = played;
  let still = document.createElement('img');
  still.className = 'home-reveal-still';
  still.alt = '';
  still.decoding = 'async';
  still.fetchPriority = 'high';

  const video = document.createElement('video');
  video.className = 'home-reveal-video';
  video.muted = video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.autoplay = true;
  video.loop = false;
  video.preload = 'metadata';
  video.disableRemotePlayback = true;
  video.setAttribute('aria-hidden', 'true');
  art.append(still, video);

  const events = new AbortController(), { signal } = events;
  const wide = matchMedia(WIDE_HOME);
  let variant: RevealVariant | undefined, loading: { shape: RevealVariant } | undefined;
  let source = -1;
  let wasWide = false; // The window left the wide layout, with its picture.
  let visible = false, pageHidden = false, failed = false, settled = false;
  let releaseTimer: ReturnType<typeof setTimeout> | undefined;

  function release() {
    clearTimeout(releaseTimer);
    delete video.dataset.ready;
    if (!video.hasAttribute('src')) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  /** The film gives way to the still: a picture of another shape takes the one of this shape. */
  const owed = () => { if (art.classList.contains('home-art-whole')) void reframe(); };

  function fallback() {
    failed = true;
    art.classList.add('home-art-still');
    release();
    owed();
  }

  /** After a turn, the last film frame stays until the still for the new shape is ready, cannot come, or takes more than 1.5 s. */
  const held = () => settled && !art.classList.contains('home-art-settled');
  function settle() {
    if (!held()) return;
    clearTimeout(releaseTimer);
    art.classList.add('home-art-settled');
    // A hidden page or a disabled transition may send no transitionend event.
    releaseTimer = setTimeout(release, 400);
  }

  function play() {
    const attempt = source;
    void video.play().catch((error: DOMException) => {
      if (attempt === source && error.name !== 'AbortError') nextFilm(error.name);
    });
  }

  function nextFilm(playErrorName?: string) {
    if (failed || settled || signal.aborted || !video.hasAttribute('src')) return;
    if (playErrorName === 'NotAllowedError' || reducedMotion() || ++source === codecs.length) { fallback(); return; }
    delete video.dataset.ready;
    video.src = revealVideo(variant!, codecs[source]);
    play();
  }

  const stillOnly = () => replay || failed || reducedMotion() || !navigator.onLine;
  const layoutShape = () => wide.matches ? 'wide' : revealVariant(art.clientWidth || window.innerWidth, art.clientHeight || window.innerHeight);

  // A film or a picture framed for another shape would crop the kings: show the still of the layout, once it is ready.
  // Until then home.ts keeps the split layout, and a narrow layout shows the old picture whole. Only a window resize
  // starts this: a redraw of the controls keeps the framing. A window that never enters the wide layout (a tablet that
  // turns) plays its film on, whole, and takes its still after the film.
  async function reframe() {
    if (signal.aborted || !variant) return;
    const shape = layoutShape(), due = () => wide.matches || wasWide || settled || stillOnly();
    art.classList.toggle('home-art-whole', shape !== variant);
    if (shape === variant || !due()) { loading = undefined; settle(); return; }
    if (shape === loading?.shape) return;
    const own = loading = { shape }, picture = still.cloneNode() as HTMLImageElement;
    picture.src = revealPoster(shape);
    const ready = await picture.decode().then(() => true, () => false);
    if (loading !== own || signal.aborted) return;
    loading = undefined;
    if (!ready) { settle(); return; } // The next resize or sync (the connection returns) tries again.
    if (layoutShape() !== shape || !due()) { void reframe(); return; }
    still.replaceWith(picture); still = picture;
    variant = art.dataset.frame = shape; art.classList.remove('home-art-whole'); fallback(); framed();
  }

  function sync() {
    if (!art.isConnected || signal.aborted) return;
    // Keep the same framing for both layers when the Home controls redraw.
    if (!variant) {
      variant = art.dataset.frame = layoutShape();
      still.src = revealPoster(variant);
      void still.decode().catch(() => {});
    }
    const useStill = stillOnly();
    if (useStill) settle(); // The hold ends when the connection or the motion goes.
    if (!held()) art.classList.toggle('home-art-still', useStill);
    owed();
    if (settled) return;
    if (useStill || !visible || pageHidden || document.hidden) { video.pause(); return; }
    if (!video.hasAttribute('src')) {
      source = inApp ? 2 : video.canPlayType(av1) === 'probably' ? 0 : video.canPlayType(hevc) === 'probably' ? 1 : 2;
      video.src = revealVideo(variant, codecs[source]);
      played = true;
    }
    if (video.paused) play();
  }

  video.addEventListener('playing', () => { video.dataset.ready = ''; }, { signal });
  video.addEventListener('error', () => nextFilm(), { signal });
  video.addEventListener('ended', () => {
    settled = true;
    if (!art.classList.contains('home-art-whole')) { settle(); return; }
    releaseTimer = setTimeout(settle, 1500);
    sync();
  }, { signal });
  video.addEventListener('transitionend', event => {
    if (settled && !held() && event.propertyName === 'opacity') release();
  }, { signal });
  wide.addEventListener('change', () => { wasWide ||= !wide.matches && variant === 'wide'; void reframe(); }, { signal });
  window.addEventListener('resize', reframe, { signal });
  document.addEventListener('visibilitychange', sync, { signal });
  window.addEventListener('online', sync, { signal });
  window.addEventListener('offline', sync, { signal });
  window.addEventListener('pagehide', () => { pageHidden = true; sync(); }, { signal });
  window.addEventListener('pageshow', () => { pageHidden = false; sync(); }, { signal });
  const intersection = new IntersectionObserver(entries => {
    visible = (entries.at(-1)?.intersectionRatio ?? 0) >= 0.1;
    sync();
  }, { threshold: 0.1 });
  intersection.observe(art);

  return {
    sync,
    dispose() {
      events.abort();
      intersection.disconnect();
      art.classList.add('home-art-still');
      release();
    },
  };
}
