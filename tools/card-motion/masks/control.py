"""Control. R: the teal strand in the open air between rook and knight. G: all the teal light (strand, on the rook's crown, on the knight's neck, in the wet stone). B: the storm clouds."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('control'); h, s, v = hsv(rgb)
R, G = rgb[..., 0], rgb[..., 1]

# Teal paint: how far green stands above red, in the teal hues. The dark wall behind has a small teal cast, so the key starts above it.
teal = np.clip((G - R - .05) / .12, 0, 1) * ((h > .36) & (h < .56))

# The pieces, traced, with the strand where it lies over them.
rook = polygon(rgb, [(.20,.08),(.262,.10),(.297,.125),(.31,.135),(.311,.20),(.308,.245),(.29,.265),(.296,.30),(.29,.40),(.29,.60),(.20,.60)])
knight = polygon(rgb, [(.60,.60),(.40,.60),(.385,.46),(.392,.42),(.40,.40),(.392,.36),(.405,.325),(.425,.30),(.423,.27),(.432,.24),(.445,.195),(.47,.165),(.60,.15)])

# The strand in the open air, with its faint wisps above and below.
air = polygon(rgb, [(.30,.11),(.335,.11),(.35,.175),(.40,.17),(.43,.20),(.44,.24),(.43,.31),(.41,.34),(.40,.41),(.365,.41),(.355,.33),(.32,.30),(.30,.26)])
pieces = soften(np.maximum(rook, knight), 2, 1)
strand = soften(air * teal, 3, 2) * soften(air, 0, 2) * (1 - pieces)

# All the teal light: over the pieces it only brightens; in the wet stone it answers at half strength.
light = polygon(rgb, [(.23,.11),(.60,.11),(.60,.56),(.36,.56),(.36,.40),(.30,.30),(.23,.26)])
pool = polygon(rgb, [(.40,.82),(.47,.82),(.47,.97),(.40,.97)])
glow = np.maximum(soften(light * teal, 1, 1.5), soften(pool * teal, 1, 2) * .5)

# The clouds, in the open sky only. Towers, spires, banners and the tree stay out, and the edge fades before each.
sky = np.maximum.reduce([
    polygon(rgb, [(.714,0),(.952,0),(.956,.06),(.936,.08),(.932,.155),(.91,.175),(.90,.24),(.893,.285),(.872,.31),(.84,.30),(.822,.285),(.816,.245),(.79,.238),(.782,.20),(.778,.125),(.714,.118)]),
    polygon(rgb, [(.625,0),(.678,0),(.672,.045),(.66,.06),(.655,.13),(.628,.125)]),
])
clouds = soften(sky, 0, 3)

save('control', strand, glow, clouds)
