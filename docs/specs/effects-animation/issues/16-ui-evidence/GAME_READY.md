# Early real game result

The local game plays a legal mate, opens its real result and shows real review tiles. It keeps the board and result reachable at 430 px and 390 px, with White and Black board views.

Early capture run:
`/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/effects-ui-game-qUSiJX/end/`

Files: `ui-ready-430-white.png`, `ui-ready-430-black.png`, `ui-ready-390-white.png`, `ui-ready-390-black.png`.

These first captures use Motion Off for a stable result. The follow-up check covers live result motion and cancellation. This is an implementation sample. It makes no new owner-approval claim. No deploy runs.

At this checkpoint, the lesson browser check passes. The end check passes the result and focus cases. Its old immediate-visibility assertion needs to wait for the new dialog exit motion; native Escape already closes the dialog.

## Final worker check

Final result and account-board checks both pass:
`/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/effects-ui-game-pPwpE4/`

The `end/` folder has the four early orientation captures plus `ui-motion-normal-430.png`, `ui-motion-normal-390.png`, `ui-motion-fast-430.png` and `ui-motion-fast-390.png`. The live check also proves one onset, correct speed, stable resize/reload, Off and reduced motion. A separate prior run passes turn, power and lesson checks. All temporary check servers close when their runner ends. The shared preview server is untouched.
