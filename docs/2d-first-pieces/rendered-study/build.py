"""Whole-character still using MakeHuman's authored mesh, skeleton and skin weights.
Blender --background --python build.py. Core MakeHuman assets are CC0.
"""
import bpy,bmesh,math,json
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
OUT=Path(__file__).resolve().parent;SRC=OUT/'source'
V=Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.context.preferences.filepaths.save_version=0
raw=[];faces=[];group=''
for line in (SRC/'human-base.obj').read_text().splitlines():
 a=line.split()
 if not a:continue
 if a[0]=='v':raw.append(V(tuple(map(float,a[1:4]))))
 elif a[0]=='g':group=a[1]
 elif a[0]=='f' and group=='body':faces.append([int(t.split('/')[0])-1 for t in a[1:]])
for name in ['female.target','build.target']:
 for line in (SRC/name).read_text().splitlines():
  a=line.split()
  if len(a)==4 and a[0].isdigit():raw[int(a[0])]+=V(tuple(map(float,a[1:])))
used={i for f in faces for i in f};low=min(raw[i].y for i in used);high=max(raw[i].y for i in used);scale=1.5/(high-low)
verts=[V((p.x*scale,p.z*scale,(p.y-low)*scale)) for p in raw]
skeleton=json.loads((SRC/'default.mhskel').read_text());weights=json.loads((SRC/'default_weights.mhw').read_text())['weights']
joints={name:sum((verts[i] for i in ids),V())/len(ids) for name,ids in skeleton['joints'].items()}
# Use the supplied skin weights to identify anatomy, not broad spatial arm masks.
arm_strength=[0.]*len(verts)
for name,entries in weights.items():
 if any(k in name for k in ['upperarm','lowerarm','wrist','finger','metacarpal']):
  for i,w in entries:arm_strength[i]+=w
# Y/Z exchange changes handedness, so reverse winding.
body_faces=faces
# Cull only costume-covered torso/legs; arm and finger weights preserve complete hands.
faces=[list(reversed(f)) for f in faces if max(verts[i].z for i in f)>1.135 or sum(arm_strength[i] for i in f)/len(f)>.12]
me=bpy.data.meshes.new('MakeHuman female anatomy');me.from_pydata(verts,[],faces);me.update();human=bpy.data.objects.new('Archer anatomy • MakeHuman CC0',me);bpy.context.collection.objects.link(human)
palette={'ivory':(.69,.62,.47,1),'leather':(.115,.047,.021,1),'skin':(.55,.31,.175,1),'copper':(.25,.060,.018,1),'green':(.16,.24,.040,1),'metal':(.32,.37,.38,1),'gold':(.47,.27,.065,1),'ink':(.008,.004,.002,1),'eye':(.72,.70,.57,1)}
mats={}
for name,col in palette.items():
 m=bpy.data.materials.new(name);m.diffuse_color=col;m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=col;bs.inputs['Roughness'].default_value=.91;bs.inputs['Specular IOR Level'].default_value=.12
 noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=110;noise.inputs['Detail'].default_value=2
 ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=tuple(c*.91 for c in col[:3])+(1,);ramp.color_ramp.elements[1].color=col;l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],bs.inputs['Base Color']);mats[name]=m
for mat in mats.values():me.materials.append(mat)
roles=list(mats)
for p in me.polygons:
 q=p.center;arm=sum(arm_strength[i] for i in p.vertices)/len(p.vertices);role='skin'
 if q.z<.24:role='leather'
 # A fitted leather guard is assigned by the forearm's authored weights.
 if any(sum(dict(weights.get('lowerarm02.'+side,[])).get(i,0) for i in p.vertices)/len(p.vertices)>.25 for side in ['L','R']):role='leather'
 p.material_index=roles.index(role);p.use_smooth=True
# Import the actual joint locations, hierarchy and all authored vertex weights.
data=bpy.data.armatures.new('MakeHuman authored skeleton');rig=bpy.data.objects.new('Archer skeleton',data);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,b in skeleton['bones'].items():
 bone=data.edit_bones.new(name);bone.head=joints[b['head']];bone.tail=joints[b['tail']]
for name,b in skeleton['bones'].items():
 if b['parent']:data.edit_bones[name].parent=data.edit_bones[b['parent']]
bpy.ops.object.mode_set(mode='OBJECT')
for name,entries in weights.items():
 g=human.vertex_groups.new(name=name)
 for i,w in entries:g.add([i],w,'REPLACE')
mod=human.modifiers.new('Authored skin weights','ARMATURE');mod.object=rig;mod.use_deform_preserve_volume=True;human.parent=rig
sub=human.modifiers.new('Surface subdivision','SUBSURF');sub.levels=1;sub.render_levels=1
rest={n:b.matrix_local.copy() for n,b in data.bones.items()}
def affine(rot,old,new):
 m=rot.to_4x4();m.translation=new-rot@old;return m
