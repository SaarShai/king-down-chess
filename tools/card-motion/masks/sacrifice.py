import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
rgb = painting('sacrifice'); h, s, v = hsv(rgb)
W, H = 491, 512  # The polygons below are in painting pixels, read from enlarged crops.
def poly(*pts): return polygon(rgb, [(x / W, y / H) for x, y in pts])

blade = poly((124,184),(175,230),(207,256),(240,285),(280,312),(311,340),(300,341),(260,325),(225,300),(185,267),(142,230),(105,195))
arm = poly((22,150),(30,118),(60,108),(100,116),(160,133),(360,148),(400,118),(440,102),(491,98),(491,225),(415,222),(290,215),(200,197),(130,186),(95,194),(40,198))
helmet = poly((430,0),(491,0),(491,110),(435,110))
body = poly((395,100),(491,100),(491,512),(372,512),(382,440),(394,330),(400,230))

# R: the thin fire. Colour key inside tight boxes round each lick; the blade's grey is below the saturation limit.
fire_zone = np.clip(
    poly((132,224),(150,226),(190,262),(190,272),(160,264),(138,246))
    + poly((176,232),(190,230),(212,254),(204,258))
    + poly((183,262),(205,260),(252,284),(246,292),(205,276))
    + poly((226,296),(248,300),(290,334),(280,342),(250,332)), 0, 1)
key = (s > .62) & (v > .55) & (((h > .02) & (h < .15)))
fire = fire_zone * key
fire = soften(fire, 1, 1.2)

# G: the air round the blade, where the light breathes and the embers rise. It keeps off the arm.
air = poly((130,205),(250,225),(345,300),(335,360),(270,350),(170,270),(120,225))
air = soften(air, 0, 7) * (1 - soften(arm, 1, 2))

# B: the bands of cloud, with some sky round them so the edges can move. Never the blade, the arm or the body.
clouds = np.clip(
    poly((0,28),(235,38),(235,95),(0,105))
    + poly((285,52),(378,52),(378,78),(285,78))
    + poly((135,84),(425,84),(425,115),(135,112))
    + poly((0,195),(75,195),(75,222),(0,222))
    + poly((25,270),(180,262),(300,250),(415,250),(415,305),(180,305),(25,305))
    + poly((0,340),(250,340),(250,405),(0,410))
    + poly((0,405),(345,405),(345,478),(0,482))
    + poly((35,478),(395,478),(395,512),(35,512)), 0, 1)
keep_off = np.clip(soften(blade, 3, 1) + soften(arm, 1, 1) + soften(helmet, 1, 1) + soften(body, 1, 1) + soften(fire_zone, 2, 1), 0, 1)
clouds = soften(clouds, 0, 5) * (1 - soften(keep_off, 1, 3))

save('sacrifice', fire, air, clouds)
