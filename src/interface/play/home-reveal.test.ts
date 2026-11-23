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

function fakePage(av1: string) {
  vi.resetModules();
  const node = (tag = 'div') => {
    const classes = new Set<string>(), attributes = new Map<string, string>();
    return {
      tag, dataset: {}, isConnected: true, clientWidth: 1440, clientHeight: 900, paused: true,
      classList: { add: (name: string) => classes.add(name), contains: (name: string) => classes.has(name), toggle: (name: string, on: boolean) => on ? classes.add(name) : classes.delete(name) },
      setAttribute: (name: string, value: string) => attributes.set(name, value), hasAttribute: (name: string) => attributes.has(name),
      removeAttribute: (name: string) => attributes.delete(name), get src() { return attributes.get('src'); }, set src(value) { attributes.set('src', value!); },
      append() {}, addEventListener() {}, decode: () => Promise.resolve(), play: () => Promise.resolve(), pause() {}, load() {}, canPlayType: () => av1,
    };
  };
  const observers: ((entries: { intersectionRatio: number }[]) => void)[] = [];
  vi.stubGlobal('document', { createElement: node, addEventListener() {}, hidden: false });
  vi.stubGlobal('window', { addEventListener() {}, innerWidth: 1440, innerHeight: 900 });
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('IntersectionObserver', class { constructor(seen: typeof observers[number]) { observers.push(seen); } observe() {} disconnect() {} });
  return {
    async show() {
      const { homeReveal } = await import('./home-reveal');
      const art = node(), videos: ReturnType<typeof node>[] = [];
      Object.assign(art, { append: (...children: ReturnType<typeof node>[]) => videos.push(...children.filter(child => child.tag === 'video')) });
      const reveal = homeReveal(art as unknown as HTMLElement);
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

it('loads the H.264 film when the browser cannot play AV1', async () => {
  const first = await fakePage('').show();
  expect(first.video.src).toBe('/interface/reveal/wide.mp4');
});
