"""A thin applied-clay relief, stored as one optional native glTF shape key.

The painted feature supplies the footprint. Its edge stays on the sculpt while
the interior rounds out, so there are no floating shells or gaps during a walk.
"""
import heapq
from collections import defaultdict


def add_clay_layer(obj, height):
    mesh = obj.data
    accent = set()
    army = set()
    edges = defaultdict(set)
    for face in mesh.polygons:
        painted = mesh.materials[face.material_index].name.split('.')[0] == 'accent1'
        (accent if painted else army).update(face.vertices)
        if painted:
            for a, b in face.edge_keys:
                edges[a].add(b)
                edges[b].add(a)
    if not accent:
        return None
    boundary = accent & army
    # Some source features (the mitre, for example) are already separate closed
    # components. They round out uniformly; fused patches taper at their seam.
    distance = {i: 0. for i in boundary}
    queue = [(0., i) for i in boundary]
    heapq.heapify(queue)
    while queue:
        d, i = heapq.heappop(queue)
        if d != distance[i]:
            continue
        for j in edges[i]:
            candidate = d + (mesh.vertices[i].co - mesh.vertices[j].co).length
            if candidate < distance.get(j, float('inf')):
                distance[j] = candidate
                heapq.heappush(queue, (candidate, j))
    obj.shape_key_add(name='Basis')
    layer = obj.shape_key_add(name='ClayLayer')
    moved = 0
    max_lift = height * .0045
    for i in accent - boundary:
        t = min(1., distance.get(i, height) / (height * .024))
        lift = max_lift * t * t * (3 - 2 * t)
        layer.data[i].co += mesh.vertices[i].normal * lift
        moved += lift > 1e-7
    layer.value = 0
    assert moved, 'Applied clay needs interior surface vertices'
    return {'shapeKey': 'ClayLayer', 'raisedVertices': moved,
            'boundaryVertices': len(boundary), 'maxLift': max_lift,
            'edgeWidth': height * .024, 'armyDisplacement': 0}
