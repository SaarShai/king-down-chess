"""Source-derived Guard/Archer detail pass. Run in Blender; no replacement character design.

Keep the original surface proportions, remove only the separate Texture pedestal,
reduce mesh density, assign a small army/type material vocabulary, and bake local
crease occlusion into vertex colours. The source OBJs and colour guides are the references.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/prototype/models'
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


def material_role(name, p, normal, height):
    x, y, z = p.x, p.z/height, -p.y
    front = -normal.y
    if name == 'guard':
        # Recessed helmet, sculpted armour rims, collar ribs and separate fingers
        # already exist in the source; colour supports those surfaces.
        if .67 < y < .82 and abs(x) < .125 and z > .22:
            if .741 < y < .766 and .025 < abs(x) < .09 and front > .1: return 'accent2'
            if .715 < y < .792 and abs(x) < .102: return 'shade'
            return 'light'
        if y > .81 and abs(x) > .25 and z > .08: return 'accent1'
        if y > .80 and abs(x) > .27 and z < -.15: return 'accent1'
        if .18 < y < .48 and abs(x) < .025 and z > .21: return 'shade'
        if y < .12 or (.17 < y < .42 and abs(x) > .47): return 'shade'
    else:
        # Original anatomy/face/braid are kept as a sculptural army-family treatment.
        # The hood opening and selected skirt folds carry green; weapons carry ochre.
        if y > .80:
            if abs(x) < .095 and z > .03:
                return 'light'
            if (abs(x) > .095 and y > .84) or (z < -.055 and y > .82): return 'accent1'
        if .38 < y < .77 and (x < -.21 or x > .235): return 'accent2'
        if y < .11: return 'shade'
        if .20 < y < .48 and abs(x+.11) < .055 and z > .13: return 'accent1'
        if .18 < y < .49 and abs(x-.04) < .038 and z < -.12: return 'accent1'
        if .58 < y < .77 and abs(x) < .15 and z > .07: return 'shade'
        if .48 < y < .59 and abs(x) < .13 and z > .07: return 'light'
    return 'army'


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
    reduction = obj.modifiers.new('Silhouette-preserving reduction','DECIMATE')
    reduction.ratio = min(1.,target/source_tris)
    bpy.ops.object.modifier_apply(modifier=reduction.name)
    mesh = obj.data
    for role in roles: mesh.materials.append(materials[role])
    areas = {role:0. for role in roles}
    for polygon in mesh.polygons:
        p = sum((mesh.vertices[i].co for i in polygon.vertices),Vector())/len(polygon.vertices)
        role = material_role(name,p,polygon.normal,height)
        polygon.material_index = roles.index(role); polygon.use_smooth = True
        areas[role] += polygon.area
    ao_range = bake_creases(mesh,.075 if name=='guard' else .065)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);root.select_set(True)
    destination = OUT/('rebuilt-'+name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(destination),use_selection=True,export_format='GLB',export_materials='EXPORT',export_animations=False,export_cameras=False,export_lights=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
    mesh.calc_loop_triangles()
    report.append({'name':'rebuilt-'+name,'triangles':len(mesh.loop_triangles),'bytes':destination.stat().st_size,
                   'source':source,'sourceTriangles':source_tris,'materialAreaShare':{k:round(v/sum(areas.values()),4) for k,v in areas.items()},'creaseShadingRange':ao_range})
    root.location.x = -1. if name=='guard' else 1.

bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/graphics-prototype/rebuilt-pieces.blend'))
manifest_path = OUT/'manifest.json'
manifest = json.loads(manifest_path.read_text())
manifest['method'] = 'Source-derived refined Guard/Archer with semantic materials and baked crease shading; earlier blockouts retained for comparison'
manifest['models'] = [m for m in manifest['models'] if m['name'] not in ['rebuilt-guard','rebuilt-archer']] + report
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('REFINEMENT_REPORT',json.dumps(report))
