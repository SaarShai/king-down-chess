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
export const revealPoster = (width: number, height: number) => `/interface/reveal/hero-${revealVariant(width, height)}.webp`;

// AV1 is smallest. HEVC is next. H.264 plays on the remaining browsers.
const av1 = 'video/mp4; codecs="av01.0.08M.08"';
const hevc = 'video/mp4; codecs="hvc1.1.6.L120.90"';
const codecs = ['av1', 'hevc', 'h264'] as const;
// The film plays once in each page session: later Home views show the still. A reload starts a new session.
let played = false;

/** `art.dataset.frame`: the shape that the picture and the film are framed for. `framed`: a resize changed it. */
export function homeReveal(art: HTMLElement, framed: () => void) {
  const replay = played;
  const still = document.createElement('img');
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
  let variant: RevealVariant | undefined;
  let source = -1;
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

  function fallback() {
    failed = true;
    art.classList.add('home-art-still');
    release();
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

  function sync() {
    if (!art.isConnected || signal.aborted) return;
    // Keep the same framing for both layers when the Home controls redraw.
    if (!variant) {
      const width = art.clientWidth || window.innerWidth, height = art.clientHeight || window.innerHeight;
      variant = art.dataset.frame = revealVariant(width, height);
      still.src = revealPoster(width, height);
      void still.decode().catch(() => {});
    }
    const useStill = replay || failed || reducedMotion() || !navigator.onLine;
    art.classList.toggle('home-art-still', useStill);
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
    art.classList.add('home-art-settled');
    // A hidden page or a disabled transition may send no transitionend event.
    releaseTimer = setTimeout(release, 400);
  }, { signal });
  video.addEventListener('transitionend', event => {
    if (settled && event.propertyName === 'opacity') release();
  }, { signal });
  // A film or a picture framed for a narrower window would crop the kings in the wide layout: show the wide still, once
  // it is ready. Until then home.ts keeps the split layout.
  const wide = matchMedia(WIDE_HOME);
  const needsWide = () => !signal.aborted && wide.matches && !!variant && variant !== 'wide';
  wide.addEventListener('change', async () => {
    if (!needsWide()) return;
    const poster = revealPoster(window.innerWidth, window.innerHeight), picture = new Image();
    picture.src = poster;
    try { await picture.decode(); } catch { return; }
    if (!needsWide()) return;
    variant = 'wide'; still.src = poster; fallback();
    await still.decode().catch(() => {});
    if (signal.aborted) return;
    art.dataset.frame = 'wide'; framed();
  }, { signal });
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
