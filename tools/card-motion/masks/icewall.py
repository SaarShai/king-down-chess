"""Ice Wall. R: the torn banner, free at its torn ends, still at the pole. G: the ice that takes the cold light. B: where drifting snow shows."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('icewall'); h, s, v = hsv(rgb)
H, W = v.shape
Y, X = np.mgrid[0:H, 0:W]; X = (X + .5) / W; Y = (Y + .5) / H

def px(points):
    """Polygon traced in the painting's own pixels (1024 x 576)."""
    return polygon(rgb, [(x / 1024, y / 576) for x, y in points])

# The pole with its spear head and binding. The cloth is tied to it, so nothing here moves.
pole = px([(520,55),(535,55),(545,95),(558,170),(556,178),(543,178),(531,110),(517,95)])

# The banner: the deep blue cloth, darker and more saturated than the sky behind it.
reach = px([(402,142),(430,118),(470,108),(505,92),(531,88),(532,178),(528,200),(500,206),(482,212),(462,190),(420,182),(424,160)])
cloth = reach * (h > .52) * (h < .66) * (s > .6)
cloth = soften(cloth, 1, 0) * (soften(cloth, 0, 2) > .3)
# Ice and spray under the banner's lower end stay out of the moving paint.
under = px([(528,178),(560,150),(560,240),(470,240),(470,212),(495,208),(525,200)])
# The cloth's travel grows from the pole out to the torn ends.
free = np.clip((.5145 - X - .002) / .075, 0, 1); free = free * free * (3 - 2 * free)
free = np.maximum(free, np.clip((.5145 - X - .002) / .02, 0, 1) * .25)
banner = soften(cloth, 5, 2) * free * (1 - soften(pole, 2, 1)) * (1 - soften(under, 0, 1))

# The ice wall's silhouette. Sky, mountains, snow and rock are outside.
wall = px([(90,398),(135,360),(170,335),(190,345),(205,335),(240,303),(265,322),(283,275),(300,288),(315,245),(340,272),(355,242),(372,212),(390,187),(415,225),
           (430,200),(450,190),(475,215),(490,197),(510,205),(535,168),(555,135),(590,85),(625,110),(640,130),(660,72),(690,90),(720,15),(760,60),(775,32),(800,72),
           (830,42),(862,5),(890,60),(925,148),(970,106),(1005,160),(1024,150),(1024,410),(960,465),(800,478),(650,500),(500,472),(350,452),(230,442),(100,402)])
# Cold light lives in the blue and pale facets. Arrows, the dark broken arrow head, the pole and the cloth stay out.
ice = wall * (h > .45) * (h < .64) * (v > .5) * (s > .08) * (1 - soften(pole, 2, 1)) * (1 - soften(cloth, 2, 1))
# The light dies away into the snow at the wall's foot, with no line there.
above = px([(0,0),(1024,0),(1024,395),(960,450),(800,463),(650,485),(500,457),(350,437),(230,427),(90,388),(0,388)])
glow = soften(ice, 0, 1) * soften(above, 0, 4)

# Snow: free in the sky, thin in front of the wall, gone at the ground, and behind the banner.
back = soften(wall, 0, 3)
snow = (1 - .55 * back) * np.clip((.80 - Y) / .10, 0, 1) * (1 - soften(cloth, 1, 1))
save('icewall', banner, glow, snow)
