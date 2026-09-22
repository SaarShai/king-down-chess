"""Editable Shover sculpt and baked Walk/Shove clips. Run with Blender --background --python.

Recipe coordinates: X across, Y up, Z forward. Authored parts determine weights;
the hand pads and face cannot be accidentally assigned to nearby legs.
"""
import bpy, math, json, sys, struct
from pathlib import Path
from mathutils import Vector, Quaternion
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from rig_walk import smooth
from sculpt_surface import bake_creases
from clay_layer import add_clay_layer

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0
out = ROOT/'public/prototype/models'
parts = []
materials = {}
for name, color in [('army', (.72,.59,.38,1)), ('accent1', (.66,.27,.12,1))]:
    m = bpy.data.materials.new(name); m.diffuse_color = color; m.use_nodes = True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = color
    m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .92
    materials[name] = m

def vec(p): return Vector((p[0], -p[2], p[1]))
def select(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects: o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
def orb(name, p, size, role='army', group='body', shade=1, tilt=0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=1, location=vec(p))
    o=bpy.context.object; o.name=name; o.scale=(size[0],size[2],size[1]); o.rotation_euler.y=tilt
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    o.data.materials.append(materials[role]); o['region']=group; o['shade']=shade; parts.append(o)
    return o
def capsule(name,a,b,radii,group):
    a,b=vec(a),vec(b)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=1,location=(a+b)*.5)
    o=bpy.context.object;o.name=name;o.scale=(radii[0],radii[1],(b-a).length*.5+radii[2]);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    o.data.materials.append(materials['army']);o['region']=group;o['shade']=1;parts.append(o);return o
def fuse(objects,name,voxel=.016):
    select(objects);bpy.ops.object.join();o=bpy.context.object;o.name=name
    for old in objects[1:]: parts.remove(old)
    mod=o.modifiers.new('Joined hand-pressed clay masses','REMESH');mod.mode='VOXEL';mod.voxel_size=voxel;mod.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Soften clay joins','SMOOTH');mod.factor=.7;mod.iterations=5;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Round the broad planes','SUBSURF');mod.levels=1;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Sculpt density','DECIMATE');mod.ratio=.48;bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

