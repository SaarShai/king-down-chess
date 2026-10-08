// Secret rule of the repo gate: a file or a commit message that holds the exact value of a current
// secret fails. The search is a fixed byte search, so binary files count. No output holds a value:
// a fault line names the secret file, never the value.
//
// Sources:
//   - The secrets folder of the main checkout (the parent of git's common folder, so a linked
//     worktree finds it too). GATE_SECRETS_DIR replaces it. The gate reads each file in the folder
//     and its sub-folders; it skips names that start with ".".
//   - The Typesafe key file that AGENTS.md names (~/.config/typesafe/key). GATE_TYPESAFE_KEY
//     replaces it.
// A ".json" file gives each string whose own key holds "secret", "token", "password" or "apikey"
// (case ignored); a string in an array takes the key of the array. Another file gives its trimmed
// content. An empty value counts as no value. A missing source gives no values; a source that does
// not read (no access, not valid JSON) is a gate fault.
import { readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { GateFault } from './fault.mjs';

export const TYPESAFE_KEY = join(homedir(), '.config', 'typesafe', 'key');
const SECRET_KEY = /secret|token|password|apikey/i;

/** @typedef {{ name: string, value: Buffer }} Secret `name` is the secret file name for the fault line */

/** The text of a source file, or undefined when it is absent. */
const readSource = (/** @type {string} */ path, /** @type {string} */ name) => {
  try { return readFileSync(path, 'utf8'); } catch (error) {
    const code = /** @type {NodeJS.ErrnoException} */ (error).code;
    if (code === 'ENOENT') return undefined;
    throw new GateFault(`secrets: ${name}: cannot read (${code})`);
  }
};

/** The values that one source file gives. */
const valuesOf = (/** @type {string} */ text, /** @type {string} */ name) => {
  if (!name.endsWith('.json')) return [text.trim()];
  /** @type {unknown} */
  let data;
  // The parse error can quote the text, so the fault line does not give it.
  try { data = JSON.parse(text); } catch { throw new GateFault(`secrets: ${name}: cannot read (not valid JSON)`); }
  /** @type {string[]} */
  const values = [];
  const walk = (/** @type {unknown} */ node, /** @type {string} */ key) => {
    if (typeof node === 'string') { if (SECRET_KEY.test(key)) values.push(node); }
    else if (Array.isArray(node)) for (const item of node) walk(item, key);
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, k);
  };
  walk(data, '');
  return values;
};

/** The file names in a folder and its sub-folders, or [] when the folder is absent. */
const filesIn = (/** @type {string} */ folder) => {
  try {
    return readdirSync(folder, { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
      .map(entry => join(entry.parentPath, entry.name).slice(folder.length + 1))
      .filter(path => !path.split('/').some(part => part.startsWith('.')));
  } catch (error) {
    const code = /** @type {NodeJS.ErrnoException} */ (error).code;
    if (code === 'ENOENT') return [];
    throw new GateFault(`secrets: ${folder}: cannot read (${code})`);
  }
};

/**
 * Reads each secret file of the two sources, in name order, with the values that it gives. A file
 * that gives no value is in the list too; a missing file is not.
 * @param {string} mainCheckout the top folder of the main checkout
 * @returns {{ name: string, values: Buffer[] }[]}
 */
export const readSources = mainCheckout => {
  const folder = process.env.GATE_SECRETS_DIR || join(mainCheckout, '.secrets');
  const files = filesIn(folder).sort().map(path => ({ path: join(folder, path), name: `.secrets/${path}` }));
  files.push({ path: process.env.GATE_TYPESAFE_KEY || TYPESAFE_KEY, name: 'typesafe key' });
  return files.flatMap(({ path, name }) => {
    const text = readSource(path, name);
    return text === undefined ? [] : [{ name, values: valuesOf(text, name).filter(Boolean).map(value => Buffer.from(value)) }];
  });
};

/**
 * Reads the current secret values from the two sources.
 * @param {string} mainCheckout the top folder of the main checkout
 * @returns {Secret[]}
 */
export const readSecrets = mainCheckout =>
  readSources(mainCheckout).flatMap(({ name, values }) => values.map(value => ({ name, value })));

/**
 * Gives one fault line for each text (a file or a commit message) and each secret that it holds.
 * @param {{ where: string, path: string, content: Buffer }[]} texts `where` is the short commit, or
 *   "index"; `path` is the file path, or "message"
 * @param {Secret[]} secrets
 */
export const secretFaults = (texts, secrets) => texts.flatMap(({ where, path, content }) => {
  const names = [...new Set(secrets.filter(({ value }) => content.includes(value)).map(({ name }) => name))];
  const fix = where === 'index'
    ? 'take the value out of the file, then stage it again'
    : 'take the value out of that commit (for example with git rebase), then push again; if the value left this computer, rotate the secret';
  return names.map(name => `secret: ${where}: ${path}: ${name}: holds a secret value; ${fix}`);
});
