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
  expect(revealPoster('portrait')).toBe('/interface/reveal/hero-portrait.webp');
  expect(revealPoster('square')).toBe('/interface/reveal/hero-square.webp');
  expect(revealPoster('wide')).toBe('/interface/reveal/hero-wide.webp');
});

function fakePage(av1Answer: string, hevcAnswer = av1Answer, app = false) {
  vi.resetModules();
  const codecChecks: string[] = [];
  const node = (tag = 'div') => {
    const classes = new Set<string>(), attributes = new Map<string, string>();
    const listeners = new Map<string, (event: { propertyName?: string }) => void>();
    return {
      tag, dataset: {} as Record<string, string>, isConnected: true, clientWidth: 1440, clientHeight: 900, paused: true,
      classList: { add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name), contains: (name: string) => classes.has(name), toggle: (name: string, on: boolean) => on ? classes.add(name) : classes.delete(name) },
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
  const resized: (() => void)[] = [];
  vi.stubGlobal('window', { addEventListener(type: string, listener: () => void) { if (type === 'resize') resized.push(listener); }, innerWidth: 1440, innerHeight: 900 });
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('location', { protocol: app ? 'capacitor:' : 'https:' });
  const media = { matches: false, listeners: [] as (() => void)[], addEventListener(_type: string, listener: () => void) { media.listeners.push(listener); } };
  vi.stubGlobal('matchMedia', () => media);
  vi.stubGlobal('IntersectionObserver', class { constructor(seen: typeof observers[number]) { observers.push(seen); } observe() {} disconnect() {} });
  return {
    codecChecks, media, resized,
    async show(playError?: DOMException, [clientWidth, clientHeight] = [1440, 900], framed = () => {}) {
      const { homeReveal } = await import('./home-reveal');
      const art = node(), videos: ReturnType<typeof node>[] = [], stills: ReturnType<typeof node>[] = [];
      Object.assign(art, { clientWidth, clientHeight, append: (...children: ReturnType<typeof node>[]) => { videos.push(...children.filter(child => child.tag === 'video')); stills.push(...children.filter(child => child.tag === 'img')); } });
      const reveal = homeReveal(art as unknown as HTMLElement, framed);
      if (playError) videos[0].play.mockRejectedValue(playError);
      observers.at(-1)!([{ intersectionRatio: 1 }]);
      return { art, video: videos[0], still: stills[0], reveal };
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

/** Home with its film; `resize` sets the art box and enters or leaves the wide layout; `answers` settles the pictures in turn. */
async function openHome(wide: boolean, box: [number, number] = wide ? [1280, 720] : [500, 1000], app = false) {
  const page = fakePage('probably', 'probably', app), answers: ((ok: boolean) => Promise<void>)[] = [], framed = vi.fn();
  page.media.matches = wide;
  const decode = () => new Promise<void>((done, fail) => { answers.push(async ok => { if (ok) done(); else fail(new Error('EncodingError')); for (let i = 0; i < 9; i++) await Promise.resolve(); }); });
  const home = await page.show(undefined, box, framed);
  type Still = typeof home.still;
  let still = home.still;
  // Each decode after the first picture waits for its answer. Only the picture on the page can be replaced.
  const picture = (node: Still): Still => Object.assign(node, { decode, cloneNode: () => picture(Object.create(null)), replaceWith: (next: Still) => { if (still === node) still = next; } });
  picture(still);
  const resize = (wide: boolean, box = wide ? [1280, 720] : [500, 780]) => {
    const changed = page.media.matches !== wide;
    page.media.matches = wide; Object.assign(home.art, { clientWidth: box[0], clientHeight: box[1] });
    page.resized.forEach(listener => listener());
    if (changed) page.media.listeners.forEach(listener => listener());
  };
  const shown = () => [still.src, home.art.dataset.frame, home.video.src !== undefined];
  const whole = () => home.art.classList.contains('home-art-whole');
  return { ...home, resize, answers, framed, shown, whole };
}
const narrowHome = () => openHome(false);
const PORTRAIT = ['/interface/reveal/hero-portrait.webp', 'portrait', true], WIDE = ['/interface/reveal/hero-wide.webp', 'wide', false];
const PORTRAIT_STILL = [...PORTRAIT.slice(0, 2), false], SQUARE_STILL = ['/interface/reveal/hero-square.webp', 'square', false];

it('enters the wide layout when the wide picture is ready: until then the portrait film and picture stay', async () => {
  const home = await narrowHome();
  expect(home.video.src).toBe('/interface/reveal/portrait-av1.mp4');
  home.resize(true);
  expect(home.shown()).toEqual(PORTRAIT);
  expect(home.framed).not.toHaveBeenCalled();
  // The picture, the film and the layout change together: no second decode can leave the wide picture blank.
  await home.answers[0](true);
  expect(home.shown()).toEqual(WIDE);
  expect(home.art.classList.contains('home-art-still')).toBe(true);
  expect(home.framed).toHaveBeenCalledOnce();
  expect(home.answers).toHaveLength(1);
});
it('a resize back to narrow before the load ends changes no picture and no layout', async () => {
  const home = await narrowHome();
  home.resize(true); home.resize(false);
  expect(home.shown()).toEqual(PORTRAIT);
  await home.answers[0](true);
  expect(home.shown()).toEqual(PORTRAIT);
  expect(home.framed).not.toHaveBeenCalled();
});
it('two fast resizes into the wide layout frame it once', async () => {
  const home = await narrowHome();
  home.resize(true); home.resize(false); home.resize(true);
  expect(home.shown()).toEqual(PORTRAIT);
  await home.answers[0](true); await home.answers[1](true);
  expect(home.shown()).toEqual(WIDE);
  expect(home.framed).toHaveBeenCalledOnce();
});
it('a wide picture that cannot load leaves the portrait frame; a later resize tries again', async () => {
  const home = await narrowHome();
  home.resize(true);
  expect(home.shown()).toEqual(PORTRAIT);
  await home.answers[0](false);
  expect(home.shown()).toEqual(PORTRAIT);
  home.resize(false); home.resize(true);
  expect(home.shown()).toEqual(PORTRAIT);
  await home.answers[1](true);
  expect(home.shown()).toEqual(WIDE);
});
it('Home that closes during the load takes no wide picture', async () => {
  const home = await narrowHome();
  home.resize(true);
  expect(home.shown()).toEqual(PORTRAIT);
  home.reveal.dispose(); await home.answers[0](true);
  expect(home.shown()).toEqual(['/interface/reveal/hero-portrait.webp', 'portrait', false]);
  expect(home.framed).not.toHaveBeenCalled();
});
it('a film that ended and reduced motion take the wide picture the same way', async () => {
  for (const before of [(home: Awaited<ReturnType<typeof narrowHome>>) => home.video.emit('ended'), async () => { (await import('./fx')).setFxMotion('normal', true); }]) {
    const home = await narrowHome();
    await before(home);
    home.resize(true); expect(home.shown().slice(0, 2)).toEqual(PORTRAIT.slice(0, 2));
    await home.answers[0](true);
    expect(home.shown()).toEqual(WIDE);
  }
});
it('Home that opens wide has its wide frame at once', async () => {
  const page = fakePage('probably'); page.media.matches = true;
  const home = await page.show();
  expect([home.still.src, home.art.dataset.frame]).toEqual(['/interface/reveal/hero-wide.webp', 'wide']);
});
it('a hidden tab takes the wide picture too, and starts no film', async () => {
  const home = await narrowHome();
  (document as { hidden: boolean }).hidden = true;
  const plays = home.video.play.mock.calls.length;
  home.resize(true); expect(home.shown()).toEqual(PORTRAIT);
  await home.answers[0](true); home.reveal.sync();
  expect(home.shown()).toEqual(WIDE);
  expect(home.video.play.mock.calls.length).toBe(plays);
});

it('a resize out of the wide layout shows the still for its shape when it is ready; the film does not start again', async () => {
  const home = await narrowHome();
  const plays = home.video.play.mock.calls.length;
  home.resize(true); await home.answers[0](true);
  home.resize(false);
  expect(home.shown()).toEqual(WIDE);
  await home.answers[1](true); home.reveal.sync();
  expect(home.shown()).toEqual(PORTRAIT_STILL);
  expect(home.art.classList.contains('home-art-still')).toBe(true);
  // And back: the wide picture comes again, and again only when it is ready.
  home.resize(true);
  expect(home.shown()).toEqual(PORTRAIT_STILL);
  await home.answers[2](true);
  expect(home.shown()).toEqual(WIDE);
  home.resize(false, [900, 800]); await home.answers[3](true);
  expect(home.shown()).toEqual(SQUARE_STILL);
  expect(home.framed).toHaveBeenCalledTimes(4);
  expect(home.video.play.mock.calls.length).toBe(plays);
});
it('a window that a player drags from wide to narrow ends with the still for its last shape', async () => {
  const home = await openHome(true);
  // The wide layout ends while the art box is still a wide shape: the picture fits.
  home.resize(false, [1150, 798]);
  expect(home.answers).toHaveLength(0);
  home.resize(false, [860, 760]); home.resize(false, [850, 760]);
  expect(home.answers).toHaveLength(1);
  await home.answers[0](true);
  expect(home.shown()).toEqual(SQUARE_STILL);
  home.resize(false); await home.answers[1](true);
  expect(home.shown()).toEqual(PORTRAIT_STILL);
});
it('Home that opens wide takes the narrow still and stops the wide film together', async () => {
  const home = await openHome(true);
  expect(home.shown()).toEqual(['/interface/reveal/hero-wide.webp', 'wide', true]);
  home.resize(false);
  expect(home.shown()).toEqual(['/interface/reveal/hero-wide.webp', 'wide', true]);
  await home.answers[0](true);
  expect(home.shown()).toEqual(PORTRAIT_STILL);
  expect(home.framed).toHaveBeenCalledOnce();
});
it('a narrow decode that ends after another resize changes nothing', async () => {
  const home = await narrowHome();
  home.resize(true); await home.answers[0](true);
  home.resize(false); home.resize(true);
  await home.answers[1](true);
  expect(home.shown()).toEqual(WIDE);
  // Two shapes in turn: the first answer comes last.
  home.resize(false, [860, 760]); home.resize(false);
  await home.answers[3](true); await home.answers[2](true);
  expect(home.shown()).toEqual(PORTRAIT_STILL);
  expect(home.framed).toHaveBeenCalledTimes(2);
});
it('a late error of a stale decode does not drop the decode that replaced it', async () => {
  const home = await openHome(true);
  home.resize(false, [860, 760]); home.resize(false);
  await home.answers[0](false); await home.answers[1](true);
  expect(home.shown()).toEqual(PORTRAIT_STILL);
});
it('a layout that changes shape during the decode without a resize gets the still for its last shape', async () => {
  const home = await openHome(true);
  home.resize(false, [860, 760]);
  Object.assign(home.art, { clientWidth: 500, clientHeight: 780 });
  await home.answers[0](true);
  expect(home.shown()).toEqual(['/interface/reveal/hero-wide.webp', 'wide', true]);
  await home.answers[1](true);
  expect(home.shown()).toEqual(PORTRAIT_STILL);
});
it('a narrow picture that cannot load leaves the wide picture; the next resize tries again', async () => {
  const home = await narrowHome();
  home.resize(true); await home.answers[0](true);
  home.resize(false); await home.answers[1](false);
  expect(home.shown()).toEqual(WIDE);
  expect(home.framed).toHaveBeenCalledOnce();
  home.resize(false, [501, 780]); await home.answers[2](true);
  expect(home.shown()).toEqual(PORTRAIT_STILL);
});
it('Home that closes during the narrow load keeps its wide picture', async () => {
  const home = await narrowHome();
  home.resize(true); await home.answers[0](true);
  home.resize(false); home.reveal.dispose(); await home.answers[1](true);
  expect(home.shown()).toEqual(WIDE);
  expect(home.framed).toHaveBeenCalledOnce();
});
it.each([
  ['a film that ended', (home: Awaited<ReturnType<typeof openHome>>) => home.video.emit('ended')],
  ['reduced motion', async () => { (await import('./fx')).setFxMotion('normal', true); }],
  ['a hidden tab', () => { (document as { hidden: boolean }).hidden = true; }],
] as const)('%s takes the narrow still the same way, from narrow and from wide, and starts no film', async (_name, before) => {
  for (const wide of [false, true]) {
    const home = await openHome(wide);
    await before(home);
    const plays = home.video.play.mock.calls.length;
    if (!wide) { home.resize(true); await home.answers[0](true); }
    home.resize(false);
    expect(home.shown().slice(0, 2)).toEqual(WIDE.slice(0, 2));
    await home.answers.at(-1)!(true); home.reveal.sync();
    expect(home.shown()).toEqual(PORTRAIT_STILL);
    expect(home.video.play.mock.calls.length).toBe(plays);
  }
});
it('a narrow film keeps its frame through narrow resizes', async () => {
  const home = await narrowHome();
  home.resize(false, [860, 760]); home.resize(false, [1150, 798]);
  expect(home.answers).toHaveLength(0);
  expect(home.shown()).toEqual(PORTRAIT);
});
const turns = [
  ['a tablet that turns from a wide shape', false, [1180, 820], [820, 900], SQUARE_STILL],
  ['a phone in the app that turns from a wide shape', true, [844, 390], [390, 600], PORTRAIT_STILL],
  ['a tablet in split view', false, [1024, 700], [500, 900], PORTRAIT_STILL],
] as const;
it.each(turns)('%s keeps its film and shows it whole; the still for its shape comes after the film', async (_name, app, from, to, still) => {
  const home = await openHome(false, [...from], app), plays = home.video.play.mock.calls.length, film = ['/interface/reveal/hero-wide.webp', 'wide', true];
  for (const [box, whole] of [[to, true], [from, false], [to, true]] as const) {
    home.resize(false, [...box]);
    expect([home.shown(), home.whole(), home.art.classList.contains('home-art-still')]).toEqual([film, whole, false]);
  }
  expect(home.answers).toHaveLength(0);
  home.video.emit('ended');
  expect([home.shown(), home.whole()]).toEqual([film, true]);
  await home.answers[0](true);
  expect([home.shown(), home.whole(), home.video.play.mock.calls.length]).toEqual([still, false, plays]);
  home.resize(false, [...from]); await home.answers[1](true);
  expect([home.shown(), home.whole()]).toEqual([WIDE, false]);
});
it.each(turns)('%s after its film ended takes the still for its shape; a load error leaves the wide picture whole', async (_name, app, from, to, still) => {
  const home = await openHome(false, [...from], app);
  home.video.emit('ended');
  expect(home.answers).toHaveLength(0);
  home.resize(false, [...to]); await home.answers[0](false);
  expect([home.shown().slice(0, 2), home.whole()]).toEqual([WIDE.slice(0, 2), true]);
  home.resize(false, [...to]); await home.answers[1](true);
  expect([home.shown(), home.whole()]).toEqual([still, false]);
});
it('a redraw that changes the art box during the film changes no picture at its end', async () => {
  const home = await openHome(false);
  Object.assign(home.art, { clientWidth: 500, clientHeight: 450 });
  home.video.emit('ended');
  expect([home.answers.length, home.whole()]).toEqual([0, false]);
});
it('a film that cannot play and reduced motion take the still for each turn of a touch device', async () => {
  for (const before of [(home: Awaited<ReturnType<typeof openHome>>) => { for (let i = 0; i < 3; i++) home.video.emit('error'); }, async () => { (await import('./fx')).setFxMotion('normal', true); }]) {
    const home = await openHome(false, [1180, 820]);
    await before(home);
    home.resize(false, [820, 900]);
    expect(home.whole()).toBe(true);
    await home.answers[0](true);
    expect([home.shown(), home.whole()]).toEqual([SQUARE_STILL, false]);
  }
});
it('a window that touches the wide layout and leaves it before the picture came keeps its film in each later resize', async () => {
  const home = await narrowHome();
  home.resize(true); home.resize(false); await home.answers[0](true);
  home.resize(false, [860, 760]); home.resize(false, [1150, 798]);
  expect(home.answers).toHaveLength(1);
  expect(home.shown()).toEqual(PORTRAIT);
  home.resize(false);
  expect(home.whole()).toBe(false);
});
it('a wide shape outside the wide layout keeps its film into the wide layout, and takes the narrow still on the way back', async () => {
  const home = await openHome(false, [1150, 798]);
  home.resize(true);
  expect(home.shown()).toEqual(['/interface/reveal/hero-wide.webp', 'wide', true]);
  home.resize(false); await home.answers[0](true);
  expect(home.shown()).toEqual(PORTRAIT_STILL);
});
it('after the wide layout the old picture shows whole until the picture of the layout is ready', async () => {
  const home = await openHome(true);
  expect(home.whole()).toBe(false);
  home.resize(false, [860, 760]);
  expect(home.whole()).toBe(true);
  home.resize(true);
  expect(home.whole()).toBe(false);
  home.resize(false, [860, 760]); await home.answers[1](true);
  expect([home.shown(), home.whole()]).toEqual([SQUARE_STILL, false]);
  home.resize(false);
  expect(home.whole()).toBe(true);
  await home.answers[2](true);
  expect([home.shown(), home.whole()]).toEqual([PORTRAIT_STILL, false]);
});
it('a narrow picture that cannot load leaves the wide picture whole, for as long as that lasts', async () => {
  const home = await openHome(true);
  home.resize(false); await home.answers[0](false); home.reveal.sync();
  expect(home.whole()).toBe(true);
  home.resize(false, [501, 780]); await home.answers[1](false);
  expect(home.whole()).toBe(true);
  home.resize(false); await home.answers[2](true);
  expect([home.shown(), home.whole()]).toEqual([PORTRAIT_STILL, false]);
});
