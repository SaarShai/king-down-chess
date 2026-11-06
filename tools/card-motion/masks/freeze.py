import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
rgb = painting('freeze'); h, s, v = hsv(rgb)
# The ice block around the horse, traced from the painting.
shell = polygon(rgb, [(.62,.035),(.70,.008),(.757,.012),(.795,.07),(.828,.16),(.84,.22),(.84,.285),(.80,.325),(.782,.37),(.80,.44),(.84,.445),(.87,.46),(.90,.60),(.84,.695),(.815,.71),(.84,.745),(.83,.86),(.13,.86),(.0,.79),(.0,.655),(.03,.635),(.05,.62),(.085,.56),(.122,.60),(.13,.56),(.16,.42),(.205,.30),(.225,.25),(.345,.178),(.37,.18),(.435,.135),(.46,.07),(.51,.09)])
# Metal and dark hide stay out of the glint: the head with its bridle, and the collar.
head = polygon(rgb, [(.695,.07),(.725,.075),(.805,.235),(.805,.30),(.765,.335),(.72,.31),(.70,.28),(.60,.285),(.61,.20)])
collar = polygon(rgb, [(.52,.285),(.60,.27),(.73,.39),(.70,.435),(.60,.345),(.51,.335)])
# Mist: the pale soft puff beside the muzzle. It grows a little into the sky, because its edge moves, and it fades to nothing against the ice.
puff = polygon(rgb, [(.84,.285),(.85,.235),(.935,.245),(.97,.33),(.955,.41),(.85,.43),(.782,.40),(.785,.345),(.803,.322)])
cloud = puff * (s < .42) * (v > .62)
# Opening removes the loose flakes around the puff, so they do not ghost when it moves.
cloud = np.asarray(Image.fromarray(np.uint8(cloud * 255)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5)), dtype=np.float32) / 255
mist = soften(cloud, 3, 3) * (1 - soften(shell, 1, 1.5))
# Facets: light ice only, the fracture lines strongest.
luma = rgb @ np.array([.3, .6, .1], dtype=np.float32)
edge = np.clip(np.hypot(np.gradient(luma, axis=0), np.gradient(luma, axis=1)) * 9, 0, 1)
ice = shell * (1 - soften(head, 1, 1)) * (1 - soften(collar, 1, 1)) * np.clip((v - .62) / .22, 0, 1) * (h > .47) * (h < .64)
facets = soften(ice * (.5 + .5 * edge), 0, .7)
# Snow: open sky only. Flakes pass behind the ice and fade at the ground.
ground = polygon(rgb, [(0,.84),(1,.84),(1,1),(0,1)])
snow = (1 - soften(shell, 1, 1.5)) * (1 - soften(ground, 0, 5))
save('freeze', mist, facets, snow)
