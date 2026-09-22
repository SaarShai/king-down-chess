"""Exact boot/hem triangle intersections through a cycle and walk fades.
BISHOP_CLEARANCE_BLEND selects a saved baseline as a negative control.
BISHOP_CLEARANCE_OUT selects the JSON report path.
"""
import bpy,json,os
from pathlib import Path
from mathutils import Matrix,Quaternion,Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import intersect_ray_tri
root=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=os.environ.get('BISHOP_CLEARANCE_BLEND',str(root/'docs/graphics-prototype/complete-cast.blend')))
obj=bpy.data.objects['bishop source surface'];rig=obj.parent;rig.data.pose_position='POSE';mesh=obj.data
adj=[set() for v in mesh.vertices]
for e in mesh.edges:
 a,b=e.vertices;adj[a].add(b);adj[b].add(a)
remain=set(range(len(adj)));boot=set()
while remain:
 seed=remain.pop();island={seed};q=[seed]
 while q:
  for j in adj[q.pop()]&remain:remain.remove(j);island.add(j);q.append(j)
 if max(mesh.vertices[i].co.z for i in island)<.095:boot.update(island)
mesh.calc_loop_triangles();feet=[tuple(t.vertices) for t in mesh.loop_triangles if all(i in boot for i in t.vertices)]
cloth={v.index for v in mesh.vertices if any(obj.vertex_groups[g.group].name.startswith('cloth') and g.weight>.01 for g in v.groups)}
robe=[tuple(t.vertices) for t in mesh.loop_triangles if any(i in cloth for i in t.vertices) and min(mesh.vertices[i].co.z for i in t.vertices)<.3]
def crosses(a,b):
 for A,B in [(a,b),(b,a)]:
  for i in range(3):
   d=A[(i+1)%3]-A[i];hit=intersect_ray_tri(*B,d,A[i],True)
   if hit is not None:
    t=(hit-A[i]).dot(d)/d.length_squared
    if 1e-5<t<1-1e-5:return True
 return False
rows=[];rest_pairs=set()
for i,weight in [(0,0.)]+[(i,1.) for i in range(97)]+[(i,w) for i in range(0,97,2) for w in [0.,.25,.5,.75]]:
 frame=1+i*52/96;bpy.context.scene.frame_set(int(frame),subframe=frame%1)
 for bone in rig.pose.bones:
  loc,rot,scale=bone.matrix_basis.decompose()
  bone.matrix_basis=Matrix.LocRotScale(loc*weight,Quaternion().slerp(rot,weight),Vector((1,1,1)).lerp(scale,weight))
 bpy.context.view_layer.update()
 evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());m=evaluated.to_mesh();vs=[v.co.copy() for v in m.vertices]
 a=BVHTree.FromPolygons(vs,feet,all_triangles=True);b=BVHTree.FromPolygons(vs,robe,all_triangles=True)
 collisions=[(j,k) for j,k in a.overlap(b) if crosses([vs[v] for v in feet[j]],[vs[v] for v in robe[k]])]
 if weight==0:rest_pairs.update(collisions)
 rows.append({'newIntersections':len(set(collisions)-rest_pairs),'phase':i/96,'weight':weight,'intersections':len(collisions)});evaluated.to_mesh_clear()
report={'bootTriangles':len(feet),'robeTriangles':len(robe),'maxIntersections':max(r['intersections'] for r in rows),'collidingPhases':sum(r['intersections']>0 for r in rows),'sourceRestIntersections':len(rest_pairs),'newIntersections':max(r['newIntersections'] for r in rows),'samples':len(rows),'frames':rows}
output=Path(os.environ.get('BISHOP_CLEARANCE_OUT',str(root/'docs/graphics-prototype/capture-verification/bishop-clearance.json')))
output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2)+'\n')
print('BISHOP_CLEARANCE',json.dumps({k:v for k,v in report.items() if k!='frames'}),flush=True)
assert report['maxIntersections']==0, 'Bishop boots intersect the robe'
