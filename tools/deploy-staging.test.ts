import { expect, it } from 'vitest';
import { requireStagingHistory, stagingDeployArgs, verifyStagingPreview } from './deploy-staging.mjs';
import { STAGING_ORIGIN, STAGING_PROJECT_ID, STAGING_TEAM_ID, STAGING_SUPABASE_URL } from './staging-config.mjs';
const project = { projectId: STAGING_PROJECT_ID, orgId: STAGING_TEAM_ID, projectName: 'kingdown-staging' };
const manifest = { stage: 'staging', supabaseUrl: STAGING_SUPABASE_URL, publicOrigin: STAGING_ORIGIN, projectId: STAGING_PROJECT_ID };
const config = { version: 3, routes: [{ dest: '/mcp' }, { dest: '/index.html' }] };
const env = { KINGDOWN_STAGE: 'staging', VITE_KINGDOWN_STAGE: 'staging', VITE_SUPABASE_URL: STAGING_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' };
it('pins the project and preview target without a production option', () => {
  const command = stagingDeployArgs(project, config, env, manifest);
  expect(command).toContain('--prebuilt'); expect(command).toContain('preview'); expect(command).not.toContain('--prod'); expect(command).toContain('--json'); expect(command).not.toContain('--skip-domain');
  expect(command.slice(command.indexOf('--target'), command.indexOf('--target') + 2)).toEqual(['--target', 'preview']);
});
it('refuses an old project, environment override, incomplete artifact or missing stage', () => {
  expect(() => stagingDeployArgs(project, config, env, undefined)).toThrow('Rebuild');
  expect(() => stagingDeployArgs({ ...project, projectId: 'prj_OldProduction' }, config, env, manifest)).toThrow('approved');
  expect(() => stagingDeployArgs(project, config, { ...env, VERCEL_PROJECT_ID: 'prj_OldProduction' }, manifest)).toThrow('another project');
  expect(() => stagingDeployArgs(project, { version: 3, routes: [] }, env, manifest)).toThrow('combined');
  expect(() => stagingDeployArgs(project, config, { ...env, KINGDOWN_STAGE: undefined }, manifest)).toThrow('staging build settings');
});


it('refuses first deployment promotion and permits a project with a remaining preview', () => {
  for (const result of [undefined, {}, { deployments: [] }, { deployments: [{ uid: '' }] }]) expect(() => requireStagingHistory(result)).toThrow('first deployments');
  expect(() => requireStagingHistory({ deployments: [{ uid: 'dpl_PreviousPreview', target: null }] })).not.toThrow();
});

it('checks the actual deployment project, preview target and ready state before success', () => {
  const deployment = { id: 'dpl_NewPreview', projectId: STAGING_PROJECT_ID, name: 'kingdown-staging', readyState: 'READY', target: null };
  expect(verifyStagingPreview(deployment)).toEqual(deployment);
  expect(verifyStagingPreview({ ...deployment, target: 'preview' })).toEqual({ ...deployment, target: 'preview' });
  expect(() => verifyStagingPreview({ ...deployment, target: 'production' })).toThrow('did not create a preview');
  expect(() => verifyStagingPreview({ ...deployment, target: undefined })).toThrow('did not create a preview');
  expect(() => verifyStagingPreview({ ...deployment, projectId: 'prj_OldProduction' })).toThrow('approved staging project');
  expect(() => verifyStagingPreview({ ...deployment, readyState: 'ERROR' })).toThrow('not READY');
});
