import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import mask_lib
from mask_lib import *

# Key at twice the map's size, so the thin ink line round the stag holds the fill back; shrink at the end.
mask_lib.SIDE = 512
rgb = painting('leap'); h, s, v = hsv(rgb)
H, W = rgb.shape[:2]
Y, X = np.mgrid[0:H, 0:W]
x, y = (X + .5) / W, (Y + .5) / H
CX, CY, R = .5445, .4255, .3385  # The disc, measured on the painting.
aspect = H / W
dist = np.sqrt((x - CX) ** 2 + ((y - CY) * aspect) ** 2)
disc = dist < R

# The stag's middle, traced well inside its outline; it only gives the row colours and stops leaks.
core = polygon(rgb, [(.385,.30),(.44,.24),(.50,.26),(.60,.25),(.72,.285),(.85,.37),(1,.5),(1,.72),(.92,.72),(.90,.97),(.86,.97),(.85,.72),(.70,.67),(.66,.60),(.62,.60),(.66,.655),(.585,.665),(.56,.645),(.565,.61),(.50,.565),(.46,.565),(.40,.53),(.34,.525),(.285,.49),(.27,.39),(.30,.31)]) > .5

# The disc's paint: a colour that changes only with height. Row medians give that colour.
ref = np.zeros((H, 3), np.float32)
free = disc & ~soften(core, 8, 0).astype(bool)
for j in range(H):
    pick = free[j]
    if pick.sum() > 3: ref[j] = np.median(rgb[j][pick], axis=0)
    elif j: ref[j] = ref[j - 1]
first = np.argmax(free.sum(1) > 3); ref[:first] = ref[first]
near = np.abs(rgb - ref[:, None, :]).max(-1) < .075

# Grow only from clean disc through near paint, so cream on the muzzle and chest stays out.
fill = np.array(free & near & (dist < R - .004))
room = disc & near & ~core
for _ in range(80):
    wide = np.array(Image.fromarray(np.uint8(fill) * 255).filter(ImageFilter.MaxFilter(3))) > 0
    fill = wide & room

def small(m):
    size = (round(256 * W / max(W, H)), round(256 * H / max(W, H)))
    return np.asarray(Image.fromarray(np.uint8(np.clip(m, 0, 1) * 255)).resize(size, Image.LANCZOS), dtype=np.float32) / 255

# G: the disc's paint, and a faint halo on the ground beyond its rim. Nothing on the stag.
stagkey = (np.abs(h - .105) < .045) & (s > .28) & (v > .55) & ~disc  # stag and antler gold outside the disc
ink = v < .32
halo = np.clip(1 - (dist - R) / .05, 0, 1) ** 2 * .55 * (dist >= R) * (1 - soften(stagkey | ink | core, 3, 1))

# R: the green leaves, with room to move into the ground. The hoof stays out.
leaves = polygon(rgb, [(.45,.84),(.70,.82),(.84,.93),(.95,1),(.45,1)]) + polygon(rgb, [(.93,.70),(1,.70),(1,.90),(.95,.88)])
green = (h > .2) & (h < .42) & (s > .22) & (leaves > .5)
hoof = soften(polygon(rgb, [(.84,.70),(.90,.70),(.95,.95),(.90,.96),(.85,.90)]), 2, 1)

# B: the antlers' gold. Two tracings keep out the head and the ear.
horns = polygon(rgb, [(0,.08),(.05,.07),(.14,.20),(.18,.11),(.21,.24),(.27,.15),(.315,.30),(.295,.335),(.25,.29),(.10,.34),(.05,.31),(0,.17)]) \
      + polygon(rgb, [(.29,.14),(.33,.12),(.38,.15),(.40,.10),(.445,.15),(.40,.0),(.50,.0),(.525,.13),(.50,.215),(.44,.225),(.43,.27),(.40,.325),(.355,.315),(.385,.235),(.36,.19),(.295,.16)])
gold = (horns > .5) & (h > .09) & (h < .17) & (s > .22) & (v > .55)

# The two gold keys meet on the disc: light on a tine belongs to the antler, not to the disc.
fill = fill & ~soften(gold, 2, 0).astype(bool)
mask_lib.SIDE = 256
save('leap', soften(small(green * (1 - hoof)), 3, 2), np.maximum(soften(small(fill), 0, .7), soften(small(halo * (1 - soften(gold, 3, 1))), 0, 1)), soften(small(gold), 0, .7))
