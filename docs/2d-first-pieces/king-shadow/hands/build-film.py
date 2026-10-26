"""Build the Shadow hand atlas with the owner's local FILM SavedModel runtime."""
import hashlib
import json
import time
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
import tensorflow as tf

tf.config.threading.set_intra_op_parallelism_threads(2)
tf.config.threading.set_inter_op_parallelism_threads(2)
ROOT = Path(__file__).resolve().parent
MODEL = Path('/tmp/kingdown-film/weights/film-1')
SIZE, SCALE, PIVOT, STEPS, COLS = 192, .4, (96, 176), 16, 8
WINDOWS = [(36,348,222),(516,222,626),(876,244,1004),(1276,244,1400),(1666,264,1830)]
BG = np.float32(.5)
started = time.time()
model = tf.saved_model.load(str(MODEL))
source = Image.open(ROOT/'painted-poses.png').convert('RGBA')
metrics = {'model': str(MODEL), 'source_sha256': hashlib.sha256((ROOT/'painted-poses.png').read_bytes()).hexdigest(), 'size': SIZE, 'pivot': PIVOT, 'intervals_per_gap': STEPS, 'inferences': 0, 'warp_check_max': 0., 'alpha_method': 'Original alpha backward-warped with FILM backward_flow_pyramid[0]/2 and forward_flow_pyramid[0]/2; averaged only after alignment. FILM synthesized neutral-matte RGB is uncomposited with the transported alpha. No chromakey.'}

def key(side, pose):
    x,w,pivot = WINDOWS[pose]
    row,bottom = (396,779) if side else (4,395)
    crop = source.crop((x,row,x+w,bottom))
    im = crop.transform((SIZE,SIZE), Image.Transform.AFFINE, (1/SCALE,0,pivot-x-PIVOT[0]/SCALE,0,1/SCALE,bottom-row-PIVOT[1]/SCALE), Image.Resampling.BICUBIC)
    return np.asarray(im,dtype=np.float32)/255

def warp(image, flow):
    # FILM util.warp reads the source at (y+dy,x+dx), with clamped bilinear lookup.
    yy,xx = np.mgrid[:SIZE,:SIZE].astype(np.float32)
    x = np.clip(xx+flow[...,0],0,SIZE-1);y = np.clip(yy+flow[...,1],0,SIZE-1)
    x0=x.astype(np.int32);y0=y.astype(np.int32);x1=np.minimum(x0+1,SIZE-1);y1=np.minimum(y0+1,SIZE-1)
    dx=(x-x0)[...,None];dy=(y-y0)[...,None]
    return (image[y0,x0]*(1-dx)*(1-dy)+image[y0,x1]*dx*(1-dy)+image[y1,x0]*(1-dx)*dy+image[y1,x1]*dx*dy).astype(np.float32)

def middle(a,b):
    rgb0=a[...,:3]*a[...,3:]+BG*(1-a[...,3:]);rgb1=b[...,:3]*b[...,3:]+BG*(1-b[...,3:])
    r=model({'x0':tf.convert_to_tensor(rgb0[None]),'x1':tf.convert_to_tensor(rgb1[None]),'time':tf.constant([[.5]],tf.float32)},training=False)
    back=r['backward_flow_pyramid'][0].numpy()[0]*.5
    forward=r['forward_flow_pyramid'][0].numpy()[0]*.5
    check=float(np.max(np.abs(warp(rgb0,back)-r['x0_warped'].numpy()[0])))
    metrics['warp_check_max']=max(metrics['warp_check_max'],check)
    assert check<.0001, f'FILM warp convention mismatch: {check}'
    alpha=np.clip((warp(a[...,3:],back)+warp(b[...,3:],forward))*.5,0,1)
    alpha[alpha<1/255]=0
    rgb=np.clip((r['image'].numpy()[0]-BG*(1-alpha))/np.maximum(alpha,1/255),0,1)
    rgb[alpha[...,0]==0]=0
    metrics['inferences']+=1
    return np.concatenate([rgb,alpha],axis=-1).astype(np.float32)

def segment(a,b,depth):
    if depth==0:return [a,b]
    mid=middle(a,b)
    return segment(a,mid,depth-1)[:-1]+segment(mid,b,depth-1)

all_frames=[]
for side in range(2):
    keys=[key(side,p) for p in range(5)]
    frames=[]
    for gap in range(4):
        frames.extend(segment(keys[gap],keys[gap+1],4)[:-1])
        print(json.dumps({'side':side,'gap_done':gap,'inferences':metrics['inferences'],'seconds':round(time.time()-started,2)}),flush=True)
    frames.append(keys[-1]);all_frames.append(frames)

count=len(all_frames[0]);rows=(count+COLS-1)//COLS
atlas=Image.new('RGBA',(COLS*SIZE,rows*SIZE*2))
checks=[]
for side,frames in enumerate(all_frames):
    centers=[]
    for i,rgba in enumerate(frames):
        im=Image.fromarray(np.uint8(np.round(np.clip(rgba,0,1)*255)),'RGBA')
        atlas.paste(im,((i%COLS)*SIZE,(side*rows+i//COLS)*SIZE))
        a=rgba[...,3];band=a[165:177];mass=band.sum()
        centers.append(float((band*np.arange(SIZE)[None]).sum()/mass))
        assert not a[:4].any() and not a[-4:].any() and not a[:,:4].any() and not a[:,-4:].any(), 'Nontransparent gutter'
    checks.append({'side':side,'frames':len(frames),'wrist_x_min':min(centers),'wrist_x_max':max(centers),'zero_alpha_gutter':True,'max_adjacent_alpha_delta':max(float(np.mean(np.abs(frames[i+1][...,3]-frames[i][...,3]))) for i in range(count-1))})
atlas.save(ROOT/'film-poses.webp',lossless=True,method=4)
# A visual alpha check over both stone colours; it includes all keys and their middle frames.
contact=Image.new('RGB',(9*SIZE,2*SIZE),(225,213,181))
for side in range(2):
    for col,i in enumerate(range(0,count,8)):
        x=col*SIZE;y=side*SIZE
        ImageDraw.Draw(contact).rectangle((x,y,x+SIZE,y+SIZE),fill=(225,213,181) if col%2==0 else (87,61,42))
        im=Image.fromarray(np.uint8(np.round(np.clip(all_frames[side][i],0,1)*255)),'RGBA')
        contact.paste(im,(x,y),im)
contact.save(ROOT/'film-alpha-review.png')
metrics.update({'frames_per_army':count,'atlas_columns':COLS,'atlas_rows_per_army':rows,'checks':checks,'seconds':round(time.time()-started,2),'output_sha256':hashlib.sha256((ROOT/'film-poses.webp').read_bytes()).hexdigest(),'status':'complete'})
(ROOT/'film-build.json').write_text(json.dumps(metrics,indent=2)+'\n')
print(json.dumps(metrics),flush=True)
