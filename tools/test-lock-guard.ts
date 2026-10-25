// Vitest global setup (vite.config.ts). A run must come through `npm test`: tools/test-lock.sh holds the one test lock
// and marks the run with KINGDOWN_TEST_LOCKED, and the type checks run first. A bare `npx vitest run` has neither, so it
// stops here. `npm run test:docs` marks its run with KINGDOWN_TEST_DOCS; the config then includes the doc lints only.
export default function setup() {
  if (process.env.KINGDOWN_TEST_LOCKED || process.env.KINGDOWN_TEST_DOCS) return;
  throw new Error('This vitest run has no test lock and no type check: run npm test (KINGDOWN_TEST_FILE and KINGDOWN_TEST_NAME select cases), or npm run test:docs for the doc lints.');
}
