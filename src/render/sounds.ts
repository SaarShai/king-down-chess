import type { GameRules } from '../game-rules';
import { momentKind } from '../moment';
import { colorOf, typeOf, N, P, G, M, O, K, PLAIN_KINGS, type Move, type Position } from '../rules/engine';
import { movementSample, playArmour, snd, stopSelection, type SamplePlayback } from './sfx';

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

export function boardSounds() {
  let knightTake = false, pawnTake = false, round = 0;
  const cues = new Set<SamplePlayback>();
  function cue(playback: SamplePlayback) { cues.add(playback); void playback.done.then(() => cues.delete(playback)); return playback; }
  return {
    stop() { round++; for (const playback of cues) playback.cancel(); cues.clear(); stopSelection(); },
    move(before: Position, action: Move, rules: GameRules, animated: boolean, current: () => boolean, armour: boolean, silent = false) {
      if (silent) return { start() {}, contact(_soundHandled?: boolean) {}, finish() {} };
      const own = round;
      const sounds = soundsFor(momentKind(before, action), action);
      const piece = before.board[action.from], type = typeOf(piece), side = colorOf(piece);
      const travels = armour && action.from !== action.to && action.drop === undefined;
      const ordinary = travels && !action.swap && sounds.now !== 'shot' && sounds.now !== 'swap';
      const knight = ordinary && type === N, pawn = ordinary && type === P;
      const moves = !action.pass && !action.pushes && (ordinary || travels && [G, M, O, K].includes(type) && (!action.swap || type === M));
      const movement = moves ? movementSample(type, rules.rules.kings[side]?.king ?? PLAIN_KINGS[side]) : undefined;
      const hidden = () => typeof document !== 'undefined' && document.hidden;
      const take = knightTake ? 'B' : 'A';
      if (knight) { knightTake = !knightTake; cue(playArmour(`knightLeap${take}`)); }
      if (pawn) { cue(playArmour(pawnTake ? 'pawnWalkB' : 'pawnWalkA')); pawnTake = !pawnTake; }
      if (!animated && !hidden() && movement) cue(playArmour(movement));
      if (sounds.now && !((knight || pawn || movement) && sounds.now === 'move')) snd[sounds.now]();
      let struck = false, playback: SamplePlayback | undefined;
      const live = () => current() && own === round;
      return {
        start() {
          if (animated && movement && live() && !hidden()) playback = cue(movement === 'bishopMove' ? playArmour(movement) : playArmour(movement, true));
        },
        contact(soundHandled = false) {
          if (struck || !current()) return;
          struck = true;
          if (knight && own === round) cue(playArmour(`knightLand${take}`));
          if (sounds.hit && !soundHandled) snd[sounds.hit]();
        },
        // On a normal end, stop the loop and let the current take finish.
        finish() { if (live()) playback?.finish(); else playback?.cancel(); },
      };
    },
  };
}
