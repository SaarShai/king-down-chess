import { reducedMotion } from './fx';

type RevealVariant = 'portrait' | 'square' | 'wide';

export function revealVariant(width: number, height: number): RevealVariant {
  const aspect = width / height;
  if (aspect <= 0.78) return 'portrait';
  return aspect <= 1.25 ? 'square' : 'wide';
}

export const revealVideo = (variant: RevealVariant, av1 = false) => `/interface/reveal/${variant}${av1 ? '-av1' : ''}.mp4`;
export const revealPoster = (width: number, height: number) => `/interface/reveal/hero-${revealVariant(width, height)}.webp`;

// The AV1 film is about half the bytes; browsers that cannot decode it get the H.264 film.
const av1 = 'video/mp4; codecs="av01.0.08M.08"';
// The film plays once in each page session: later Home views show the still. A reload starts a new session.
let played = false;

export function homeReveal(art: HTMLElement) {
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

  function sync() {
    if (!art.isConnected || signal.aborted) return;
    // Keep the same framing for both layers when the Home controls redraw.
    if (!variant) {
      const width = art.clientWidth || window.innerWidth, height = art.clientHeight || window.innerHeight;
      variant = revealVariant(width, height);
      still.src = revealPoster(width, height);
      void still.decode().catch(() => {});
    }
    const useStill = replay || failed || reducedMotion() || !navigator.onLine;
    art.classList.toggle('home-art-still', useStill);
    if (settled) return;
    if (useStill || !visible || pageHidden || document.hidden) { video.pause(); return; }
    if (!video.hasAttribute('src')) {
      video.src = revealVideo(variant, video.canPlayType(av1) === 'probably');
      played = true;
    }
    if (video.paused) void video.play().catch((error: DOMException) => {
      if (!signal.aborted && error.name !== 'AbortError') fallback();
    });
  }

  video.addEventListener('playing', () => { video.dataset.ready = ''; }, { signal });
  video.addEventListener('error', fallback, { signal });
  video.addEventListener('ended', () => {
    settled = true;
    art.classList.add('home-art-settled');
    // A hidden page or a disabled transition may send no transitionend event.
    releaseTimer = setTimeout(release, 400);
  }, { signal });
  video.addEventListener('transitionend', event => {
    if (settled && event.propertyName === 'opacity') release();
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
