// Deploy script test kit (secrets-and-public-gates/09), for tools/deploy-sh.test.ts,
// tools/deploy-sh-release.test.ts and tools/deploy-publish.test.ts. Each case runs the real tools/deploy.sh in a
// temporary repository with a bare remote. Stub `npm`, `npx` and `node` on PATH write each call to a
// log, with the commit and the folder of the call. The browser-check runner is `node tools/check.mjs`,
// so the `node` stub also logs the runner. Origin/main holds a stub `tools/wt.sh` and a stub
// `tools/test-lock.sh`, because the deploy script calls the tools of the commit that it tests; the
// stubs log `wt add <path>` and `test-lock.sh bash tools/test-unlocked.sh`.
// Each test file that uses it calls `afterEach(cleanRepos)`.
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import { tempRepo } from './temp-repo.mjs';
import { keepAssets, liveCheck, pluginLiveCheck, runAsync } from './deploy-site-kit';

export const script = fileURLToPath(new URL('../deploy.sh', import.meta.url));
const pluginSwitch = fileURLToPath(new URL('../chatgpt-plugin.mjs', import.meta.url));
export const siteProject = { projectId: 'prj_SiteTest', orgId: 'team_mIlANWWDRbX1NT4jgJn9jAna', projectName: 'kingdown' };
export const enginesDatabase = 'postgresql://kingdown_plugin_runtime.utqzovjmclfyojedmwok:fake-engines-password@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require';
export const productionSupabase = 'https://utqzovjmclfyojedmwok.supabase.co', stagingSupabase = 'https://puhspsyjyzaghmgtkzqd.supabase.co';
export const pluginProject = { projectId: 'prj_2H4LcrzOXCQbFuKbq0z0G7lCFFC6', orgId: 'team_mIlANWWDRbX1NT4jgJn9jAna', projectName: 'kingdown-plugin' };

export type Repo = ReturnType<typeof tempRepo>;
const repos: Repo[] = [];
export function cleanRepos() { while (repos.length) repos.pop()!.cleanup(); }

export const stub = (path: string, lines: string[]) => {
  writeFileSync(path, ['#!/bin/sh', ...lines, ''].join('\n'));
  chmodSync(path, 0o755);
};

/** A work tree whose origin/main holds the stub wt script and the real live check, and stub npm and
 *  npx on PATH. The runner stub writes the build (`STUB_DIST`, a folder) into `dist/`, as the real
 *  runner builds the app there. */
