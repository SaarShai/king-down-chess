"""Alpha RIFE midpoints for the animation bank pipeline.

The plan lists frames in order. A key frame has an input file; a midpoint names two frame indexes and a timestep.
The network loads once. Colour and alpha travel through the same motion field as premultiplied channels.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
import torch
import torch.nn.functional as functional

MATTE = np.array([32, 42, 37], np.float32) / 255


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def pack(path):
    with Image.open(path) as image:
        if image.mode != 'RGBA':
            raise ValueError(f'{path}: expected RGBA')
        rgba = np.asarray(image, dtype=np.float32) / 255
    alpha = rgba[..., 3:]
    premult = rgba[..., :3] * alpha
    matte = premult + MATTE * (1 - alpha)
    return torch.from_numpy(np.concatenate([matte, premult, alpha], -1).transpose(2, 0, 1).copy()).unsqueeze(0)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--runtime', type=Path, required=True)
    args = parser.parse_args()
    plan_path = args.plan.resolve()
    plan = json.loads(plan_path.read_text())
    base = plan_path.parent
    runtime = args.runtime.resolve()

    runtime_sha = sha(runtime / 'manifest.json')
    expected = plan.get('runtimeManifestSha256')
    if expected and runtime_sha != expected:
        raise ValueError(f'RIFE runtime manifest hash mismatch: {runtime_sha}')
    manifest = json.loads((runtime / 'manifest.json').read_text())
    for entry in manifest['files']:
        if sha(runtime / entry['file']) != entry['sha256']:
            raise ValueError(f"RIFE runtime hash mismatch: {entry['file']}")
    sys.path.insert(0, str(runtime))
    from train_log.IFNet_HDv3 import IFNet

    torch.set_num_threads(2)
    net = IFNet().to('cpu')
    weights = torch.load(runtime / 'train_log/flownet.pkl', map_location='cpu', weights_only=True)
    net.load_state_dict({k.replace('module.', ''): v for k, v in weights.items() if 'module.' in k}, strict=False)
    net.eval()

    cache, size, records = {}, None, []
    for frame in plan['frames']:
        left_path, right_path = (base / frame['left']).resolve(), (base / frame['right']).resolve()
        if left_path not in cache:
            cache[left_path] = pack(left_path)
        if right_path not in cache:
            cache[right_path] = pack(right_path)
        left, right = cache[left_path], cache[right_path]
        if left.shape != right.shape:
            raise ValueError(f'RIFE inputs have different canvas sizes: {left_path.name}, {right_path.name}')
        height, width = left.shape[-2:]
        if size and size != (width, height):
            raise ValueError('RIFE inputs changed canvas size during the run')
        size = (width, height)
        pad = (0, (-width) % 64, 0, (-height) % 64)
        padded = []
        for value in (left, right):
            value = functional.pad(value, pad)
            if pad[1]:
                value[:, :3, :, width:] = torch.tensor([32, 42, 37]).view(1, 3, 1, 1) / 255
            if pad[3]:
                value[:, :3, height:, :] = torch.tensor([32, 42, 37]).view(1, 3, 1, 1) / 255
            padded.append(value)
        with torch.inference_mode():
            result = net(torch.cat(tuple(padded), 1), float(frame['t']), [16, 8, 4, 2, 1])[2][-1]
        data = result[0, :, :height, :width].numpy().transpose(1, 2, 0)
        if not np.isfinite(data).all():
            raise ValueError(f"RIFE output has non-finite pixels at frame {frame['index']}")
        alpha = np.clip(data[..., 6:7], 0, 1)
        colour = np.divide(data[..., 3:6], alpha, out=np.zeros_like(data[..., 3:6]), where=alpha > 1e-8)
        pixels = np.rint(np.clip(np.concatenate([colour, alpha], -1), 0, 1) * 255).astype('uint8')
        pixels[pixels[..., 3] == 0, :3] = 0
        output = base / frame['output']
        output.parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(pixels, 'RGBA').save(output)
        mid = result[0, :, :height, :width].unsqueeze(0).clone()
        cache[output] = mid
        records.append({'index': frame['index'], 't': float(frame['t']), 'output': frame['output'], 'sha256': sha(output),
                        'alphaRange': [int(pixels[..., 3].min()), int(pixels[..., 3].max())],
                        'borderAlphaMax': int(max(pixels[0, :, 3].max(), pixels[-1, :, 3].max(), pixels[:, 0, 3].max(), pixels[:, -1, 3].max()))})
        print(json.dumps(records[-1]), flush=True)

    report = {'runtimeManifestSha256': runtime_sha, 'canvas': list(size), 'frames': records}
    (base / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'frames': len(records), 'runtimeManifestSha256': runtime_sha}), flush=True)


if __name__ == '__main__':
    main()
