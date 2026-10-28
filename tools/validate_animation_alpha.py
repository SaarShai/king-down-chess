"""Preflight selected sprite bytes before publication. See issue 17 for the manifest contract.

This detects missing alpha, empty characters and clipped exteriors. It cannot prove
that a contour has no matte halo; ready publication also needs recorded visual checks.
Recovery exporters can import these functions or run this file on their PNG paths.
"""
from pathlib import Path
from io import BytesIO
import argparse
import hashlib
import json
from PIL import Image, ImageChops


class AlphaError(ValueError):
    pass


def fail(path, reason):
    raise AlphaError(f'{path}: {reason}')


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def validate_frame(path, *, role='character', canvas_size=None, expected_sha256=None):
    """Require real alpha without changing pixels; blank frames need role='effect'."""
    path = Path(path)
    if role not in ('character', 'effect'):
        fail(path, f'unknown frame role {role!r}')
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if expected_sha256 and digest != expected_sha256:
        fail(path, 'frame hash differs from the selected bytes')
    try:
        image = Image.open(BytesIO(raw))
        image.load()
    except (OSError, SyntaxError, Image.DecompressionBombError) as error:
        fail(path, f'unreadable image: {error}')
    with image:
        if 'A' not in image.getbands():
            fail(path, f'{image.mode} has no alpha channel; provide an authoritative RGBA source')
        if canvas_size is not None and list(image.size) != list(canvas_size):
            fail(path, f'canvas {list(image.size)} differs from {list(canvas_size)}')
        alpha = image.getchannel('A')
        lo, hi = alpha.getextrema()
        if lo == 255:
            fail(path, 'fully opaque alpha; provide an authoritative RGBA source')
        w, h = image.size
        border = list(alpha.crop((0, 0, w, 1)).tobytes())
        border += list(alpha.crop((0, h - 1, w, h)).tobytes())
        border += list(alpha.crop((0, 1, 1, h - 1)).tobytes()) if h > 2 else []
        border += list(alpha.crop((w - 1, 1, w, h - 1)).tobytes()) if h > 2 else []
        if max(border) > 1:
            fail(path, 'visible alpha reaches the canvas border; source/equipment may be clipped')
        # An isolated alpha=1 edge speck is harmless; a nonzero exterior is not.
        if sum(a != 0 for a in border) > max(4, len(border) // 100):
            fail(path, 'exterior is not transparent; provide a clear alpha gutter')
        histogram = alpha.histogram()
        if role == 'character' and (sum(histogram[16:]) < 16 or sum(a * n for a, n in enumerate(histogram)) < 16 * 255):
            fail(path, 'no meaningful visible character; blank frames are only allowed as explicit effects')
        return {'role': role, 'size': [w, h], 'alphaRange': [lo, hi], 'sha256': digest}


def validate_frames(frames, *, role='character', canvas_size=None):
    if not frames:
        fail('frames', f'no selected {role} frames')
    return [validate_frame(item['imagePath'], role=role, canvas_size=canvas_size,
                           expected_sha256=item.get('sha256')) for item in frames]


def prepare_assets(paths, asset_dir):
    """Capture and check every selected byte before any publication write."""
    assets = {}
    for path, expected in paths:
        path = Path(path)
        raw = path.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if expected and digest != expected:
            fail(path, 'asset changed after selection/alpha validation')
        if path.suffix.lower() == '.png':
            try:
                with Image.open(BytesIO(raw)) as image:
                    image.verify()
            except (OSError, SyntaxError, Image.DecompressionBombError) as error:
                fail(path, f'unreadable PNG export: {error}')
        target = Path(asset_dir)/(digest+path.suffix.lower())
        if target.exists() and sha256(target) != digest:
            fail(target, 'frozen asset hash differs')
        assets[path] = (target, raw, digest)
    return assets


def same_visible_pixels(left, right):
    if left.size != right.size:
        return False
    a, b = left.convert('RGBA'), right.convert('RGBA')
    if ImageChops.difference(a.getchannel('A'), b.getchannel('A')).getbbox():
        return False
    for channel in 'RGB':
        aa = ImageChops.multiply(a.getchannel(channel), a.getchannel('A'))
        bb = ImageChops.multiply(b.getchannel(channel), b.getchannel('A'))
        if ImageChops.difference(aa, bb).getbbox():
            return False
    return True


def validate_neutral(source, rest, approved, padding, canvas_size, authority=None):
    """Preserve the approved neutral, including alpha and transparent padding."""
    source, rest, approved = map(Path, (source, rest, approved))
    validate_frame(source)
    validate_frame(rest, canvas_size=canvas_size)
    if sha256(source) != sha256(approved):
        with Image.open(approved) as frozen:
            matte = 'A' not in frozen.getbands() or frozen.getchannel('A').getextrema() == (255, 255)
            valid_record = (
                isinstance(authority, dict) and matte
                and isinstance(authority.get('rgbaPath'), str)
                and Path(authority.get('rgbaPath', '')).resolve() == source.resolve()
                and authority.get('rgbaSha256') == sha256(source)
                and authority.get('approvedSha256') == sha256(approved)
                and isinstance(authority.get('provenance'), str) and authority['provenance'].strip()
                and isinstance(authority.get('matteRgb'), list) and len(authority['matteRgb']) == 3
                and all(type(v) is int and 0 <= v <= 255 for v in authority['matteRgb'])
            )
            if not valid_record:
                fail(source, 'differs from the frozen approved neutral; supply an authoritative RGBA source '
                     'and sourceAuthority record (rgbaPath, rgbaSha256, approvedSha256, matteRgb, provenance)')
            with Image.open(source) as rgba:
                composite = Image.new('RGBA', rgba.size, tuple(authority['matteRgb']) + (255,))
                composite.alpha_composite(rgba.convert('RGBA'))
                if composite.size != frozen.size or ImageChops.difference(composite.convert('RGB'), frozen.convert('RGB')).getbbox():
                    fail(source, 'authoritative RGBA recomposite differs from the frozen approved pixels')
    if (not isinstance(padding, list) or len(padding) != 2
            or any(type(v) is not int or v < 0 for v in padding)):
        fail(rest, 'sourcePadding must be two nonnegative pixel offsets')
    with Image.open(source) as rgba, Image.open(rest) as actual:
        x, y = padding
        if x + rgba.width > actual.width or y + rgba.height > actual.height:
            fail(rest, 'sourcePadding clips the authoritative source')
        expected = Image.new('RGBA', tuple(canvas_size))
        expected.paste(rgba.convert('RGBA'), (x, y))
        if not same_visible_pixels(expected, actual):
            fail(rest, 'rest differs from the transparent padded authoritative source')


def validate_visual_review(data, manifest_path):
    """Record evidence, not an automated claim that matte halos are absent."""
    review = data.get('visualReview', {})
    if not isinstance(review, dict) or not isinstance(review.get('reviewer'), str) or not review['reviewer'].strip():
        fail(manifest_path, 'ready publication requires visualReview.reviewer and light/dark/checkerboard/board checks')
    checks = review.get('checks', {})
    for background in ('light', 'dark', 'checkerboard', 'board'):
        check = checks.get(background) if isinstance(checks, dict) else None
        if (not isinstance(check, dict) or check.get('passed') is not True
                or not isinstance(check.get('evidence'), str) or not check['evidence'].strip()):
            fail(manifest_path, f'ready publication requires a passed visualReview.checks.{background} with evidence')
    return review


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('paths', type=Path, nargs='+')
    parser.add_argument('--role', choices=('character', 'effect'), default='character')
    args = parser.parse_args()
    try:
        print(json.dumps([validate_frame(path, role=args.role) for path in args.paths]))
    except (AlphaError, OSError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