def pose_segment(name,start,end):
 b=data.bones[name];r=(b.tail_local-b.head_local).rotation_difference(end-start).to_matrix();rig.pose.bones[name].matrix=affine(r,b.head_local,start)@rest[name];bpy.context.view_layer.update()
def solve(s,w,a,b,pole):
 delta=w-s;d=min(delta.length,a+b-.00001);axis=delta.normalized();t=(a*a-b*b+d*d)/(2*d);perp=pole-s;perp=(perp-axis*perp.dot(axis)).normalized();return s+axis*t+perp*math.sqrt(max(0,a*a-t*t))
def h(name):return data.bones[name].head_local.copy()
def t(name):return data.bones[name].tail_local.copy()
def hand_transform(side,new):
 old=h('wrist.'+side);forward=((h('finger2-1.'+side)+h('finger5-1.'+side))*.5-old).normalized();width=h('finger2-1.'+side)-h('finger5-1.'+side);width=(width-forward*width.dot(forward)).normalized();normal=forward.cross(width).normalized()
 f=V((-1,0,0));u=V((0,0,1));normal2=f.cross(u)
 a=Matrix((forward,width,normal)).transposed();b=Matrix((f,u,normal2)).transposed();return affine(b@a.transposed(),old,new)
targets={'R':V((-.526,.075,1.335)),'L':V((.085,.145,1.325))};pose_report={}
for side in ['R','L']:
 s=h('upperarm01.'+side);e=h('lowerarm01.'+side);w=h('wrist.'+side);target=targets[side]
 pole=V((-.34,.025,1.15)) if side=='R' else V((.42,-.03,1.32));ne=solve(s,target,(e-s).length,(w-e).length,pole)
 u=(h('upperarm02.'+side)-s).length/(e-s).length;lo=(h('lowerarm02.'+side)-e).length/(w-e).length
 pose_segment('upperarm01.'+side,s,s.lerp(ne,u));pose_segment('upperarm02.'+side,s.lerp(ne,u),ne)
 pose_segment('lowerarm01.'+side,ne,ne.lerp(target,lo));pose_segment('lowerarm02.'+side,ne.lerp(target,lo),target)
 transform=hand_transform(side,target);rig.pose.bones['wrist.'+side].matrix=transform@rest['wrist.'+side];bpy.context.view_layer.update()
 # Finger bones flex as a chain, preserving the hand's authored topology/weights.
 for finger in range(2,6):
  chain=transform.copy();pivot=h(f'finger{finger}-1.{side}')
  angles=[45,65,40] if side=='R' else [32,68,35]
  for segment,angle in enumerate(angles,1):
   name=f'finger{finger}-{segment}.{side}';origin=chain@h(name);axis=V((0,0,1));rot=Quaternion(axis,math.radians(-angle if side=='R' else angle)).to_matrix();chain=affine(rot,origin,origin)@chain;rig.pose.bones[name].matrix=chain@rest[name];bpy.context.view_layer.update()
 # Opposable thumbs need a separate plane from the four finger hinges.
 thumb_transform=transform.copy()
 directions=[(-.018,.016,.002),(-.014,.010,-.019),(.005,-.003,-.021)] if side=='R' else [(.006,.016,-.020),(-.020,.008,-.020),(-.018,0,-.018)]
 for segment,direction in enumerate(directions,1):
  name=f'finger1-{segment}.{side}';origin=thumb_transform@h(name);current=thumb_transform.to_3x3()@(t(name)-h(name));rot=current.rotation_difference(V(direction)).to_matrix();thumb_transform=affine(rot,origin,origin)@thumb_transform;rig.pose.bones[name].matrix=thumb_transform@rest[name];bpy.context.view_layer.update()
 pose_report[side]={'shoulder':list(s),'elbow':list(ne),'wrist':list(target)}
# Turn the head toward the arrow. Neck control carries the face and accessories.
headpivot=h('neck01');headrot=Quaternion((0,0,1),math.radians(46)).to_matrix();headmat=affine(headrot,headpivot,headpivot);rig.pose.bones['neck01'].matrix=headmat@rest['neck01'];bpy.context.view_layer.update()
def mesh_object(name,vs,fs,material):
 m=bpy.data.meshes.new(name);m.from_pydata(vs,[],fs);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);m.materials.append(mats[material]);
 for p in m.polygons:p.use_smooth=True
 return o
def curve(name,points,radius,material,head=False):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=24;d.bevel_depth=radius;d.bevel_resolution=4;sp=d.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
 for b,p in zip(sp.bezier_points,points):b.co=headmat@V(p) if head else p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(mats[material]);return o
