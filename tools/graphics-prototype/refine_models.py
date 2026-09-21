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
from paint_regions import paint_surface
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


def read_figure(path, height):
    vertices, faces, material = [], [], ''
    for line in path.open():
        tokens = line.split()
        if not tokens: continue
        if tokens[0] == 'v': vertices.append(tuple(map(float,tokens[1:4])))
        elif tokens[0] == 'usemtl': material = tokens[1]
        elif tokens[0] == 'f' and material != 'Texture':
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
    """Quiet shallow surface noise before reduction; protect defining small features."""
    before = [v.co.copy() for v in obj.data.vertices]
    group = obj.vertex_groups.new(name='Surface cleanup · protected face and silhouette details')
    limits = []
    for v in obj.data.vertices:
        x, y, z = v.co.x, v.co.z / height, -v.co.y
        limit = height * (.009 if name == 'guard' else .006)
        if name == 'guard':
            weight = .55
            if y > .67 and abs(x) + 1.1*y > 1.16:
                weight = 1.; limit = height * .02
            if .43 < y < .68 and .12 < abs(x) < .44 and z > .14: weight = .9
            if .66 < y < .83 and abs(x) < .15 and z > .17: weight = .05
            if y > .80 and abs(x) < .29 and z < -.10: weight = .1
            if y < .16 or (y < .43 and abs(x) > .40): weight = .2
        else:
            weight = .6 if y < .52 else .45
            if .14 < y < .49: limit = height * .009
            if y > .80: weight = .7
            if y > .80 and abs(x) < .115 and z > .015: weight = .08
            if .5 < y < .83 and abs(x) < .105 and z > .08: weight = .08
            if .38 < y < .85 and abs(x) > .23: weight = .5
            if y < .12: weight = .15
        group.add([v.index], weight, 'REPLACE')
        limits.append(limit)
    smooth = obj.modifiers.new('Simplify small bumps and engraved clutter', 'SMOOTH')
    iterations = 24 if name == 'guard' else 16
    smooth.factor = .7; smooth.iterations = iterations; smooth.vertex_group = group.name
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    # Cap local movement so cloth edges, weapon limbs and armour proportions stay intact.
    distances = []
    for v, start, limit in zip(obj.data.vertices, before, limits):
        delta = v.co - start
        if delta.length > limit: v.co = start + delta.normalized() * limit
        distances.append((v.co-start).length)
    obj.data.update()
    return {'iterations':iterations, 'maxDisplacement':max(distances),
            'rmsDisplacement':math.sqrt(sum(d*d for d in distances)/len(distances)),
            'height':height}


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


report = []
for name, source, height, target in [('guard','Guard_22mm.obj',1.40,12000), ('archer','Archer_2.obj',1.45,14000)]:
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
    ao_range = bake_creases(mesh,.075 if name=='guard' else .065)
    mesh, paint_report = paint_surface(mesh, name, height, roles, materials)
    obj.data = mesh
    areas = {role:0. for role in roles}
    for polygon in mesh.polygons: areas[roles[polygon.material_index]] += polygon.area
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);root.select_set(True)
    destination = OUT/('rebuilt-'+name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(destination),use_selection=True,export_format='GLB',export_materials='EXPORT',export_animations=False,export_cameras=False,export_lights=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
    mesh.calc_loop_triangles()
    report.append({'name':'rebuilt-'+name,'triangles':len(mesh.loop_triangles),'bytes':destination.stat().st_size,
                   'source':source,'sourceTriangles':source_tris,'materialAreaShare':{k:round(v/sum(areas.values()),4) for k,v in areas.items()},'creaseShadingRange':ao_range,'paintBoundaryCheck':paint_report,'featureCleanup':smoothing_report})
    root.location.x = -1. if name=='guard' else 1.

bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/graphics-prototype/rebuilt-pieces.blend'))
manifest_path = OUT/'manifest.json'
manifest = json.loads(manifest_path.read_text())
manifest['method'] = 'Source-derived Guard/Archer with selective feature smoothing, continuous cut-in paint boundaries and baked crease shading; earlier blockouts retained for comparison'
manifest['models'] = [m for m in manifest['models'] if m['name'] not in ['rebuilt-guard','rebuilt-archer']] + report
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('REFINEMENT_REPORT',json.dumps(report))
