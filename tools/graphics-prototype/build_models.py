"""Candidate study: authored Guard/Archer and decimated original controls.
Run: /Applications/Blender.app/Contents/MacOS/Blender -b --python tools/graphics-prototype/build_models.py
Coordinates in this recipe are x lateral, y height, z forward; Blender receives x,-z,y.
References: art-src/pieces/colour-guides/{guard_color_ref,Archer_color_ref}.jpg and corresponding OBJ.
"""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/prototype/models';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
COLORS={'army':(0.79,0.69,0.49,1),'shade':(0.42,0.34,0.23,1),'light':(0.93,0.86,0.67,1),'ink':(.10,.085,.07,1),'accent1':(.18,.37,.52,1),'accent2':(.61,.85,.69,1)}
MATS={}
for n,c in COLORS.items():
 m=bpy.data.materials.new(n);m.diffuse_color=c;m.use_nodes=True;m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=c;m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.8;MATS[n]=m

def xyz(p):return (p[0],-p[2],p[1])
def root(name):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);return o

def finish(obj,name,mat,parent):
 obj.name=name;obj.data.materials.append(MATS[mat]);obj.parent=parent;return obj

def mesh(name,verts,faces,mat,parent):
 m=bpy.data.meshes.new(name);m.from_pydata([xyz(v) for v in verts],[],faces);m.update();bm=bmesh.new();bm.from_mesh(m);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(m);bm.free();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return finish(o,name,mat,parent)

def box(name,p,size,mat,parent,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Broad bevel','BEVEL');mod.width=bevel;mod.segments=1;bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,mat,parent)

def orb(name,p,size,mat,parent,seg=8,rings=4):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,radius=1,location=xyz(p));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,mat,parent)

def beam(name,a,b,r,mat,parent,vertices=6):
 av,bv=Vector(xyz(a)),Vector(xyz(b));d=bv-av
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d.length,location=(av+bv)*.5);o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return finish(o,name,mat,parent)

def plate(name,pts,depth,z,mat,parent,bevel=.018):
 # Explicit silhouette with a narrow bevel: no small inset decoration that will disappear at 48px.
 n=len(pts);cx=sum(p[0] for p in pts)/n;cy=sum(p[1] for p in pts)/n
 inner=[(cx+(x-cx)*.87,cy+(y-cy)*.92) for x,y in pts]
 vs=[(x,y,z-depth/2) for x,y in pts]+[(x,y,z+depth/2-bevel) for x,y in pts]+[(x,y,z+depth/2) for x,y in inner]
 faces=[tuple(reversed(range(n))),tuple(range(2*n,3*n))]
 for i in range(n):
  j=(i+1)%n;faces.extend([(i,j,n+j,n+i),(n+i,n+j,2*n+j,2*n+i)])
 return mesh(name,vs,faces,mat,parent)

G=root('Rebuilt_Guard')
for s,side in [(-1,'L'),(1,'R')]:
 box('Boot_'+side,(s*.155,.10,.045),(.23,.18,.31),'shade',G,.035)
 box('Shin_'+side,(s*.15,.245,0),(.19,.23,.22),'army',G,.027)
 orb('Elbow_'+side,(s*.43,.66,-.005),(.135,.145,.15),'shade',G)
 box('Gauntlet_'+side,(s*.46,.48,.06),(.25,.29,.27),'army',G,.045)
 plate('Fist_face_'+side,[(s*.46-.088,.37),(s*.46+.088,.37),(s*.46+.09,.48),(s*.46-.09,.48)],.05,.22,'light',G)
box('Armour_core',(0,.77,0),(.66,.75,.39),'army',G,.09)
plate('Belly_plate',[(-.25,.66),(0,.32),(.25,.66),(.22,.85),(-.22,.85)],.13,.235,'army',G)
plate('Belly_ridge',[(-.027,.65),(0,.38),(.027,.65),(.018,.79),(-.018,.79)],.018,.317,'shade',G)
for s,side in [(-1,'L'),(1,'R')]:
 # Raised shoulder wings flank a deeply recessed helmet, matching the original Guard.
 pts=[(s*x,y) for x,y in [(.13,1.40),(.38,1.34),(.53,1.12),(.59,.93),(.35,.85),(.23,1.02),(.20,1.25)]]
 plate('Wing_'+side,pts,.39,.015,'army',G,.04)
 pts=[(s*x,y) for x,y in [(.19,1.36),(.35,1.30),(.46,1.12),(.49,1.02),(.41,1.05),(.30,1.23)]]
 plate('Steel_inlay_'+side,pts,.04,.244,'accent1',G,.012)
 plate('Chest_'+side,[(s*.05,.77),(s*.27,.74),(s*.34,.94),(s*.11,1.01)],.1,.265,'army',G)
 # Rear accent stays readable from the opposing side.
 plate('Back_inlay_'+side,[(s*.15,1.22),(s*.33,1.17),(s*.34,1.02),(s*.20,1.03)],.03,-.215,'accent1',G)
