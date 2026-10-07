// The browser checks that `npm run check:browser` knows (checks-and-hooks/06).
// Each entry: name (the short name on the command line), script (from the checkout root), limit (seconds
// before the runner stops the check), and optional: channel (sets PLAYABLE_BROWSER unless the caller set it),
// args (for the script), byName (true: the entry runs only when you name it, never in a run of all).
// The 13 checks and the self-test run in a run of all. The selftest-* entries after them are planned
// faults that prove the runner: selftest-dirty writes a scratch file into the checkout, selftest-fail
// fails, selftest-hang never ends.
export const checks = [
  { name: 'account', script: 'tools/verify-account.mjs', limit: 180 },
  { name: 'cursor-adoption', script: 'tools/verify-cursor-adoption.mjs', limit: 240, channel: 'chromium' },
  { name: 'king-effects', script: 'tools/verify-king-effects.mjs', limit: 240 },
  { name: 'lesson-return', script: 'tools/verify-lesson-return.mjs', limit: 180 },
  { name: 'new-game', script: 'tools/verify-new-game.mjs', limit: 240 },
  { name: 'painted-game', script: 'tools/verify-painted-game.mjs', limit: 240 },
  { name: 'playable-clay', script: 'tools/verify-playable-clay.mjs', limit: 240, channel: 'chromium' },
  { name: 'powers', script: 'tools/verify-powers.mjs', limit: 180 },
  { name: 'special-moves', script: 'tools/verify-special-moves.mjs', limit: 240 },
  { name: 'visual-design', script: 'docs/visual-design/verify.mjs', limit: 240 },
  { name: 'workshop', script: 'tools/verify-workshop.mjs', limit: 240 },
  { name: 'workshop-cast', script: 'tools/verify-workshop-cast.mjs', limit: 180 },
  { name: 'qa', script: 'tools/qa.mjs', limit: 900, channel: 'chromium' },
  { name: 'selftest', script: 'tools/check-selftest.mjs', limit: 120 },
  { name: 'selftest-dirty', script: 'tools/check-selftest-dirty.mjs', limit: 30, byName: true },
  { name: 'selftest-fail', script: 'tools/check-selftest-dirty.mjs', args: ['fail'], limit: 30, byName: true },
  { name: 'selftest-hang', script: 'tools/check-selftest-dirty.mjs', args: ['hang'], limit: 5, byName: true },
];
