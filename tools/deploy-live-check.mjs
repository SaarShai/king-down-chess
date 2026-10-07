// node tools/deploy-live-check.mjs <build folder>: confirms that the live site serves this build
// (secrets-and-public-gates/10). tools/deploy.sh runs it after the publish step.
//
// It passes when the live home page loads the same bundle (the module entry script of index.html) as
// the build, and the privacy, terms and delete-data pages are byte-identical to the build's copies.
// It sends no cookie. It tries again every 5 s until all match or the time limit ends; then it fails
// and names each difference.
//
//   DEPLOY_LIVE_URL          the live site (default https://kingdown.dev)
//   DEPLOY_LIVE_TIMEOUT_MS   the time limit (default 120000: 2 minutes)
//
// Exit codes: 0 the live site serves the build, 1 a difference at the time limit, 2 a usage fault
// (no build folder, or a build with no entry script or legal page).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const legalPages = ['privacy.html', 'terms.html', 'delete-data.html'];
const fault = message => { console.error(`live-check: ${message}`); process.exit(2); };

/** The bundle name: the src of the first module script in a page, or null. */
function bundleOf(html) {
  for (const [tag] of html.matchAll(/<script\b[^>]*>/gi)) {
    const src = /\btype=["']?module\b/i.test(tag) && /\bsrc=["']?([^"'\s>]+)/i.exec(tag)?.[1];
    if (src) return src;
  }
  return null;
}

const [folder, ...extra] = process.argv.slice(2);
if (!folder || extra.length) fault('usage: node tools/deploy-live-check.mjs <build folder>');
for (const name of ['index.html', ...legalPages]) if (!existsSync(join(folder, name))) fault(`the build has no ${name} in ${folder}`);
const bundle = bundleOf(readFileSync(join(folder, 'index.html'), 'utf8'));
if (!bundle) fault(`the build's index.html has no module script in ${folder}`);
const built = Object.fromEntries(legalPages.map(name => [name, readFileSync(join(folder, name))]));

const base = (process.env.DEPLOY_LIVE_URL || 'https://kingdown.dev').replace(/\/+$/, '');
const limit = Number(process.env.DEPLOY_LIVE_TIMEOUT_MS || 120_000);
if (!(limit >= 0)) fault('DEPLOY_LIVE_TIMEOUT_MS must be a number of milliseconds');

/** Fetches one path with no cookie and no cache. Gives the bytes, or a fault line. */
async function get(path) {
  try {
    // Node's fetch keeps no cookie jar, and `credentials: 'omit'` sends no cookie header.
    const res = await fetch(base + path, { credentials: 'omit', redirect: 'follow', headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return { error: `${path}: HTTP ${res.status}` };
    return { bytes: Buffer.from(await res.arrayBuffer()) };
  } catch (error) {
    return { error: `${path}: fetch failed (${error.cause?.code ?? error.message})` };
  }
}

/** One look at the live site. Gives the list of differences (empty: a match). */
async function differences() {
  const [home, ...legal] = await Promise.all(['/', ...legalPages.map(name => `/${name}`)].map(get));
  const found = [];
  if (home.error) found.push(home.error);
  else {
    const live = bundleOf(home.bytes.toString('utf8'));
    if (live !== bundle) found.push(`bundle: the live site loads ${live ?? 'no module script'}, the build ${bundle}`);
  }
  legalPages.forEach((name, i) => {
    const { error, bytes } = legal[i];
    if (error) found.push(error);
    else if (!bytes.equals(built[name])) found.push(`${name}: the live page differs from the build (live ${bytes.length} bytes, build ${built[name].length} bytes)`);
  });
  return found;
}

const start = Date.now();
const deadline = start + limit;
console.log(`live-check: ${base} against ${folder} (bundle ${bundle}, time limit ${Math.round(limit / 1000)} s)`);
for (;;) {
  const found = await differences();
  if (!found.length) {
    console.log(`live-check: pass: ${base} loads ${bundle}; ${legalPages.join(', ')} are identical to the build`);
    process.exit(0);
  }
  const left = deadline - Date.now();
  if (left <= 0) {
    console.error(`live-check: FAIL after ${Math.round((Date.now() - start) / 1000)} s: ${base} does not serve the build`);
    for (const line of found) console.error(`live-check:   ${line}`);
    process.exit(1);
  }
  await new Promise(done => setTimeout(done, Math.min(5000, left)));
}
