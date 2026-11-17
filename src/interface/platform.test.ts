import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { launchRoute, NOTICE_KEY, returningPlayer, RETURN_NOTICE, startPlatform } from './platform';

vi.mock('./ui/kit.js', () => ({ button: () => {} }));
vi.mock('./play/main', () => ({}));

function storage(values: Record<string, string>) {
  const keys = Object.keys(values);
  return { length: keys.length, key: (i: number) => keys[i] ?? null, getItem: (key: string) => values[key] ?? null };
}
it('shows the exact notice to a returning player once and leaves old bytes intact', () => {
  expect(RETURN_NOTICE).toBe('Lessons, Workshop and badges are away for now. Your data stays on this device.');
  const values = { 'kingdown.workshop': 'old designs', 'kingdown.lessons': 'old progress', 'kingdown.save': 'old game' };
  expect(returningPlayer(storage(values))).toBe(true);
  expect(returningPlayer(storage({ ...values, [NOTICE_KEY]: '1' }))).toBe(false);
  expect(values).toEqual({ 'kingdown.workshop': 'old designs', 'kingdown.lessons': 'old progress', 'kingdown.save': 'old game' });
  expect(returningPlayer(storage({}))).toBe(false);
  expect(returningPlayer(storage({ unrelated: 'value' }))).toBe(false);
});
it.each(['army', 'fen', 'moves', 'design'])('identifies the old %s game link before a new game loads', key => {
  expect(launchRoute(new URL(`https://game.test/?${key}=old`))).toBe('old-link');
});
it('accepts the public new page and rejects unknown paths, without treating online links as solo', () => {
  for (const path of ['/', '/next.html', '/?utm_source=friend']) expect(launchRoute(new URL(path, 'https://game.test'))).toBe('home');
  for (const path of ['/missing', '/g/id', '/j', '/play']) expect(launchRoute(new URL(path, 'https://game.test'))).toBe('missing');
});
it('marks a fresh player as seen when home opens, so the notice never shows to that player', async () => {
  const setItem = vi.fn(), root = { replaceChildren: vi.fn(), hasChildNodes: () => true }, ready = vi.fn();
  vi.stubGlobal('document', { querySelector: () => root }); vi.stubGlobal('location', { href: 'https://game.test/' });
  vi.stubGlobal('localStorage', { length: 0, key: () => null, getItem: () => null, setItem });
  vi.stubGlobal('dispatchEvent', ready); vi.stubGlobal('navigator', {});
  try {
    await startPlatform();
    expect(setItem).toHaveBeenCalledExactlyOnceWith(NOTICE_KEY, '1'); expect(ready).toHaveBeenCalledOnce();
  } finally { vi.unstubAllGlobals(); }
});
it('hides the focus frame of a message heading that the script focuses', () => {
  expect(readFileSync('src/interface/platform.css', 'utf8')).toContain('.platform-message h1:focus { outline: none; }');
});
it('opens home at the start address of the iOS app', () => {
  for (const url of ['capacitor://localhost', 'capacitor://localhost/', 'capacitor://localhost/next.html']) expect(launchRoute(new URL(url))).toBe('home');
  expect(launchRoute(new URL('capacitor://localhost/missing'))).toBe('missing');
});
