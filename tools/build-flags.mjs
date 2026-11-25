// The build flags and environment variables of the game: each VITE_* or KINGDOWN_* name that a file in src/ or tools/
// (or vite.config.ts, package.json) reads. tools/build-flags.test.ts compares this list with a scan of the source text.
// When you add a name, also look at each place that must know it:
// - a non-VITE_ name that src reads from import.meta.env: a define in tools/plugin-server-build.mjs (else it is undefined);
// - a stage or site name: tools/deploy.sh (production refusal, site_env), tools/deploy-staging.mjs, tools/ios-sync.sh,
//   tools/release/release.sh and tools/release/live.sh (unset lists), tools/online-local.mjs, CHECK_SITE_ENV in
//   tools/lib/checks.mjs;
// - a KINGDOWN_TEST_* name: the clear list of run(['test'], ...) in tools/ci-plan.mjs.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const FLAG_NAMES = [
  'KINGDOWN_ADMIN_DATABASE_URL', 'KINGDOWN_ANIM_MIN_FREE_GIB', 'KINGDOWN_ANIM_OUT',
  'KINGDOWN_ANIM_PYTHON', 'KINGDOWN_BANK_GEOMETRY', 'KINGDOWN_BANK_INFER',
  'KINGDOWN_BANK_PREVIEW', 'KINGDOWN_CATALOG', 'KINGDOWN_CHATGPT',
  'KINGDOWN_CI_BROWSER_CHECKS', 'KINGDOWN_CI_WAIT_MINUTES', 'KINGDOWN_COMPARISON_BASE_DIST',
  'KINGDOWN_COMPARISON_STAGE_DIST', 'KINGDOWN_ENGINES_DATABASE_URL', 'KINGDOWN_ERROR_RECORDER',
  'KINGDOWN_FRAME_CHECKS_HISTORY', 'KINGDOWN_FRAME_CHECKS_RECORD', 'KINGDOWN_HOSTED_SIGNIN_ORIGIN',
  'KINGDOWN_INTERNAL_SECRET', 'KINGDOWN_LOCAL_API_ORIGIN', 'KINGDOWN_LOCAL_ONLINE',
  'KINGDOWN_LOCAL_ONLINE_AUTH_STANDIN', 'KINGDOWN_LOCAL_PAGE_PORT', 'KINGDOWN_LOCAL_PAGE_URL',
  'KINGDOWN_M1_RIFE_PYTHON', 'KINGDOWN_M1_RIFE_RUNTIME', 'KINGDOWN_M1_SSH',
  'KINGDOWN_MACHINE_LEASED', 'KINGDOWN_MACHINE_LEASE_FD', 'KINGDOWN_MACHINE_LEASE_ID',
  'KINGDOWN_MAIL_FROM', 'KINGDOWN_MUSE', 'KINGDOWN_PICK_PYTHON',
  'KINGDOWN_PLUGIN_DATABASE_URL', 'KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS', 'KINGDOWN_PLUGIN_OAUTH_READY',
  'KINGDOWN_PLUGIN_ORIGIN', 'KINGDOWN_PLUGIN_UI_PART', 'KINGDOWN_PREVIEW_PYTHON',
  'KINGDOWN_PUBLISH_PYTHON', 'KINGDOWN_RELEASE_COMMIT', 'KINGDOWN_RELEASE_EVIDENCE',
  'KINGDOWN_RELEASE_FAIL_STAGE', 'KINGDOWN_RELEASE_LOG', 'KINGDOWN_RELEASE_SITE_ROOT',
  'KINGDOWN_RELEASE_WORKTREE', 'KINGDOWN_REVIEW', 'KINGDOWN_REVIEW_EMAIL',
  'KINGDOWN_REVIEW_OPPONENT_EMAIL', 'KINGDOWN_RIFE_PYTHON', 'KINGDOWN_RIFE_RUNTIME',
  'KINGDOWN_RUNTIME_MANIFEST', 'KINGDOWN_SECRETS_ENV', 'KINGDOWN_SMOKE_DIR',
  'KINGDOWN_STAGE', 'KINGDOWN_TEST_BASE',
  'KINGDOWN_TEST_DOCS', 'KINGDOWN_TEST_FILE', 'KINGDOWN_TEST_LOCKED',
  'KINGDOWN_TEST_LOCK_WAIT', 'KINGDOWN_TEST_NAME', 'KINGDOWN_TEST_NO_TYPECHECK',
  'KINGDOWN_TEST_OUT', 'KINGDOWN_TEST_PAGES', 'KINGDOWN_TEST_SKIP',
  'KINGDOWN_TEST_WHY', 'KINGDOWN_WEB_RECOVERY_OUTPUT', 'VITE_KINGDOWN_APPLE_SIGN_IN',
  'VITE_KINGDOWN_STAGE', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_URL',
];

// A read (import.meta.env.X, import.meta.env['X'], process.env.X, env.X, $X, ${X}, a quoted key) or a shell assignment (X=value).
const READ = /(?:import\.meta\.env(?:\??\.|(?:\?\.)?\[['"])|process\.env\.|env\.|\$\{?|['"]|(?<=^|\s)(?=[A-Z0-9_]+=))((?:VITE_)?KINGDOWN_[A-Z0-9_]+|VITE_[A-Z0-9_]+)/g;
const SOURCE = /\.(?:ts|mjs|sh|py)$/, TEST = /\.test\.(?:ts|mjs)$/;
const SELF = 'tools/build-flags.mjs';

/**
 * Each read of a name in the sources: the name, its place (file:line) and whether it is an import.meta.env read.
 * A source that ends in / is a folder; the scan reads each .ts, .mjs, .sh and .py file below it, except tests.
 */
export function scanFlags(root, sources) {
  const files = sources.filter(source => !source.endsWith('/'));
  const walk = dir => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(path); }
      else if (SOURCE.test(entry.name) && !TEST.test(entry.name) && path !== SELF) files.push(path);
    }
  };
  for (const source of sources) if (source.endsWith('/')) walk(source.slice(0, -1));
  const reads = [];
  for (const file of files) {
    const lines = readFileSync(join(root, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const match of line.matchAll(READ)) reads.push({ name: match[1], place: `${file}:${i + 1}`, client: match[0].startsWith('import.meta.env') });
    });
  }
  return reads;
}
