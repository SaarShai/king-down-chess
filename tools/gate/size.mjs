// Size rule of the repo gate: a file over LIMIT bytes fails, unless the size allowlist holds its
// path with a reason.
//
// Allowlist format (tools/gate/size-allowlist.txt): one file per line, the path from the top of
// the work tree, then one or more spaces, then the reason. A path cannot hold a space. Blank lines
// and lines that start with "#" are comments. A line with no reason is a gate fault.
import { GateFault } from './fault.mjs';

export const LIMIT = 2_000_000;
export const ALLOWLIST = 'tools/gate/size-allowlist.txt';

/** Parses the allowlist text into a set of paths. */
export const readAllowlist = (/** @type {string} */ text) => {
  const paths = new Set();
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const [path, ...reason] = line.split(/\s+/);
    if (!reason.length) throw new GateFault(`${ALLOWLIST}: line ${i + 1}: ${path} has no reason`);
    paths.add(path);
  });
  return paths;
};

/**
 * Gives one fault line for each file over the limit that the allowlist does not hold.
 * @param {{ path: string, size: number }[]} files
 * @param {Set<string>} allowlist
 * @param {string} where the short commit, or "index"
 */
export const sizeFaults = (files, allowlist, where) => files
  .filter(file => file.size > LIMIT && !allowlist.has(file.path))
  .map(file => `size: ${where}: ${file.path}: ${file.size} bytes is over ${LIMIT}; add the path and a reason to ${ALLOWLIST}`);
