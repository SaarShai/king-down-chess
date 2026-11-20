import { isDeepStrictEqual } from 'node:util';

const paths = [
  { match: /^(?:TASKS\.md|LESSONS\.md|docs\/lessons\/[a-z-]+\.md|docs\/specs\/[a-z0-9-]+\/issues\/\d+-[a-z0-9-]+\.md)$/, docs: true },
  { match: /^package(?:-lock)?\.json$/, version: true, risky: true },
  { match: /^(?:\.github\/|\.githooks\/|tools\/|supabase\/|api\/|engines\/|plugin-deploy\/|ios\/|capacitor\.config\.json$|vercel\.json$|vite\.config\.ts$)/, risky: true },
  { match: /^src\/(?:account(?:-game)?\/|api\/|online\/|match\/|muse\/|rules\/|ai\/|(?:game|game-rules|platform|lesson-store|trick-store)\.ts$)/, risky: true },
  { match: /^src\/plugin\/(?:[^/]+\.ts$|screens\/(?:board(?:-model|-actions)?|friend|join|lobby|wait|seat(?:-model)?|setup(?:-model)?)\.ts$)/, risky: true },
  { match: /^src\/interface\/(?:people\/|platform\.ts$|play\/(?:shell|history|replay|saved|main|turn)\.ts$)/, risky: true },
  { match: /^src\/interface\/play\/help\/help\.css$/, tests: ['src/interface/play/help/**/*.test.ts'],
    checks: ['read-piece', 'game-screen', 'new-game', 'powers', 'special-moves', 'ux-defects', 'visual-design', 'qa', 'web-game', 'web-online'] },
  { match: /^src\/interface\/play\/menus\.css$/, tests: ['src/interface/play/menus.test.ts', 'src/interface/play/mini-board.test.ts'],
    checks: ['menu-extra', 'home', 'new-game', 'game-screen', 'account', 'ux-defects', 'visual-design', 'qa', 'web-game', 'web-online'] },
  { match: /^src\/(?:style\.css|interface\/play\/(?:reading-b|sides|shell|play)\.css|plugin\/screens\/(?:board|end|collection|seat|setup)\.css)$/ },
];

function versionOnly({ path, before, after }) {
  try {
    const old = JSON.parse(before), next = JSON.parse(after);
    const version = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
    if (!version.test(old.version) || !version.test(next.version) || old.version === next.version) return false;
    if (path === 'package-lock.json') {
      if (old.packages?.['']?.version !== old.version || next.packages?.['']?.version !== next.version) return false;
      delete old.packages[''].version;
      delete next.packages[''].version;
    }
    delete old.version;
    delete next.version;
    return isDeepStrictEqual(old, next);
  } catch {
    return false;
  }
}

export function pathPlan(changes, baseGreen) {
  if (!baseGreen || !changes.length) return { mode: 'full' };
  const rows = changes.map(change => {
    const row = paths.find(({ match }) => match.test(change.path));
    return row?.version && versionOnly(change) ? { docs: true } : row;
  });
  if (rows.every(row => row?.docs)) return { mode: 'docs' };
  if (rows.some(row => !row?.docs && !row?.tests)) return { mode: 'full' };
  return {
    mode: 'selected',
    tests: [...new Set(rows.flatMap(row => row?.tests ?? []))],
    checks: [...new Set(rows.flatMap(row => row?.checks ?? []))],
  };
}

export function riskyPaths(names) {
  return names.filter(name => {
    const row = paths.find(({ match }) => match.test(name));
    // A new directory can contain rules or persistence. Add it here after checking its use.
    return !row || row.risky;
  });
}

export function compareContents(path) {
  return paths.some(row => row.version && row.match.test(path));
}
