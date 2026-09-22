"""Build the complete source-derived cast, preserving the approved Guard/Archer files.
Run with Blender --background --python tools/graphics-prototype/build_roster.py.
"""
import bpy,math,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(Path(__file__).resolve().parent));sys.dont_write_bytecode=True
from sculpt_surface import read_figure,smooth_features,bake_creases
from paint_regions import paint_surface,surface_signature
from mathutils import Vector
from roster_profiles import PROFILES
from roster_rig import add_roster_walk
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for material in list(bpy.data.materials):bpy.data.materials.remove(material,do_unlink=True)
bpy.context.preferences.filepaths.save_version=0
out=ROOT/'public/prototype/models';out.mkdir(exist_ok=True,parents=True)
roles=['army','accent1'];reports=[]
# Optional focused rebuilds, while the saved whole-cast file is produced by a complete run.
chosen=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for index,p in enumerate(PROFILES):
 if chosen and p['key'] not in chosen:continue
 print('BUILD_CHARACTER',p['key'],flush=True)
 name=p['key'];height=p['height'];vertices,faces=read_figure(ROOT/'art-src/pieces/obj'/p['source'],height)
 mesh=bpy.data.meshes.new('Refined_'+name);mesh.from_pydata(vertices,[],faces);mesh.update()
 root=bpy.data.objects.new('Refined_'+name,None);bpy.context.collection.objects.link(root)
 obj=bpy.data.objects.new(name+' source surface',mesh);bpy.context.collection.objects.link(obj);obj.parent=root
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 mesh.calc_loop_triangles();source_tris=len(mesh.loop_triangles)
 cleanup=smooth_features(obj,name,height)
 if p['target']<source_tris:
  reduction=obj.modifiers.new('Preserve silhouette, reduce surface density','DECIMATE');reduction.ratio=p['target']/source_tris;bpy.ops.object.modifier_apply(modifier=reduction.name)
 # Paint cuts operate on convex, planar faces. Some source sculpts contain
 # non-planar quads, so use Blender's tessellation before measuring/cutting them.
 triangulate=obj.modifiers.new('Triangulate source surface','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=triangulate.name)
 mesh=obj.data
 assert max(v.co.z for v in mesh.vertices)-min(v.co.z for v in mesh.vertices)>height*.99,f'{name}: reduction lost the silhouette'
 for polygon in mesh.polygons:polygon.use_smooth=True
 mesh.set_sharp_from_angle(angle=math.radians(48))
 normals=obj.modifiers.new('Defined feature shading','WEIGHTED_NORMAL');normals.keep_sharp=True;normals.mode='FACE_AREA_WITH_ANGLE';normals.weight=50;bpy.ops.object.modifier_apply(modifier=normals.name)
 mesh=obj.data;ao=bake_creases(mesh,.065)
 materials={}
 for role in roles:
  value=0xdcc9a2 if role=='army' or p['accent'] is None else p['accent'];color=tuple(((value>>shift)&255)/255 for shift in [16,8,0])+(1,)
  mat=bpy.data.materials.new(role);mat.diffuse_color=color;mat.use_nodes=True;mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=color;mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.85
  # Shared semantic names in glTF; material data stays local to each export.
  materials[role]=mat
 accent_faces=[];regions=p.get('regions',[])
 if 'paint_faces' in p:
  selection=json.loads((Path(__file__).resolve().parent/'paint-masks'/p['paint_faces']).read_text())
  assert surface_signature(mesh)==selection['surfaceSha256'],f'{name}: surface changed; review the authored paint selection'
  accent_faces=selection['accentFaces']
  regions=regions+[(r['role'],[(Vector(n),d) for n,d in r['planes']]) for r in selection.get('regions',[])]
 mesh,paint=paint_surface(mesh,name,height,roles,materials,regions,accent_faces);obj.data=mesh
 rig,walk=add_roster_walk(obj,root,p)
 root.rotation_euler.z=math.radians(p.get('yaw',0))
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True);obj.select_set(True);rig.select_set(True)
 destination=out/('rebuilt-'+name+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(destination),use_selection=True,export_format='GLB',export_materials='EXPORT',export_animations=True,export_frame_range=True,export_force_sampling=True,export_animation_mode='ACTIVE_ACTIONS',export_nla_strips_merged_animation_name='Walk',export_anim_slide_to_zero=True,export_cameras=False,export_lights=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
 # Blender suffixes repeated names. Canonical roles are cleaned in the glTF JSON below.
 mesh.calc_loop_triangles();area=sum(f.area for f in mesh.polygons);accent_area=sum(f.area for f in mesh.polygons if f.material_index==1)
 if p['accent'] is not None:assert accent_area>0,f'{name} accent missed the actual surface'
 report={'name':'rebuilt-'+name,'label':p['label'],'source':p['source'],'height':height,'triangles':len(mesh.loop_triangles),'sourceTriangles':source_tris,'bytes':destination.stat().st_size,'accent':p['accent'],'feature':p['feature'],'materialAreaShare':{'army':1-accent_area/area,'accent1':accent_area/area},'creaseShadingRange':ao,'paintBoundaryCheck':paint,'featureCleanup':cleanup,'walk':walk}
 reports.append(report);rig.data.pose_position='REST';root.location=(index%4*2.2,index//4*2.4,0)
 print('BUILT_CHARACTER',json.dumps(report),flush=True)
# Canonical material roles are the runtime contract; normalize Blender's name suffixes.
import struct
for report in reports:
 path=out/(report['name']+'.glb');blob=path.read_bytes();length=struct.unpack_from('<I',blob,12)[0];g=json.loads(blob[20:20+length]);tail=blob[20+length:]
 for mat in g.get('materials',[]):mat['name']=mat['name'].split('.')[0]
 payload=json.dumps(g,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4)
 path.write_bytes(struct.pack('<4sII','glTF'.encode(),2,20+len(payload)+len(tail))+struct.pack('<I4s',len(payload),b'JSON')+payload+tail);report['bytes']=path.stat().st_size
if not chosen:bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/graphics-prototype/complete-cast.blend'))
manifest_path=out/'manifest.json';manifest=json.loads(manifest_path.read_text());names={r['name'] for r in reports}
manifest['models']=[r for r in manifest['models'] if r['name'] not in names]+reports
manifest['method']='Source-derived full cast with feature-specific paint, crease shading and authored skeletal walking; approved Guard/Archer preserved; earlier controls retained'
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('ROSTER_COMPLETE',len(reports),flush=True)