# A pear-shaped torso: broad belly, sloping shoulders, small head. No armour dome.
torso=[orb('Belly',(0,.75,.075),(.385,.345,.27)),orb('Chest',(0,1.005,0),(.385,.235,.225)),orb('Neck',(0,1.15,.01),(.19,.17,.16))]
fuse(torso,'Torso clay',.018)
head=[orb('Skull',(0,1.295,.055),(.191,.195,.169),'army','head'),orb('Heavy lower jaw',(0,1.18,.158),(.185,.111,.132),'army','head'),orb('Left cheek',(-.127,1.27,.151),(.078,.082,.069),'army','head'),orb('Right cheek',(.127,1.27,.151),(.078,.082,.069),'army','head')]
fuse(head,'Heavy jaw and small head',.009)
orb('Upper muzzle',(0,1.255,.223),(.115,.048,.054),'army','head')
orb('Lower lip',(0,1.223,.254),(.118,.024,.030),'army','head')
orb('Mouth crease',(0,1.24,.266),(.105,.008,.009),'army','head',.36)
orb('Blunt nose',(0,1.31,.246),(.074,.044,.043),'army','head')
for s,side in [(-1,'L'),(1,'R')]:
    orb('Ear '+side,(s*.199,1.314,.016),(.055,.073,.047),'army','head')
    orb('Ear hollow '+side,(s*.217,1.316,.05),(.026,.039,.016),'army','head',.5)
    orb('Eye recess '+side,(s*.080,1.347,.216),(.054,.021,.022),'army','head',.35)
    orb('Eye '+side,(s*.081,1.344,.237),(.016,.013,.007),'army','head',.25)
    orb('Wedge brow '+side,(s*.078,1.377,.19),(.091,.031,.049),'army','head',1,-s*.19)
    orb('Nostril '+side,(s*.035,1.297,.275),(.017,.009,.006),'army','head',.4)
    # Tiny blunt tusks stay in the army clay, not an extra identifying colour.
    capsule('Tusk '+side,(s*.116,1.226,.247),(s*.106,1.267,.26),(.014,.014,.010),'head')
    leg='leg.'+side; arm='limb.'+side; hand='hand.'+side
    limb=[capsule('Thigh '+side,(s*.155,.48,0),(s*.185,.285,.065),(.121,.121,.048),leg),capsule('Calf '+side,(s*.185,.30,.065),(s*.19,.12,.035),(.096,.098,.038),leg)]
    fuse(limb,'Leg clay '+side,.010)
    foot=orb('Foot '+side,(s*.19,.069,.09),(.122,.069,.164),'army','foot.'+side)
    # Broad planted sole, rather than an ellipsoid balancing on one vertex.
    for v in foot.data.vertices: v.co.z=max(.008,v.co.z-.008)
    for j in range(3):orb('Toe '+side+str(j),(s*.19+(j-1)*.062,.047,.223),(.035,.036,.040),'army','foot.'+side)
    arm_parts=[capsule('Upper arm '+side,(s*.29,1.036,0),(s*.45,.79,.015),(.137,.14,.058),arm),capsule('Forearm '+side,(s*.45,.80,.015),(s*.49,.59,.095),(.12,.12,.05),arm)]
    fuse(arm_parts,'Arm clay '+side,.014)
    palm=[orb('Shovel palm '+side,(s*.50,.503,.13),(.117,.139,.09),'army',hand)]
    for j in range(3):palm.append(orb('Blunt finger '+side+str(j),(s*.50+(j-1)*.065,.405,.146),(.041,.075,.07),'army',hand))
    palm.append(orb('Thumb '+side,(s*.396,.497,.179),(.052,.074,.058),'army',hand,1,-s*.33))
    fuse(palm,'Four digit hand '+side,.008)
    orb('Palm pushing pad '+side,(s*.515,.50,.211),(.104,.105,.026),'accent1',hand)
    orb('Pad outer wrap '+side,(s*.601,.512,.132),(.025,.099,.071),'accent1',hand)
    orb('Pad back edge '+side,(s*.555,.532,.053),(.059,.069,.018),'accent1',hand)

# Short thick clay tunic, with a distinct hem well above the moving knees.
vs=[];fs=[];n=64
for h,rx,rz in [(.40,.286,.196),(.425,.315,.212),(.53,.30,.216),(.575,.271,.201)]:
    for i in range(n):
        a=i*2*math.pi/n;vs.append((rx*math.cos(a),-rz*math.sin(a),h+.008*math.sin(a*3)))
for row in range(3):
    for i in range(n): j=(i+1)%n;fs.append((row*n+i,row*n+j,(row+1)*n+j,(row+1)*n+i))
fs.extend([tuple(reversed(range(n))),tuple(range(3*n,4*n))])
me=bpy.data.meshes.new('Short tunic');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Short tunic',me);bpy.context.collection.objects.link(o);o.data.materials.append(materials['army']);o['region']='body';o['shade']=.9;parts.append(o)
select([o]);mod=o.modifiers.new('Rounded hem','BEVEL');mod.width=.016;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
orb('Folded waist roll',(0,.57,.025),(.294,.027,.219))
orb('Tunic knot',(0,.525,.224),(.043,.05,.028))

# Independent deform bones allow planted feet to ignore torso follow-through.
points={'body':((0,.49,0),(0,.92,0)),'head':((0,1.12,0),(0,1.39,.06))}
for s,side in [(-1,'L'),(1,'R')]:
    points.update({'thigh.'+side:((s*.155,.46,0),(s*.185,.285,.065)), 'shin.'+side:((s*.185,.285,.065),(s*.19,.115,.035)), 'foot.'+side:((s*.19,.115,.035),(s*.19,.115,.19)), 'arm.'+side:((s*.29,1.036,0),(s*.45,.79,.015)), 'forearm.'+side:((s*.45,.79,.015),(s*.49,.59,.095)), 'hand.'+side:((s*.49,.59,.095),(s*.50,.42,.14))})
data=bpy.data.armatures.new('Ogre skeleton');rig=bpy.data.objects.new('Ogre rig',data);bpy.context.collection.objects.link(rig)
select([rig]);bpy.ops.object.mode_set(mode='EDIT')
for name,(a,b) in points.items():
    bone=data.edit_bones.new(name);bone.head=vec(a);bone.tail=vec(b)
