"""Local fingertip fairing; preserve the accepted reconstruction and its UVs."""
from pathlib import Path
from collections import defaultdict
import hashlib
import json
import bpy
from mathutils import Vector

OUT = Path(__file__).resolve().parent
SOURCE = OUT.parent / 'trellis-trial/ogre-original.glb'
bpy.ops.wm.open_mainfile(filepath=str(OUT.parent / 'trellis-trial/ogre-inspection.blend'))
obj = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
mesh = obj.data
original = [obj.matrix_world @ v.co for v in mesh.vertices]

# Share neighbours across UV seams without welding or changing the texture layout.
groups = defaultdict(list)
for i, co in enumerate(original):
    groups[tuple(round(x, 7) for x in co)].append(i)
ids = {}
points = []
for key, indices in groups.items():
    for i in indices:
        ids[i] = len(points)
    points.append(Vector(key))
neighbours = [set() for _ in points]
for edge in mesh.edges:
    a, b = (ids[i] for i in edge.vertices)
    if a != b:
        neighbours[a].add(b)
        neighbours[b].add(a)

# Two separately centred soft brushes: only the curled middle fingertips.
weights = []
for co in points:
    center = Vector((-.412 if co.x < 0 else .401, -.220, -.192))
    delta = co - center
    radius = sum((delta[i] / (.061, .055, .065)[i]) ** 2 for i in range(3))
    weights.append(max(0, 1 - radius) ** 2)
before = [p.copy() for p in points]
for _ in range(38):
    next_points = [p.copy() for p in points]
    for i, (p, weight) in enumerate(zip(points, weights)):
        if weight and neighbours[i]:
            mean = sum((points[j] for j in neighbours[i]), Vector()) / len(neighbours[i])
            next_points[i] = p.lerp(mean, .55 * weight)
    points = next_points
inverse = obj.matrix_world.inverted()
for vertex in mesh.vertices:
    # Do not round/rewrite unaffected coordinates, even at UV seams.
    if weights[ids[vertex.index]]:
        vertex.co = inverse @ points[ids[vertex.index]]
mesh.update()
repaired = [obj.matrix_world @ v.co for v in mesh.vertices]
displacements = [(a - b).length for a, b in zip(original, repaired)]
outside = [d for i, d in enumerate(displacements) if weights[ids[i]] == 0]
assert max(outside, default=0) == 0, 'Edit escaped the finger brushes'
assert 0 < max(displacements) < .025, 'Unexpected finger displacement'
min_normal_dot = 1
for face in mesh.polygons:
    a, b, c = face.vertices
    old = (original[b] - original[a]).cross(original[c] - original[a]).normalized()
    new = (repaired[b] - repaired[a]).cross(repaired[c] - repaired[a]).normalized()
    min_normal_dot = min(min_normal_dot, old.dot(new))
assert min_normal_dot > 0, 'Repair flipped a triangle'

# Soft normals across UV seams remove lighting facets without resculpting the body.
def smooth_normals():
    normal_sums = [Vector() for _ in points]
    for face in mesh.polygons:
        face.use_smooth = True
        a, b, c = (mesh.vertices[i].co for i in face.vertices)
        normal = (b - a).cross(c - a)
        for i in face.vertices:
            normal_sums[ids[i]] += normal
    mesh.normals_split_custom_set_from_vertices([normal_sums[ids[i]].normalized() for i in range(len(mesh.vertices))])
smooth_normals()

# Follow the existing orange paint on the raised cuffs, not a spatial colour band.
body = mesh.materials[0]
body.name = 'army'
pad = body.copy()
pad.name = 'accent1'
mesh.materials.append(pad)
image = next(n.image for n in body.node_tree.nodes if n.type == 'TEX_IMAGE')
pixels = list(image.pixels)
w, h = image.size
uv = mesh.uv_layers.active.data
accent_faces = 0
painted = set()
for face in mesh.polygons:
    coord = sum((uv[i].uv for i in face.loop_indices), Vector((0, 0))) / 3
    x, y = min(w-1, max(0, int(coord.x*w))), min(h-1, max(0, int(coord.y*h)))
    r, g, b = pixels[(y*w+x)*4:(y*w+x)*4+3]
    co = sum((original[i] for i in face.vertices), Vector()) / 3
    if abs(co.x) > .3 and r > g * 1.5 and r > b * 1.9 and r > .12:
        painted.add(face.index)
# Warm baked shadows can pass the colour threshold. Only the two connected cuffs
# are colour features; reject isolated flecks elsewhere on the arms or fingers.
edge_faces = defaultdict(list)
for face in mesh.polygons:
    vs = [ids[i] for i in face.vertices]
    for a, b in zip(vs, vs[1:] + vs[:1]):
        edge_faces[tuple(sorted((a, b)))].append(face.index)
adjacent = [set() for _ in mesh.polygons]
for faces in edge_faces.values():
    for face in faces:
        adjacent[face].update(set(faces) - {face})
components = []
remaining = painted.copy()
while remaining:
    component = {remaining.pop()}
    pending = list(component)
    while pending:
        found = adjacent[pending.pop()] & remaining
        remaining.difference_update(found)
        component.update(found)
        pending.extend(found)
    components.append(component)
components.sort(key=len, reverse=True)
assert len(components) >= 2
painted = components[0] | components[1]
for i in painted:
    mesh.polygons[i].material_index = 1
accent_faces = len(painted)
assert 200 < accent_faces < 6000, 'Unexpected cuff classification'
obj.name = 'Ogre — repaired fingers'
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.export_scene.gltf(filepath=str(OUT/'ogre-repaired.glb'), use_selection=True, export_format='GLB', export_animations=False)

scene = bpy.context.scene
scene.render.resolution_x = scene.render.resolution_y = 700
scene.cycles.samples = 24
neutral = bpy.data.materials.new('Neutral clay inspection')
neutral.use_nodes = True
node = neutral.node_tree.nodes['Principled BSDF']
node.inputs['Base Color'].default_value = (.48, .40, .31, 1)
node.inputs['Roughness'].default_value = .9
scene.view_layers[0].material_override = neutral
camera = scene.camera
for state, positions in [('before', original), ('after', repaired)]:
    for v, co in zip(mesh.vertices, positions):
        v.co = inverse @ co
    mesh.update()
    smooth_normals()
    for side in (-1, 1):
        target = Vector((side*.4, -.10, -.17))
        camera.data.ortho_scale = .36
        camera.location = target + Vector((side*2, -4, 1))
        camera.rotation_euler = (target-camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(OUT/f'hand-{side}-{state}.png')
        bpy.ops.render.render(write_still=True)
scene.view_layers[0].material_override = None
camera.data.ortho_scale = 1.22
camera.location = (3, -4, 1.5)
camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'ogre-repaired.blend'))
report = {'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
          'changed_vertices': sum(d > 1e-7 for d in displacements),
          'max_displacement': max(displacements), 'outside_brush_max_displacement': max(outside),
          'minimum_triangle_normal_dot': min_normal_dot, 'accent_triangles': accent_faces,
          'retained_cuff_components': [len(c) for c in components[:2]],
          'triangles': len(mesh.polygons), 'uvs_and_topology': 'preserved',
          'scope': 'middle fingertips only; body shape and face unchanged; smooth shading added'}
(OUT/'verification.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report))
