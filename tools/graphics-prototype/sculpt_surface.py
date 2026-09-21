"""Shared source-surface preparation; preserves the supplied character geometry."""
import bpy, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def read_figure(path, height):
    vertices, faces, material = [], [], ''
    for line in path.open():
        tokens = line.split()
        if not tokens: continue
        if tokens[0] == 'v': vertices.append(tuple(map(float,tokens[1:4])))
        elif tokens[0] == 'usemtl': material = tokens[1]
        elif tokens[0] == 'f' and not material.startswith('Texture'):
            faces.append([int(x.split('/')[0])-1 for x in tokens[1:]])
    used = sorted({i for face in faces for i in face})
    remap = {i:j for j,i in enumerate(used)}
    lo = [min(vertices[j][i] for j in used) for i in range(3)]
    hi = [max(vertices[j][i] for j in used) for i in range(3)]
    scale = height / (hi[1]-lo[1])
    # Input Y-up, +Z faces forward; Blender Z-up, -Y faces forward.
    points = [((vertices[i][0]-(hi[0]+lo[0])/2)*scale,
               -(vertices[i][2]-(hi[2]+lo[2])/2)*scale,
               (vertices[i][1]-lo[1])*scale) for i in used]
    return points, [[remap[i] for i in face] for face in faces]


def smooth_features(obj, name, height):
    """Relax broad surfaces slightly, pinning crease edges and defining features."""
    mesh = obj.data
    before = [v.co.copy() for v in mesh.vertices]
    edge_faces = {}
    for face in mesh.polygons:
        for edge in face.edge_keys: edge_faces.setdefault(edge, []).append(face)
    pinned = set()
    for edge, faces in edge_faces.items():
        if len(faces) != 2 or faces[0].normal.angle(faces[1].normal, 0) > math.radians(28):
            pinned.update(edge)
    group = obj.vertex_groups.new(name='Broad surface relaxation')
    for v in mesh.vertices:
        x, y, z = v.co.x, v.co.z / height, -v.co.y
        head_x, head_z = (x+z)*math.sqrt(.5), (-x+z)*math.sqrt(.5)
        protected = (name == 'guard' and (.63 < y < .84 and abs(x)<.17 and z>.15)) or (name == 'archer' and y>.48 and head_z>.04)
        weight = 0. if v.index in pinned or protected else 1.
        group.add([v.index], weight, 'REPLACE')
    smooth = obj.modifiers.new('Relax interiors, retain feature edges', 'SMOOTH')
    smooth.factor = .35; smooth.iterations = 3; smooth.vertex_group = group.name
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    obj.vertex_groups.clear()
    distances = []
    for v, start in zip(obj.data.vertices, before):
        delta = v.co-start; limit = height*.003
        if delta.length > limit: v.co = start+delta.normalized()*limit
        distances.append((v.co-start).length)
    obj.data.update()
    return {'iterations':3, 'pinnedCreaseVertices':len(pinned),
            'maxDisplacement':max(distances),
            'rmsDisplacement':math.sqrt(sum(d*d for d in distances)/len(distances)), 'height':height}


def bake_creases(mesh, reach):
    """Local neutral occlusion only; runtime colours and lighting still belong to the army."""
    mesh.update()
    tree = BVHTree.FromPolygons([v.co for v in mesh.vertices], [p.vertices[:] for p in mesh.polygons])
    ao = []
    count = 24
    for vertex in mesh.vertices:
        n = vertex.normal.normalized()
        tangent = n.cross(Vector((0,0,1)) if abs(n.z)<.9 else Vector((0,1,0))).normalized()
        bitangent = n.cross(tangent)
        blocked = 0.
        for j in range(count):
            r = math.sqrt((j+.5)/count)
            angle = j*2.399963229728653
            direction = tangent*(r*math.cos(angle))+bitangent*(r*math.sin(angle))+n*math.sqrt(1-r*r)
            hit, _, _, distance = tree.ray_cast(vertex.co+n*.0012, direction, reach)
            if hit is not None: blocked += 1.-distance/reach
        ao.append(max(.50, 1.-.72*blocked/count))
    attribute = mesh.color_attributes.new(name='Crease shading', type='FLOAT_COLOR', domain='CORNER')
    for polygon in mesh.polygons:
        for loop in polygon.loop_indices:
            shade = ao[mesh.loops[loop].vertex_index]
            attribute.data[loop].color = (shade,shade,shade,1)
    mesh.color_attributes.active_color = attribute
    return [min(ao), max(ao)]
