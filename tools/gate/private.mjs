// Private rule of the repo gate: an added or changed path in a private folder fails, also a file
// that `git add -f` forced past the ignore rules. A deleted path passes. The art manifest passes.
// The rule names the folders exactly, so the research folders whose names end in
// `-context-recovery` are not private.
export const PRIVATE = ['docs/claude-recovery/', 'docs/cursor-recovery/', '.secrets/', 'art-src/'];
export const PUBLIC = ['art-src/MANIFEST.md'];

/**
 * Gives one fault line for each file in a private folder.
 * @param {{ where: string, path: string }[]} files `where` is the short commit, or "index"
 */
export const privateFaults = files => files.flatMap(({ where, path }) => {
  const folder = PRIVATE.find(prefix => path.startsWith(prefix));
  if (!folder || PUBLIC.includes(path)) return [];
  const fix = where === 'index'
    ? `unstage it: git rm --cached "${path}"`
    : 'take the file out of that commit (for example with git rebase), then push again';
  return [`private: ${where}: ${path}: ${folder} is a private folder; ${fix}`];
});
