// The browser checks that `npm run check:browser` knows (checks-and-hooks/06).
// Each entry: name (the short name on the command line), script (from the checkout root), limit (seconds
// before the runner stops the check), and optional: channel (sets PLAYABLE_BROWSER unless the caller set it),
// args (for the script), byName (true: the entry runs only when you name it, never in a run of all).
// The default checks and the self-test run when no name is given. The selftest-* entries after them are planned
// faults that prove the runner: selftest-dirty writes a scratch file into the checkout, selftest-fail
// fails, selftest-hang never ends.
export const checks = [
  { name: 'turn', script: 'tools/verify-turn.mjs', limit: 180 },
  { name: 'link-game', script: 'tools/verify-turn.mjs', args: ['link'], limit: 180 },
  { name: 'game-screen', script: 'tools/verify-game-screen.mjs', limit: 240 },
  { name: 'menu-extra', script: 'tools/verify-menu-extra.mjs', limit: 240 },
  { name: 'home', script: 'tools/verify-home.mjs', limit: 180 },
  { name: 'account', script: 'tools/verify-account.mjs', limit: 180 },
  { name: 'cursor-adoption', script: 'tools/verify-cursor-adoption.mjs', limit: 240, channel: 'chromium' },
  { name: 'king-effects', script: 'tools/verify-king-effects.mjs', limit: 240 },
  { name: 'lesson-return', script: 'tools/verify-lesson-return.mjs', limit: 180 },
  { name: 'new-game', script: 'tools/verify-new-game.mjs', limit: 240 },
  { name: 'painted-game', script: 'tools/verify-painted-game.mjs', limit: 240 },
  { name: 'playable-clay', script: 'tools/verify-playable-clay.mjs', limit: 240, channel: 'chromium' },
  { name: 'powers', script: 'tools/verify-powers.mjs', limit: 180 },
  { name: 'special-moves', script: 'tools/verify-special-moves.mjs', limit: 240 },
  { name: 'ux-defects', script: 'tools/verify-ux-defects.mjs', limit: 300 },
  { name: 'visual-design', script: 'docs/visual-design/verify.mjs', limit: 240 },
  { name: 'workshop', script: 'tools/verify-workshop.mjs', limit: 240 },
  { name: 'workshop-cast', script: 'tools/verify-workshop-cast.mjs', limit: 180 },
  { name: 'qa', script: 'tools/qa.mjs', limit: 900, channel: 'chromium' },
  { name: 'selftest', script: 'tools/check-selftest.mjs', limit: 120 },
  // Plugin checks build their own artifact; OAuth and HTTP checks need local PostgreSQL.
  { name: 'plugin-oauth', script: 'tools/plugin-browser-check.mjs', args: ['oauth'], limit: 240, channel: 'chromium', byName: true },
  { name: 'plugin-ui', script: 'tools/plugin-browser-check.mjs', args: ['fixture'], limit: 240, channel: 'chromium', byName: true },
  { name: 'plugin-ui-http', script: 'tools/plugin-browser-check.mjs', args: ['http'], limit: 240, channel: 'chromium', byName: true },
  { name: 'selftest-dirty', script: 'tools/check-selftest-dirty.mjs', limit: 30, byName: true },
  { name: 'selftest-fail', script: 'tools/check-selftest-dirty.mjs', args: ['fail'], limit: 30, byName: true },
  { name: 'selftest-hang', script: 'tools/check-selftest-dirty.mjs', args: ['hang'], limit: 5, byName: true },
];

// The probe files that a check runs as parts of itself: ux-defects (tools/verify-ux-defects.mjs) runs each
// tools/ux-defects/d<N>-<slug>.mjs. The commit-msg counter counts their assertion lines as it counts the
// lines of a registered check (web redesign spec, rule 7).
export const probeFiles = /^tools\/ux-defects\/d\d+-[\w-]+\.mjs$/;
