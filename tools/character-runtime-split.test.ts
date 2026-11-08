import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { validateManifest } from './lib/character-runtime-guard.mjs';
import { splitManifest } from './lib/character-runtime-split.mjs';

it('splits the published manifest into an index and one part for each character and army, with every bank once', () => {
  const manifest = validateManifest(JSON.parse(readFileSync('public/character-runtime/manifest.json', 'utf8')));
  const { index, files } = splitManifest(manifest), head = JSON.parse(index);
  const { banks, ...rest } = manifest;
  expect(head).toEqual({ ...rest, schemaVersion: 2, parts: head.parts });
  expect(Object.values(head.parts).sort()).toEqual(Object.keys(files).sort());
  const parts = Object.entries(head.parts as Record<string, string>).map(([key, path]) => [key, JSON.parse(files[path]).banks] as const);
  for (const [key, list] of parts) expect(new Set(list.map((b: { character: string, army: string }) => `${b.character}:${b.army}`))).toEqual(new Set([key]));
  expect(parts.flatMap(([, list]) => list).length).toBe(banks.length);
  expect(new Set(parts.flatMap(([, list]) => list.map((b: { character: string, army: string, id: string }) => `${b.character}:${b.army}:${b.id}`))).size).toBe(banks.length);
  // The index is small: the game loads it before any part.
  expect(index.length).toBeLessThan(4000);
});

it('refuses a bank with no character or army', () => {
  expect(() => splitManifest({ schemaVersion: 1, effects: {}, banks: [{ id: 'x', frames: [] }] })).toThrow('Invalid character part');
  expect(() => splitManifest({ schemaVersion: 1, effects: {}, banks: [{ character: '../x', army: 'white', frames: [] }] })).toThrow('Invalid character part');
});
