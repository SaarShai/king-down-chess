"""Mask helpers for the card motion maps. A map is RGB: three soft masks in painting space, one per moving element."""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SIDE = 384  # The map's long side. The map keeps the painting's shape: the runtime reads the painting's shape from it.

def painting(card):
    """The painting as float RGB (0 to 1), resized to the map."""
    src = Image.open(f'{ROOT}/public/ui/cards/{card}.webp').convert('RGB')
    w, h = src.size
    size = (round(SIDE * w / max(w, h)), round(SIDE * h / max(w, h)))
    return np.asarray(src.resize(size, Image.LANCZOS), dtype=np.float32) / 255

def hsv(rgb):
    """Hue (0 to 1), saturation, value."""
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-5)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, (g - b) / d % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    return h, (mx - mn) / np.maximum(mx, 1e-5), mx

def polygon(rgb, points):
    """1 inside a polygon given in painting units (0 to 1)."""
    h, w = rgb.shape[:2]
    im = Image.new('L', (w, h), 0)
    ImageDraw.Draw(im).polygon([(x * w, y * h) for x, y in points], fill=255)
    return np.asarray(im, dtype=np.float32) / 255

def soften(mask, grow=0, blur=2):
    """Widen a mask by "grow" map pixels, then feather it, so the edge of moving paint fades into the still paint."""
    im = Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255))
    if grow: im = im.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im, dtype=np.float32) / 255

def save(card, r, g=None, b=None):
    """Write src/plugin/assets/card-motion/<card>.webp (lossless) and a view of the masks over the painting beside it in the run folder."""
    blank = np.zeros_like(r)
    rgb = np.dstack([r, blank if g is None else g, blank if b is None else b])
    out = Image.fromarray(np.uint8(np.clip(rgb, 0, 1) * 255 + .5))
    path = f'{ROOT}/src/plugin/assets/card-motion/{card}.webp'
    out.save(path, lossless=True, quality=100, exact=True)
    run = os.path.expanduser(f'~/kd-runs/card-motion/{card}')
    os.makedirs(run, exist_ok=True)
    base = painting(card)
    over = base * (1 - .75 * rgb.max(-1, keepdims=True)) + rgb * .75
    Image.fromarray(np.uint8(over * 255)).resize((512, round(512 * base.shape[0] / base.shape[1]))).save(f'{run}/mask-view.png')
    print(path, os.path.getsize(path), 'bytes; view', f'{run}/mask-view.png')
