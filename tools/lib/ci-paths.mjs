const docsPath = /^(?:TASKS\.md|LESSONS\.md|docs\/lessons\/[a-z-]+\.md|docs\/specs\/[a-z0-9-]+\/issues\/\d+-[a-z0-9-]+\.md)$/;
const leadReadCss = /^src\/(?:style\.css|interface\/play\/(?:help\/help|menus|reading-b|sides|shell|play)\.css|plugin\/screens\/(?:board|end|collection|seat|setup)\.css)$/;

const localChecks = [
  { match: /^src\/interface\/play\/help\/help\.css$/, tests: ['src/interface/play/help/**/*.test.ts', 'tools/focus-contrast.test.ts'],
    checks: ['read-piece', 'game-screen', 'new-game', 'powers', 'special-moves', 'ux-defects', 'visual-design', 'qa', 'web-game', 'web-online'] },
  { match: /^src\/interface\/play\/menus\.css$/, tests: ['src/interface/play/menus.test.ts', 'src/interface/play/mini-board.test.ts', 'tools/focus-contrast.test.ts'],
    checks: ['menu-extra', 'home', 'new-game', 'game-screen', 'account', 'ux-defects', 'visual-design', 'qa', 'web-game', 'web-online'] },
];

export function pathPlan(changes, baseGreen) {
  return { mode: baseGreen && changes.length > 0 && changes.every(({ path }) => docsPath.test(path)) ? 'docs' : 'full' };
}

export function localPlan(changes) {
  const plan = pathPlan(changes, true);
  if (plan.mode === 'docs' || !changes.length) return plan;
  const rows = changes.filter(({ path }) => !docsPath.test(path))
    .map(({ path }) => localChecks.find(({ match }) => match.test(path)));
  if (rows.some(row => !row)) return plan;
  return {
    mode: 'selected',
    tests: [...new Set(rows.flatMap(row => row.tests))],
    checks: [...new Set(rows.flatMap(row => row.checks))],
  };
}

export function riskyPaths(names) {
  return names.filter(name => !docsPath.test(name) && !leadReadCss.test(name));
}
