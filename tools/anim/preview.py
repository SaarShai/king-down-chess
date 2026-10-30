"""Board-size previews for one animation bank: light, dark, checkerboard and board."""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

LIGHT = (239, 230, 211, 255)
DARK = (29, 38, 34, 255)
CHECK_LIGHT = (205, 205, 205, 255)
CHECK_DARK = (139, 139, 139, 255)
SQUARE_LIGHT = (234, 219, 189, 255)
SQUARE_DARK = (180, 138, 94, 255)
BOARD = 512
CELL = 64


def checker() -> Image.Image:
    image = Image.new('RGBA', (BOARD, BOARD), CHECK_LIGHT)
    draw = ImageDraw.Draw(image)
    for y in range(0, BOARD, CELL):
        for x in range(0, BOARD, CELL):
            if (x // CELL + y // CELL) % 2:
                draw.rectangle([x, y, x + CELL - 1, y + CELL - 1], fill=CHECK_DARK)
    return image


def board() -> Image.Image:
    image = Image.new('RGBA', (BOARD, BOARD), SQUARE_LIGHT)
    draw = ImageDraw.Draw(image)
    for y in range(0, BOARD, CELL):
        for x in range(0, BOARD, CELL):
            if (x // CELL + y // CELL) % 2:
                draw.rectangle([x, y, x + CELL - 1, y + CELL - 1], fill=SQUARE_DARK)
    return image


def scale_frame(path: Path, factor: float, pivot, anchor) -> tuple[Image.Image, tuple[int, int]]:
    with Image.open(path) as opened:
        frame = opened.convert('RGBA')
    width = max(1, round(frame.width * factor))
    height = max(1, round(frame.height * factor))
    frame = frame.resize((width, height), Image.LANCZOS)
    left = round(anchor[0] - pivot[0] * factor)
    top = round(anchor[1] - pivot[1] * factor)
    return frame, (left, top)


def write_gif(frames, positions, background, output: Path, durations):
    images = []
    for frame, position in zip(frames, positions):
        canvas = background.copy()
        canvas.alpha_composite(frame, position)
        images.append(canvas.convert('RGB'))
    images[0].save(output, save_all=True, append_images=images[1:], duration=durations, loop=0, disposal=2)
    images[0].save(output.with_name(f'{output.stem}-first.png'))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--frames', type=Path, required=True)
    parser.add_argument('--bank', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--height', type=float, default=160)
    args = parser.parse_args()
    bank = json.loads(args.bank.read_text())
    geometry = bank['previewGeometry']
    factor = args.height / geometry['bodyHeightPx']
    files = [args.frames / Path(frame['url']).name for frame in bank['frames']]
    times = [frame['timeMs'] for frame in bank['frames']]
    step = times[1] - times[0] if len(times) > 1 else 100
    durations = [max(20, round(times[index + 1] - times[index])) for index in range(len(times) - 1)] + [max(20, round(step))]
    args.out.mkdir(parents=True, exist_ok=True)
    pivot = geometry['pivot']

    anchor = (BOARD / 2, BOARD / 2 + args.height / 2 + 24)
    for name, background in (('light', Image.new('RGBA', (BOARD, BOARD), LIGHT)), ('dark', Image.new('RGBA', (BOARD, BOARD), DARK)), ('checker', checker())):
        frames, positions = [], []
        for path in files:
            frame, position = scale_frame(path, factor, pivot, anchor)
            frames.append(frame)
            positions.append(position)
        write_gif(frames, positions, background, args.out / f'preview-{name}.gif', durations)

    board_anchor = (BOARD / 2, 4 * CELL + CELL - 8)
    frames, positions = [], []
    for path in files:
        frame, position = scale_frame(path, factor, pivot, board_anchor)
        frames.append(frame)
        positions.append(position)
    write_gif(frames, positions, board(), args.out / 'preview-board.gif', durations)

    sheet = Image.new('RGB', (BOARD, 256), (139, 139, 139))
    column = BOARD / max(1, len(files))
    for index, path in enumerate(files):
        layer = checker().resize((max(1, round(column)), 256)).convert('RGBA')
        frame, position = scale_frame(path, factor * 0.85, pivot, (column / 2, 240))
        layer.alpha_composite(frame, position)
        sheet.paste(layer.convert('RGB'), (round(index * column), 0))
    sheet.save(args.out / 'preview-sheet.png')
    print(json.dumps({'previews': ['light', 'dark', 'checker', 'board'], 'height': args.height, 'frameMs': step}))


if __name__ == '__main__':
    main()
