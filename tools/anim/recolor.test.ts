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

it.skipIf(!available)('maps color groups in opposite directions with soft, repeatable transitions', () => {
  const result = spawnSync(python, ['-B', '-c', `
import importlib.util,numpy as np
from skimage.color import rgb2lab
s=importlib.util.spec_from_file_location('recolor','tools/anim/recolor.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
a=np.zeros((64,104,4),dtype=np.uint8)
y,x=np.indices((54,94)); noise=(x%7+y%5).astype(np.uint8)
for start,color in [(0,[170,90,65]),(31,[65,105,175]),(62,[80,150,75])]:
 for c in range(3): a[5:59,5+start:5+start+31,c]=color[c]+noise[:,start:start+31]
a[5:59,5:99,3]=255;a[4,10:30]=[170,90,65,15]
b=a.copy();b[5:59,5:36,:3]=(a[5:59,5:36,:3]*0.5).astype(np.uint8)
b[5:59,36:67,:3]=np.minimum(a[5:59,36:67,:3].astype(int)+60,255)
mapping=m.fit(a,b,'groups');r=m.apply(a,mapping);m.gate(a,r)
assert np.array_equal(r,m.apply(a,mapping))
L=lambda z: rgb2lab(z[:,:,:3]/255.)[:,:,0]
before,after=L(a),L(r)
assert after[10:54,10:30].mean()<before[10:54,10:30].mean()-15
assert after[10:54,42:62].mean()>before[10:54,42:62].mean()+15
assert abs(after[10:54,73:93].mean()-before[10:54,73:93].mean())<2
assert r[10:54,10:30,:3].std()>5
assert np.array_equal(a[:,:,3],r[:,:,3])
# A smooth ramp across a group boundary must not jump as nearest-centre labels change.
centers=np.array([[50.,-10.,0.],[50.,10.,0.]])
test={'mode':'groups','centers':centers.tolist(),'offsets':[[20,0,0],[-20,0,0]]}
from skimage.color import lab2rgb
lab=np.zeros((32,64,3));lab[:,:,0]=50;lab[:,:,1]=np.linspace(-15,15,64)
rgb=np.rint(lab2rgb(lab)*255).astype(np.uint8);frame=np.dstack((rgb,np.full((32,64),255,dtype=np.uint8)))
out=L(m.apply(frame,test))[16];assert np.max(np.abs(np.diff(out)))<4
`], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
});

it.skipIf(!available)('changes only a source colour inside its body zone', () => {
  const result = spawnSync(python, ['-B', '-c', `
import importlib.util,numpy as np
from skimage.color import rgb2lab
s=importlib.util.spec_from_file_location('recolor','tools/anim/recolor.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
a=np.zeros((64,64,4),dtype=np.uint8);a[8:56,8:56]=[120,120,120,255]
a[12:20,12:20,:3]=[180,80,40]
center=rgb2lab(np.array([[[120,120,120]]])/255.)[0,0].tolist()
spec={'mode':'parts','parts':[{'source':center,'tolerance':[5,5,5],'target':[80,0,0],'zone':[-1,-1,0,1]}]}
r=m.apply(a,spec,[32,56]); assert np.array_equal(r,m.apply(a,spec,[32,56]))
assert np.array_equal(r[:,:,3],a[:,:,3]); assert np.array_equal(r[:,33:],a[:,33:])
assert np.array_equal(r[12:20,12:20],a[12:20,12:20])
assert r[25,20,0]>a[25,20,0]; assert r[25,8,0]<r[25,10,0]
spec['parts'].append(spec['parts'][0])
assert np.array_equal(r,m.apply(a,spec,[32,56]))
# Source edges may already differ from the nearest interior pixel.
a[7,10]=[2,3,4,15]; r=m.apply(a,spec,[32,56]);m.gate(a,r,parts=True)
r[7,10,0]=10
try: m.gate(a,r,parts=True)
except ValueError: pass
else: raise AssertionError('changed unlabelled edge accepted')
`], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
});


it.skipIf(!available)('keeps shading and recolours the edge of a selected part', () => {
  const result = spawnSync(python, ['-B', '-c', `
import importlib.util,numpy as np
from skimage.color import rgb2lab
s=importlib.util.spec_from_file_location('recolor','tools/anim/recolor.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
a=np.zeros((48,48,4),dtype=np.uint8); a[8:40,8:40]=[180,120,90,255]
a[16:24,16:24,:3]=[140,80,50]; a[7,20]=[180,120,90,15]
center=rgb2lab(np.array([[[160,100,70]]])/255.)[0,0].tolist()
spec={'mode':'parts','parts':[{'source':center,'tolerance':[30,20,20],'target':[30,2,3],'zone':[-1,-1,1,1],'lightnessScale':0.5}]}
r=m.apply(a,spec,[24,40]); m.gate(a,r,parts=True)
assert np.array_equal(r[:,:,3],a[:,:,3]); assert np.array_equal(r,m.apply(a,spec,[24,40]))
L=rgb2lab(r[:,:,:3]/255.)[:,:,0]; assert 5 < L[12,12]-L[20,20] < 15
assert np.array_equal(r[7,20,:3],r[8,20,:3]); assert np.array_equal(r[0],a[0])
`], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
});
