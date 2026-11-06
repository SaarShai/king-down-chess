"""Sacrifice. R: the banners, tight at the pole and free at the tail. G: the sky's clouds, the sun's air and the sun's light on the water. B: 1 in the shell's broken inside (warm light), about .45 in the air round the shell (dust)."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('sacrifice'); h, s, v = hsv(rgb)
H, W = v.shape
Y, X = np.mgrid[0:H, 0:W]
x, y = (X + .5) / W, (Y + .5) / H

def ramp(a, b): return np.clip((y - a) / (b - a), 0, 1)
def fall(a, b): return 1 - ramp(a, b)
# The centre crop's pixels: 3x enlargement of x .36 to .68, y .05 to .85 at 1024 x 576.
def C(*pts): return polygon(rgb, [(.36 + a / 3072, .05 + b / 1728) for a, b in pts])

# R: each banner, traced from the enlarged crops with its gold edge. The sides grow past the cloth so that its edges may move.
big = polygon(rgb, [(.884,.157),(.928,.150),(.928,.375),(.918,.415),(.905,.445),(.896,.42),(.886,.375)])
far = polygon(rgb, [(.960,.0),(1.,.0),(1.,.312),(.985,.362),(.973,.33),(.960,.288)])
left = polygon(rgb, [(0,.338),(.052,.338),(.054,.42),(.052,.512),(0,.512)])
small = polygon(rgb, [(.800,.235),(.819,.235),(.820,.36),(.812,.40),(.801,.37)])
banners = np.maximum.reduce([
    soften(big, 2, 1.5) * ramp(.16, .30),
    soften(far, 2, 1.5) * ramp(.01, .20),
    soften(left, 2, 1.5) * ramp(.34, .42) * fall(.47, .515),
    soften(small, 1, 1.2) * ramp(.24, .32) * .7,
])

# The pawn's shell, its fragments and the rook: nothing here moves, and dust passes behind them.
solid = np.maximum.reduce([
    C((470,2),(560,18),(640,75),(690,170),(688,270),(640,380),(752,440),(750,500),(712,525),(714,570),(685,572),(660,540),(668,640),(652,780),(720,830),(790,830),(860,920),(880,1040),(860,1160),(800,1230),(990,1290),(990,1390),(0,1390),(0,1090),(250,1030),(150,860),(158,720),(185,620),(232,558),(300,590),(300,490),(245,470),(255,420),(310,385),(255,270),(262,160),(330,60),(400,18)),
    C((752,690),(790,632),(826,690),(800,752),(760,720)),
    C((65,990),(105,930),(146,985),(100,1052),(70,1030)),
    C((640,370),(700,370),(752,440),(750,500),(712,525),(660,450)),
])
solid = soften(solid, 1, 1)

# B: the broken inside of the shell, by its saturated gold. The rook's pale marble keeps out.
rook = C((345,545),(605,545),(608,650),(590,690),(570,800),(575,900),(620,965),(650,1040),(680,1100),(250,1100),(300,1040),(340,960),(375,900),(382,800),(370,690),(345,650))
inside = np.maximum.reduce([
    C((345,540),(400,520),(440,470),(560,495),(640,505),(650,560),(660,620),(640,680),(612,770),(575,810),(590,690),(608,650),(605,545)),
    C((575,810),(640,850),(720,880),(780,920),(770,1000),(690,1080),(650,1040),(620,965),(575,900)),
    C((372,700),(330,770),(280,830),(260,900),(320,1010),(345,960),(375,900),(382,800)),
    C((610,100),(560,170),(520,250),(480,330),(540,372),(590,290),(600,180)),
])
gold = (s > .45) & (h > .04) & (h < .14)
inside = soften(inside * gold * (1 - rook), 1, 1.5)

# The dust stays close to the shell: a ring round it, wider at the sides where the painting already has dust, and above the wall.
ring = soften(solid, 15, 6)
air = ring * (1 - solid) * ramp(.18, .27) * fall(.57, .66)
ivory = np.maximum(air * .45, inside)

# G: the sky above the ridge. It keeps off the towers, the shell and the dust. The water's light lies below it.
sky = polygon(rgb, [(0,0),(.95,0),(.875,.145),(.875,.34),(.785,.34),(.78,.20),(.74,.20),(.74,.33),(.70,.42),(.64,.41),(.40,.42),(.34,.435),(.26,.43),(.20,.40),(.14,.40),(.10,.34),(.06,.34),(.06,.27),(0,.27)])
keep_off = np.maximum(solid, soften(air, 2, 3))
sky = soften(sky, 0, 2) * (1 - soften(keep_off, 3, 3))
water = soften(polygon(rgb, [(.255,.548),(.33,.548),(.335,.58),(.25,.58)]) * (v > .62), 2, 2.5) * .9
air_water = np.maximum(sky, water)

save('sacrifice', banners, air_water, ivory)
