import { expect, it, vi } from 'vitest';
import { revealPoster, revealVariant, revealVideo } from './home-reveal';

it.each([
  [390, 844, 'portrait'],
  [78, 100, 'portrait'],
  [79, 100, 'square'],
  [820, 961, 'square'],
  [125, 100, 'square'],
  [126, 100, 'wide'],
  [1440, 900, 'wide'],
] as const)('selects the reveal for %i by %i', (width, height, variant) => {
  expect(revealVariant(width, height)).toBe(variant);
});

it('uses only the MP4 for the selected variant', () => {
  expect(revealVideo('portrait')).toBe('/interface/reveal/portrait.mp4');
  expect(revealVideo('square')).toBe('/interface/reveal/square.mp4');
  expect(revealVideo('wide')).toBe('/interface/reveal/wide.mp4');
});

it('uses the still that matches the selected variant', () => {
  expect(revealPoster(390, 844)).toBe('/interface/reveal/hero-portrait.webp');
  expect(revealPoster(820, 961)).toBe('/interface/reveal/hero-square.webp');
  expect(revealPoster(1440, 900)).toBe('/interface/reveal/hero-wide.webp');
});

function fakePage(av1Answer: string, hevcAnswer = av1Answer, app = false) {
  vi.resetModules();
  const codecChecks: string[] = [];
  const node = (tag = 'div') => {
    const classes = new Set<string>(), attributes = new Map<string, string>();
    const listeners = new Map<string, (event: { propertyName?: string }) => void>();
    return {
      tag, dataset: {}, isConnected: true, clientWidth: 1440, clientHeight: 900, paused: true,
      classList: { add: (name: string) => classes.add(name), contains: (name: string) => classes.has(name), toggle: (name: string, on: boolean) => on ? classes.add(name) : classes.delete(name) },
      setAttribute: (name: string, value: string) => attributes.set(name, value), hasAttribute: (name: string) => attributes.has(name),
      removeAttribute: (name: string) => attributes.delete(name), get src() { return attributes.get('src'); }, set src(value) { attributes.set('src', value!); },
      append() {}, addEventListener: (type: string, listener: (event: { propertyName?: string }) => void) => listeners.set(type, listener),
      emit: (type: string) => listeners.get(type)?.({}),
      decode: () => Promise.resolve(), play: vi.fn(() => Promise.resolve()), pause() {}, load() {},
      canPlayType: (type: string) => {
        codecChecks.push(type);
        return type.includes('av01') ? av1Answer : type.includes('hvc1') ? hevcAnswer : '';
      },
    };
  };
  const observers: ((entries: { intersectionRatio: number }[]) => void)[] = [];
  vi.stubGlobal('document', { createElement: node, addEventListener() {}, hidden: false });
  vi.stubGlobal('window', { addEventListener() {}, innerWidth: 1440, innerHeight: 900 });
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('location', { protocol: app ? 'capacitor:' : 'https:' });
  vi.stubGlobal('IntersectionObserver', class { constructor(seen: typeof observers[number]) { observers.push(seen); } observe() {} disconnect() {} });
  return {
    codecChecks,
    async show(playError?: DOMException) {
      const { homeReveal } = await import('./home-reveal');
      const art = node(), videos: ReturnType<typeof node>[] = [];
      Object.assign(art, { append: (...children: ReturnType<typeof node>[]) => videos.push(...children.filter(child => child.tag === 'video')) });
      const reveal = homeReveal(art as unknown as HTMLElement);
      if (playError) videos[0].play.mockRejectedValue(playError);
      observers.at(-1)!([{ intersectionRatio: 1 }]);
      return { art, video: videos[0], reveal };
    },
  };
}

it('plays the film once in each page session and shows the still on later Home views', async () => {
  const page = fakePage('probably');
  const first = await page.show();
  expect(first.video.src).toBe('/interface/reveal/wide-av1.mp4');
  first.reveal.dispose();
  const second = await page.show();
  expect(second.video.src).toBeUndefined();
  expect(second.art.classList.contains('home-art-still')).toBe(true);
});

it('moves an AV1 error to HEVC, then H.264, then the still', async () => {
  const first = await fakePage('probably', 'probably').show();
  expect(first.video.src).toBe('/interface/reveal/wide-av1.mp4');
  first.video.emit('error');
  expect(first.video.src).toBe('/interface/reveal/wide-hevc.mp4');
  expect(first.video.play).toHaveBeenCalledTimes(2);
  first.video.emit('error');
  expect(first.video.src).toBe('/interface/reveal/wide.mp4');
  expect(first.video.play).toHaveBeenCalledTimes(3);
  expect(first.art.classList.contains('home-art-still')).toBe(false);
  first.video.emit('error');
  expect(first.video.src).toBeUndefined();
  expect(first.art.classList.contains('home-art-still')).toBe(true);
});

it('shows the still while the next film loads after a playback error', async () => {
  const first = await fakePage('probably').show();
  first.video.emit('playing');
  expect(first.video.dataset).toHaveProperty('ready');

  first.video.emit('error');
  expect(first.video.src).toBe('/interface/reveal/wide-hevc.mp4');
  expect(first.video.dataset).not.toHaveProperty('ready');

  first.video.emit('playing');
  expect(first.video.dataset).toHaveProperty('ready');
});

it('shows the still if reduced motion is on when a film fails', async () => {
  const first = await fakePage('probably').show();
  const { setFxMotion } = await import('./fx');
  setFxMotion('normal', true);

  first.video.emit('error');
  expect(first.video.src).toBeUndefined();
  expect(first.art.classList.contains('home-art-still')).toBe(true);
  expect(first.video.play).toHaveBeenCalledTimes(1);
});

it('shows the still when the browser refuses playback', async () => {
  const first = await fakePage('probably').show(new DOMException('Playback is blocked', 'NotAllowedError'));
  expect(first.video.play).toHaveBeenCalledTimes(1);
  expect(first.video.src).toBeUndefined();
  expect(first.art.classList.contains('home-art-still')).toBe(true);
});

it('uses only H.264 in the app and makes no codec check', async () => {
  const page = fakePage('probably', 'probably', true);
  const first = await page.show();
  expect(first.video.src).toBe('/interface/reveal/wide.mp4');
  expect(page.codecChecks).toEqual([]);
});

it.each([
  { av1: 'probably', hevc: 'probably', src: '/interface/reveal/wide-av1.mp4', checks: ['av01'] },
  { av1: '', hevc: 'probably', src: '/interface/reveal/wide-hevc.mp4', checks: ['av01', 'hvc1'] },
  { av1: '', hevc: '', src: '/interface/reveal/wide.mp4', checks: ['av01', 'hvc1'] },
])('uses the first supported film: AV1 $av1, HEVC $hevc', async ({ av1, hevc, src, checks }) => {
  const page = fakePage(av1, hevc);
  const first = await page.show();
  expect(first.video.src).toBe(src);
  expect(page.codecChecks.map(type => type.includes('av01') ? 'av01' : 'hvc1')).toEqual(checks);
});
