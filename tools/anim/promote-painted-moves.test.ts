import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';

it('rejects a changed candidate before writing to the target', () => {
 const root=mkdtempSync(join(tmpdir(),'kingdown-walk-promotion-')),candidate=join(root,'candidate'),target=join(root,'target');
 try {
  mkdirSync(candidate);mkdirSync(target);writeFileSync(join(candidate,'manifest.json'),'{}');
  expect(()=>execFileSync('python3',[resolve('tools/anim/promote-painted-moves.py'),'--candidate',candidate,'--target',target],{stdio:'pipe'})).toThrow(/Candidate catalog does not match the selection/);
  expect(readdirSync(target)).toEqual([]);
 } finally {rmSync(root,{recursive:true,force:true});}
});

it('removes new banks and snapshots when a rebuild fails', () => {
 const script = `
import hashlib, importlib.util, json, pathlib, subprocess, sys, tempfile
spec = importlib.util.spec_from_file_location('promotion', sys.argv[1])
p = importlib.util.module_from_spec(spec); spec.loader.exec_module(p)
with tempfile.TemporaryDirectory() as tmp:
 root = pathlib.Path(tmp); target = root/'target'; candidate = root/'candidate'
 for path in (target/'banks', target/'assets', candidate/'banks'):
  path.mkdir(parents=True)
 for name in ('alpha-recovery-review', 'army-effects-review', 'directional-attacks'):
  (root/name).mkdir()
 (target/'.catalog.lock').touch()
 old = b'{"entries":[]}'
 (target/'manifest.json').write_bytes(old); p.BASE = hashlib.sha256(old).hexdigest()
 bank = b'{"frames":[]}'; sha = hashlib.sha256(bank).hexdigest()
 (candidate/'banks'/f'{sha}.json').write_bytes(bank)
 entry = {'kind':'move','sha256':sha,'manifest':f'banks/{sha}.json'}
 proposed = json.dumps({'entries':[entry]*196}).encode()
 (candidate/'manifest.json').write_bytes(proposed)
 p.SELECTION = root/'selection.json'
 p.SELECTION.write_text(json.dumps({'catalogSha256':hashlib.sha256(proposed).hexdigest()}))
 before = p.files(target)
 (root/'directional-attacks').rmdir()
 try: p.promote(candidate, target)
 except ValueError as error: assert 'Missing sibling folder: directional-attacks' in str(error)
 else: raise AssertionError('missing sibling must fail')
 assert p.files(target) == before
 (root/'directional-attacks').mkdir()
 def fail(*args, **kwargs): raise subprocess.CalledProcessError(1, args[0])
 p.subprocess.run = fail
 try: p.promote(candidate, target)
 except subprocess.CalledProcessError: pass
 else: raise AssertionError('rebuild must fail')
 assert p.files(target) == before
 assert not (target/'catalogs').exists()
`;
 expect(()=>execFileSync('python3',['-c',script,resolve('tools/anim/promote-painted-moves.py')],{stdio:'pipe'})).not.toThrow();
});
