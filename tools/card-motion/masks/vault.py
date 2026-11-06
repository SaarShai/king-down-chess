import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
from math import cos, sin, radians
rgb = painting('vault'); h, s, v = hsv(rgb)

def poly(*points):
    """Polygon in the 1024 px grid used to read the painting."""
    return polygon(rgb, [(x / 1024, y / 1024) for x, y in points])

def union(*masks):
    return np.maximum.reduce(masks)

def ellipse(cx, cy, rx, ry, turn=0):
    a, b = radians(turn), [radians(i * 15) for i in range(24)]
    return poly(*[(cx + rx * cos(i) * cos(a) - ry * sin(i) * sin(a), cy + rx * cos(i) * sin(a) + ry * sin(i) * cos(a)) for i in b])

# Keep the stag and the stone out of the moving paint.
stag = poly((360,395),(375,365),(470,335),(600,285),(645,255),(830,250),(830,400),(860,440),(840,520),(740,590),(720,560),(770,520),(790,460),(720,500),(660,545),(660,510),(700,480),(500,470),(400,520),(300,620),(240,655),(235,625),(290,590),(330,530),(360,490),(340,470),(280,510),(230,570),(190,600),(190,560),(260,470),(305,432))
# The polygon sits a little inside the painted edge; the colour key finds the rest of the hide.
stag = np.maximum(stag, soften(stag, 5, 0) * (h < .12) * (s > .4) * (v < .8))
rock = (s < .35) & (v < .72) & (poly((0,380),(620,540),(620,1024),(0,1024)) > 0)
wall = poly((400,720),(528,682),(538,770),(548,850),(640,880),(640,1024),(380,1024))

# R: the loose leaves, whole, with a margin of sky so that the leaf moves and only the sky bends.
leaves = union(*[ellipse(*e) for e in [
    (100,138,74,34,-14), (28,208,38,18), (80,280,24,16,20), (130,288,28,24,40), (202,290,25,17,20),
    (264,344,38,30,-30), (300,387,36,20,20), (370,319,18,16), (428,258,36,19,16), (422,33,24,14,15),
    (435,584,34,38), (527,561,28,16,8), (570,733,30,13,-8), (566,760,20,20,40), (635,737,18,18),
    (622,812,30,18,50), (850,897,28,16,-5)]])
# The rocks near the leaves, sunlit faces too: the colour key finds only their dark faces.
rocks = union(ellipse(472,620,18,20), ellipse(413,660,34,26), poly((0,320),(60,318),(98,350),(98,400),(0,400)))
keep_out = soften(np.maximum(np.maximum(stag, wall), np.maximum(rocks, rock * 1.)), 2, 1)
r = soften(leaves, 5, 3) * (1 - keep_out * (1 - soften(leaves, 0, 1)))  # A leaf's own dark paint must not cut the leaf.

# G: the streaks of cream light, with a low soft halo on the sky round them. No stag, stone, leaf or cloud.
ways = union(
    poly((275,285),(610,170),(650,195),(630,225),(290,315)),
    poly((105,365),(320,285),(350,300),(340,330),(130,400)),
    poly((345,340),(640,250),(650,268),(600,278),(470,328),(375,360),(355,375)),
    poly((165,490),(200,420),(355,365),(375,390),(345,425),(290,435),(250,470),(210,530),(170,570)),
    poly((440,560),(680,478),(690,495),(460,585)),
    poly((300,590),(400,505),(460,510),(470,570),(360,670),(330,640)))
cream = (h > .09) & (h < .31) & (s < .6) & (v > .7)
core = ways * cream * (1 - stag)
g = np.maximum(soften(core, 0, 1), .6 * soften(core, 2, 4)) * (1 - soften(stag, 0, 1)) * (1 - soften(rock * 1., 0, 1))

# B: the ivy on the wall. Leaf colour only, so that the stone stays still.
vines = union(
    poly((0,360),(135,360),(135,400),(90,500),(85,610),(200,640),(290,720),(285,790),(190,835),(110,780),(0,740)),
    poly((375,730),(420,730),(460,790),(545,830),(545,1000),(390,1000),(400,880)),
    poly((615,880),(720,900),(720,1024),(630,1024)),
    poly((795,925),(880,960),(870,1024),(790,1024)))
ivy = vines * (h > .13) * (h < .42) * (s > .35)
b = soften(ivy, 1, 1) * (1 - soften(leaves, 1, 1))

save('vault', r, g, b)
