// The model names that commits and steering files must not hold (decision 4).
// This module is the one exception to decision 4: a matcher must hold its words.
// The commit-msg hook and the steering lint import it.
//
// A find is a whole word in any case, with or without a version tag: the name, then an optional
// space, hyphen, dot or underscore, an optional "v", digits with dots or hyphens, and optional
// letters ("name 5.5", "name-4-1", "name5", "name v2", "name4x"). A letter or digit before the
// name, or a letter or digit after the find, stops it: "prename" and "names" are not finds.
// Tool names (Claude Code, Codex) are not model names. Short series names of two characters are
// not in the list, because the same letters occur as tokens in code and data.

/** The model names, in lower case. */
export const MODEL_NAMES = Object.freeze([
  'opus', 'sonnet', 'haiku', 'fable', 'mythos',
  'gpt', 'gemini', 'gemma', 'grok', 'llama', 'mistral', 'deepseek', 'qwen', 'kimi',
]);

const pattern = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${MODEL_NAMES.join('|')})(?:[ ._-]?v?\\d+(?:[.-]\\d+)*\\p{L}*)?(?![\\p{L}\\p{N}])`,
  'giu',
);

/**
 * Finds each model name in a text.
 * @param {string} text
 * @returns {{ word: string, line: number }[]} each find as written, with its line (from 1), in order
 */
export function findModelNames(text) {
  return text.split('\n').flatMap((line, i) => [...line.matchAll(pattern)].map(m => ({ word: m[0], line: i + 1 })));
}
