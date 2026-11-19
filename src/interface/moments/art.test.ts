import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { createArtLoader, frameAt, type FramePack } from './art';
import { kings, pieces } from './painted';

const art = new URL('../../../public/moments/', import.meta.url);
const banks: Record<string, FramePack> = JSON.parse(readFileSync(new URL('painted.json', art), 'utf8'));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('lists a distinct WebP for each of the 22 collapses and 12 bows', () => {
  const keys = ['white', 'black'].flatMap(army => [
    ...pieces.map(piece => `collapse/${piece}/${army}`),
    ...kings.map(king => `bow/${king}/${army}`),
  ]);
  expect(Object.keys(banks)).toHaveLength(34);
  expect(Object.keys(banks).sort()).toEqual(keys.sort());
  expect(Object.values(banks).map(bank => bank.image).sort()).toEqual(
    readdirSync(new URL('painted/', art)).sort().map(file => `painted/${file}`),
  );
  for (const [key, bank] of Object.entries(banks)) {
    const file = readFileSync(new URL(bank.image, art));
    expect(file.toString('ascii', 8, 12)).toBe('WEBP');
    expect(bank.frames.length).toBeGreaterThanOrEqual(16);
    expect(bank.size).toBe(384);
    expect(bank.pivot).toHaveLength(2);
    expect(bank.body).toBeGreaterThan(0);
    expect(bank.ms).toBe(key.startsWith('bow/') ? 1400 : 1100);
    expect(bank.frames[0]).toEqual([0, 0]);
    expect(bank.frames.at(-1)![0]).toBeLessThan(bank.ms);
    if (key.startsWith('collapse/')) expect(bank.frames.at(-1)![0]).toBe(925);
    expect(frameAt(bank, bank.ms * 10)).toBe(bank.frames.at(-1)![1]);
    for (const [time, index] of bank.frames) expect(frameAt(bank, time)).toBe(index);
  }
});

it('requests art only on use and shares concurrent requests for one sheet', async () => {
  const fetch = vi.fn(async () => ({ ok: true, json: async () => banks }));
  vi.stubGlobal('fetch', fetch);
  const urls: string[] = [];
  vi.stubGlobal('Image', class { set src(url: string) { urls.push(url); } async decode() {} });
  const load = createArtLoader();
  expect(fetch).not.toHaveBeenCalled();
  const first = load('collapse/pawn/black');
  expect(load('collapse/pawn/black')).toBe(first);
  await first;
  expect(urls).toEqual([`/moments/${banks['collapse/pawn/black'].image}`]);
  await load('bow/frost/black');
  expect(urls).toEqual([`/moments/${banks['collapse/pawn/black'].image}`, `/moments/${banks['bow/frost/black'].image}`]);
  expect(fetch).toHaveBeenCalledExactlyOnceWith('/moments/painted.json');
});

it('retries a failed index or sheet and reports an unknown bank', async () => {
  const fetch = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValue({ ok: true, json: async () => banks });
  vi.stubGlobal('fetch', fetch);
  const decode = vi.fn().mockRejectedValueOnce(Error('missing')).mockResolvedValue(undefined);
  vi.stubGlobal('Image', class { decode = decode; });
  const load = createArtLoader();
  const key = 'bow/flame/white';
  await expect(load(key)).rejects.toThrow('index');
  await expect(load(key)).rejects.toThrow('missing');
  await expect(load(key)).resolves.toHaveProperty('bank');
  await expect(load('bad')).rejects.toThrow('Unknown moment');
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(decode).toHaveBeenCalledTimes(2);
});
