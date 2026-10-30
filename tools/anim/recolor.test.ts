import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

const python = process.env.KINGDOWN_ANIM_PYTHON || 'python3';
const available = spawnSync(python, ['-c', 'import numpy, scipy, skimage, PIL']).status === 0;

it.skipIf(!available)('fits a tone map and preserves alpha and detail', () => {
  const result = spawnSync(python, ['-B', '-c', `
import importlib.util, numpy as np
s=importlib.util.spec_from_file_location('recolor','tools/anim/recolor.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
a=np.zeros((40,40,4),dtype=np.uint8)
y,x=np.indices((30,30));a[5:35,5:35,:3]=np.stack((130+x*3,110+y*3,90+x*2),axis=-1);a[5:35,5:35,3]=255
a[4,10:30]=[200,160,100,15]
b=a.copy();b[5:35,5:35,:3]//=2
mapping=m.fit(a,b); assert np.all(np.diff(mapping['targetL'])>=0)
r=m.apply(a,mapping);m.gate(a,r)
assert np.array_equal(r[:,:,3],a[:,:,3]);assert r[8:32,8:32,:3].std()>5
assert r[10:30,10:30,:3].mean()<a[10:30,10:30,:3].mean()
`], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
});

it.skipIf(!available)('rejects changed alpha, clipped edges and a fringe', () => {
  const result = spawnSync(python, ['-B', '-c', `
import importlib.util,numpy as np
s=importlib.util.spec_from_file_location('recolor','tools/anim/recolor.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
a=np.zeros((12,12,4),dtype=np.uint8);a[3:9,3:9]=[60,50,40,255];a[2,5]=[60,50,40,12]
m.gate(a,a.copy())
def rejected(source,result):
 try: m.gate(source,result)
 except ValueError: return
 raise AssertionError('bad frame passed')
b=a.copy();b[4,4,3]=1;rejected(a,b)
b=a.copy();b[0,0,3]=255;rejected(b,b)
b=a.copy();b[2,5,:3]=255;rejected(a,b)
`], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
});
