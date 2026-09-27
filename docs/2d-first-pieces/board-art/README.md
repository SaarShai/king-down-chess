# Board artwork

`stone-board.png` (web copy `stone-board.webp`) is the painted board used by the game and the board trial. Owner direction, 2026-09-27: take inspiration from the centre four tiles (the capital) of the original King Down board, without the gilding, covering the whole board.

- `source/capital-reference.png` — the capital 2×2 cropped from the original biome board (Drive `board_colored_4K.jpg`, via `docs/research/drive-assets/final-art/board-biomes-capital.jpg`).
- `source/light-stone.png`, `source/dark-stone.png` — cream limestone and charcoal slate textures from Codex built-in image generation, with the capital crop as reference. Exact prompts in `source/*-prompt.txt`; generator output paths in `source/*-generated-source.txt`. Unmodified.
- `compose-board.py` cuts the 64 squares from those textures (varied crop, rotation and tone; fixed seed) and adds the capital's chamfered corners, thin red-brown outline, soft bevel and dark grout. The grid is exact because the script, not the image model, lays it out. `../web-art.py` writes the WebP.

Not used: the marble chess side of the original board (`board-front_back.ai` page 2, `board-2500x2500px.png`). Its marble comes from textures.com stock photos (`FloorsCheckerboard0037`), whose licence forbids distributing the content by itself; those files were removed from the public repository history on 2026-09-26. The full biome board was used briefly on 2026-09-27 and replaced by this stone board at the owner's request.
