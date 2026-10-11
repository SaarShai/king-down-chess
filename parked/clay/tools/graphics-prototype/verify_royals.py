"""Evaluate the royal/Paladin GLB meshes at 97 phases, compare loop endpoints and render views.
Run with Blender --background --python tools/graphics-prototype/verify_royals.py.
"""
import bpy, math, json, os, statistics
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/graphics-prototype/captures/royal-qa'
OUT.mkdir(exist_ok=True, parents=True)
NAMES = ['paladin','king-ember','king-frost','king-gaya','king-celestial','king-shadow','king-spirit']

def clear():
    bpy.ops.object.mode_set(mode='OBJECT') if bpy.context.object and bpy.context.object.mode != 'OBJECT' else None
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    for d in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights, bpy.data.armatures):
        for x in list(d):
            try: d.remove(x, do_unlink=True)
            except: pass

def mesh_objs():
    # Blender's glTF importer creates an unparented Icosphere helper for armature
    # display; it is not a runtime GLB mesh and must not affect bounds or renders.
    return [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent is not None]

def world_points(frame):
    base=int(frame); bpy.context.scene.frame_set(base, subframe=float(frame-base))
    dg=bpy.context.evaluated_depsgraph_get(); dg.update()
    pts=[]; per=[]
    for ob in mesh_objs():
        eo=ob.evaluated_get(dg)
        me=eo.to_mesh()
        q=[eo.matrix_world @ v.co for v in me.vertices]
        if q:
            per.append((ob.name,len(q),min(v.z for v in q),max(v.z for v in q),min(v.x for v in q),max(v.x for v in q),min(v.y for v in q),max(v.y for v in q)))
            pts.extend(q)
        eo.to_mesh_clear()
    return pts, per

def setup_camera(center_z, scale, view='front'):
    cd=bpy.data.cameras.new('QA Camera'); cam=bpy.data.objects.new('QA Camera',cd); bpy.context.collection.objects.link(cam)
    cd.type='ORTHO'; cd.ortho_scale=scale
    target=Vector((0,0,center_z))
    pos=Vector((0,-4.8,center_z+.02)) if view=='front' else Vector((4.6,-4.6,center_z+1.0))
    cam.location=pos; cam.rotation_euler=(target-pos).to_track_quat('-Z','Y').to_euler(); bpy.context.scene.camera=cam

def scene_bounds(frame):
    pts,_=world_points(frame)
    if not pts: return None
    return (min(v.x for v in pts),max(v.x for v in pts),min(v.y for v in pts),max(v.y for v in pts),min(v.z for v in pts),max(v.z for v in pts))

def render_frame(key, tag, frame, view='front', floor=0.0):
    b=scene_bounds(frame); lo_x,hi_x,lo_y,hi_y,lo_z,hi_z=b
    # Camera scale is height plus a small margin; fit broad capes/weapon in width.
    scale=max(hi_z-lo_z+0.12, hi_x-lo_x+0.16 if view=='front' else hi_y-lo_y+0.16)
    setup_camera((lo_z+hi_z)/2, scale, view)
    scene=bpy.context.scene; scene.render.engine='BLENDER_WORKBENCH'; scene.render.resolution_x=480; scene.render.resolution_y=620; scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'; scene.render.film_transparent=False; scene.world.color=(0.035,0.035,0.045)
    scene.display.shading.light='STUDIO'; scene.display.shading.studio_light='paint.sl'; scene.display.shading.color_type='MATERIAL'; scene.display.shading.show_shadows=True; scene.display.shading.show_cavity=True; scene.display.shading.cavity_type='BOTH'; scene.display.shading.curvature_ridge_factor=1.5; scene.display.shading.curvature_valley_factor=1.2
    scene.render.filepath=str(OUT/f'{key}-{tag}-{view}.png'); bpy.ops.render.render(write_still=True)

