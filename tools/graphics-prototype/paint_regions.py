"""Cut paint boundaries into the surface, retaining interpolated normals and occlusion.

Regions are convex volumes in (x, fraction of figure height, forward z). They
change material boundaries only: no displacement, remeshing or runtime shader.
"""
import bpy, math
from mathutils import Vector


def front_polygon(points, z):
    """Counter-clockwise outline, extruded forward through the surface."""
    planes = [(Vector((0, 0, 1)), z)]
    for a, b in zip(points, points[1:] + points[:1]):
        normal = Vector((a[1] - b[1], b[0] - a[0], 0))
        planes.append((normal, normal.x * a[0] + normal.y * a[1]))
    return planes


def regions(name):
    if name == 'guard':
        # Trace the inner shoulder arch instead of slicing the plates with one diagonal.
        profile = [(.58,.47),(.66,.47),(.74,.43),(.82,.37),(.90,.28),(.97,.14),(1.02,.065)]
        result = []
        for sign in [-1,1]:
            for (low,x0),(high,x1) in zip(profile,profile[1:]):
                points = [(sign*x0,low),(sign*1.,low),(sign*1.,high),(sign*x1,high)]
                if sign < 0: points.reverse()
                result.append(('accent1',front_polygon(points,-2)))
        return result
    # The sculpt's head faces diagonally. Author its opening in that local frame,
    # so the green follows cloth rather than cutting through cheek, hair and neck.
    def head_frame(planes):
        c = math.sqrt(.5)
        return [(Vector(((n.x-n.z)*c,n.y,(n.x+n.z)*c)),d) for n,d in planes]
    # Opening traced from an orthographic source view, including its asymmetric brow.
    opening = [(-.138,.760),(.087,.760),(.059,.833),(.046,.898),(.029,.932),(-.011,.953),(-.054,.932),(-.099,.901)]
    return [
        ('accent1', head_frame(front_polygon([(-.15,.834),(0,.802),(.13,.83),(.13,1.1),(-.15,1.1)],-2))),
        ('army', head_frame(front_polygon(opening,.015))),
    ]


def paint_surface(mesh, name, height, roles, materials, region_list=None):
    ao_attribute = mesh.color_attributes.active_color
    # Payload: paint-space position, original smooth normal, neutral crease shade.
    vertices = []
    for v in mesh.vertices:
        vertices.append((Vector((v.co.x, v.co.z / height, -v.co.y)), v.normal.copy(), 1.))
    for loop in mesh.loops:
        p, n, _ = vertices[loop.vertex_index]
        vertices[loop.vertex_index] = (p, n, ao_attribute.data[loop.index].color[0])
    faces = [([(vertices[mesh.loops[i].vertex_index][0], mesh.corner_normals[i].vector.copy(),
                vertices[mesh.loops[i].vertex_index][2]) for i in p.loop_indices], 'army') for p in mesh.polygons]
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

    for role, planes in (regions(name) if region_list is None else region_list):
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
