/** The game's character package in parts. manifest.json holds the banks of every character of every army: 3.3 MB,
 * 0.9 MB with brotli. A game needs only the figures on its board, so the build also writes index.json (the manifest
 * without its banks, and the path of each part) and one part for each character and army (parts/<character>.<army>.json,
 * about 22 kB with brotli). The runtime loads the index, then the part of each figure that it shows. A part has a fixed
 * name: a page that loaded the index of the build before a deploy gets the part of the new build, not a 404.
 * manifest.json stays published for pages of the builds before the parts (during a deploy) and for the tools. */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const partPath = (character, army) => `parts/${character}.${army}.json`;

/** { index, files }: the index text and each part's text by its path. Input: a validated manifest (validateManifest). */
export function splitManifest(manifest) {
  const groups = new Map();
  for (const bank of manifest.banks) {
    const key = `${bank.character}:${bank.army}`;
    if (!/^[a-z][a-z-]*$/.test(bank.character ?? '') || !['white', 'black'].includes(bank.army)) throw Error(`Invalid character part: ${key}`);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(bank);
  }
  const parts = {}, files = {};
  for (const [key, banks] of groups) {
    const path = partPath(banks[0].character, banks[0].army);
    parts[key] = path;
    files[path] = JSON.stringify({ banks }) + '\n';
  }
  const { banks: _, ...rest } = manifest;
  return { index: JSON.stringify({ ...rest, schemaVersion: 2, parts }) + '\n', files };
}

/** Write index.json and parts/ beside manifest.json in a built runtime folder. Returns the written paths. */
export function writeRuntimeParts(folder, manifest) {
  const { index, files } = splitManifest(manifest);
  rmSync(join(folder, 'parts'), { recursive: true, force: true });
  mkdirSync(join(folder, 'parts'), { recursive: true });
  writeFileSync(join(folder, 'index.json'), index);
  for (const [path, text] of Object.entries(files)) writeFileSync(join(folder, path), text);
  return ['index.json', ...Object.keys(files)];
}