# A clean cloth skirt replaces the old fused robe/weapon scan.
vs=[];fs=[];N=72
for k,(z,rx,ry,fold) in enumerate([(.90,.136,.101,0),(.82,.172,.119,.004),(.66,.198,.139,.009),(.46,.222,.148,.015),(.28,.236,.154,.020),(.18,.244,.158,.023)]):
 for i in range(N+1):
  a=.085+(2*math.pi-.17)*i/N;wave=fold*(.65*math.cos(12*a)+.35*math.cos(20*a+.4));r=1+wave/rx
  vs.append((rx*math.sin(a)*r,-.008+ry*math.cos(a)*r,z+(.004*math.cos(12*a) if k==5 else 0)))
for j in range(5):
 for i in range(N):a=j*(N+1)+i;fs.append((a,a+1,a+N+2,a+N+1))
skirt=mesh_object('Ivory pleated robe',vs,fs,'ivory');sub=skirt.modifiers.new('Soft cloth','SUBSURF');sub.levels=2;sol=skirt.modifiers.new('Fabric thickness','SOLIDIFY');sol.thickness=.005
# Olive thread along the full hem, subordinate to the army colour.
curve('Robe hem',[vs[5*(N+1)+i] for i in range(N+1)],.003,'green')
# Structured bodice shell covers the torso rather than painting clothing on skin.
vs=[];fs=[];N=64
for z,rx,front,back in [(.875,.145,.112,.093),(.96,.13,.104,.087),(1.04,.154,.145,.100),(1.115,.174,.175,.106),(1.18,.162,.115,.093)]:
 for i in range(N):
  a=i*2*math.pi/N;vs.append((rx*math.sin(a),(front if math.cos(a)>0 else back)*math.cos(a),z))
for j in range(4):
 for i in range(N):a=j*N+i;b=j*N+(i+1)%N;fs.append((a,b,b+N,a+N))
bodice=mesh_object('Structured ivory bodice',vs,fs,'ivory');sub=bodice.modifiers.new('Fabric surface','SUBSURF');sub.levels=2;sol=bodice.modifiers.new('Fabric thickness','SOLIDIFY');sol.thickness=.006
# A small leather waist panel and crossed lacing retain the costume identity.
mesh_object('Leather waist panel',[(-.066,.128,.90),(.066,.128,.90),(.052,.154,1.035),(-.052,.154,1.035)],[(0,1,2,3)],'leather')
for z in [.917,.94,.963,.986,1.009]:
 for sign in [-1,1]:curve('Bodice lacing',[(sign*.04,.132+(z-.90)*.2,z),(-sign*.04,.135+(z-.90)*.2,z+.018)],.0018,'gold')
# Hood is a continuous cloth shell around the complete head.
levels=[(1.555,.013,.026,.015,.0),(1.535,.059,.080,.018,.30),(1.49,.097,.116,.017,.86),(1.42,.108,.132,.005,1.03),(1.34,.111,.140,-.005,1.09),(1.285,.129,.124,-.01,1.03)]
vs=[];fs=[];N=40
for z,rx,ry,cy,cut in levels:
 for i in range(N+1):
  a=cut+(2*math.pi-2*cut)*i/N;vs.append(headmat@V((rx*math.sin(a),cy+ry*math.cos(a),z)))
for j in range(len(levels)-1):
 for i in range(N):a=j*(N+1)+i;fs.append((a,a+1,a+N+2,a+N+1))
hood=mesh_object('Ivory cloth hood',vs,fs,'ivory');sub=hood.modifiers.new('Cloth surface','SUBSURF');sub.levels=2;sol=hood.modifiers.new('Cloth thickness','SOLIDIFY');sol.thickness=.004
for sign in [-1,1]:curve('Green hood lining',[(sign*rx*math.sin(cut),cy+ry*math.cos(cut),z) for z,rx,ry,cy,cut in levels],.0038,'green',True)
# Three interwoven strands, tied below the collar.
for strand in range(3):
 pts=[]
 for i in range(55):
  a=i/54;z=1.40-.36*a;phase=a*math.pi*10+strand*2*math.pi/3;pts.append((-.103-.045*math.sin(a*math.pi)+.009*math.cos(phase),.007+.173*math.sin(a*math.pi/2)+.009*math.sin(phase),z))
 curve('Copper braid strand',pts,.008,'copper')
# Belt follows the waist, and a small green clasp carries the recognition colour.
curve('Waist belt',[(.151*math.sin(a),.12*math.cos(a),.895) for a in [i*2*math.pi/24 for i in range(25)]],.011,'leather')
def sphere(name,loc,sc,material,head=False):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=headmat@V(loc) if head else loc);o=bpy.context.object;o.name=name;o.scale=sc;o.data.materials.append(mats[material]);
 if head:o.rotation_euler=headrot.to_euler()
 for p in o.data.polygons:p.use_smooth=True
 return o
