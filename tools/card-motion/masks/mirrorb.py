"""Mirror. R: the blue magic in the glass and its spill past the frame. G: the candle flame and its reflection (above .35 the flame moves; below it only its light breathes). B: the glass, for the sheen."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('mirrorb'); h, s, v = hsv(rgb)
H, W = v.shape

def c(*points):
    """Points read off a 2x crop of the mirror, from pixel (460, 60) of the 1024 x 576 painting, in painting units."""
    return [((460 + x / 2) / 1024, (60 + y / 2) / 576) for x, y in points]
def shrink(mask, n):
    return np.asarray(Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MinFilter(n * 2 + 1)), dtype=np.float32) / 255

# The glass: a tilted ellipse inside the frame.
cx, cy, a, b, tilt = 348, 395, 268, 358, np.radians(4)
glass = polygon(rgb, c(*[(cx + a * np.cos(u) * np.cos(tilt) + b * np.sin(u) * np.sin(tilt),
                          cy - a * np.cos(u) * np.sin(tilt) + b * np.sin(u) * np.cos(tilt)) for u in np.linspace(0, 2 * np.pi, 96)]))

# What stays still in front of the magic.
arm = polygon(rgb, c((332,350),(360,343),(400,353),(440,370),(470,398),(495,438),(512,473),(550,486),(590,523),(640,558),(700,588),(770,613),(860,648),(925,680),(925,850),
                     (600,850),(575,700),(540,640),(480,650),(440,610),(390,575),(345,535),(330,480),(338,462),(298,428),(295,405),(318,390),(345,393),(328,370)))
card = polygon(rgb, c((250,250),(378,280),(318,530),(188,478)))
candles = soften(((h > .03) & (h < .16) & (s > .28) & (v > .3)).astype(np.float32), 1, 2)

# The magic in the glass: below the reflected windows, not on the warm reflected candles. The arcs reach up to the crossing of the window bars.
region = polygon(rgb, c((95,470),(120,370),(190,300),(250,225),(320,165),(400,145),(470,180),(530,235),(590,300),(640,400),(640,560),(560,700),(470,780),(330,790),(200,750),(110,620)))
hold = np.maximum(soften(arm, 3, 1), soften(card, 2, 1))
inside = soften(region * shrink(glass, 2), 0, 4) * soften(shrink(glass, 2), 0, 1.5) * (1 - hold) * (1 - candles)

# The spill past the frame: pale blue strokes on the dark stone, away from the frame's knob and the gauntlet.
reach = polygon(rgb, c((725,405),(770,395),(830,450),(848,520),(818,578),(770,602),(700,585),(640,556),(618,516),(650,500),(705,490),(725,470)))
pale = np.clip((v - .32) / .28, 0, 1) * ((h > .5) & (h < .72))
spill = soften(pale, 2, 2) * soften(reach, 0, 3) * (1 - soften(arm, 3, 1)) * (1 - soften(glass, 4, 1))

magic = np.maximum(inside, spill)

# Flames. A ramp from the wick to the tip holds the base still; a soft halo below .35 carries only light.
def flame(x, base, tip, half):
    yy, xx = np.mgrid[0:H, 0:W]
    u, w = ((xx + .5) / W - x) / half, (yy + .5) / H
    # Across: full on the flame, past its edges into the dark. Along: nothing at the wick, full from two thirds up, and a soft end above the tip.
    up = np.clip((base - w) / (base - tip) * 1.5, 0, 1)
    over = np.exp(-(np.minimum(w - tip, 0) / ((base - tip) * .28)) ** 2)
    core = np.exp(-u ** 2) * (up * up * (3 - 2 * up)) * over
    near = np.exp(-(u / 2.4) ** 2 - ((w - (base + tip) / 2) / ((base - tip) * .85)) ** 2)
    return np.maximum(core, near * .3)
g = np.maximum.reduce([flame(.1495, .380, .308, .017), flame(.5127, .360, .325, .010), flame(.5444, .622, .6, .008) * .34])

# The sheen lies on all the glass except the arm; the reflected card takes less of it.
sheen = soften(shrink(glass, 1), 0, 1.5) * (1 - soften(arm, 3, 1)) * (1 - .6 * soften(card, 1, 1))

save('mirrorb', magic, g, sheen)
