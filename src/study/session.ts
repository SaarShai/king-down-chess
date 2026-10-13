import { Game } from '../game';
import { toFen, toLan } from '../rules/setup';
import type { Status } from '../rules/engine';
import { MAX_ACTIONS, parseStudy, positionData, positionOf, withRules, type PositionData, type Study } from './model';

export interface StudySnapshot { position: PositionData; fen: string; status: Status; legal: string[]; history: string[] }
export interface StudySession {
  snapshot(): StudySnapshot;
  play(lan: string): StudySnapshot;
  undo(): boolean;
  exportStudy(): Study;
}
/** Each call owns the ambient rules only until it returns. The host must keep search in its own worker. */
export function openStudy(input: unknown, engine: string): StudySession {
  const study = parseStudy(input);
  if (!engine || study.engine !== engine) throw new Error('Incompatible study engine source');
  return withRules(study.rules, () => {
    const game = new Game('RNBQKBNR');
    game.load(positionOf(study.start));
    function apply(lan: string): void {
      if (game.status !== 'playing') throw new Error('Study is terminal');
      const matches = game.legal.filter(m => toLan(game.pos, m) === lan);
      if (matches.length !== 1) throw new Error('Illegal or ambiguous study action');
      game.play(matches[0]);
    }
    for (const lan of [...study.prefix, ...study.actions]) apply(lan);
    const snapshot = (): StudySnapshot => withRules(study.rules, () => ({
      position: positionData(game.pos), fen: toFen(game.pos), status: game.status,
      legal: game.status === 'playing' ? game.legal.map(m => toLan(game.pos, m)) : [],
      history: game.history.map(h => h.lan),
    }));
    return {
      snapshot,
      play(lan) { return withRules(study.rules, () => {
        if (typeof lan !== 'string' || lan.length > 1024 || study.actions.length >= MAX_ACTIONS) throw new Error('Study action limit or malformed action');
        apply(lan); study.actions.push(lan); return snapshot();
      }); },
      undo() { return withRules(study.rules, () => {
        if (!study.actions.length) return false;
        game.undo(); study.actions.pop(); return true;
      }); },
      exportStudy() { return structuredClone(study); },
    };
  });
}
