/** Art-style presets. One row of render settings the designer can switch between in-engine. */
export interface Style {
  label: string;
  pixelSize: number;
  palette: boolean;
  dither: number;
  normalEdge: number;
  depthEdge: number;
  shading: 'lambert' | 'toon';
  toonBands?: number;
  pieces: 'voxel' | 'sprite' | 'clay';
  clayLook?: 'handmade' | 'plasticine';
  /** Inverted-hull outline behind each voxel piece (the pixel pass cannot outline dark pieces). */
  outline: boolean;
  /** Multiplies TARGET_HEIGHT so back-rank pieces stop covering the row behind. Default 1. */
  pieceScale?: number;
  /** Camera pose in degrees (elevation above the board, azimuth from white's side). Default 54/0. */
  camera?: { elev: number; azim: number; zoom?: number };
  /** Tile top: flat colour, a 1-art-pixel dark ring, the Drive stone albedo, or the procedural
   *  pixel stone that replaces it (same mean luminance, no licence). Default 'flat'. */
  tiles?: 'flat' | 'edged' | 'stone' | 'stoneProc';
  /** 'torch' = dim hemisphere + 4 warm corner points + dark background. Default 'bright'. */
  lights?: 'bright' | 'torch';
  /** Which quantisation ramp the palette pass uses. Default 'db32'. */
  paletteName?: 'db32' | 'endesga32' | 'warm';
  /** Hull / sprite outline colour. Default 0x151515. */
  outlineColor?: number;
  /** Hull thickness in art pixels (converted with the pixel size). Default ≈ the legacy 0.04 world units. */
  rim?: number;
  /** Dilate the sprite alpha into a thick outline at texture-load time. */
  spriteOutline?: boolean;
  /** Board block height in tiles; taller shows side faces for the iso look. Default 0.3. */
  boardSide?: number;
  /** Soft dark disc under every piece. */
  shadow?: boolean;
  /** File letters and rank numbers on the board frame. Default true. */
  coords?: boolean;
}

