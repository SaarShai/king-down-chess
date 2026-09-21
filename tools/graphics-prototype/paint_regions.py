"""Cut paint boundaries into the surface, retaining interpolated normals and occlusion.

Regions are convex volumes in (x, fraction of figure height, forward z). They
change material boundaries only: no displacement, remeshing or runtime shader.
"""
import bpy
from mathutils import Vector


def box(x=(-2, 2), y=(-1, 2), z=(-2, 2)):
    return [(Vector(n), d) for n, d in [
        ((1, 0, 0), x[0]), ((-1, 0, 0), -x[1]),
        ((0, 1, 0), y[0]), ((0, -1, 0), -y[1]),
        ((0, 0, 1), z[0]), ((0, 0, -1), -z[1])]]


def front_polygon(points, z):
    """Counter-clockwise outline, extruded forward through the surface."""
    planes = [(Vector((0, 0, 1)), z)]
    for a, b in zip(points, points[1:] + points[:1]):
        normal = Vector((a[1] - b[1], b[0] - a[0], 0))
        planes.append((normal, normal.x * a[0] + normal.y * a[1]))
    return planes


def regions(name):
    if name == 'guard':
        return [
            # Continuous shoulder caps, wrapping around both sides of the armour.
            ('accent1', box(y=(.67, 1.1)) + [(Vector((s, 1.1, 0)), 1.18)])
            for s in [-1, 1]
        ] + [
            ('shade', box(y=(0, .085))),
            # One helmet rim and a recessed visor; two small, regular eye slits.
            ('light', front_polygon([(-.115,.695),(.115,.695),(.12,.773),(.075,.813),(-.075,.813),(-.12,.773)], .225)),
            ('shade', front_polygon([(-.084,.714),(.084,.714),(.087,.773),(.05,.789),(-.05,.789),(-.087,.773)], .235)),
            ('accent2', front_polygon([(-.079,.755),(-.024,.750),(-.024,.767),(-.079,.773)], .235)),
            ('accent2', front_polygon([(.024,.750),(.079,.755),(.079,.773),(.024,.767)], .235)),
        ]
    return [
        # A whole hood, an inset face opening, and coherent leather/weapon areas.
        ('accent1', box(x=(-.19,.19), y=(.796,1.1))),
        ('light', front_polygon([(-.060,.811),(.060,.811),(.102,.861),(.077,.918),(-.04,.934),(-.093,.887)], .028)),
        ('shade', box(x=(-.17,.17), y=(.567,.746), z=(.065,.4))),
        ('shade', box(y=(0,.105))),
        # The long leaf panels remain army coloured; colour no longer cuts across folds.
        ('accent2', box(x=(-.5,-.24), y=(.57,.84))),
        ('accent2', box(x=(.235,.5), y=(.385,.59))),
    ]


def paint_surface(mesh, name, height, roles, materials):
    ao_attribute = mesh.color_attributes.active_color
    # Payload: paint-space position, original smooth normal, neutral crease shade.
    vertices = []
    for v in mesh.vertices:
        vertices.append((Vector((v.co.x, v.co.z / height, -v.co.y)), v.normal.copy(), 1.))
    for loop in mesh.loops:
        p, n, _ = vertices[loop.vertex_index]
        vertices[loop.vertex_index] = (p, n, ao_attribute.data[loop.index].color[0])
    faces = [([vertices[i] for i in p.vertices], 'army') for p in mesh.polygons]
    original_area = sum(p.area for p in mesh.polygons)

    def split(polygon, normal, distance):
        inside, outside = [], []
        for a, b in zip(polygon, polygon[1:] + polygon[:1]):
            da, db = normal.dot(a[0]) - distance, normal.dot(b[0]) - distance
            (inside if da >= 0 else outside).append(a)
            if (da < 0) != (db < 0):
                t = da / (da - db)
                cut = (a[0].lerp(b[0], t), a[1].lerp(b[1], t), a[2] + (b[2] - a[2]) * t)
                inside.append(cut); outside.append(cut)
        return inside, outside

    for role, planes in regions(name):
        painted = []
        for polygon, previous_role in faces:
            # Reject disjoint polygons before introducing any cuts.
            if any(all(n.dot(v[0]) < d for v in polygon) for n, d in planes):
                painted.append((polygon, previous_role)); continue
            for normal, distance in planes:
                polygon, outside = split(polygon, normal, distance)
                if len(outside) >= 3: painted.append((outside, previous_role))
                if len(polygon) < 3: break
            if len(polygon) >= 3: painted.append((polygon, role))
        faces = painted

    points, indices, payloads, painted_roles, lookup = [], [], [], [], {}
    for polygon, role in faces:
        for i in range(1, len(polygon) - 1):
            tri = [polygon[0], polygon[i], polygon[i+1]]
            coords = [Vector((v[0].x, -v[0].z, v[0].y * height)) for v in tri]
            if (coords[1]-coords[0]).cross(coords[2]-coords[0]).length < 1e-10: continue
            face = []
            for p in coords:
                key = tuple(round(x, 9) for x in p)
                if key not in lookup: lookup[key] = len(points); points.append(p)
                face.append(lookup[key])
            if len(set(face)) != 3: continue
            indices.append(face); payloads.extend(tri); painted_roles.append(roles.index(role))
    result = bpy.data.meshes.new(mesh.name + ' · clean paint boundaries')
    result.from_pydata(points, [], indices); result.update()
    for role in roles: result.materials.append(materials[role])
    for polygon, role in zip(result.polygons, painted_roles):
        polygon.material_index = role; polygon.use_smooth = True
    result.normals_split_custom_set([v[1].normalized() for v in payloads])
    color = result.color_attributes.new(name='Crease shading', type='FLOAT_COLOR', domain='CORNER')
    for loop, v in zip(color.data, payloads): loop.color = (v[2], v[2], v[2], 1)
    result.color_attributes.active_color = color
    painted_area = sum(p.area for p in result.polygons)
    assert abs(painted_area / original_area - 1) < 1e-5, 'Paint cuts must preserve the sculpt surface'
    return result, {'surfaceAreaRelativeError': abs(painted_area / original_area - 1),
                    'sourceReducedTriangles': len(mesh.polygons), 'paintedTriangles': len(result.polygons)}
