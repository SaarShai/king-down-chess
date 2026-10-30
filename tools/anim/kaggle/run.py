"""Run recursive movement midpoints on Kaggle. Inputs and results stay private."""
import hashlib
import json
import os
import sys
import tarfile
import time
import traceback
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
import torch
import torch.nn.functional as F

ROOT = Path('/kaggle/working')
SOURCE = Path('/kaggle/input/kd-anim-movement-keys-20261030/movement.tar')
PART = int(os.environ.get('KD_PART', '0'))
PARTS = int(os.environ.get('KD_PARTS', '1'))
MATTE = np.array([32, 42, 37], np.float32) / 255
started = time.time()

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def pack(path):
    im = Image.open(path)
    if im.mode != 'RGBA':
        raise ValueError(f'{path}: expected RGBA')
    rgba = np.asarray(im, np.float32) / 255
    alpha = rgba[..., 3:]
    premult = rgba[..., :3] * alpha
    data = np.concatenate([premult + MATTE * (1 - alpha), premult, alpha], -1)
    return torch.from_numpy(data.transpose(2, 0, 1).copy()).unsqueeze(0).cuda()

def pixels(value):
    data = value[0].permute(1, 2, 0).cpu().numpy()
    if not np.isfinite(data).all():
        raise ValueError('non-finite interpolation')
    alpha = np.clip(data[..., 6:7], 0, 1)
    rgb = np.divide(data[..., 3:6], alpha, out=np.zeros_like(data[..., 3:6]), where=alpha > 1e-8)
    rgba = np.rint(np.clip(np.concatenate([rgb, alpha], -1), 0, 1) * 255).astype('uint8')
    rgba[rgba[..., 3] == 0, :3] = 0
    return rgba

def pad(a):
    height, width = a.shape[-2:]
    b = F.pad(a, (0, -width % 64, 0, -height % 64))
    if b.shape[-1] != width:
        b[:, :3, :, width:] = torch.tensor(MATTE, device='cuda').view(1, 3, 1, 1)
    if b.shape[-2] != height:
        b[:, :3, height:, :] = torch.tensor(MATTE, device='cuda').view(1, 3, 1, 1)
    return b

def rife_mid(a, b):
    h, w = a.shape[-2:]
    with torch.inference_mode():
        return net(torch.cat([pad(a), pad(b)], 1), 0.5, [16, 8, 4, 2, 1])[2][-1][:, :, :h, :w].clone()

def warp(value, flow):
    h, w = value.shape[-2:]
    x = torch.linspace(-1, 1, w, device='cuda').view(1, 1, w).expand(1, h, w)
    y = torch.linspace(-1, 1, h, device='cuda').view(1, h, 1).expand(1, h, w)
    grid = torch.stack([x + flow[..., 0] / (w - 1), y + flow[..., 1] / (h - 1)], -1)
    return F.grid_sample(value, grid, mode='bilinear', padding_mode='border', align_corners=True)

def film_mid(a, b):
    # FILM exposes flows, not the fusion weights. Blend its two aligned premultiplied
    # images equally, so the same flow applies to colour and alpha.
    h, w = a.shape[-2:]
    a, b = pad(a), pad(b)
    x0 = a[:, :3].permute(0, 2, 3, 1).cpu().numpy()
    x1 = b[:, :3].permute(0, 2, 3, 1).cpu().numpy()
    with tf.device('/GPU:0'):
        result = film({'x0': tf.convert_to_tensor(x0), 'x1': tf.convert_to_tensor(x1), 'time': tf.constant([[0.5]])})
    backward = torch.from_numpy(result['backward_flow_pyramid'][0].numpy()).cuda()
    forward = torch.from_numpy(result['forward_flow_pyramid'][0].numpy()).cuda()
    return ((warp(a, backward) + warp(b, forward)) * 0.5)[:, :, :h, :w].clone()

def score(rgba, left, right):
    # Fraction of partly transparent output pixels outside either input's soft edge.
    # Motion can also score here; this is a triage screen, not proof of ghosts.
    a, l, r = (x[..., 3] for x in (rgba, left, right))
    partial = (a > 12) & (a < 243)
    edge = ((l > 12) & (l < 243)) | ((r > 12) & (r < 243))
    return float(np.count_nonzero(partial & ~edge) / max(1, np.count_nonzero(a > 12)))

