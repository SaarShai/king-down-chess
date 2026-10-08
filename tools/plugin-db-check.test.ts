import { describe, expect, it, vi } from 'vitest';
import { checkPluginDatabase } from './plugin-db-check.mjs';
import { diagnostic } from '../src/plugin/diagnostics';
describe('plugin startup checks and safe diagnostics', () => {
 it('checks board access, deletion behavior and the exact audience allowlist', async () => {
  const query=vi.fn().mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{confdeltype:'n'}]}).mockResolvedValueOnce({rows:[{client_id:'client'}]});
  await checkPluginDatabase({query},{clientIds:['client']},'https://example/mcp');
  expect(query.mock.calls[0][0]).toContain('public.plugin_boards'); expect(query.mock.calls[2][1]).toEqual([['client'],'https://example/mcp']);
 });
 it('preserves database faults rather than diagnosing them as missing configuration', async () => {
  const error=Object.assign(new Error('private connection URL'),{code:'ECONNRESET'});
  await expect(checkPluginDatabase({query:vi.fn().mockRejectedValue(error)},undefined,undefined)).rejects.toBe(error);
  expect(diagnostic(error)).toEqual({name:'Error',code:'ECONNRESET'});
  expect(diagnostic(Object.assign(new Error('private URL'),{code:'SELF_SIGNED_CERT_IN_CHAIN'}))).toEqual({name:'Error',code:'SELF_SIGNED_CERT_IN_CHAIN'});
  expect(diagnostic({name:'private token',code:'private token',message:'private token'})).toEqual({name:'Error',code:'UNKNOWN'});
 });
 it('rejects old board schema and missing configured clients', async () => {
  const query=vi.fn().mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{confdeltype:'c'}]});
  await expect(checkPluginDatabase({query},undefined,undefined)).rejects.toThrow('0004');
  query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{confdeltype:'n'}]}).mockResolvedValueOnce({rows:[]});
  await expect(checkPluginDatabase({query},{clientIds:['client']},'resource')).rejects.toThrow('allowlist');
 });
});
