#!/usr/bin/env node
/** Publish a checked prebuilt tree only to the isolated staging project's preview target. */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGING_ORIGIN, STAGING_PROJECT_ID, STAGING_TEAM_ID, STAGING_SUPABASE_URL } from './staging-config.mjs';

export function stagingDeployArgs(project, config, env, manifest) {
  if (project.projectId !== STAGING_PROJECT_ID || project.orgId !== STAGING_TEAM_ID || project.projectName !== 'kingdown-staging') throw new Error('Link only the approved kingdown-staging project before deploy');
  if (config.version !== 3 || !config.routes?.some(route => route.dest === '/mcp') || !config.routes?.some(route => route.dest === '/index.html')) throw new Error('Build the combined staging site before deploy');
  if (manifest?.stage !== 'staging' || manifest.supabaseUrl !== STAGING_SUPABASE_URL || manifest.publicOrigin !== STAGING_ORIGIN || manifest.projectId !== STAGING_PROJECT_ID) throw new Error('Rebuild the artifact with staging settings before deploy');
  if (env.KINGDOWN_STAGE !== 'staging' || env.VITE_KINGDOWN_STAGE !== 'staging' || env.VITE_SUPABASE_URL !== STAGING_SUPABASE_URL || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '')) throw new Error('Set the explicit staging build settings before deploy');
  if (env.VERCEL_PROJECT_ID && env.VERCEL_PROJECT_ID !== STAGING_PROJECT_ID || env.VERCEL_ORG_ID && env.VERCEL_ORG_ID !== STAGING_TEAM_ID) throw new Error('Vercel environment points to another project');
  return ['--yes', 'vercel@62.2.0', 'deploy', '--prebuilt', '--target', 'preview', '--scope', 'saars-projects-2c777ec5', '--yes'];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--publish') || args.length > 1) throw new Error('Usage: node tools/deploy-staging.mjs [--publish]');
  const tree = resolve('kingdown-deploy');
  const project = JSON.parse(readFileSync(resolve(tree, '.vercel/project.json'), 'utf8'));
  const config = JSON.parse(readFileSync(resolve(tree, '.vercel/output/config.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(resolve(tree, '.vercel/output/staging.json'), 'utf8'));
  const command = stagingDeployArgs(project, config, process.env, manifest);
  if (!args.includes('--publish')) console.log('Staging artifact and project guards pass. No deploy requested.');
  else {
    const result = spawnSync('npx', command, { cwd: tree, stdio: 'inherit', env: { ...process.env, VERCEL_PROJECT_ID: STAGING_PROJECT_ID, VERCEL_ORG_ID: STAGING_TEAM_ID } });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  }
}
