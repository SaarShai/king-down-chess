// The browser checks that `npm run check:browser` knows (checks-and-hooks/06).
// Each entry: name (the short name on the command line), script (from the checkout root), limit (seconds
// before the runner stops the check), and optional: channel (sets PLAYABLE_BROWSER unless the caller set it),
// args (for the script), env (extra environment for the script, for example the staging build stage), byName (true: the entry runs only when you name it, never in a run of all),
// site (true: a plugin check that also opens the site at PLAYABLE_URL, so the runner builds and serves it),
// exclusive (true: the check asserts time or shares the test database, so it runs with every machine slot
// and no other check beside it; after-redesign/01).
// The default checks and the self-test run when no name is given. The selftest-* entries after them are planned
// faults that prove the runner: selftest-dirty writes a scratch file into the checkout, selftest-fail
// fails, selftest-hang never ends, selftest-hold sleeps 15 s so that two runs can be seen together.
export const checks = [
  { name: 'ui-review-samples', script: 'docs/specs/ui-review-samples/verify.mjs', limit: 90, channel: 'chromium', byName: true },
  { name: 'character-prepare', script: 'tools/verify-character-prepare.mjs', limit: 90, channel: 'chromium', byName: true, exclusive: true },
  { name: 'stratus-idle-exit', script: 'tools/verify-stratus-idle-exit.mjs', limit: 240, channel: 'chromium', byName: true },
  { name: 'stratus-registration', script: 'tools/verify-stratus-registration.mjs', limit: 300, channel: 'chromium', byName: true },
  { name: 'character-runtime', script: 'tools/verify-character-runtime.mjs', limit: 300, channel: 'chromium', byName: true },
  { name: 'layout-title', script: 'tools/verify-layout.mjs', args: ['title'], limit: 120, channel: 'chromium', byName: true },
  { name: 'layout-zoom', script: 'tools/verify-layout.mjs', args: ['zoom'], limit: 120, channel: 'chromium', byName: true },
  { name: 'layout-result', script: 'tools/verify-layout.mjs', args: ['result'], limit: 120, channel: 'chromium', byName: true },
  { name: 'effects-animation', script: 'docs/specs/effects-animation/verify.mjs', limit: 180, channel: 'chromium', byName: true },
  { name: 'effects-concepts', script: 'docs/specs/effects-animation/verify-concepts.mjs', limit: 120, channel: 'chromium', byName: true },
  { name: 'effects-comparisons', script: 'docs/specs/effects-animation/verify-comparisons.mjs', limit: 120, channel: 'chromium', byName: true },
  { name: 'card-art', script: 'docs/specs/effects-animation/verify-card-art.mjs', limit: 120, channel: 'chromium', byName: true },
  { name: 'card-crops', script: 'docs/specs/effects-animation/preview/card-art/crop-review/verify.mjs', limit: 120, channel: 'chromium', byName: true },
  { name: 'card-art-wide', script: 'docs/specs/effects-animation/preview/card-art/wide-review/verify.mjs', limit: 180, channel: 'chromium', byName: true },
  { name: 'wide-card-motion', script: 'docs/specs/effects-animation/preview/card-art/wide-review/motion/verify.mjs', limit: 240, channel: 'chromium', byName: true },
  { name: 'effects-game', script: 'docs/specs/effects-animation/verify-game.mjs', limit: 240, channel: 'chromium', byName: true, exclusive: true },
  { name: 'motion-concepts', script: 'tools/verify-motion-concepts.mjs', limit: 300, channel: 'chromium', byName: true },
  { name: 'effects-states', script: 'docs/specs/effects-animation/evidence/14-state-integration/capture.mjs', limit: 180, channel: 'chromium', byName: true },
  { name: 'read-piece', script: 'tools/verify-read-piece.mjs', limit: 180 },
  { name: 'verb-marks', script: 'tools/verify-verb-marks.mjs', limit: 180 },
  // Parked with their features (docs/PARKED.md): lessons, lesson-return, workshop and workshop-cast run only by name.
  { name: 'lessons', script: 'tools/verify-lessons.mjs', limit: 180, byName: true },
  { name: 'turn', script: 'tools/verify-turn.mjs', limit: 180 },
  // The serverless game link is parked (docs/PARKED.md): its check runs only by name, and it can fail until the link returns.
  { name: 'link-game', script: 'tools/verify-link-game.mjs', args: ['link'], limit: 180, byName: true },
  { name: 'end', script: 'tools/verify-end.mjs', limit: 180 },
  { name: 'their-turn', script: 'tools/verify-their-turn.mjs', limit: 180 },
  { name: 'game-screen', script: 'tools/verify-game-screen.mjs', limit: 240 },
  { name: 'menu-extra', script: 'tools/verify-menu-extra.mjs', limit: 240 },
  { name: 'home', script: 'tools/verify-home.mjs', limit: 180 },
  { name: 'account', script: 'tools/verify-account.mjs', limit: 180 },
  { name: 'cursor-adoption', script: 'tools/verify-cursor-adoption.mjs', limit: 240, channel: 'chromium' },
  { name: 'king-effects', script: 'tools/verify-king-effects.mjs', limit: 240, exclusive: true },
  { name: 'character-clips', script: 'tools/verify-character-clips.mjs', limit: 180 },
  { name: 'lesson-return', script: 'tools/verify-lesson-return.mjs', limit: 180, byName: true },
  { name: 'new-game', script: 'tools/verify-new-game.mjs', limit: 240 },
  { name: 'painted-game', script: 'tools/verify-painted-game.mjs', limit: 240, exclusive: true },
  { name: 'powers', script: 'tools/verify-powers.mjs', limit: 180 },
  { name: 'special-moves', script: 'tools/verify-special-moves.mjs', limit: 240 },
  { name: 'ux-defects', script: 'tools/verify-ux-defects.mjs', limit: 300 },
  { name: 'visual-design', script: 'docs/visual-design/verify.mjs', limit: 240 },
  { name: 'workshop', script: 'tools/verify-workshop.mjs', limit: 240, byName: true },
  { name: 'workshop-cast', script: 'tools/verify-workshop-cast.mjs', limit: 180, byName: true },
  { name: 'qa', script: 'tools/qa.mjs', limit: 900, channel: 'chromium', exclusive: true },
  { name: 'selftest', script: 'tools/check-selftest.mjs', limit: 120 },
  // Plugin checks build their own artifact; OAuth and HTTP checks need local PostgreSQL.
  { name: 'plugin-oauth', script: 'tools/plugin-browser-check.mjs', args: ['oauth'], limit: 240, channel: 'chromium', byName: true, exclusive: true },
  { name: 'plugin-privacy', script: 'tools/plugin-browser-check.mjs', args: ['privacy'], limit: 120, channel: 'chromium', byName: true, exclusive: true },
  { name: 'w6-parts', script: 'tools/verify-w6-parts.mjs', limit: 180, channel: 'chromium', byName: true },
  { name: 'search-worker', script: 'tools/verify-search-worker.mjs', limit: 180, channel: 'chromium', byName: true },
  { name: 'plugin-skylift', script: 'tools/plugin-browser-check.mjs', args: ['skylift'], limit: 180, channel: 'chromium', byName: true, exclusive: true },
  // CI WebKit (limit x 3) took 1130-1218 s of 1260 s; New game's open Cards section draws its paintings in each setup step
  // (+30-90 s), and run 40253834383 passed the old limit near the end. 480 s gives 1440 s there.
  { name: 'plugin-ui', script: 'tools/plugin-browser-check.mjs', args: ['fixture'], limit: 480, channel: 'chromium', byName: true },
  // The board previews A8, A15, A17, A18 and A39 also open the site (docs/specs/gui-previews-2026-10-19/capture.mjs).
  // The full preview set takes about 160 s at normal load (ticket 71), so it gets 300 s.
  { name: 'gui-board-preview', script: 'tools/plugin-browser-check.mjs', args: ['preview'], limit: 300, channel: 'chromium', byName: true, site: true },
  { name: 'gui-board-a8', script: 'tools/plugin-browser-check.mjs', args: ['preview', 'A8'], limit: 180, channel: 'chromium', byName: true, site: true },
  { name: 'gui-board-a14', script: 'tools/plugin-browser-check.mjs', args: ['preview', 'A14'], limit: 180, channel: 'chromium', byName: true },
  { name: 'gui-board-a15', script: 'tools/plugin-browser-check.mjs', args: ['preview', 'A15'], limit: 180, channel: 'chromium', byName: true, site: true },
  { name: 'gui-board-a18', script: 'tools/plugin-browser-check.mjs', args: ['preview', 'A18'], limit: 180, channel: 'chromium', byName: true, site: true },
  { name: 'gui-board-y3', script: 'tools/plugin-browser-check.mjs', args: ['preview', 'Y3'], limit: 180, channel: 'chromium', byName: true },
  { name: 'plugin-ui-http', script: 'tools/plugin-browser-check.mjs', args: ['http'], limit: 480, channel: 'chromium', byName: true, exclusive: true },
  { name: 'web-game', script: 'tools/web-game-check.mjs', limit: 480, channel: 'chromium', byName: true, exclusive: true },
  // The same two checks on a staging build: they run the Ranked flows that production hides (staging-first-game/67).
  { name: 'plugin-ui-http-staging', script: 'tools/plugin-browser-check.mjs', args: ['http'], env: { VITE_KINGDOWN_STAGE: 'staging' }, limit: 480, channel: 'chromium', byName: true, exclusive: true },
  { name: 'web-game-staging', script: 'tools/web-game-check.mjs', env: { VITE_KINGDOWN_STAGE: 'staging' }, limit: 480, channel: 'chromium', byName: true, exclusive: true },
  { name: 'account-discovery', script: 'tools/web-game-check.mjs', args: ['discovery'], limit: 240, channel: 'chromium', byName: true, exclusive: true },
  { name: 'staging-login', script: 'tools/web-game-check.mjs', args: ['staging-login'], limit: 240, channel: 'chromium', byName: true, exclusive: true },
  { name: 'desktop-performance', script: 'tools/web-game-check.mjs', args: ['desktop'], limit: 600, channel: 'chromium', byName: true, exclusive: true },
  { name: 'production-comparison', script: 'tools/production-comparison.mjs', limit: 360, channel: 'chromium', byName: true, exclusive: true },
  { name: 'shared-mechanics', script: 'tools/web-game-check.mjs', args: ['mechanics'], limit: 480, channel: 'chromium', byName: true, exclusive: true },
  { name: 'recovery-consumers', script: 'tools/web-game-check.mjs', args: ['recovery'], limit: 480, channel: 'chromium', byName: true, exclusive: true },
  { name: 'cache-registration', script: 'tools/cache-registration-check.mjs', limit: 45, channel: 'chromium', byName: true, exclusive: true },
  { name: 'web-online', script: 'tools/web-online-check.mjs', limit: 480, byName: true, exclusive: true },
  { name: 'selftest-dirty', script: 'tools/check-selftest-dirty.mjs', limit: 30, byName: true },
  { name: 'selftest-fail', script: 'tools/check-selftest-dirty.mjs', args: ['fail'], limit: 30, byName: true },
  { name: 'selftest-hang', script: 'tools/check-selftest-dirty.mjs', args: ['hang'], limit: 5, byName: true },
  { name: 'selftest-hold', script: 'tools/check-selftest-dirty.mjs', args: ['hold'], limit: 60, byName: true },
];

// The probe files that a check runs as parts of itself: ux-defects (tools/verify-ux-defects.mjs) runs each
// tools/ux-defects/d<N>-<slug>.mjs, and plugin-browser-check.mjs runs plugin-ui-check.mjs and
// plugin-oauth-check.mjs. The commit-msg counter counts their assertion lines as it counts the
// lines of a registered check (web redesign spec, rule 7).
export const probeFiles = /^tools\/(?:ux-defects\/d\d+-[\w-]+|plugin-(?:ui|oauth)-check)\.mjs$/;
