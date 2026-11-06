"""Hop. R: the loose leaves in the air and the blurred leaves in the near corners. G: the ivy on the wall. B: the sun's glow on the sky and clouds."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('vault'); h, s, v = hsv(rgb)
H, W = v.shape

def grow(mask, n):
    return np.asarray(Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MaxFilter(n * 2 + 1)), dtype=np.float32) / 255
def shrink(mask, n):
    return np.asarray(Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MinFilter(n * 2 + 1)), dtype=np.float32) / 255

# Loose leaves, traced on enlarged crops. Upper crop: x = px / 2048, y = .05 + py / 1152. Lower crop: x = .2 + px / 2048, y = .45 + py / 1152.
def upper(*pts): return polygon(rgb, [(x / 2048, .05 + y / 1152) for x, y in pts])
def lower(*pts): return polygon(rgb, [(.2 + x / 2048, .45 + y / 1152) for x, y in pts])
air = np.maximum.reduce([
    upper((100,135),(135,85),(210,65),(290,72),(240,115),(215,145),(160,155),(105,145)),
    upper((240,222),(300,222),(340,245),(352,280),(300,270),(262,252)),
    upper((385,282),(440,290),(480,320),(500,340),(485,360),(440,350),(410,325)),
    upper((5,315),(60,315),(100,340),(130,370),(150,405),(110,395),(70,370),(30,340)),
    upper((535,215),(560,222),(582,248),(555,235)),
    upper((585,265),(610,270),(612,290),(595,283)),
    upper((518,365),(560,372),(590,395),(598,428),(560,420),(530,395)),
    upper((600,385),(630,405),(680,420),(710,440),(730,495),(690,470),(650,445),(615,410)),
    upper((690,335),(730,340),(755,365),(755,378),(720,365)),
    upper((842,345),(860,350),(877,367),(855,362)),
    upper((885,188),(915,190),(938,220),(910,215)),
    upper((932,258),(960,262),(978,283),(950,280)),
    lower((395,180),(430,185),(455,200),(460,225),(430,243),(412,220)),
    lower((470,270),(510,278),(540,300),(558,335),(520,325),(490,305)),
    lower((755,408),(800,415),(840,450),(875,480),(875,520),(850,505),(800,480),(770,440)),
    lower((160,525),(205,545),(240,600),(200,585),(170,555)),
])
# The flying stones next to the leaf under the stag must not bend.
stones = polygon(rgb, [(.355,.625),(.393,.625),(.393,.675),(.355,.675)])
# The stag's two back legs and antlers lie next to leaves: the margin of a leaf must stop short of them.
stag_near = np.maximum.reduce([
    lower((250,140),(268,92),(300,82),(360,16),(420,-4),(402,36),(352,92),(302,134)),
    lower((296,194),(318,146),(344,136),(410,56),(590,36),(572,68),(492,94),(412,104),(372,154),(342,190)),
    polygon(rgb, [(.484,.16),(.56,.16),(.56,.30),(.484,.30)]),
])
keep = soften(np.maximum(stones, stag_near), 1, 1)
leaves = soften(air, 4, 2) * (1 - keep * (1 - soften(air, 0, .6)))

# The big blurred leaves in the near corners sway softly; their blur hides the soft mask.
near = np.maximum(
    polygon(rgb, [(0,.70),(.06,.70),(.10,.76),(.17,.84),(.165,.92),(.14,1),(0,1)]),
    polygon(rgb, [(.875,1),(.89,.93),(.93,.86),(1,.81),(1,1)]))
r = np.maximum(leaves, soften(near, 0, 4) * .8)

# The ivy: leaf colour inside the clumps. Stone and grass stay out.
clumps = np.maximum.reduce([
    polygon(rgb, [(0,.47),(.08,.47),(.13,.56),(.17,.63),(.17,.70),(.09,.68),(0,.66)]),
    polygon(rgb, [(.18,.65),(.25,.66),(.285,.72),(.30,.80),(.28,.875),(.23,.86),(.19,.79),(.165,.70)]),
    polygon(rgb, [(.30,.73),(.375,.72),(.41,.80),(.40,.88),(.41,.965),(.345,.965),(.315,.90),(.295,.81)]),
    polygon(rgb, [(.44,.82),(.495,.80),(.525,.86),(.515,.96),(.475,.985),(.445,.92)]),
    polygon(rgb, [(.53,.885),(.585,.885),(.62,.95),(.62,1),(.54,1)]),
])
leafy = (h > .13) & (h < .42) & (s > .38)
ivy = shrink(grow(clumps * leafy, 1), 1) * clumps
stone = (s < .33) | ((h < .125) & (v > .3))
g = soften(ivy, 0, 1.2) * (1 - soften(shrink(stone * 1., 1) * clumps, 0, .8)) * (1 - near)

# The glow: a wide pool round the sun, only on bright sky and cloud. The stag and mountains stay out.
y, x = np.mgrid[0:H, 0:W]
d = np.hypot((x + .5) / W - .843, ((y + .5) / H - .454) * 9 / 16)
pool = np.exp(-(d / .16) ** 2)
sky = np.clip((v - .78) / .12, 0, 1) * np.clip((.62 - s) / .15, 0, 1)
above = polygon(rgb, [(.63,0),(1,0),(1,.40),(.965,.42),(.92,.44),(.885,.40),(.862,.50),(.80,.57),(.74,.60),(.66,.60),(.63,.58)])
b = soften(sky * pool * above, 0, 3)
b = b / b.max()
stag = polygon(rgb, [(.56,.2),(.665,.2),(.665,.37),(.64,.37),(.64,.60),(.56,.60)])
b = b * (1 - soften(stag, 1, 2))

save('vault', r, g, b)
