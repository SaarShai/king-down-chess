#!/usr/bin/env python3
"""Voxelize an STL sculpt into a compact JSON voxel model for the game.

Usage: voxelize.py in.stl out.json [--height 24] [--up auto|y|z] [--yaw 0]
Output: {"size": [sx, sy, sz], "voxels": [[x, y, z], ...]} — y up, x/z centred on the footprint, y from 0.
Requires: pip install trimesh numpy scipy
"""
import argparse
import json

import numpy as np
import trimesh

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('dst')
ap.add_argument('--height', type=int, default=24, help='model height in voxels (20 = chunky, 32 = faithful)')
ap.add_argument('--up', default='auto', choices=['auto', 'y', 'z'], help='up axis of the source file (auto = tallest extent)')
ap.add_argument('--yaw', type=float, default=0, help='rotate about the vertical axis (degrees) so the figure faces -z')
a = ap.parse_args()

m = trimesh.load(a.src, force='mesh')
print(f'source extents x/y/z: {np.round(m.extents, 2)}')
if a.up == 'auto':
    a.up = 'z' if m.extents[2] >= m.extents[1] else 'y'
if a.up == 'z':
    m.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]))
if a.yaw:
    m.apply_transform(trimesh.transformations.rotation_matrix(np.radians(a.yaw), [0, 1, 0]))
m.apply_translation(-m.bounds[0])
pitch = m.extents[1] / a.height
grid = m.voxelized(pitch).fill()
mat = grid.matrix
sx, sy, sz = mat.shape
idx = np.argwhere(mat)
out = {
    'size': [int(sx), int(sy), int(sz)],
    'voxels': [[int(x - sx // 2), int(y), int(z - sz // 2)] for x, y, z in idx],
}
with open(a.dst, 'w') as f:
    json.dump(out, f, separators=(',', ':'))
print(f'{a.dst}: grid {mat.shape}, {len(idx)} voxels, pitch {pitch:.3f} (source units)')
