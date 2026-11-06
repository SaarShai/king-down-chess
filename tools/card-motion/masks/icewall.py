import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
rgb = painting('icewall'); h, s, v = hsv(rgb)
H, W = v.shape
Y, X = np.mgrid[0:H, 0:W]; X = (X + .5) / W; Y = (Y + .5) / H
# Banner: the dark torn blue cloth. The pole and the arrow tip beside its left end stay still.
area = polygon(rgb, [(.262,.235),(.33,.205),(.40,.19),(.452,.185),(.468,.26),(.472,.385),(.36,.385),(.27,.33)])
cloth = area * (h > .52) * (h < .66) * (s > .45) * (v < .72)
pole = polygon(rgb, [(.438,.115),(.462,.115),(.478,.20),(.50,.335),(.47,.335),(.456,.20)])
arrow = polygon(rgb, [(.20,.205),(.27,.235),(.268,.262),(.20,.235)])
# The cloth is tied at the top of the pole, so its travel grows from that knot out to the torn ends.
knot = np.clip((np.hypot(X - .455, Y - .205) - .012) / .09, 0, 1); knot = knot * knot * (3 - 2 * knot)
banner = soften(cloth, 2, 2) * knot * (1 - soften(pole, 1, 1)) * (1 - soften(arrow, 1, 1))
# Glint: the wall's ice only, not sky, far peaks, snow or rock. Pale facets take the light; white is already full.
wall = polygon(rgb, [(.03,.68),(.075,.59),(.105,.62),(.15,.50),(.178,.42),(.205,.47),(.235,.44),(.262,.315),(.295,.375),(.335,.365),(.375,.42),(.405,.375),(.445,.42),(.49,.30),(.505,.295),(.515,.21),(.56,.24),(.572,.10),(.62,.04),(.685,.16),(.74,.06),(.79,.025),(.82,0),(1,0),(1,.80),(.90,.93),(.70,.92),(.50,.86),(.30,.80),(.14,.72)])
ice = wall * (h > .48) * (h < .64) * (v > .5) * (1 - soften(pole, 1, 1)) * (1 - soften(cloth, 1, 1))
glow = soften(ice * np.clip(1.25 - rgb[..., 0] * .6, 0, 1), 0, 1)
# Snow: free in the sky, thinner in front of the wall, gone at the ground.
sky = 1 - soften(wall, 0, 3)
snow = np.clip(sky + .45, 0, 1) * np.clip((.86 - Y) / .12, 0, 1) * (1 - .5 * soften(cloth, 0, 1))
save('icewall', banner, glow, snow)