orb('Helmet',(0,1.135,.11),(.17,.20,.16),'light',G,10,5)
plate('Visor_socket',[(-.118,1.06),(.118,1.06),(.113,1.185),(0,1.215),(-.113,1.185)],.026,.265,'ink',G,.006)
for s in [-1,1]:
 plate('Eye_'+str(s),[(s*.02,1.128),(s*.09,1.145),(s*.09,1.17),(s*.018,1.15)],.018,.29,'accent2',G,.002)
plate('Nose_guard',[(-.026,1.09),(-.018,1.01),(.018,1.01),(.026,1.09),(0,1.15)],.028,.295,'army',G,.003)

A=root('Rebuilt_Archer')
box('Boot_L',(-.11,.095,.06),(.16,.17,.29),'shade',A,.025)
box('Boot_R',(.13,.11,-.04),(.16,.20,.26),'shade',A,.025)
beam('Leg_L',(-.10,.13,0),(-.11,.53,-.01),.075,'army',A)
beam('Leg_R',(.13,.14,-.07),(.11,.51,-.02),.073,'army',A)
# Skirt is two separate broad leaves, preserving the original opening and trailing hem.
plate('Skirt_L',[(-.16,.72),(-.34,.18),(-.11,.22),(-.025,.56),(.025,.72)],.13,.01,'army',A,.025)
plate('Skirt_R',[(.03,.72),(.17,.72),(.32,.19),(.40,.28),(.20,.28),(.13,.40)],.13,-.07,'army',A,.022)
plate('Skirt_accent',[(-.145,.69),(-.27,.24),(-.17,.27),(-.055,.69)],.025,.097,'accent1',A,.006)
plate('Back_cloth',[(-.17,.7),(-.30,.23),(.29,.25),(.16,.70)],.04,-.10,'army',A,.012)
plate('Back_sash',[(-.08,.70),(-.13,.31),(-.05,.28),(.005,.70)],.028,-.145,'accent1',A,.003)
# Torso and a strong hood are separate; anatomy reduced to deliberate planes.
orb('Torso',(0,.835,0),(.19,.20,.12),'army',A,8,4)
box('Waist',(0,.713,0),(.27,.11,.22),'shade',A,.025)
plate('Bodice',[(-.18,.92),(0,.73),(.17,.90),(.14,1.0),(-.12,1.0)],.07,.12,'army',A,.013)
beam('Neck',(0,.96,0),(0,1.09,0),.07,'army',A)
# Hood is a peaked shell whose opening leaves a large readable face.
plate('Hood',[(-.22,1.05),(-.215,1.30),(-.11,1.43),(.10,1.45),(.23,1.28),(.21,1.05),(.11,1.11),(-.11,1.11)],.29,-.005,'army',A,.025)
plate('Hood_green_L',[(-.215,1.06),(-.20,1.29),(-.10,1.415),(-.065,1.355),(-.135,1.23),(-.13,1.09)],.027,.162,'accent1',A,.007)
plate('Hood_green_R',[(.10,1.42),(.22,1.28),(.20,1.06),(.13,1.1),(.14,1.23),(.06,1.36)],.027,.162,'accent1',A,.007)
orb('Face',(0,1.22,.165),(.115,.148,.071),'light',A,6,4)
plate('Eye_line',[(-.087,1.238),(-.026,1.22),(.084,1.237),(.073,1.252),(-.08,1.25)],.015,.23,'shade',A,.002)
plate('Braid',[(-.11,1.14),(-.13,.91),(-.075,.89),(-.064,1.15)],.04,.16,'shade',A,.004)
# Raised left forearm and lower right forearm reproduce the dual wrist-crossbow pose.
beam('Upper_arm_L',(-.16,.96,0),(-.29,.86,.015),.07,'army',A)
beam('Forearm_L',(-.29,.86,.015),(-.39,1.105,.13),.065,'army',A)
beam('Upper_arm_R',(.16,.97,0),(.29,.77,.02),.07,'army',A)
beam('Forearm_R',(.29,.77,.02),(.38,.77,.22),.065,'army',A)
for side,p in [('L',(-.39,1.08,.18)),('R',(.38,.77,.25))]:
 x,y,z=p
 box('Cuff_'+side,(x,y,z-.025),(.145,.10,.18),'accent2',A,.018)
 box('Crossbow_stock_'+side,(x,y+.065,z+.06),(.065,.07,.28),'shade',A,.011)
 # Broad wings, deliberately enlarged to survive a 40–60px-tall piece.
 plate('Crossbow_wings_'+side,[(x-.19,y+.075),(x-.12,y+.12),(x,y+.086),(x+.12,y+.12),(x+.19,y+.075),(x+.13,y+.068),(x,y+.044),(x-.13,y+.068)],.055,z+.17,'accent2',A,.006)
 beam('Bolt_'+side,(x,y+.104,z-.035),(x,y+.104,z+.30),.015,'light',A,4)
 plate('Bolt_tip_'+side,[(x-.035,y+.10),(x+.035,y+.10),(x,y+.145)],.065,z+.31,'light',A,.001)

