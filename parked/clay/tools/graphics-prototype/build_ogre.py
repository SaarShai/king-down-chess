"""Rig the approved reconstruction without changing any sculpt/UV coordinates.
Run: blender --background --python tools/graphics-prototype/build_ogre.py
Recipe coordinates are X across, Y up, Z forward, in the source's unit space.
"""
import bpy, math, json, hashlib, struct
from pathlib import Path
from mathutils import Vector, Quaternion
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT/'docs/graphics-prototype/ogre-reconstruction/clay-refinement/ogre-repaired.glb'
OUT = ROOT/'public/prototype/models'
REPORT = ROOT/'docs/graphics-prototype/ogre-integration'
REPORT.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
obj = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
obj.name = 'Approved Ogre'
original = [v.co.copy() for v in obj.data.vertices]
def vec(p): return Vector((p[0], -p[2], p[1]))
def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a))); return t*t*(3-2*t)
def select(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
points={'body':((0,-.22,0),(0,.20,0)), 'head':((0,.28,.015),(0,.43,.04))}
for s,side in [(-1,'L'),(1,'R')]:
    points.update({
      'thigh.'+side:((s*.155,-.265,-.025),(s*.170,-.355,.018)),
      'shin.'+side:((s*.170,-.355,.018),(s*.180,-.435,-.002)),
      'foot.'+side:((s*.180,-.435,-.002),(s*.180,-.435,.13)),
      'arm.'+side:((s*.265,.215,-.008),(s*.354,.070,.015)),
      'forearm.'+side:((s*.354,.070,.015),(s*.416,-.087,.085)),
      'hand.'+side:((s*.416,-.087,.085),(s*.420,-.210,.12))})
data=bpy.data.armatures.new('Ogre skeleton');rig=bpy.data.objects.new('Ogre rig',data);bpy.context.collection.objects.link(rig)
select([rig]);bpy.ops.object.mode_set(mode='EDIT')
for name,(a,b) in points.items():
    bone=data.edit_bones.new(name);bone.head=vec(a);bone.tail=vec(b)
bpy.ops.object.mode_set(mode='OBJECT')
groups={name:obj.vertex_groups.new(name=name) for name in points}
# Analytic weights are identical across UV/material seams. The whole hand stays
# rigid, including both repaired fingers. Broad transitions avoid joint pinching.
for v in obj.data.vertices:
    x,h=v.co.x,v.co.z;side='L' if x<0 else 'R'
    up=smooth(-.02,.15,h)
    low=1-smooth(-.30,-.23,h)
    arm=smooth(.27+.055*low-.03*up,.315+.04*low+.030*up,abs(x))*(1-smooth(.26,.34,h))*smooth(-.36,-.30,h)
    leg=(1-smooth(-.38,-.29,h))*(1-arm)*smooth(.035,.12,abs(x))
    head=smooth(.255,.315,h)*(1-arm)
    hand=1-smooth(-.04,.075,h);upper=smooth(.05,.18,h)
    foot=1-smooth(-.425,-.37,h);thigh=smooth(-.38,-.29,h)
    weights={'body':max(0,1-arm-leg-head),'head':head,
      'arm.'+side:arm*(1-hand)*upper,'forearm.'+side:arm*(1-hand)*(1-upper),'hand.'+side:arm*hand,
      'foot.'+side:leg*foot,'shin.'+side:leg*(1-foot)*(1-thigh),'thigh.'+side:leg*(1-foot)*thigh}
    # GLTF supports four weights. Keep the largest and normalize (normally 1–3).
    weights=sorted(weights.items(),key=lambda a:a[1],reverse=True)[:4];total=sum(w for _,w in weights)
    for name,w in weights:
        if w>0:groups[name].add([v.index],w/total,'REPLACE')
obj.parent=rig;mod=obj.modifiers.new('Ogre joints','ARMATURE');mod.object=rig
rest={name:data.bones[name].matrix_local.copy() for name in points}
def transform(name,q=Quaternion(),pivot=None,shift=Vector()):
    pivot=vec(points[name][0]) if pivot is None else pivot
    m=q.to_matrix().to_4x4();m.translation=pivot-q@pivot+shift
    rig.pose.bones[name].matrix=m@rest[name]
def segment(name,start,end):
    a,b=map(vec,points[name]);transform(name,(b-a).rotation_difference(end-start),a,start-a)
scene=bpy.context.scene;scene.render.fps=30
for clip,frames in [('Walk',60),('Shove',48)]:
    rig.animation_data_create();rig.animation_data.action=None;scene.frame_start=1;scene.frame_end=frames+1
    for f in range(frames+1):
        t=f/frames;a=t*math.tau
        shift=vec((math.sin(a)*.002,-.002*math.sin(a)**2,0)) if clip=='Walk' else vec((0,-.004*math.sin(math.pi*t)**2,.032*math.sin(math.pi*t)**2))
        transform('body',shift=shift);transform('head',shift=shift)
        for i,side in enumerate(['L','R']):
            hip=vec(points['thigh.'+side][0])+shift;ankle=vec(points['foot.'+side][0]);offset=Vector()
            if clip=='Walk':
                phase=(t+i*.5)%1
                if phase<.62:forward=.031*(1-2*phase/.62);lift=0
                else:u=(phase-.62)/.38;forward=.031*(-1+2*smooth(0,1,u));lift=.022*math.sin(math.pi*u)**2
                offset=vec((0,lift,forward))
            # Short, chunky legs translate below a broad hip blend. This preserves
            # the knee volume rather than folding a reconstructed crease.
            for part in ['thigh.','shin.','foot.']:transform(part+side,shift=offset)
            shoulder=vec(points['arm.'+side][0]);elbow=vec(points['arm.'+side][1]);wrist=vec(points['hand.'+side][0])
            if clip=='Walk':
                q=Quaternion((1,0,0),.055*math.cos(a+i*math.pi));el=shoulder+q@(elbow-shoulder)+shift;wr=shoulder+q@(wrist-shoulder)+shift
                segment('arm.'+side,shoulder+shift,el);segment('forearm.'+side,el,wr);transform('hand.'+side,q,wrist,wr-wrist)
            else:
                rise=smooth(.06,.30,t)*(1-smooth(.72,1,t));push=smooth(.30,.47,t)*(1-smooth(.58,.78,t))
                q=Quaternion((1,0,0),-.12*rise)
                advance=shift+vec((0,.006*rise,.014*push))
                # Move the massive arm as one clay form. Keep the elbow crease
                # and repaired hand intact; the shoulder blend takes the motion.
                for part in ['arm.','forearm.','hand.']:
                    transform(part+side,q,shoulder,advance)
        for b in rig.pose.bones:
            b.rotation_mode='QUATERNION'
            for channel in ['location','rotation_quaternion','scale']:b.keyframe_insert(data_path=channel,frame=f+1,group=b.name)
    action=rig.animation_data.action;action.name=clip;action.use_fake_user=True
    track=rig.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action);track.mute=True
    rig.animation_data.action=None
