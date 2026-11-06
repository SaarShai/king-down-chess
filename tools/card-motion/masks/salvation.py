"""Salvation. R: the spirit mist's soft body below and left of the rook, for upward flow. G: all turquoise wisps, also those painted on the rook's left side, for light that climbs. B: the pale mist between the chasm's ruins, for slow soft wisps of light."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('salvation'); h, s, v = hsv(rgb)
H, W = v.shape
ramp = lambda a, b, u: np.clip((u - a) / (b - a), 0, 1)

def grow(mask, n):
    return np.asarray(Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MaxFilter(n * 2 + 1)), dtype=np.float32) / 255

# The rook's silhouette, its dark underside included.
rook = polygon(rgb, [(.446,.178),(.46,.168),(.468,.172),(.47,.155),(.482,.150),(.497,.158),(.50,.150),(.53,.155),(.532,.172),(.542,.163),(.558,.177),
                     (.556,.215),(.552,.25),(.545,.262),(.538,.285),(.541,.34),(.546,.39),(.552,.435),(.553,.46),(.562,.475),(.568,.50),(.571,.552),
                     (.55,.568),(.52,.578),(.48,.572),(.45,.555),(.44,.53),(.44,.50),(.445,.48),(.455,.45),(.46,.40),(.462,.33),(.462,.29),(.456,.268),(.447,.25),(.444,.215)])

# Turquoise: cyan hue with colour in it. The chasm's mist is bluer; the stone is orange.
cyan = ramp(.425, .455, h) * (1 - ramp(.525, .56, h))
turq = cyan * ramp(.14, .28, s) * ramp(.40, .58, v)
reach = polygon(rgb, [(.44,.135),(.478,.135),(.49,.25),(.50,.40),(.50,.50),(.58,.53),(.585,.60),(.55,.66),(.525,.70),(.505,.755),(.445,.755),(.435,.69),(.41,.655),(.39,.62),(.385,.55),(.405,.47),(.425,.42),(.43,.33),(.445,.29)])
light = soften(turq * reach, 0, .8)

# The body of the current. Its dark curls are mist too, so a polygon holds it and only hard shapes leave it. It thins out as it nears the ruins.
yy = (np.mgrid[0:H, 0:W][0].astype(np.float32) + .5) / H
foot = 1 - ramp(.675, .75, yy)
foot = foot * foot * (3 - 2 * foot)
light = light * foot
body = polygon(rgb, [(.395,.555),(.43,.545),(.46,.565),(.52,.585),(.572,.565),(.578,.60),(.55,.645),(.522,.685),(.50,.75),(.452,.75),(.442,.69),(.41,.65),(.395,.615)])
flank = polygon(rgb, [(.41,.53),(.415,.47),(.43,.42),(.438,.36),(.452,.33),(.452,.45),(.435,.50),(.43,.54)])
keep_rook = soften(rook, 3, 1.2)
current = np.maximum(soften(body, 0, 3.5) * foot, soften(flank * (turq > .35), 1, 1.5)) * (1 - keep_rook)

# The ruins in the chasm: the near ones traced, dark paint for the rest of their edges.
ruins = np.maximum.reduce([polygon(rgb, p) for p in [
    [(.32,.76),(.37,.74),(.40,.80),(.53,.92),(.58,1),(.42,1),(.30,.86)],  # The fallen rook.
    [(.285,.77),(.325,.76),(.325,.86),(.285,.86)],
    [(.398,.72),(.432,.705),(.436,.80),(.40,.81)],
    [(.432,.77),(.462,.755),(.47,.89),(.436,.89)],
    [(.483,.75),(.503,.75),(.503,.81),(.483,.81)],
    [(.508,.70),(.552,.685),(.625,.73),(.625,.86),(.508,.86)],
    [(.562,.64),(.592,.64),(.592,.74),(.562,.74)],
    [(.518,.855),(.555,.855),(.555,.94),(.518,.94)],
    [(.572,.86),(.64,.82),(.668,.83),(.668,.90),(.632,.90),(.635,1),(.575,1)],
]])
# The pale mist in the chasm, behind every ruin. Small dark flecks in the mist stay in; only a dark mass counts as hard.
chasm = polygon(rgb, [(.285,.62),(.40,.62),(.44,.75),(.50,.76),(.53,.70),(.60,.66),(.67,.68),(.72,.78),(.735,.92),(.72,1),(.42,1),(.35,.88),(.28,.84),(.27,.72)])
blue = ramp(.50, .53, h) * (1 - ramp(.62, .66, h)) * ramp(.28, .44, v)
mass = grow(np.asarray(Image.fromarray(np.uint8((v < .22) * 255)).filter(ImageFilter.MinFilter(3)), dtype=np.float32) / 255, 1)
hard = grow(np.maximum(mass, ruins), 1)
drift = soften(chasm, 0, 4) * soften(blue, 2, 2.5) * (1 - soften(hard, 0, 1.2)) * (1 - soften(body, 2, 4))

clear_ruins = 1 - soften(ruins, 1, 1.2)
save('salvation', current * clear_ruins, light * clear_ruins, drift)
