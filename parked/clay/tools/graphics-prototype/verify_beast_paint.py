"""Blender --background --python tools/graphics-prototype/verify_beast_paint.py.
Surface probes from the orthographic authoring views: straps versus fittings/skin.
"""
import bpy, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'docs/graphics-prototype/complete-cast.blend'))
obj = bpy.data.objects['beast source surface']
poses = {'front':(0,-4,.72), 'left':(-4,0,.72), 'right':(4,0,.72), 'back':(0,4,.72)}
probes = [
    ('left crown strap','left',540,250,'accent1'),
    ('left temple strap','left',523,402,'accent1'),
    ('left rear strap','left',244,386,'accent1'),
    ('left diagonal strap','left',528,613,'accent1'),
    ('right crown strap','right',466,257,'accent1'),
    ('right temple strap','right',450,388,'accent1'),
    ('rear band right','back',410,388,'accent1'),
    ('rear band left','back',637,390,'accent1'),
    ('left wrist strap','left',750,857,'accent1'),
    ('right wrist strap','right',269,850,'accent1'),
    ('muzzle frame','front',500,438,'army'),
    ('teeth','front',518,507,'army'),
    ('forehead skin','front',550,285,'army'),
    ('arm skin','left',571,727,'army'),
    ('left buckle rim','left',385,404,'army'),
    ('right buckle rim','right',641,370,'army'),
    ('hand chain','front',551,810,'army'),
    ('fingers','left',839,845,'army'),
    ('back skin','back',654,645,'army'),
]
results = []
for name, view, x, y, expected in probes:
    origin = Vector(poses[view])
    q = (Vector((0,0,.67))-origin).to_track_quat('-Z','Y')
    origin += q @ Vector(((x/1000-.5)*1.6*1000/1200, (.5-y/1200)*1.6, 0))
    hit, point, normal, face = obj.ray_cast(origin, q @ Vector((0,0,-1)))
    actual = obj.data.materials[obj.data.polygons[face].material_index].name.split('.')[0] if hit else None
    results.append({'feature':name, 'expected':expected, 'actual':actual, 'ok':actual==expected})
destination = ROOT/'docs/graphics-prototype/beast-straps-verification/paint-probes.json'
destination.parent.mkdir(exist_ok=True)
destination.write_text(json.dumps(results, indent=2)+'\n')
assert all(r['ok'] for r in results), [r for r in results if not r['ok']]
print('BEAST_PAINT_CHECKS', len(results), 'passed', flush=True)