scene.frame_start=1;scene.frame_end=61;scene.frame_set(1)
for b in rig.pose.bones:b.matrix_basis.identity()
# Normalize on a parent only. Bind-space positions/UVs retain the approved material's coordinates.
root=bpy.data.objects.new('Ogre board scale',None);bpy.context.collection.objects.link(root)
floor=-min(v.co.z for v in obj.data.vertices)*1.3
rig.parent=root
assert max((a-v.co).length for a,v in zip(original,obj.data.vertices))==0
select([root,rig,obj]);dest=OUT/'rebuilt-ogre.glb'
bpy.ops.export_scene.gltf(filepath=str(dest),use_selection=True,export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_anim_slide_to_zero=True,export_cameras=False,export_lights=False)
# Blender bakes skinned mesh parent transforms into vertex coordinates. Put the
# board transform into the exported scene only after writing the raw rig.
blob=dest.read_bytes();length=struct.unpack_from('<I',blob,12)[0]
gltf=json.loads(blob[20:20+length]);tail=blob[20+length:]
node=next(n for n in gltf['nodes'] if n.get('name')=='Ogre board scale')
node['scale']=[1.3]*3;node['translation']=[0,floor,0]
payload=json.dumps(gltf,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4)
dest.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(payload)+len(tail))+struct.pack('<I4s',len(payload),b'JSON')+payload+tail)
root.scale=(1.3,)*3;root.location.z=floor
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/graphics-prototype/ogre.blend'))
report={'name':'rebuilt-ogre','source':'Owner-approved repaired TRELLIS reconstruction','sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'triangles':len(obj.data.polygons),'bytes':dest.stat().st_size,'bones':len(points),'clips':['Walk','Shove'],'feature':'Original raised cuffs, per-texel terracotta clay','sourceVertexDisplacement':0,'height':1.3*(max(v.co.z for v in obj.data.vertices)-min(v.co.z for v in obj.data.vertices))}
(REPORT/'build.json').write_text(json.dumps(report,indent=2)+'\n')
path=OUT/'manifest.json';manifest=json.loads(path.read_text());manifest['models']=[m for m in manifest['models'] if m['name']!='rebuilt-ogre']+[report];path.write_text(json.dumps(manifest,indent=2)+'\n')
print('OGRE_REPORT',json.dumps(report),flush=True)
