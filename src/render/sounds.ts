import type { momentKind } from '../moment';
import type { Move } from '../rules/engine';

/**
 * A move's sounds. `now` plays as the move starts: a launch (shot, swap) or a quiet move. `hit` plays
 * when the board shows the contact: a shove, a chain or a capture.
 */
export function soundsFor(kind: ReturnType<typeof momentKind>, m: Move): { now: 'shot' | 'swap' | 'move' | null; hit: 'shove' | 'chain' | 'capture' | null } {
  const hit = kind === 'shove' || kind === 'shoveGuard' ? 'shove'
    : kind === 'chain' || kind === 'reaver' ? 'chain'
    : m.captures.length || m.selfRemove ? 'capture' : null;
  const now = kind === 'shot' || kind === 'deathTouch' || kind === 'strikeCapture' || kind === 'lob' || kind === 'strike' ? 'shot'
    : kind === 'swap' || kind === 'swapKing' ? 'swap'
    : !hit ? 'move' : null;
  return { now, hit };
}
