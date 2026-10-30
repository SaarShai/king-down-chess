import { describe, expect, it, vi } from 'vitest';
import { accountPath, parseAccountRoute, type AccountEntryRoute } from './routes';
import { beginAccountSignIn, type SignInHost } from './sign-in';

const origin = 'https://kingdown.test', gameId = 'abcdef12-3456-7890-abcd-1234567890ab', token = 'a'.repeat(43);
const parse = (path: string) => parseAccountRoute(new URL(path, origin));

describe('account routes', () => {
  it.each<[string, AccountEntryRoute, string]>([
    ['/play/', { screen: 'play' }, '/play/'], ['/play/profile', { screen: 'profile' }, '/play/profile'],
    ['/play/friend', { screen: 'new-friend' }, '/play/friend'],
    ['/play/settings', { screen: 'settings' }, '/play/settings'], [`/g/${gameId}`, { screen: 'game', gameId }, `/g/${gameId}`],
    ['/j#ABC234', { screen: 'join', key: 'ABC234' }, '/j#ABC234'], [`/j#${token}`, { screen: 'join', key: token }, `/j#${token}`],
    ['/j#abc-234', { screen: 'join', key: 'ABC234' }, '/j#ABC234'], ['/j#%41BC234', { screen: 'join', key: 'ABC234' }, '/j#ABC234'],
  ])('R01 rebuilds checked route %s', (path, route, canonical) => {
    expect(parse(path)).toEqual(route);
    expect(accountPath(parse(path)!)).toBe(canonical);
    expect(parse(canonical)).toEqual(route);
  });

  it('R01 drops unchecked query and non-invite fragments', () => {
    expect(accountPath(parse('/play/profile?next=https://other.test#private')!)).toBe('/play/profile');
    expect(accountPath(parse(`/g/${gameId}?code=private&sb_flow_id=flow#private`)!)).toBe(`/g/${gameId}`);
    expect(accountPath(parse('/j?code=private#ABC234')!)).toBe('/j#ABC234');
  });

  it.each(['https://other.test/play/', '//other.test/play/', 'https://user:pass@kingdown.test/play/',
    '/\\other.test/play/', '/play/../play/', '/play/%2e%2e/play/', '/play/%252e%252e/profile', `/g/%2f${gameId}`, `/g/%5c${gameId}`,
    '/', '/index.html?fen=local', '?army=local', '/j/path-token', '/g', '/g/bad-id', '/playful', '/play/\nprofile',
  ])('R02 refuses unsafe sign-in target %s before SDK or storage work', async target => {
    const load = vi.fn(), storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }, assign = vi.fn();
    const host: SignInHost = { location: { href: origin + '/play/', assign }, history: { state: null, replaceState: vi.fn() }, storage, client: load, now: () => 0 };
    await expect(beginAccountSignIn('google', target, host)).rejects.toThrow('Invalid sign-in target');
    expect(load).not.toHaveBeenCalled(); expect(storage.setItem).not.toHaveBeenCalled(); expect(assign).not.toHaveBeenCalled();
  });

  it.each(['/g/%2fescape', '/g/bad-id', '/j/path-token', '/g', '/', '/index.html', '/playful'])('R02 gives no route for %s', path => {
    expect(parse(path)).toBeUndefined();
  });
  it('R02 refuses credentials and non-web protocols', () => {
    expect(parse('https://user:pass@kingdown.test/play/')).toBeUndefined();
    expect(parse('file:///play/')).toBeUndefined();
  });

  it.each([
    ['/play', '/play/'], ['/play/unknown', '/play/'], ['/play/unknown/child', '/play/'],
    ['/play/friend/', '/play/friend'],
    ['/play/profile/', '/play/profile'], ['/play/settings/', '/play/settings'], [`/g/${gameId.toUpperCase()}/`, `/g/${gameId}`], ['/j/', '/j'],
  ])('R03 gives the canonical replacement for %s', (path, canonical) => {
    expect(accountPath(parse(path)!)).toBe(canonical);
  });

  it.each(['/j', '/j#', '/j#bad', '/j#ABC01I', '/j#%ZZ', '/j#code=private&sb_flow_id=flow', '/j#https://other.test/j#ABC234'])('R04 keeps malformed invite %s in its empty shell', path => {
    expect(parse(path)).toEqual({ screen: 'join', key: null });
    expect(accountPath(parse(path)!)).toBe('/j');
  });
  it('R04 cannot turn callback fields into a game ID or unchecked destination', () => {
    expect(parse('/g/code=private')).toBeUndefined();
    expect(accountPath(parse('/play/?code=private&error=cancel&sb_flow_id=flow#code=private')!)).toBe('/play/');
    expect(accountPath({ screen: 'join', key: 'code=private' })).toBe('/j');
    expect(() => accountPath({ screen: 'game', gameId: '../play/?code=private' })).toThrow('Invalid game route');
  });
});