bpy.ops.object.mode_set(mode='OBJECT')
for o in parts:
    region=o['region'];groups={name:o.vertex_groups.new(name=name) for name in points}
    for v in o.data.vertices:
        h=v.co.z;w={region:1}
        if region.startswith('leg.'):
            side=region[-1];foot=1-smooth(.09,.22,h);thigh=smooth(.19,.39,h)
            w={'foot.'+side:foot,'shin.'+side:(1-foot)*(1-thigh),'thigh.'+side:(1-foot)*thigh}
        elif region.startswith('limb.'):
            side=region[-1];hand=1-smooth(.53,.75,h);upper=smooth(.73,.88,h);body=smooth(1.015,1.13,h)
            w={'hand.'+side:hand,'forearm.'+side:(1-hand)*(1-upper),'arm.'+side:(1-hand)*upper*(1-body),'body':(1-hand)*upper*body}
        for name,weight in w.items():
            if weight>0:groups[name].add([v.index],weight,'REPLACE')
    for p in o.data.polygons:p.use_smooth=True
    # Face recesses are neutral baked shading, so both armies keep one body colour.
    shade=o['shade'];attr=o.data.color_attributes.new(name='Crease shading',type='FLOAT_COLOR',domain='CORNER')
    for c in attr.data:c.color=(shade,shade,shade,1)
    o.data.color_attributes.active_color=attr
select(parts);bpy.ops.object.join();obj=bpy.context.object;obj.name='Ogre sculpt'
obj.data.calc_loop_triangles()
mod=obj.modifiers.new('Close-up sculpt budget','DECIMATE');mod.ratio=min(1,28000/len(obj.data.loop_triangles));bpy.ops.object.modifier_apply(modifier=mod.name)
before=[tuple(c.color) for c in obj.data.color_attributes.active_color.data]
obj.data.color_attributes.remove(obj.data.color_attributes.active_color)
bake_creases(obj.data,.055)
for c,prior in zip(obj.data.color_attributes.active_color.data,before):c.color=tuple(c.color[k]*prior[k] for k in range(4))
add_clay_layer(obj,1.49)
obj.parent=rig;mod=obj.modifiers.new('Authored Ogre joints','ARMATURE');mod.object=rig
rest={name:data.bones[name].matrix_local.copy() for name in points}
def transform(name,q=Quaternion(),pivot=None,shift=Vector()):
    pivot=vec(points[name][0]) if pivot is None else pivot
    m=q.to_matrix().to_4x4();m.translation=pivot-q@pivot+shift
    rig.pose.bones[name].matrix=m@rest[name]
def segment(name,start,end):
    a,b=map(vec,points[name]);transform(name,(b-a).rotation_difference(end-start),a,start-a)
def solve(name,hip,ankle):
    a,k=map(vec,points['thigh.'+name]);_,b=map(vec,points['shin.'+name]);l1=(k-a).length;l2=(b-k).length
    d=ankle-hip;length=min(d.length,l1+l2-.0001);direction=d.normalized();along=(l1*l1-l2*l2+length*length)/(2*length)
    bend=Vector((0,-1,0));bend=(bend-direction*bend.dot(direction)).normalized();knee=hip+direction*along+bend*math.sqrt(max(0,l1*l1-along*along))
    segment('thigh.'+name,hip,knee);segment('shin.'+name,knee,ankle)
