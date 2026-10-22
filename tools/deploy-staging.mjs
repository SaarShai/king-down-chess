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
  return ['--yes', 'vercel@62.2.0', 'deploy', '--prebuilt', '--target', 'preview', '--json', '--scope', 'saars-projects-2c777ec5', '--yes'];
}

/** The pinned CLI omits preview from the API request; a project's first deploy becomes production. */
export function requireStagingHistory(result) {
  if (!Array.isArray(result?.deployments) || !result.deployments.some(deployment => /^dpl_[A-Za-z0-9]+$/.test(deployment.uid ?? deployment.id ?? ''))) throw new Error('Preview deploy refused: this staging project has no previous deployment; Vercel promotes first deployments to production');
}

export function verifyStagingPreview(deployment) {
  if (deployment?.projectId !== STAGING_PROJECT_ID || deployment.name !== 'kingdown-staging' || !/^dpl_[A-Za-z0-9]+$/.test(deployment.id ?? '')) throw new Error('Deployment does not belong to the approved staging project');
  if (deployment.target !== null && deployment.target !== 'preview') throw new Error('Staging deploy did not create a preview; stop before assigning an alias');
  if (deployment.readyState !== 'READY') throw new Error('Staging preview is not READY');
  return deployment;
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
    const env = { ...process.env, VERCEL_PROJECT_ID: STAGING_PROJECT_ID, VERCEL_ORG_ID: STAGING_TEAM_ID };
    const runJson = args => {
      const result = spawnSync('npx', args, { cwd: tree, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, env });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error('The staging Vercel command failed');
      try { return JSON.parse(result.stdout); } catch { throw new Error('Vercel did not return deployment JSON'); }
    };
    const api = endpoint => runJson(['--yes', 'vercel@62.2.0', 'api', endpoint, '--method', 'GET', '--raw', '--scope', 'saars-projects-2c777ec5']);
    requireStagingHistory(api(`/v6/deployments?projectId=${STAGING_PROJECT_ID}&teamId=${STAGING_TEAM_ID}&limit=1`));
    console.error('Deploying the checked staging preview.');
    const result = runJson(command), deployment = result.deployment ?? result;
    if (!/^dpl_[A-Za-z0-9]+$/.test(deployment.id ?? '')) throw new Error('Vercel did not return a deployment ID');
    const verified = verifyStagingPreview(api(`/v13/deployments/${deployment.id}?teamId=${STAGING_TEAM_ID}`));
    // Provider timestamps are milliseconds since epoch. Hosting readiness does not prove a usable game.
    console.log(JSON.stringify({ id: verified.id, url: verified.url, target: 'preview', readyState: verified.readyState,
      createdAt: verified.createdAt ?? null, buildingAt: verified.buildingAt ?? null, readyAt: verified.ready ?? null }));
  }
}
