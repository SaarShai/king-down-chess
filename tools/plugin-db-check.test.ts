import { describe, expect, it, vi } from 'vitest';
import { checkPluginDatabase } from './plugin-db-check.mjs';
import { diagnostic } from '../src/plugin/diagnostics';
/** The probe results: one per statement; the last says if the role may ask for a deletion. */
const probes = (allowed = true) => [{ rows: [] }, { rows: [{ allowed }] }];
describe('plugin startup checks and safe diagnostics', () => {
 it('checks every table the server uses, the board key and the exact audience allowlist', async () => {
  const query=vi.fn().mockResolvedValueOnce(probes()).mockResolvedValueOnce({rows:[{confdeltype:'n',games:true}]}).mockResolvedValueOnce({rows:[{client_id:'client'}]});
  await checkPluginDatabase({query},{clientIds:['client']},'https://example/mcp');
  for (const table of ['public.plugin_boards','public.games','kingdown_jobs.user_email','public.profiles','public.account_deletions','public.invite_code_tries','kingdown_jobs.request_deletion','public.player_ratings','public.rating_history','public.player_badges','public.player_settings']) expect(query.mock.calls[0][0]).toContain(table);
  expect(query.mock.calls[2][1]).toEqual([['client'],'https://example/mcp']);
 });
 it('preserves database faults rather than diagnosing them as missing configuration', async () => {
  const error=Object.assign(new Error('private connection URL'),{code:'ECONNRESET'});
  await expect(checkPluginDatabase({query:vi.fn().mockRejectedValue(error)},undefined,undefined)).rejects.toBe(error);
  expect(diagnostic(error)).toEqual({name:'Error',code:'ECONNRESET'});
  expect(diagnostic(Object.assign(new Error('private URL'),{code:'SELF_SIGNED_CERT_IN_CHAIN'}))).toEqual({name:'Error',code:'SELF_SIGNED_CERT_IN_CHAIN'});
  expect(diagnostic({name:'private token',code:'private token',message:'private token'})).toEqual({name:'Error',code:'UNKNOWN'});
 });
 it('rejects an old schema, a missing grant and missing configured clients', async () => {
  for (const code of ['42P01','42501']) await expect(checkPluginDatabase({query:vi.fn().mockRejectedValue(Object.assign(new Error('relation "public.games" does not exist'),{code}))},undefined,undefined)).rejects.toMatchObject({code:'SCHEMA_REQUIRED',message:expect.stringContaining('0005-0013')});
  await expect(checkPluginDatabase({query:vi.fn().mockResolvedValueOnce(probes(false))},undefined,undefined)).rejects.toMatchObject({code:'SCHEMA_REQUIRED'});
  for (const row of [{confdeltype:'c',games:true},{confdeltype:'n',games:false}]) await expect(checkPluginDatabase({query:vi.fn().mockResolvedValueOnce(probes()).mockResolvedValueOnce({rows:[row]})},undefined,undefined)).rejects.toThrow('0006');
  const query=vi.fn().mockResolvedValueOnce(probes()).mockResolvedValueOnce({rows:[{confdeltype:'n',games:true}]}).mockResolvedValueOnce({rows:[]});
  await expect(checkPluginDatabase({query},{clientIds:['client']},'resource')).rejects.toThrow('allowlist');
 });
});