# One editable source containing the rebuilt pair only.
G.location.x=-1;A.location.x=1
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/graphics-prototype/rebuilt-pieces.blend'))
G.location.x=0;A.location.x=0

def export(o,name):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
 for ch in o.children_recursive:ch.select_set(True)
 bpy.context.view_layer.objects.active=o
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),use_selection=True,export_format='GLB',export_materials='EXPORT',export_animations=False,export_cameras=False,export_lights=False)
 tris=0
 for ob in o.children_recursive:
  if ob.type=='MESH':ob.data.calc_loop_triangles();tris+=len(ob.data.loop_triangles)
 return {'name':name,'triangles':tris,'bytes':(OUT/(name+'.glb')).stat().st_size}
report=[export(G,'rebuilt-guard'),export(A,'rebuilt-archer')]
# Original-geometry controls. Palette zoning is provisional, not recovered source paint.
for name,file,h in [('guard','Guard_22mm.obj',1.24),('archer','Archer_2.obj',1.34),('pawn','pawn_22mm.obj',.9),('knight','knight_22mm.obj',1.22),('bishop','Bishop.obj',1.3),('king','King_Frost_22mm.obj',1.53)]:
 vs=[];fs=[]
 for line in (ROOT/'art-src/pieces/obj'/file).open():
  v=line.split()
  if not v:continue
  if v[0]=='v':vs.append(tuple(map(float,v[1:4])))
  elif v[0]=='f':fs.append([int(x.split('/')[0])-1 for x in v[1:]])
 lo=[min(v[i] for v in vs) for i in range(3)];hi=[max(v[i] for v in vs) for i in range(3)];height=hi[1]-lo[1];cut=.085
 vertices=[((v[0]-(lo[0]+hi[0])/2)/height*h,max(0,((v[1]-lo[1])/height-cut)*h/(1-cut)),(v[2]-(lo[2]+hi[2])/2)/height*h) for v in vs]
 fs=[f for f in fs if max(vertices[i][1] for i in f)>.001]
 r=root('Original_'+name);o=mesh('Original_sculpt',vertices,fs,'army',r)
 for m in ['accent1','accent2','shade','light']:o.data.materials.append(MATS[m])
 # Large, visible semantic regions are approximate study assignments.
 for p in o.data.polygons:
  center=sum((o.data.vertices[i].co for i in p.vertices),Vector())/len(p.vertices);x,z,y=center.x,-center.y,center.z
  if name!='pawn':
   if name=='guard' and y>h*.77 and abs(x)>.16:p.material_index=1
   elif name=='archer' and y>h*.79:p.material_index=1
   elif name=='archer' and abs(x)>.26 and .5<y<1.1:p.material_index=2
   elif name in ['bishop','king'] and y>h*.78:p.material_index=1
   elif name=='knight' and y>h*.83:p.material_index=1
  p.use_smooth=True
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 mod=o.modifiers.new('Study simplification','DECIMATE');o.data.calc_loop_triangles();mod.ratio=min(1,6500/max(1,len(o.data.loop_triangles)));bpy.ops.object.modifier_apply(modifier=mod.name)
 report.append(export(r,'original-'+name))
(OUT/'manifest.json').write_text(json.dumps({'method':'Authored mesh/primitive rebuilds; six decimated OBJ controls with provisional region paint','models':report},indent=2)+'\n')
print('MODEL_REPORT',json.dumps(report))
