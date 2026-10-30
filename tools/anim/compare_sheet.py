"""Two-row contact sheet: candidate frames above shipped frames, on a checkerboard."""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

TILE = 256
STEP = 32


def checker(size):
    image = Image.new('RGBA', (size, size), (205, 205, 205, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size, STEP):
        for x in range(0, size, STEP):
            if (x // STEP + y // STEP) % 2:
                draw.rectangle([x, y, x + STEP - 1, y + STEP - 1], fill=(139, 139, 139, 255))
    return image


def tile(path):
    with Image.open(path) as opened:
        frame = opened.convert('RGBA')
    frame.thumbnail((TILE, TILE), Image.LANCZOS)
    canvas = checker(TILE)
    canvas.alpha_composite(frame, ((TILE - frame.width) // 2, (TILE - frame.height) // 2))
    return canvas


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    report = json.loads(args.report.read_text())
    rows = report['records']
    sheet = Image.new('RGB', (TILE * len(rows), TILE * 2), (139, 139, 139))
    for index, record in enumerate(rows):
        candidate, shipped = Path(record['candidateFile']), Path(record['shippedFile'])
        sheet.paste(tile(candidate).convert('RGB'), (index * TILE, 0))
        if shipped.exists():
            sheet.paste(tile(shipped).convert('RGB'), (index * TILE, TILE))
    sheet.save(args.out)


if __name__ == '__main__':
    main()
