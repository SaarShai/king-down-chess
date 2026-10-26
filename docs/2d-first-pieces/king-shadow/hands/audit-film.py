"""Check the final atlas against its painted keys and the FILM flow outputs."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
import tensorflow as tf
ROOT=Path(__file__).resolve().parent
SIZE=192
source=Image.open(ROOT/'painted-poses.png').convert('RGBA')
atlas=np.asarray(Image.open(ROOT/'film-poses.webp').convert('RGBA'))
windows=[(36,348,222),(516,222,626),(876,244,1004),(1276,244,1400),(1666,264,1830)]
def key(side,pose):
 x,w,pivot=windows[pose];row,bottom=(396,779) if side else (4,395)
 im=source.crop((x,row,x+w,bottom)).transform((SIZE,SIZE),Image.Transform.AFFINE,(2.5,0,pivot-x-96/.4,0,2.5,bottom-row-176/.4),Image.Resampling.BICUBIC)
 return np.asarray(im)
def frame(side,i):
 x=i%8*SIZE;y=(side*9+i//8)*SIZE;return atlas[y:y+SIZE,x:x+SIZE]
def warp(image,flow):
 yy,xx=np.mgrid[:SIZE,:SIZE].astype(np.float32);x=np.clip(xx+flow[...,0],0,SIZE-1);y=np.clip(yy+flow[...,1],0,SIZE-1)
 x0=x.astype(int);y0=y.astype(int);x1=np.minimum(x0+1,SIZE-1);y1=np.minimum(y0+1,SIZE-1);dx=(x-x0)[...,None];dy=(y-y0)[...,None]
 return image[y0,x0]*(1-dx)*(1-dy)+image[y0,x1]*dx*(1-dy)+image[y1,x0]*(1-dx)*dy+image[y1,x1]*dx*dy
result={'key_checks':[],'all_gutters_zero':True,'charcoal_opaque_dark_pixels':[],'middle_alpha_vs_plain_crossfade_mean_abs':[]}
for side in range(2):
 for pose in range(5):
  expected=key(side,pose);actual=frame(side,pose*16);visible=expected[...,3]>0
  delta=int(np.max(np.abs(actual.astype(int)-expected.astype(int))[visible]));assert delta==0
  result['key_checks'].append({'side':side,'key':pose,'max_visible_rgba_delta':delta})
 for i in range(65):
  im=frame(side,i);a=im[...,3]
  assert not a[:4].any() and not a[-4:].any() and not a[:,:4].any() and not a[:,-4:].any()
  if side:result['charcoal_opaque_dark_pixels'].append(int(((a>=230)&(im[...,:3].mean(-1)<60)).sum()))
 for gap in range(4):
  a=frame(side,gap*16)[...,3].astype(float);b=frame(side,(gap+1)*16)[...,3].astype(float);mid=frame(side,gap*16+8)[...,3].astype(float)
  delta=float(np.mean(np.abs(mid-(a+b)*.5))/255);assert delta>.003
  result['middle_alpha_vs_plain_crossfade_mean_abs'].append(delta)
assert min(result['charcoal_opaque_dark_pixels'])>500
# Check both model warp outputs on the exact normalized charcoal open/reach inputs.
tf.config.threading.set_intra_op_parallelism_threads(2)
tf.config.threading.set_inter_op_parallelism_threads(2)
model=tf.saved_model.load('/tmp/kingdown-film/weights/film-1')
a=key(1,0).astype(np.float32)/255;b=key(1,1).astype(np.float32)/255
rgb0=a[...,:3]*a[...,3:]+.5*(1-a[...,3:]);rgb1=b[...,:3]*b[...,3:]+.5*(1-b[...,3:])
r=model({'x0':tf.convert_to_tensor(rgb0[None]),'x1':tf.convert_to_tensor(rgb1[None]),'time':tf.constant([[.5]],tf.float32)},training=False)
result['warp_max_abs']={
 'x0':float(np.max(np.abs(warp(rgb0,r['backward_flow_pyramid'][0].numpy()[0]*.5)-r['x0_warped'].numpy()[0]))),
 'x1':float(np.max(np.abs(warp(rgb1,r['forward_flow_pyramid'][0].numpy()[0]*.5)-r['x1_warped'].numpy()[0])))}
assert max(result['warp_max_abs'].values())<.0001
result['charcoal_opaque_dark_min']=min(result.pop('charcoal_opaque_dark_pixels'))
result['status']='passed'
(ROOT/'film-audit.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