export function setup() {
  const repo = tempRepo({ hooks: false });
  repos.push(repo);
  const log = join(repo.root, 'calls.log');
  const started = join(repo.root, 'started');
  const record = `echo "$(basename "$0") $* @ $(git rev-parse HEAD 2>/dev/null) in $(pwd -P) with $(ls | tr '\\n' ' ')" >> "${log}"`;
  // STUB_FAIL=<word> makes a call that holds that argument fail; STUB_HANG=<word> makes it wait.
  const holds = (name: string) => `[ -n "$${name}" ] && case " $* " in *" $${name} "*) true;; *) false;; esac`;
  const behave = [
    record,
    `if ${holds('STUB_HANG')}; then touch "${started}"; sleep 30; fi`,
    `if ${holds('STUB_FAIL')}; then exit 1; fi`,
  ];
  mkdirSync(join(repo.dir, 'tools'));
  stub(join(repo.dir, 'tools', 'wt.sh'), [record, '[ -z "$STUB_LINK_MODULES" ] || ln -s "$STUB_LINK_MODULES" node_modules']);
  stub(join(repo.dir, 'tools', 'test-lock.sh'), behave);
  cpSync(liveCheck, join(repo.dir, 'tools', 'deploy-live-check.mjs'));
  cpSync(keepAssets, join(repo.dir, 'tools', 'deploy-keep-assets.mjs'));
  cpSync(pluginLiveCheck, join(repo.dir, 'tools', 'deploy-plugin-live-check.mjs'));
  cpSync(pluginSwitch, join(repo.dir, 'tools', 'chatgpt-plugin.mjs'));
  cpSync(fileURLToPath(new URL('../muse-connector.mjs', import.meta.url)), join(repo.dir, 'tools', 'muse-connector.mjs'));
  repo.write('vercel.json', readFileSync(fileURLToPath(new URL('../../vercel.json', import.meta.url)), 'utf8'));
  repo.write('app.txt', 'one\n');
  repo.git('add', '.');
  repo.git('commit', '-q', '-m', 'one');
  // deploy.sh requires the GitHub origin URL, also after insteadOf. Test pushes go to the bare
  // remote through the push URL; the deploy script fetches it through the git shim below.
  repo.git('remote', 'set-url', 'origin', 'https://github.com/SaarShai/king-down-chess.git');
  repo.git('remote', 'set-url', '--push', 'origin', repo.remote);
  repo.git('push', '-q', 'origin', 'main');
  const bin = join(repo.root, 'bin');
  mkdirSync(bin);
  // The git shim forwards each call to the real git. Only for a fetch inside this temp folder, it
  // adds a command-line insteadOf rule from the configured origin URL to the bare remote, so the
  // script's own config and `ls-remote --get-url` checks see no rewrite.
  const realGit = repo.run('sh', ['-c', 'command -v git']).stdout.trim();
  stub(join(bin, 'git'), [
    `case "$(pwd -P)" in "${repo.root}"/*) if [ "$1" = fetch ]; then url=$("${realGit}" config --get remote.origin.url) && exec "${realGit}" -c "url.${repo.remote}.insteadOf=$url" "$@"; fi ;; esac`,
    `exec "${realGit}" "$@"`,
  ]);
  stub(join(bin, 'npm'), [...behave,
    'if [ "$1 $2" = "run plugin:build:vercel" ]; then mkdir -p plugin-deploy/.vercel/output/functions/mcp.func; printf "consent-v1" > plugin-deploy/.vercel/output/functions/mcp.func/consent.mjs; fi',
    // The site build parks the ChatGPT plugin (tools/chatgpt-plugin.mjs): its function has no consent script.
    `if [ "$1 $2" = "run build:vercel" ]; then mkdir -p kingdown-deploy/.vercel/output/functions/mcp.func kingdown-deploy/.vercel/output/static; printf '{"version":3}\n' > kingdown-deploy/.vercel/output/config.json; if [ -n "$STUB_DIST" ]; then cp -R "$STUB_DIST/." kingdown-deploy/.vercel/output/static; else printf page > kingdown-deploy/.vercel/output/static/index.html; printf worker > kingdown-deploy/.vercel/output/static/sw.js; fi; fi`,
    // The build copies the committed engine archives; STUB_TAMPER_ENGINE changes them, STUB_STAGING_MANIFEST adds the staging manifest.
    'if [ "$1 $2" = "run build:vercel" ] && [ -d engines ]; then mkdir -p kingdown-deploy/.vercel/output/functions/mcp.func/runtime/engines; cp engines/*.mjs kingdown-deploy/.vercel/output/functions/mcp.func/runtime/engines/; if [ -n "$STUB_TAMPER_ENGINE" ]; then for f in kingdown-deploy/.vercel/output/functions/mcp.func/runtime/engines/*.mjs; do printf x >> "$f"; done; fi; fi',
    'if [ "$1 $2" = "run build:vercel" ] && [ -n "$STUB_STAGING_MANIFEST" ]; then printf "{}" > kingdown-deploy/.vercel/output/staging.json; fi',
    // STUB_NEW_ENGINE: the build archives an engine that origin/main does not hold.
    'if { [ "$1 $2" = "run plugin:build:vercel" ] || [ "$1 $2" = "run build:vercel" ]; } && [ -n "$STUB_NEW_ENGINE" ]; then mkdir -p engines; printf "bundle" > engines/new.mjs; fi',
  ]);
  stub(join(bin, 'node'), [
    `case "$1" in */deploy-plugin-live-check.mjs) ${record}; exec "${process.execPath}" "$1" "$2" "\${STUB_PLUGIN_ORIGIN:-$DEPLOY_LIVE_URL}" ;; esac`,
    `case "$1" in tools/engines-check.mjs) ${behave.join('; ')}; exit 0 ;; esac`,
    // STUB_CI_PASS: CI passed on the commit (exit 0); otherwise the check answers pending (exit 1).
    `case "$1" in tools/ci-green.mjs) ${record}; if [ -n "$STUB_CI_PASS" ]; then exit 0; fi; exit 1 ;; esac`,
    `case "$1" in tools/check.mjs) ${behave.join('; ')}; if [ $# -eq 1 ] && [ -n "$STUB_DIST" ]; then cp -R "$STUB_DIST" dist; fi; if [ "$2" = --gpu ] && [ -n "$STUB_FRAME_PASS" ]; then printf 'ok king-effects\\nok painted-game\\n'; fi; exit 0 ;; esac`,
    `exec "${process.execPath}" "$@"`,
  ]);
  stub(join(bin, 'npx'), [...behave,
    `case " $* " in *" link --project kingdown-plugin "*) project='${JSON.stringify(pluginProject)}' ;; *" link --project kingdown "*) project='${JSON.stringify(siteProject)}' ;; esac; if [ -n "$project" ]; then mkdir -p .vercel; [ -z "$STUB_PROJECT" ] || project="$STUB_PROJECT"; printf "%s\\n" "$project" > .vercel/project.json; fi`,
    'case " $* " in *" deploy --prebuilt --prod "*) if [ "$(basename "$PWD")" = kingdown ]; then test -f .vercel/output/config.json && test -d .vercel/output/functions/mcp.func && cmp -s "$STUB_DIST/index.html" .vercel/output/static/index.html || exit 1; fi ;; esac',
    // STUB_PUBLISH_DIR: the fake CLI puts the published static tree there, as the live site after the switch.
    'case " $* " in *" deploy --prebuilt --prod "*) if [ -n "$STUB_PUBLISH_DIR" ]; then rm -rf "$STUB_PUBLISH_DIR" && cp -R .vercel/output/static "$STUB_PUBLISH_DIR"; fi ;; esac',
    'case " $* " in *" env add "*) cat > "$STUB_ENV_DIR/$5" ;; esac',
  ]);
  const env = { PATH: `${bin}:${repo.env.PATH}`, STUB_FAIL: '', STUB_HANG: '', STUB_DIST: '', STUB_PROJECT: '', STUB_NEW_ENGINE: '', STUB_TAMPER_ENGINE: '', STUB_STAGING_MANIFEST: '', STUB_LINK_MODULES: '', STUB_PUBLISH_DIR: '', KINGDOWN_STAGE: '', VITE_KINGDOWN_STAGE: '', VITE_SUPABASE_URL: productionSupabase, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', PLUGIN_TEST_DATABASE_URL: 'postgresql://localhost/plugin_test', KINGDOWN_ENGINES_DATABASE_URL: '', DEPLOY_LIVE_URL: 'http://127.0.0.1:9', DEPLOY_LIVE_TIMEOUT_MS: '1500' };
  const deploy = (args: string[] = [], extra: Record<string, string> = {}) => repo.run(script, args, { env: { ...env, ...extra } });
  const deployAsync = (args: string[] = [], extra: Record<string, string> = {}) => runAsync(script, args, { cwd: repo.dir, env: { ...repo.env, ...env, ...extra } });
  const calls = () => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : []);
  return { repo, env, deploy, deployAsync, calls, started };
}

/** The deploy worktree path that the script prints on its first line. */
export const worktreeOf = (stdout: string) => /^deploy: worktree (.+) at [0-9a-f]{40}$/m.exec(stdout)?.[1];

export const head = (repo: Repo, ref: string) => repo.git('rev-parse', ref).stdout.trim();

export function expectGone(repo: Repo, path: string | undefined) {
  expect(path).toBeTruthy();
  expect(existsSync(path!)).toBe(false);
  expect(repo.git('worktree', 'list', '--porcelain').stdout).not.toContain(path!);
}