def glb_json(path):
    blob=path.read_bytes(); n=int.from_bytes(blob[12:16],'little'); return json.loads(blob[20:20+n])

reports=[]
for key in NAMES:
    clear(); path=ROOT/'public/prototype/models'/f'rebuilt-{key}.glb'; raw=glb_json(path)
    bpy.ops.import_scene.gltf(filepath=str(path))
    for helper in [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent is None]:
        helper.hide_render=True; helper.hide_viewport=True
    actions=[a for a in bpy.data.actions if a.users]
    act_ranges=[]
    for a in actions:
        try: channels=sum(len(cb.fcurves) for layer in a.layers for strip in layer.strips for cb in strip.channelbags)
        except Exception: channels=None
        act_ranges.append((a.name,tuple(round(x,4) for x in a.frame_range),channels))
    # Imports normally set frame range; fall back to action bounds.
    if actions:
        start=min(a.frame_range[0] for a in actions); end=max(a.frame_range[1] for a in actions)
    else: start,end=1,1
    bpy.context.scene.frame_start=round(start); bpy.context.scene.frame_end=round(end)
    rest_pts,rest_per=world_points(0.0); floor=0.0
    b=scene_bounds(0.0); render_frame(key,'rest',0.0,'front',floor); render_frame(key,'mid',(start+end)*.5,'front',floor)
    # Also capture three-quarter rest for the asymmetric kings and Paladin.
    render_frame(key,'rest',0.0,'threeq',floor)
    mins=[]; maxs=[]; contact=[]; samples=[]
    sample_count=96
    for si in range(sample_count+1):
        fr=start+(end-start)*si/sample_count
        pts,per=world_points(fr)
        if not pts: continue
        mn=min(v.z for v in pts); mx=max(v.z for v in pts); mins.append(mn); maxs.append(mx)
        near=sum(1 for v in pts if abs(v.z-floor)<1e-4); pen=max(0.0,floor-mn)
        contact.append((fr,mn,pen,near))
        if si in (0,sample_count//2,sample_count): samples.append((fr,mn,mx,near))
    # Mesh/material/node sanity facts from imported scene and source JSON.
    mesh_count=len(mesh_objs()); prims=[]; mats=[]
    for m in raw.get('meshes',[]):
        prims.append(sum(len(p.get('attributes',{})) for p in m.get('primitives',[]))); mats.extend([p.get('material') for p in m.get('primitives',[])])
    reports.append({'key':key,'rawNodes':len(raw.get('nodes',[])),'rawSkins':len(raw.get('skins',[])),'rawAnimations':[(a.get('name'),len(a.get('channels',[]))) for a in raw.get('animations',[])],'actions':act_ranges,'meshObjects':mesh_count,'primitives':len([p for m in raw.get('meshes',[]) for p in m.get('primitives',[])]),'materials':raw.get('materials',[]),'floorRestZ':floor,'restBounds':b,'minZ':min(mins),'maxPenetration':max(c[2] for c in contact) if contact else None,'minAtFrames':samples,'minContactVerts':min(c[3] for c in contact) if contact else None,'maxContactVerts':max(c[3] for c in contact) if contact else None,'loopMinDelta':None})
    # vertex seam check from evaluated points at first/last frame; compare all ordered mesh vertices.
    p0,_=world_points(start); p1,_=world_points(end); pm,_=world_points((start+end)*.5)
    if len(p0)==len(p1): reports[-1]['loopMinDelta']=max((a-b).length for a,b in zip(p0,p1))
    if len(p0)==len(pm):
        deltas=[(a-b).length for a,b in zip(p0,pm)]
        reports[-1]['midMaxDelta']=max(deltas); reports[-1]['midMeanDelta']=sum(deltas)/len(deltas); reports[-1]['midMovedVerts']=sum(d>1e-4 for d in deltas)
(ROOT/'docs/graphics-prototype/royal-verification.json').write_text(json.dumps(reports,indent=2))
print(json.dumps(reports,indent=2))
