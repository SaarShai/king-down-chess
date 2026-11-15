# Speed: the first game on a slow link

Status: ready-for-human

Branch: `redesign` (the uncommitted tree of the launch build, lane "speed"). No commit, push, pull request or deploy until the owner says so.

## 1. Source

Launch decision 43 in the design project (`runs/launch/decisions.md`), from the speed audit `runs/launch/speed/report.md` (sections 1, 2 and 4, fixes 1, 3 and 10). Budget: on "slow 4G" with a 4 times slower processor, a first game is playable in 5 s. The audit measured 16.3 s.

## 2. The plan

### Goal

The board of a first game shows when the stone base and the rest stills are ready. Art that the first frame does not draw waits for that frame. Each figure still loads once. The look of the board and of each figure does not change.

### Scope

[Issue 01](issues/01-first-game-load.md): the four parts of decision 43.

1. The board shows on the stone base; the large board picture replaces it when it is ready.
2. The board picture is encoded again at 150 kB or less with no visible loss.
3. The effect sheets, the motion sheets, the other side's parts and `footprints.json` start after the first frame.
4. Each figure still loads in one mode.

Not in scope (other lanes): the home load (fix 7), the home floor picture (fix 8), the app bundle (fix 9), the reply and the worker (decision 44), the accessibility fixes (fixes 4 to 6 and 11), the service worker (fix 12).

### What does not change for the old screens

The renderer is shared. Each change sits behind the scene option `lazySheets`, which only the new page turns on (`src/interface/board-api.ts`). One change also reaches the old page: the wind and rift sheets now load when a scene is made, not when their module loads. The old page makes its scene in the body of `src/main.ts`, so the request starts in the same task as before (browser record: the same millisecond as its stone base, before and after).

## 3. Verification

[Issue 01](issues/01-first-game-load.md), section "Verification".

## 4. Reviews

The lead decided the scope (decision 43). An independent review comes before a pull request.
