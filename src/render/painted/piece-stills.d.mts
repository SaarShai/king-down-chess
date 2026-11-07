export interface PieceStill { sourceSha256: string; pivot: [number, number]; size: [number, number]; registrationHeightPx: number; boardScale: number | null; footprint: number[] | null }
export const PIECE_STILLS: Record<string, Record<'white' | 'black', PieceStill>>;
