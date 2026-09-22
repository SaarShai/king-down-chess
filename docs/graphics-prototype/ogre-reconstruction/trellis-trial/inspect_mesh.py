"""Render the downloaded mesh unchanged, with and without its generated texture."""
from pathlib import Path
import json
import bpy
from mathutils import Vector

OUT = Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(OUT / 'ogre-original.glb'))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
assert meshes, 'Import produced no mesh'
points = [o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
lo = Vector(tuple(min(v[i] for v in points) for i in range(3)))
hi = Vector(tuple(max(v[i] for v in points) for i in range(3)))
center = (lo + hi) / 2
size = max(hi - lo)
assert size > 0
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.world.color = (0.19, 0.19, 0.19)
scene.view_settings.view_transform = 'AgX'
for name, offset, energy, width in [
    ('Key', (-2, -3, 4), 450, 3),
    ('Fill', (3, -1, 2), 220, 3),
    ('Rim', (0, 3, 3), 350, 2),
]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.shape, data.size = energy, 'DISK', width * size
    lamp = bpy.data.objects.new(name, data)
    scene.collection.objects.link(lamp)
    lamp.location = center + Vector(offset) * size
    lamp.rotation_euler = (center - lamp.location).to_track_quat('-Z', 'Y').to_euler()
cam_data = bpy.data.cameras.new('Inspection')
cam_data.type, cam_data.ortho_scale = 'ORTHO', size * 1.22
cam = bpy.data.objects.new('Inspection', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
neutral = bpy.data.materials.new('Plain inspection clay')
neutral.diffuse_color = (0.43, 0.40, 0.35, 1)
neutral.use_nodes = True
bsdf = neutral.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = neutral.diffuse_color
bsdf.inputs['Roughness'].default_value = 0.85
stats = {'bounds': [list(lo), list(hi)], 'meshes': []}
for obj in meshes:
    obj.data.calc_loop_triangles()
    stats['meshes'].append({'name': obj.name, 'vertices': len(obj.data.vertices),
                           'triangles': len(obj.data.loop_triangles)})
(OUT / 'mesh-inspection.json').write_text(json.dumps(stats, indent=2) + '\n')
for name, direction, plain in [
    ('neutral-front', (0, -4, 0), True),
    ('neutral-left', (-4, 0, 0), True),
    ('neutral-back', (0, 4, 0), True),
    ('neutral-three-quarter', (3, -4, 1.5), True),
    ('textured-three-quarter', (3, -4, 1.5), False),
]:
    scene.view_layers[0].material_override = neutral if plain else None
    cam.location = center + Vector(direction) * size
    cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(OUT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'ogre-inspection.blend'))