def sheet_tiles(canvas, images, gap, bg_index, bg):
    # One crop and scale preserves the registration across the whole gap.
    boxes = [Image.fromarray(im[..., 3], 'L').getbbox() for im in images]
    boxes = [box for box in boxes if box]
    if not boxes:
        raise ValueError('empty gap')
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes),
           max(b[2] for b in boxes), max(b[3] for b in boxes))
    width, height = box[2] - box[0], box[3] - box[1]
    scale = min(160 / height, 180 / width)
    size = (max(1, round(width * scale)), max(1, round(height * scale)))
    for x, image in enumerate(images):
        im = Image.fromarray(image, 'RGBA').crop(box).resize(size, Image.Resampling.LANCZOS)
        tile = Image.new('RGBA', (190, 190), bg)
        tile.alpha_composite(im, ((190 - im.width) // 2, 20 + 160 - im.height))
        canvas.paste(tile.convert('RGB'), (x * 190, (gap * 2 + bg_index) * 200 + 10))

status = {'part': PART, 'parts': PARTS, 'started': started, 'exit': None}
archive = None
try:
    if not torch.cuda.is_available():
        raise RuntimeError('Kaggle GPU is unavailable')
    status['gpu'] = torch.cuda.get_device_name(0)
    with tarfile.open(SOURCE) as tar:
        tar.extractall('/tmp', filter='data')
    data = Path('/tmp/movement')
    runtime = data / 'rife'
    status['runtimeManifestSha256'] = sha(runtime / 'manifest.json')
    for f in json.loads((runtime / 'manifest.json').read_text())['files']:
        if sha(runtime / f['file']) != f['sha256']:
            raise ValueError('RIFE runtime hash mismatch: ' + f['file'])
    sys.path.insert(0, str(runtime))
    from train_log.IFNet_HDv3 import IFNet
    net = IFNet().cuda().eval()
    weights = torch.load(runtime / 'train_log/flownet.pkl', map_location='cpu', weights_only=True)
    net.load_state_dict({k.replace('module.', ''): v for k, v in weights.items() if 'module.' in k}, strict=False)
    import tensorflow as tf
    gpus = tf.config.list_physical_devices('GPU')
    if not gpus:
        raise RuntimeError('TensorFlow cannot see the Kaggle GPU')
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)
    paths = list(Path('/kaggle/input').glob('**/saved_model.pb'))
    if len(paths) != 1:
        raise RuntimeError(f'expected one FILM saved model, found {len(paths)}')
    film = tf.saved_model.load(str(paths[0].parent))
    entries = json.loads((data / 'entries.json').read_text())
    status['totalEntries'] = len(entries)
    selected = [(i, e) for i, e in enumerate(entries) if i % PARTS == PART]
    results = []
    for index, entry in selected:
        name = f"{index:03d}-{entry['character']}-{entry['army']}-{entry['direction']}-{entry['id']}"
        name = ''.join(c if c.isalnum() or c in '-_' else '-' for c in name)
        dest = Path('/tmp/anim-results') / name
        dest.mkdir(parents=True, exist_ok=True)
        keys = []
        for f in entry['frames']:
            path = data / f['file']
            if sha(path) != f['sha256']:
                raise ValueError(f'key hash mismatch: {path}')
            keys.append(pack(path))
        gaps = []
        canvas = Image.new('RGB', (190 * 8, 200 * 2 * len(keys)), 'white')
        draw = ImageDraw.Draw(canvas)
        for g, left in enumerate(keys):
            right = keys[(g + 1) % len(keys)]
            if left.shape != right.shape:
                raise ValueError(f'canvas mismatch: {name} gap {g}')
            lpx, rpx = pixels(left), pixels(right)
            methods, scores = {}, {}
            for label, func in [('rife', rife_mid), ('film', film_mid)]:
                mid = func(left, right)
                values = [func(left, mid), mid, func(mid, right)]
                frames = [pixels(v) for v in values]
                for n, frame in enumerate(frames, 1):
                    alpha = frame[..., 3]
                    if max(alpha[0].max(), alpha[-1].max(), alpha[:, 0].max(), alpha[:, -1].max()) != 0:
                        raise ValueError(f'nontransparent exterior: {name}, gap {g}, {label}, frame {n}')
                    Image.fromarray(frame, 'RGBA').save(dest / f'gap-{g:02d}-{label}-{n}.png')
                methods[label] = frames
                scores[label] = [score(frame, lpx, rpx) for frame in frames]
            rows = [lpx, *methods['rife'], *methods['film'], rpx]
            for bg_index, bg in enumerate([(239, 236, 226, 255), (34, 38, 41, 255)]):
                sheet_tiles(canvas, rows, g, bg_index, bg)
                draw.text((3, (g * 2 + bg_index) * 200), f'gap {g}: key | RIFE 25 50 75 | FILM 25 50 75 | key', fill='black')
            gaps.append({'gap': g, 'left': g, 'right': (g + 1) % len(keys), 'scores': scores})
            print(json.dumps({'entry': index, 'gap': g, 'elapsed': round(time.time() - started)}), flush=True)
        canvas.save(dest / 'sheet.jpg', quality=90)
        record = {'entry': entry, 'folder': name, 'gaps': gaps}
        (dest / 'scores.json').write_text(json.dumps(record, indent=2) + '\n')
        if len(results) % 32 == 0:
            archive = tarfile.open(ROOT / f'results-{len(results) // 32:02d}.tar', 'w')
        archive.add(dest, arcname='results/' + name)
        results.append(record)
        if len(results) % 32 == 0:
            archive.close()
            archive = None
        (ROOT / 'scores.json').write_text(json.dumps(results, indent=2) + '\n')
    status['exit'] = 0
    status['entries'] = len(results)
except Exception:
    status['exit'] = 1
    status['error'] = traceback.format_exc()
    print(status['error'], flush=True)
finally:
    if archive is not None:
        archive.close()
    status['seconds'] = round(time.time() - started)
    (ROOT / 'status.json').write_text(json.dumps(status, indent=2) + '\n')
if status['exit']:
    sys.exit(1)
