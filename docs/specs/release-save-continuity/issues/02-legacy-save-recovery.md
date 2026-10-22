# Keep unreadable browser saves

Type: task
Status: resolved

## Plan and scope

1. Distinguish an absent browser save from unreadable stored data. Replay a supported save into a separate candidate and require every saved action to succeed before replacing the current game.
2. Preserve raw storage and the current game after a local restore failure. Block automatic game writes and play until the player explicitly starts a New game. Use the existing notice controls.
3. Validate a newer cloud game before replacing local saved-game data. A broken remote copy must not erase a valid local game.
4. Add focused failure and continuation checks using existing fixtures. Run `npm test` only after the main task frees the shared lane.

Keep the existing local save format, settings sections and `Game.playLan` prefix behavior. Add no archive, alternate save store, loader or migration framework. No engine semantics or published archive changes. The main task owns integration and browser checks.

## Verification

- Known legacy armies/FENs, stored rules and LAN histories restore fully, permit a future move and reload with the same state.
- Invalid JSON, invalid setup/rules and a partly legal history leave raw saved data unchanged; a failed candidate does not change the current game.
- Recovery blocks autosave and automatic play, including boot and late cloud callbacks. Explicit New game permits saving and play again.
- A broken newer remote game leaves local data and its saved-game stamp unchanged; valid newer data still applies.
- A valid local game stays playable when only the incoming cloud game is broken. Its next saved move or an explicit New game can supersede a rejected future cloud timestamp through the existing stamps.

## Evidence

The old restore ignored the number of replayed moves and reset after an exception. The boot save could then replace the original data. Reads now distinguish absent or unavailable storage from stored data that cannot replay, and validate the full candidate before main derives setup from it. A denied storage read does not lock local practice. The page installs only a complete candidate. A local data failure retains the same live game and raw stored bytes, cancels pending work, shows the existing notice line and blocks autosave, AI and turns. Ordinary saves and Sync's injected access check re-read the current raw data, including changes another tab makes after boot. Explicit New game clears recovery only after creating the replacement and permits that deliberate write.

Sync stays independent of the engine. The page supplies validation and recovery access through the existing account startup. Before a game pull or push, Sync validates it. While local recovery is blocked, settings/game writes and pushes are blocked too, because settings share the same raw save key. Invalid incoming games do not stop a valid local game. One in-memory rejected timestamp lets a real subsequent move or explicit New game supersede a rejected future-dated cloud copy through the existing stamps. No second save key is used.

`KINGDOWN_TEST_FILE='src/{screen/save,screen/play,account/sync,account/account,game}.test.ts' npm test` passes all 80 focused tests, typecheck and 54 artwork checks. Log: `/tmp/kingdown-u08-legacy-save.log`. The page-controller tests use the actual restore/save/AI/New game paths with UI collaborators mocked. Continuation fixtures cover an army without stored rules, stored 2017 rules, fairy history and the documented old spent-Strike FEN; each makes a future move and reloads. The existing `Game.playLan` prefix test still passes.

Independent review finds two faults in the first slice: storage read denial enters recovery, and a remembered boot flag misses malformed data another tab writes before a settings-only cloud pull. Four focused regressions cover both faults, denied-storage practice and an ordinary settings-save variant. Before repair, those four fail and the existing 80 pass. After repair, the same focused command passes all 84 tests, typecheck and 54 artwork checks. Logs: `/tmp/kingdown-u08-recovery-review-red.log` and `/tmp/kingdown-u08-recovery-review-green.log`. The cloud-pull regression uses the real Sync and page access together; it checks raw data, current game, suppressed callbacks and explicit New game replacement.

Base: `05d5dac0`, equivalent to the archive slice integrated at `b427c172`. No engine source, archive or save format changed. No standalone build, browser check or deployment was run. The main task owns independent review, integration after the U05 artifact is sealed, and later browser/release checks. These fixtures do not claim support for every historical development save or complete U08 rollback/setup acceptance.
