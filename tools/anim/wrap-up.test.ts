import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('checks picked-base proof and the straight move speed rule', () => {
 const script = `
import copy, json, pathlib, sys, tempfile
sys.path.insert(0, sys.argv[1])
import wrap_up_build as build
import wrap_up_strides as strides
selection = {'catalogSha256':'pin', 'entries':[{'kind':'move'}]}
proof = {'catalogSha256':'pin', 'faults':[], 'failed':{}, 'runtimePng':'pass',
         'framesWithNoPickColour':{'total':0}, 'selectionKinds':{'idle':0, 'turn':0, 'attack':0, 'move':1}}
with tempfile.TemporaryDirectory() as tmp:
 path = pathlib.Path(tmp)/'report.json'
 path.write_text(json.dumps(proof))
 assert build.picked_base_report(path, selection) == proof
 assert build.picked_base_report(None, selection) is None
 for field, bad in [('catalogSha256','other'), ('faults',['bad']), ('failed',{'walk':'bad'}),
                    ('runtimePng','fail'), ('framesWithNoPickColour',{'total':1}), ('selectionKinds',{})]:
  path.write_text(json.dumps({**proof, field:bad}))
  try: build.picked_base_report(path, selection)
  except ValueError: pass
  else: raise AssertionError(field)
 assert strides.decide({'character':'ogre','facing':'N'}, {}, {}, {'kings':1.76})[0] == 1.0
 assert strides.decide({'character':'ogre','facing':'SW'}, {}, {}, {'kings':1.76})[0] == .76
 strides.prepare = lambda walks, work: (None, [])
 strides.method_a = lambda work: {'ogre/white/E':{'stride':1.41,'confidence':'high'}}
 strides.method_b = lambda work, runtime: {'ogre/white/E':{'stride':1.41,'confidence':'high'}}
 study = pathlib.Path(tmp)/'study.json'; study.write_text(json.dumps({'king-mud/white/E':{'stride':1}}))
 walk = {'character':'ogre','facing':'E'}
 assert strides.measure([walk], study, pathlib.Path(tmp))['walks']['ogre/white/E']['strideSquaresPerCycle'] == 1.41
 strides.method_b = lambda work, runtime: {}
 try: strides.measure([walk], study, pathlib.Path(tmp))
 except ValueError as error: assert 'under 520 ms' in str(error)
 else: raise AssertionError('one method must not set a short straight move')
`;
 expect(() => execFileSync('/usr/bin/python3', ['-c', script, resolve('tools/anim')], { stdio: 'pipe' })).not.toThrow();
});