/** Shared renderer presets; the playable game always uses clay. Others serve the graphics study. */
export const STYLES: Record<string, Style> = {
  clay: {
    label: 'Handmade clay', pixelSize: 0.5, palette: false, dither: 0, normalEdge: 0, depthEdge: 0,
    shading: 'lambert', pieces: 'clay', clayLook: 'handmade', outline: false, pieceScale: .85,
    camera: { elev: 60, azim: 0 }, tiles: 'flat', lights: 'bright', shadow: true,
  },
  plasticine: {
    label: 'Polished clay', pixelSize: 1, palette: false, dither: 0, normalEdge: 0, depthEdge: 0,
    shading: 'lambert', pieces: 'clay', clayLook: 'plasticine', outline: false, pieceScale: .85,
    camera: { elev: 60, azim: 0 }, tiles: 'flat', lights: 'bright', shadow: true,
  },
  // The game's look (designer's pick, round 2 "B2 Dungeon voxel"): painted voxel sculpts on the
  // Drive stone tiles, four warm torch points, contact shadows. 53° is the flattest camera that
  // still keeps a king inside its own square (measured: at 52° the king's crown crosses the centre
  // of the square behind it by 2 px; tan 53° = 1.33 = the tallest piece, 1.55 × pieceScale 0.85).
  dungeonVoxel: {
    label: 'Dungeon', pixelSize: 2, palette: false, dither: 0.06, normalEdge: 0.05, depthEdge: 0.15,
    shading: 'lambert', pieces: 'voxel', outline: false, pieceScale: 0.85,
    camera: { elev: 53, azim: 0 }, tiles: 'stone', lights: 'torch', shadow: true,
  },

  // depthEdge stays low on `cel`: the hull outline already draws the silhouette, and the pass's
  // depth term darkens *inside* it, which only muddies the rim.
  cel: { label: 'Cel pixel', pixelSize: 1, palette: false, dither: 0.03, normalEdge: 0.05, depthEdge: 0.15, shading: 'toon', toonBands: 4, pieces: 'voxel', outline: true, pieceScale: 0.85 },
  hd: { label: 'HD pixel', pixelSize: 2, palette: false, dither: 0.03, normalEdge: 0.15, depthEdge: 0.2, shading: 'lambert', pieces: 'voxel', outline: true, pieceScale: 0.85 },
  voxel: { label: 'Clean voxel', pixelSize: 1, palette: false, dither: 0.03, normalEdge: 0, depthEdge: 0.35, shading: 'lambert', pieces: 'voxel', outline: false },
  db32: { label: '16-bit palette', pixelSize: 2, palette: true, dither: 0.03, normalEdge: 0.05, depthEdge: 0.3, shading: 'lambert', pieces: 'voxel', outline: false },
  sprites: { label: 'HD-2D sprites', pixelSize: 1, palette: false, dither: 0.03, normalEdge: 0, depthEdge: 0, shading: 'lambert', pieces: 'sprite', outline: false },

  // --- A: chunky outlined tactics (docs/research/style-refs.md §A) ---
  chunkyVoxel: {
    label: 'A1 Chunky voxel', pixelSize: 3, palette: false, dither: 0, normalEdge: 0.05, depthEdge: 0.1,
    shading: 'toon', toonBands: 2, pieces: 'voxel', outline: true, pieceScale: 0.85,
    tiles: 'edged', rim: 1,
  },
  chunkySprite: {
    label: 'A2 Chunky sprite', pixelSize: 3, palette: false, dither: 0, normalEdge: 0, depthEdge: 0,
    shading: 'lambert', pieces: 'sprite', outline: false, tiles: 'edged', spriteOutline: true,
  },
  chunkyPalette: {
    label: 'A3 Chunky + Endesga', pixelSize: 3, palette: true, dither: 0.02, normalEdge: 0.05, depthEdge: 0.1,
    shading: 'toon', toonBands: 2, pieces: 'voxel', outline: true, pieceScale: 0.85,
    tiles: 'edged', rim: 1, paletteName: 'endesga32',
  },

  // --- B: painterly dungeon (§B) ---
  dungeonSprite: {
    label: 'B1 Dungeon sprite', pixelSize: 2, palette: false, dither: 0.06, normalEdge: 0, depthEdge: 0,
    shading: 'lambert', pieces: 'sprite', outline: false,
    camera: { elev: 60, azim: 0 }, tiles: 'stone', lights: 'torch', shadow: true,
  },
  // B2 is the default preset, first in this list.
  dungeonBright: {
    label: 'B3 Dungeon (bright)', pixelSize: 2, palette: false, dither: 0.06, normalEdge: 0, depthEdge: 0,
    shading: 'lambert', pieces: 'sprite', outline: false,
    camera: { elev: 60, azim: 0 }, tiles: 'stone', lights: 'bright', shadow: true,
  },

  // --- C: iso pixel (§C) ---
  isoVoxel: {
    label: 'C1 Iso voxel', pixelSize: 3, palette: true, dither: 0.08, normalEdge: 0.05, depthEdge: 0.1,
    shading: 'lambert', pieces: 'voxel', outline: true, pieceScale: 0.85,
    camera: { elev: 30, azim: 45, zoom: 0.85 }, paletteName: 'warm', rim: 1, boardSide: 0.8, shadow: true,
  },
  isoSprite: {
    label: 'C2 Iso sprite', pixelSize: 3, palette: true, dither: 0.08, normalEdge: 0, depthEdge: 0,
    shading: 'lambert', pieces: 'sprite', outline: false,
    camera: { elev: 30, azim: 45, zoom: 0.85 }, paletteName: 'warm', spriteOutline: true, boardSide: 0.8, shadow: true,
  },
  isoClean: {
    label: 'C3 Iso clean', pixelSize: 3, palette: false, dither: 0.03, normalEdge: 0.05, depthEdge: 0.1,
    shading: 'lambert', pieces: 'voxel', outline: true, pieceScale: 0.85,
    camera: { elev: 30, azim: 45, zoom: 0.85 }, rim: 1, boardSide: 0.8, shadow: true,
  },
};

/** The default preset on procedural pixel stone instead of the textures.com photo tiles — the
 *  licence swap under review (docs/research/tiles-proc/README.md). Spread from B2 so it keeps
 *  tracking the default and the two stay an apples-to-apples comparison. */
STYLES.dungeonProc = { ...STYLES.dungeonVoxel, label: 'B4 Dungeon (proc stone)', tiles: 'stoneProc' };
