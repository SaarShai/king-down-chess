import { afterEach, expect, it, vi } from 'vitest';
import { loadSeals, saveSeal, seeSeals } from './trick-store';

const box = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
  };
};

afterEach(() => vi.unstubAllGlobals());

it('keeps a seal and its unseen mark on this device', () => {
  const storage = box();
  storage.setItem('kingdown.lessons', '{"done":["Guard"]}');
  expect(saveSeal('chain', storage)).toBe(true);
  expect(loadSeals(storage)).toEqual({ found: ['chain'], unseen: true });
  expect(storage.getItem('kingdown.lessons')).toBe('{"done":["Guard"]}');
});

it('keeps new finds first and saves each trick only once', () => {
  const storage = box();
  saveSeal('chain', storage);
  saveSeal('shot-over', storage);
  expect(saveSeal('chain', storage)).toBe(false);
  expect(loadSeals(storage)).toEqual({ found: ['shot-over', 'chain'], unseen: true });
});

it('clears the unseen mark and shows it again only for a new find', () => {
  const storage = box();
  saveSeal('chain', storage);
  expect(seeSeals(storage)).toBe(true);
  expect(loadSeals(storage)).toEqual({ found: ['chain'], unseen: false });
  saveSeal('chain', storage);
  expect(loadSeals(storage).unseen).toBe(false);
  saveSeal('far-swap', storage);
  expect(loadSeals(storage)).toEqual({ found: ['far-swap', 'chain'], unseen: true });
});

it.each([null, '{', 'null', '{}', '{"found":"chain","unseen":true}', '{"found":[],"unseen":true}'])
('loads no seals from empty or bad data: %s', raw => {
  const storage = box();
  if (raw !== null) storage.setItem('kingdown.tricks', raw);
  expect(loadSeals(storage)).toEqual({ found: [], unseen: false });
});

it('keeps only known tricks, once each, from stored data', () => {
  const storage = box();
  storage.setItem('kingdown.tricks', '{"found":["chain","bad",null,"chain","king-guard"],"unseen":"yes"}');
  expect(loadSeals(storage)).toEqual({ found: ['chain', 'king-guard'], unseen: false });
});

it('uses the device store by default', () => {
  const storage = box();
  vi.stubGlobal('localStorage', storage);
  expect(saveSeal('second-life')).toBe(true);
  expect(loadSeals()).toEqual({ found: ['second-life'], unseen: true });
  expect(seeSeals()).toBe(true);
  expect(loadSeals().unseen).toBe(false);
});

it('does not throw when storage is absent or blocked', () => {
  const blocked = {
    getItem: () => { throw new Error('Blocked'); },
    setItem: () => { throw new Error('Blocked'); },
  };
  for (const storage of [null, blocked]) {
    expect(loadSeals(storage)).toEqual({ found: [], unseen: false });
    expect(saveSeal('chain', storage)).toBe(false);
    expect(seeSeals(storage)).toBe(false);
  }
});

it('keeps the saved seals if a write fails', () => {
  const storage = box();
  saveSeal('chain', storage);
  const full = { getItem: storage.getItem, setItem: () => { throw new Error('Full'); } };
  expect(saveSeal('far-swap', full)).toBe(false);
  expect(seeSeals(full)).toBe(false);
  expect(loadSeals(storage)).toEqual({ found: ['chain'], unseen: true });
});
