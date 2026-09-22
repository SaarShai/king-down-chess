"""Check named feature and exclusion landmarks on the exported cast's source mesh.
Run with Blender --background --python tools/graphics-prototype/verify_cast_paint.py.
"""
import bpy, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'docs/graphics-prototype/complete-cast.blend'))
spec = json.loads((Path(__file__).parent/'paint-masks/landmarks.json').read_text())
results, layers = [], []
for key, item in spec.items():
    obj = bpy.data.objects[key+' source surface']
    for label, view, x, y, expected in item['probes']:
        camera = item['views'][view]
        origin = Vector(camera['position'])
        q = (Vector(camera['target'])-origin).to_track_quat('-Z','Y')
        origin += q @ Vector(((x/1000-.5)*camera['scale'], (.5-y/1000)*camera['scale'], 0))
        hit, _, _, face = obj.ray_cast(origin, q @ Vector((0,0,-1)))
        actual = obj.data.materials[obj.data.polygons[face].material_index].name.split('.')[0] if hit else None
        results.append({'character':key,'feature':label,'expected':expected,'actual':actual,'ok':actual==expected})
for obj in bpy.data.objects:
    if obj.type != 'MESH': continue
    mesh = obj.data
    if obj.name.startswith('pawn'):
        assert not mesh.shape_keys, 'Pawn must stay army-coloured without an accent layer'
        continue
    key = mesh.shape_keys.key_blocks['ClayLayer']
    army = {i for p in mesh.polygons if mesh.materials[p.material_index].name.split('.')[0]=='army' for i in p.vertices}
    moved = [(key.data[i].co-v.co).length for i,v in enumerate(mesh.vertices)]
    army_error = max((moved[i] for i in army),default=0)
    assert army_error < 1e-7, obj.name+': army surface or shared edge moved'
    assert 0 < max(moved) < .008, obj.name+': clay relief outside its authored thickness'
    assert key.value == 0, obj.name+': source look must default to the unraised sculpt'
    layers.append({'character':obj.name,'maxLift':max(moved),'armyAndSeamDisplacement':army_error,'raisedVertices':sum(d>1e-7 for d in moved)})
out=ROOT/'docs/graphics-prototype/applied-clay-verification';out.mkdir(exist_ok=True)
(out/'surface-checks.json').write_text(json.dumps({'probes':results,'layers':layers},indent=2)+'\n')
assert all(r['ok'] for r in results), [r for r in results if not r['ok']]
print('CAST_PAINT_CHECKS',len(results),'landmarks and',len(layers),'relief surfaces passed',flush=True)