sphere('Collar clasp',(0,.078,1.237),(.012,.008,.016),'green')
# Boots are built from the actual foot topology, with toes merged into a leather shell.
for sign in [-1,1]:
 fs=[list(reversed(f)) for f in body_faces if max(verts[i].z for i in f)<.242 and all(verts[i].x*sign>0 for i in f)]
 bm=bmesh.new()
 for i in {i for f in fs for i in f}:bm.verts.new(verts[i])
 result=bmesh.ops.convex_hull(bm,input=list(bm.verts),use_existing_faces=False)
 bmesh.ops.delete(bm,geom=result['geom_interior'],context='VERTS')
 m=bpy.data.meshes.new('Closed boot hull');bm.to_mesh(m);bm.free();boot=bpy.data.objects.new('Leather boot '+str(sign),m);bpy.context.collection.objects.link(boot);m.materials.append(mats['leather'])
 for poly in m.polygons:poly.use_smooth=True
 bevel=boot.modifiers.new('Rounded leather edges','BEVEL');bevel.width=.006;bevel.segments=3
# A swept fringe breaks up the forehead while retaining the original copper hair.
for i in range(12):
 x=-.063+i*.011
 curve('Copper swept fringe',[(x*.75,.083,1.492),(x,.095,1.465),(x+.023,.101,1.443-abs(x)*.14)],.007,'copper',True)
# Eyes use the supplied eye-joint centres and turn with the head.
for side in ['L','R']:
 name='eye.'+side
 if name in data.bones:
  p=h(name);curve('Copper eyebrow '+side,[p+V((-.013,.030,.013)),p+V((0,.035,.018)),p+V((.012,.030,.014))],.0025,'copper',True);sphere('Eye '+side,p,(.012,.010,.008),'eye',True);sphere('Iris '+side,p+V((0,.009,.000)),(.005,.002,.005),'green',True);sphere('Pupil '+side,p+V((0,.011,.000)),(.0025,.001,.003),'ink',True)
# Place the bow handle within the curled bow hand, and nock between drawing fingers.
grip=targets['R']+V((-.060,.021,-.004));nock=targets['L']+V((-.100,-.024,.020))
bowpoints=[grip+V((.042,0,.48)),grip+V((-.043,0,.405)),grip+V((-.075,0,.24)),grip+V((-.014,0,.08)),grip,grip+V((-.014,0,-.08)),grip+V((-.075,0,-.24)),grip+V((-.043,0,-.405)),grip+V((.042,0,-.48))]
curve('Recurve bow',bowpoints,.012,'leather');curve('Leather bow grip',[grip+V((0,0,-.040)),grip+V((0,0,.040))],.0135,'green')
for tip in [bowpoints[0],bowpoints[-1]]:curve('Drawn bowstring',[tip,nock],.0011,'gold')
direction=(grip-nock).normalized();tip=grip+direction*.17;curve('Arrow shaft',[nock,tip],.0022,'leather')
bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.012,radius2=0,depth=.052,location=tip+direction*.026);point=bpy.context.object;point.name='Arrow point';point.rotation_euler=direction.to_track_quat('Z','Y').to_euler();point.data.materials.append(mats['metal'])
for off in [-1,1]:mesh_object('Ivory feather',[nock+direction*.012,nock+direction*.085,nock+direction*.055+V((0,off*.014,.004)),nock+V((0,off*.014,.004))],[(0,1,2,3)],'ivory')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.render.resolution_x=1200;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.8,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.22
for loc,power,size in [((-3,4,5),230,4),((3,1,3),90,3),((-2,-3,3),150,2.5)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(V((0,0,.9))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(-2.7,5,2.05));cam=bpy.context.object;cam.name='Fixed sprite camera';cam.data.type='ORTHO';cam.data.ortho_scale=2.08;cam.rotation_euler=(V((-.15,.01,.91))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast';scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.filepath=str(OUT/'full-draw.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'archer-pose.blend'));bpy.ops.render.render(write_still=True)
# A close inspection render uses the same mesh, pose and lighting. The saved source keeps the full-figure camera.
target=V((-.19,.03,1.355));cam.location=target+V((-2.55,4.99,1.14));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=1.12
scene.render.resolution_x=1200;scene.render.resolution_y=700;scene.render.filepath=str(OUT/'hands-detail.png');bpy.ops.render.render(write_still=True)
(OUT/'build-report.json').write_text(json.dumps({'source':'MakeHuman CC0 base, female shape targets, default skeleton and authored skin weights; original King Down costume as visual reference.','vertices':len(verts),'faces':len(faces),'bones':len(data.bones),'pose':pose_report,'render':[1200,1400],'method':'Editable 3D geometry and skeleton; actual finger bones posed; authored hood, braid and bow; orthographic Cycles render. No generated finish.','scope':'Single full-draw pose; no animation delivered. Costume and equipment are static meshes in this study, not a production animation rig.'},indent=2))