scene=bpy.context.scene;scene.render.fps=30
for clip,frames in [('Walk',54),('Shove',48)]:
    rig.animation_data_create();rig.animation_data.action=None;scene.frame_start=1;scene.frame_end=frames+1
    for f in range(frames+1):
        t=f/frames;a=t*math.tau
        shift=vec((math.sin(a)*.006,-.005+.003*(1-math.cos(a*2)),0)) if clip=='Walk' else vec((0,-.012*math.sin(math.pi*t)**2,.045*math.sin(math.pi*t)**2))
        transform('body',shift=shift);transform('head',Quaternion((0,0,1),.018*math.sin(a-.35)) if clip=='Walk' else Quaternion(),shift=shift)
        for i,side in enumerate(['L','R']):
            hip=vec(points['thigh.'+side][0])+shift;ankle=vec(points['foot.'+side][0]);offset=Vector()
            if clip=='Walk':
                phase=(t+i*.5)%1
                if phase<.64:forward=.065*(1-2*phase/.64);lift=0
                else:u=(phase-.64)/.36;forward=.065*(-1+2*smooth(0,1,u));lift=.035*math.sin(math.pi*u)**2
                offset=vec((0,lift,forward))
            solve(side,hip,ankle+offset);transform('foot.'+side,shift=offset)
            shoulder=vec(points['arm.'+side][0]);elbow=vec(points['arm.'+side][1]);wrist=vec(points['hand.'+side][0])
            if clip=='Walk':
                q=Quaternion((1,0,0),.12*math.cos(a+i*math.pi));el=shoulder+q@(elbow-shoulder)+shift;wr=shoulder+q@(wrist-shoulder)+shift
                segment('arm.'+side,shoulder+shift,el);segment('forearm.'+side,el,wr);transform('hand.'+side,q,wrist,wr-wrist)
            else:
                # Brace, lift open palms, extend, then settle exactly back to rest.
                rise=smooth(.08,.28,t)*(1-smooth(.76,1,t));push=smooth(.30,.48,t)*(1-smooth(.61,.83,t))
                q=Quaternion((1,0,0),-1.17*rise)
                wr=shoulder+q@(wrist-shoulder)+shift+vec((0,.020*rise,.035*push))
                start=shoulder+shift;delta=wr-start;l1=(elbow-shoulder).length;l2=(wrist-elbow).length;length=min(delta.length,(l1+l2)*.995);direction=delta.normalized();wr=start+direction*length
                along=(l1*l1-l2*l2+length*length)/(2*length);bend=q@(elbow-shoulder);bend=(bend-direction*bend.dot(direction)).normalized();el=start+direction*along+bend*math.sqrt(max(0,l1*l1-along*along))
                segment('arm.'+side,shoulder+shift,el);segment('forearm.'+side,el,wr)
                transform('hand.'+side,Quaternion((1,0,0),-.65*rise),wrist,wr-wrist)
        for b in rig.pose.bones:
            b.rotation_mode='QUATERNION'
            for channel in ['location','rotation_quaternion','scale']:b.keyframe_insert(data_path=channel,frame=f+1,group=b.name)
    action=rig.animation_data.action;action.name=clip;action.use_fake_user=True
    track=rig.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action);track.mute=True
    rig.animation_data.action=None
scene.frame_start=1;scene.frame_end=55;scene.frame_set(1)
for b in rig.pose.bones:b.matrix_basis.identity()
select([rig,obj])
destination=out/'rebuilt-ogre.glb'
bpy.ops.export_scene.gltf(filepath=str(destination),use_selection=True,export_format='GLB',export_animations=True,export_morph_animation=False,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_anim_slide_to_zero=True,export_cameras=False,export_lights=False,export_vertex_color='ACTIVE')
# Canonical roles are the same two-material contract as the source-derived cast.
blob=destination.read_bytes();length=struct.unpack_from('<I',blob,12)[0];g=json.loads(blob[20:20+length]);tail=blob[20+length:]
for m in g['materials']:m['name']=m['name'].split('.')[0]
payload=json.dumps(g,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4)
destination.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(payload)+len(tail))+struct.pack('<I4s',len(payload),b'JSON')+payload+tail)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/graphics-prototype/ogre.blend'))
obj.data.calc_loop_triangles();report={'name':'rebuilt-ogre','source':'Authored from approved Shover concept','triangles':len(obj.data.loop_triangles),'bytes':destination.stat().st_size,'bones':len(points),'clips':[a['name'] for a in g.get('animations',[])],'feature':'Separate rounded terracotta palm pads','height':max(v.co.z for v in obj.data.vertices)}
assert set(report['clips'])=={'Walk','Shove'},report
path=out/'manifest.json';manifest=json.loads(path.read_text());manifest['models']=[m for m in manifest['models'] if m['name']!='rebuilt-ogre']+[report];path.write_text(json.dumps(manifest,indent=2)+'\n')
print('OGRE_REPORT',json.dumps(report),flush=True)
