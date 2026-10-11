import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resultsRoot } from './lib/results-root.mjs';

describe('card result storage', () => {
  it('preserves conflicts, deduplicates compressed logs, and keeps sources', () => {
    execFileSync('python3', ['-c', `
import importlib.util,tempfile,gzip,sys
sys.dont_write_bytecode=True
from pathlib import Path
spec=importlib.util.spec_from_file_location('store','tools/results-store.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as t:
 p=Path(t);root=p/'results';a=p/'a';b=p/'b';root.mkdir();a.mkdir();b.mkdir()
 (a/'run.jsonl').write_bytes(b'first\\n');m.merge(root,a,'a')
 with gzip.open(b/'run.jsonl.gz','wb') as f:f.write(b'first\\n')
 rows=m.merge(root,b,'drive',True);assert rows[0]['stored']=='run.jsonl'
 (a/'run.jsonl').write_bytes(b'second\\n');rows=m.merge(root,a,'changed')
 assert rows[0]['stored'].startswith('.variants/')
 assert (root/'run.jsonl').read_bytes()==b'first\\n'
 assert (root/rows[0]['stored']).read_bytes()==b'second\\n'
 (a/'node_modules').symlink_to(b,target_is_directory=True)
 assert any('dependency_link' in r for r in m.merge(root,a,'dependency'))
 (a/'run.jsonl').write_bytes(b'first\\nmore\\n');m.merge(root,a,'append')
 assert (root/'run.jsonl').read_bytes()==b'first\\nmore\\n'
 assert (a/'run.jsonl').exists() and (b/'run.jsonl.gz').exists()
 (a/'link').symlink_to(b/'run.jsonl.gz')
 try:m.merge(root,a,'links');raise AssertionError('symlink accepted')
 except RuntimeError:pass
`], { cwd: process.cwd(), stdio: 'pipe' });
  });
  it('uses a remote spool without local card configuration and fails for a missing configured card', () => {
    const temp=mkdtempSync(join(tmpdir(),'results-root-'));const file=join(temp,'config.json');
    const previous=process.env.KING_DOWN_RESULTS_DIR;delete process.env.KING_DOWN_RESULTS_DIR;
    try {
      expect(resultsRoot(file)).toBe('sim/out');
      writeFileSync(file, JSON.stringify({ root:join(temp,'absent'),volume:join(temp,'absent'),uuid:'wrong' }));
      expect(()=>resultsRoot(file)).toThrow('Connect card disk');
      process.env.KING_DOWN_RESULTS_DIR=temp;expect(resultsRoot(file)).toBe(temp);
    } finally { if(previous===undefined)delete process.env.KING_DOWN_RESULTS_DIR;else process.env.KING_DOWN_RESULTS_DIR=previous;rmSync(temp,{recursive:true}); }
  });
});
