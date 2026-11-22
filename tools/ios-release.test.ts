import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

// The dry run in a temporary repository with its own origin/main: it prints the steps and stops before the archive.
it('prints each release step of an origin/main commit and runs none', () => {
  const repo = tempRepo({ hooks: false });
  mkdirSync(join(repo.dir, 'tools')); mkdirSync(join(repo.dir, 'ios/App/App.xcodeproj'), { recursive: true });
  cpSync('tools/ios-release.sh', join(repo.dir, 'tools/ios-release.sh'));
  writeFileSync(join(repo.dir, 'package.json'), '{"scripts":{"ios:sync":"x"}}\n');
  writeFileSync(join(repo.dir, 'ios/App/App.xcodeproj/project.pbxproj'), 'CURRENT_PROJECT_VERSION = 9;\nMARKETING_VERSION = 1.1;\n'.repeat(2));
  writeFileSync(join(repo.dir, 'ios/release-log.md'), '# iOS release log\n');
  repo.git('add', '-A'); repo.git('commit', '-qm', 'base'); repo.git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  const commit = repo.git('rev-parse', 'HEAD').stdout.trim();
  const result = repo.run('bash', ['tools/ios-release.sh', '--dry-run']);
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
  const steps = [...result.stdout.matchAll(/^ios-release: (\S+ \S+)/gm)].map(match => match[1]);
  expect(steps).toEqual(['git worktree', 'npm ci', 'npm run', 'env KINGDOWN_TEST_FILE=ios/store.test.ts', 'xcodebuild -project', 'dry run:', 'owner step:']);
  expect(result.stdout).toContain(`| build 1.1 (9) | commit ${commit} |`);
  expect(result.stdout).toContain('ios-release: owner step: xcodebuild -exportArchive');
  expect(readFileSync(join(repo.dir, 'ios/release-log.md'), 'utf8')).toBe('# iOS release log\n');

  repo.git('commit', '-q', '--allow-empty', '-m', 'not on main');
  expect(repo.run('bash', ['tools/ios-release.sh', '--dry-run', repo.git('rev-parse', 'HEAD').stdout.trim()])).toMatchObject({ status: 2, stderr: expect.stringContaining('is not on origin/main') });
});
