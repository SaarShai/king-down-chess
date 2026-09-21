"""Source-derived Guard/Archer detail pass. Run in Blender; no replacement character design.

Keep the original surface proportions, remove only the separate Texture pedestal,
reduce mesh density, assign a small army/type material vocabulary, and bake local
crease occlusion into vertex colours. The source OBJs and colour guides are the references.
"""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/prototype/models'
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.dont_write_bytecode = True
from paint_regions import paint_surface
from rig_walk import add_walk_rig
from sculpt_surface import read_figure, smooth_features, bake_creases
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for material in list(bpy.data.materials): bpy.data.materials.remove(material, do_unlink=True)
bpy.context.preferences.filepaths.save_version = 0

colors = {'army': (.72,.64,.47,1), 'shade': (.41,.34,.25,1), 'light': (.90,.82,.64,1),
          'ink': (.055,.045,.035,1), 'accent1': (.14,.30,.42,1), 'accent2': (.55,.83,.70,1)}
roles = list(colors)
materials = {}
for role, color in colors.items():
    material = bpy.data.materials.new(role)
    material.diffuse_color = color
    material.use_nodes = True
    material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = color
    material.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .85
    materials[role] = material


def check_feature_paint(mesh, name, height):
    """Ray-check named landmarks from the source reference views."""
    tree = BVHTree.FromPolygons([v.co for v in mesh.vertices], [p.vertices[:] for p in mesh.polygons])
    samples = [('left shoulder',-.50,.80,'accent1'),('right shoulder',.50,.80,'accent1'),
               ('helmet',0,.75,'army'),('chest',.25,.58,'army')] if name == 'guard' else [
               ('hood crown',0,.985,'accent1'),('hood side',.072,.90,'accent1'),
               ('face',-.0102,.9114,'army'),('chin',-.0102,.8498,'army'),('braid',-.09,.79,'army')]
    result = []
    for label,x,y,expected in samples:
        if name == 'guard': origin, direction = Vector((x,-2,y*height)), Vector((0,1,0))
        else:
            c = math.sqrt(.5)
            origin, direction = Vector(((x-2)*c,-(x+2)*c,y*height)), Vector((c,c,0))
        hit, _, face, _ = tree.ray_cast(origin, direction)
        assert hit is not None, f'{name} landmark missed: {label}'
        actual = roles[mesh.polygons[face].material_index]
        assert actual == expected, f'{name} {label}: expected {expected}, got {actual}'
        result.append({'feature':label,'role':actual})
    return result


report = []
for name, source, height, target in [('guard','Guard_22mm.obj',1.40,18000), ('archer','Archer_2.obj',1.45,20000)]:
    vertices, faces = read_figure(ROOT/'art-src/pieces/obj'/source, height)
    mesh = bpy.data.meshes.new('Refined_'+name)
    mesh.from_pydata(vertices,[],faces); mesh.update()
    root = bpy.data.objects.new('Refined_'+name.title(),None)
    bpy.context.collection.objects.link(root)
    obj = bpy.data.objects.new('Source surface · armour' if name=='guard' else 'Source surface · hood braid cloth crossbows',mesh)
    bpy.context.collection.objects.link(obj);obj.parent=root
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    mesh.calc_loop_triangles(); source_tris = len(mesh.loop_triangles)
    smoothing_report = smooth_features(obj, name, height)
    reduction = obj.modifiers.new('Silhouette-preserving reduction','DECIMATE')
    reduction.ratio = min(1.,target/source_tris)
    bpy.ops.object.modifier_apply(modifier=reduction.name)
    mesh = obj.data
    for polygon in mesh.polygons: polygon.use_smooth = True
    mesh.set_sharp_from_angle(angle=math.radians(48))
    normals = obj.modifiers.new('Clear plate and cloth shading', 'WEIGHTED_NORMAL')
    normals.keep_sharp = True; normals.mode = 'FACE_AREA_WITH_ANGLE'; normals.weight = 50
    bpy.ops.object.modifier_apply(modifier=normals.name)
    mesh = obj.data
    ao_range = bake_creases(mesh,.075 if name=='guard' else .065)
    mesh, paint_report = paint_surface(mesh, name, height, roles, materials)
    obj.data = mesh
    feature_samples = check_feature_paint(mesh, name, height)
    areas = {role:0. for role in roles}
    for polygon in mesh.polygons: areas[roles[polygon.material_index]] += polygon.area
    rig, walk_report = add_walk_rig(obj, root, name)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);root.select_set(True);rig.select_set(True)
    destination = OUT/('rebuilt-'+name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(destination),use_selection=True,export_format='GLB',export_materials='EXPORT',export_animations=True,export_frame_range=True,export_force_sampling=True,export_animation_mode='ACTIVE_ACTIONS',export_nla_strips_merged_animation_name='Walk',export_anim_slide_to_zero=True,export_cameras=False,export_lights=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
    mesh.calc_loop_triangles()
    report.append({'name':'rebuilt-'+name,'triangles':len(mesh.loop_triangles),'bytes':destination.stat().st_size,
                   'source':source,'sourceTriangles':source_tris,'materialAreaShare':{k:round(v/sum(areas.values()),4) for k,v in areas.items()},'creaseShadingRange':ao_range,'paintBoundaryCheck':paint_report,'featureCleanup':smoothing_report,'featureSamples':feature_samples,'walk':walk_report})
    rig.data.pose_position='REST'
    root.location.x = -1. if name=='guard' else 1.

bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/graphics-prototype/rebuilt-pieces.blend'))
manifest_path = OUT/'manifest.json'
manifest = json.loads(manifest_path.read_text())
manifest['method'] = 'Source-derived Guard/Archer with crease-protected surface relaxation, weighted normals and feature-specific paint boundaries and baked crease shading, with authored skeletal in-place walk clips; earlier blockouts retained for comparison'
manifest['models'] = [m for m in manifest['models'] if m['name'] not in ['rebuilt-guard','rebuilt-archer']] + report
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('REFINEMENT_REPORT',json.dumps(report))
