# Converts the demo renders into small webp stills for the presentation: media/demos/<id>/<state>-<size>.webp.
# Phone: every state. Desktop: the states named in DESKTOP (default: the first state).
# python3 docs/specs/web-ux/showcase/media.py [demo-id ...]
import json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'media', 'demos')
ids = sys.argv[1:] or sorted(d for d in os.listdir(os.path.join(HERE, 'demos')) if os.path.exists(os.path.join(HERE, 'demos', d, 'meta.json')))
DESKTOP = {'proto': ['game-rest', 'result', 'title', 'home'], 'dir-compare': None}
total = 0
for i in ids:
    meta = json.load(open(os.path.join(HERE, 'demos', i, 'meta.json')))
    states = meta.get('states', [])
    os.makedirs(os.path.join(OUT, i), exist_ok=True)
    want = [(s, 'phone') for s in states]
    desk = DESKTOP.get(i, states[:1]) or states
    want += [(s, 'desktop') for s in desk]
    for s, size in want:
        src = os.path.join(HERE, 'renders', i, f'{s}-{size}.png')
        if not os.path.exists(src):
            continue
        im = Image.open(src).convert('RGB')
        w = 585 if size == 'phone' else 1440
        if im.width > w:
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        dst = os.path.join(OUT, i, f'{s}-{size}.webp')
        im.save(dst, 'WEBP', quality=80, method=6)
        total += os.path.getsize(dst)
print(f'{len(ids)} demos, {total // 1024} KB')
