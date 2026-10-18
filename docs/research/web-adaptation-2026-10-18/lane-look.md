# Look, phone, touch and access survey

PR 61 gives the web app shared fixes for board loading, reduced motion, idle drawing, board labels, disabled coins and some rule text. Most phone, zoom and screen changes stay in plugin code. They need a web change before the web app can use them. The web app already has the game look, keyboard play, live screen-reader text, focus return, sound and an end ceremony. Keep these parts. Use the plugin fixes as inputs to a small web plan. Do not copy the host frame or its composer reserve. This survey checks source and saved reports only. It does not prove how the current web page looks on a device.

## Scope and evidence key

- Date: 2026-10-18. Main: `38a6bbffb3b85f10bb9e6d23e8e1f394b781b4f4`. Release: `682e58bd47e38aa1e571deb17afb64f3183149a1`.
- The release branch advances to `442c5eb3` during this survey. This report stays at the requested `682e58bd` head. The later commit changes the queued name-screen return route and its tests. It does not change the CSS, art or shared board fixes in this lane.
- `M path:line` means the file on that main commit. `R path:line` means the file on that release commit. Line numbers refer to Git content, not the active worktree.
- `I/name` means `R docs/specs/chatgpt-mvp/issues/name`. `P/name` means `R docs/specs/plugin-submission/issues/name`. These short paths keep the item evidence small.
- `Q` means `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad`. Saved QA reports below are under that path.
- The [PR 61 body](https://github.com/SaarShai/king-down-chess/pull/61) lists the phone, zoom and device fixes. It records 70 shots and 13 states for rolling QA 3. Its check list names an older head, `801cc7c9`. This survey does not treat that list as a fresh check of `682e58bd` or of the web app.
- Size is the web work after merge: **S** = one small change; **M** = changes across a few UI parts; **L** = a page design or several user paths. For (a), (d) and (e), **S / no web edit** means no lift is needed.
- The owner rule is one game look across hosts. Evidence: `docs/lessons/browser-checks-and-ui.md:3`; memory `feedback-plugin-ui-uses-game-design.md:11`. An improvement or taste call needs the owner's yes. A confirmed fault with one right fix does not. Evidence: memory `feedback-ux-choices-delegated.md:11`.
- Check method: compare the two Git trees; trace imports and callers; read the fault tickets and saved QA reports. No repo file changes, tests, runs, browser checks, sign-in or live-site requests occur. The only written file is this report.

## (a) Shared code: arrives with PR 61

### LOOK-01 — Show stone before the first board frame

- **Kind:** (a). The web app uses this code.
- **Evidence:** `R src/render/PaintedView.ts:92`; `R docs/2d-first-pieces/board/scene.mjs:952`; `M src/main.ts:69`. Commit `88f1188a`; `P/29-release-candidate.md:137` (F13).
- **Web today:** `M src/render/PaintedView.ts:90` starts the load without hiding the canvas. The old scene load does not wait for stone decode. The same load path exists on the web; the visible flash is **unverified** in this survey.
- **Change / size:** merge only; **S / no web edit**. The canvas stays hidden until the load and next frame.
- **Depends on:** none. **Risk:** `ready()` now waits for a frame. A hidden tab can delay it. Do not use an old load-only assumption in web checks.
- **Taste:** no; this repairs first paint.

### LOOK-02 — Reduced motion uses a slide and a short fade

- **Kind:** (a). The web renderer uses it.
- **Evidence:** `R src/render/PaintedView.ts:177`; `R docs/2d-first-pieces/board/scene.mjs:602`, `:723`, `:883`; `I/24-fault-round-2a.md:28`. Commit `9bf584d9`.
- **Web today:** `M src/render/PaintedView.ts:162` still sets move and capture effects on. It does not pass the system reduced-motion choice to the scene. Web Settings defaults to Off under reduced motion, but a saved Normal or Fast setting can take this path (`M src/screen/settings.ts:37`).
- **Change / size:** merge only; **S / no web edit**. Large strikes and shake stop. Travel stays; a taken piece fades for 150 ms at either pace.
- **Depends on:** none. **Risk:** check swaps, shoves, takes and the saved pace. Off and reduced motion are separate settings.
- **Taste:** no for the access fix. A different motion design needs approval.

### LOOK-03 — Stop passive board drawing after five seconds

- **Kind:** (a). The web uses the same scene.
- **Evidence:** `R docs/2d-first-pieces/board/scene.mjs:854`, `:873`; `I/26-fault-round-3.md:25`. Commit `7adaac11`.
- **Web today:** the old scene keeps a timer for idle, king and pawn effects. The same loop serves the web board. The ticket records browser CPU time; it does not measure battery use.
- **Change / size:** merge only; **S / no web edit**. A state change wakes passive motion for five seconds. A live move can finish.
- **Depends on:** LOOK-02 for motion limits. **Risk:** effects now rest on the web too. Frequent pointer or state changes can wake them again; this is not a fixed five-second limit on all drawing.
- **Taste:** the performance fault has one cause. The length of visible passive motion is a taste choice if the owner wants to change it.

### LOOK-04 — Keep board coordinates clear of the pieces

- **Kind:** (a). The web opts in with `webInk: true`.
- **Evidence:** `R src/render/board-ink.ts:16`; `R src/render/PaintedView.ts:209`; `M src/main.ts:69`; `I/27-fault-round-4.md:40`, `:68` (M10).
- **Web today:** `M src/render/PaintedView.ts:195` scales the label without the new 40 board-unit cap. The overlap path exists on small web boards. Actual web overlap is **unverified**.
- **Change / size:** merge only; **S / no web edit**. Limit the label size and inset. Hide labels when they would be below 8 CSS px, about a 192 px board.
- **Depends on:** none. **Risk:** a player can have Coordinates on and see no labels on a very small board.
- **Taste:** **yes** for hiding tiny labels. The ticket calls this out for the owner. This choice reaches the web on merge without a web CSS change.

### LOOK-05 — Disabled coins keep their round face

- **Kind:** (a). The web imports the changed base CSS.
- **Evidence:** `R src/style.css:184`, `:504`; `M src/main.ts:1`; `P/29-release-candidate.md:82`. The selector uses `:not(:where(.coin))` to keep its old weight.
- **Web today:** `M src/style.css:184` gives every disabled button a flat background and removes its shadow. That can erase a coin face. The present web power renderer does not normally disable its read coins (`M src/ui/coin.ts:16`), so the reported disabled-coin case is not proved in a current web path.
- **Change / size:** merge only; **S / no web edit**.
- **Depends on:** none. **Risk:** keep the exclusion narrow. An earlier stronger selector changes disabled king pictures; the ticket records the correction.
- **Taste:** no; keep the coin's own style.

### LOOK-06 — Let the short-phone context row grow

- **Kind:** (a), but only part of the plugin fix is shared.
- **Evidence:** `R src/ui/table.css:7`, `:109`, `:117`; `I/23-fault-round-1.md:25`. The web imports this stylesheet at `M src/main.ts:14`.
- **Web today:** `M src/ui/table.css:109` fixes the short-phone context track at 57 px. Line 117 also fixes the box height. The release changes these to minimum heights and adds `--strip-row` hooks.
- **Change / size:** merge only; **S / no web edit** for these hooks.
- **Depends on:** LOOK-34 for full web reflow. **Risk:** the web still has line clamps and hidden overflow at `M src/ui/table.css:85`, `:118`. Merge does **not** give the web all of the plugin's full-text rules. A taller row can also leave less board room.
- **Taste:** no for a cut-text fault. The board-versus-text layout is an owner choice.

### LOOK-07 — More complete spoken rule and move text

- **Kind:** (a). The web calls the changed helpers.
- **Evidence:** `R src/read.ts:211`; `R src/move-text.ts:88`, `:93`, `:100`; `R src/context-line.ts:26`; `R src/ui/table.ts:101`. Web callers: `M src/screen/play.ts:290`, `M src/ui/guide.ts:4`, `M src/ui/table.ts:9`.
- **Web today:** the pawn read gives only the first movement sentence. Firewall can fall through to a same-square move sentence. Castling and en passant lack the added names. Several instructions say Tap.
- **Change / size:** merge only; **S / no web edit** for the fuller pawn rule, Firewall, castle and en-passant text, and Select instructions.
- **Depends on:** none. **Risk:** longer words need the context space in LOOK-06 and LOOK-34. New helpers such as `pieceTitle`, `teachNote` and `shortMove` are **not** used by the web just because they are shared.
- **Taste:** no for false or incomplete move descriptions. New teaching words are LOOK-33.

### LOOK-08 — Shared touch and drag gate

- **Kind:** (a) for the input mechanism only. The web uses it, but does not set its new gate.
- **Evidence:** `R src/render/PaintedView.ts:50`, `:112`, `:304`; `R src/plugin/screens/board.ts:83`; `I/39-device-faults.md:14`. Commits `34a72f56`, `e4add863`.
- **Web today:** the input path arms a drag on any piece of the side to move (`M src/render/PaintedView.ts:275`). The web screen rejects many blocked actions later (`M src/screen/play.ts:488`, `:502`).
- **Change / size:** merge only; **S / no web edit** for the mechanism. F-2 is **not a complete automatic web fix**: `canDrag` defaults to true and the web never sets it.
- **Depends on:** LOOK-15 for useful web scroll and the local input gate. **Risk:** a swipe can still reach a web click/read path when that gate stays true. The device symptom on the web is **unverified**.
- **Taste:** no for swipe-versus-tap separation.

### LOOK-09 — Cross-origin board art can enter the canvas

- **Kind:** (a). The web uses these shared image loaders.
- **Evidence:** `R docs/2d-first-pieces/board/scene.mjs:55`; `R docs/2d-first-pieces/board/king-effects.mjs:54`; `M src/render/PaintedView.ts:1`.
- **Web today:** board, king, piece and effect images do not all set `crossOrigin`. This serves same-origin web art today.
- **Change / size:** merge only; **S / no web edit**. The release sets anonymous cross-origin image loads, including Workshop figures.
- **Depends on:** the art server's response if art moves to another origin. **Risk:** a remote art URL without the correct response can fail where an unreadable canvas once worked. Current same-origin art is not evidence of that fault.
- **Taste:** no. This supports the plugin's separate art origin; it does not require a web art move.

## (b) Plugin code that the web can reuse

### LOOK-10 — Stone controls and a pressed selected state

- **Kind:** (b).
- **Evidence:** `R src/plugin/app.css:334` to `:379`; `R src/plugin/assets/stone-control.webp`; `R docs/specs/taste-recommended/issues/04-owner-decisions.md:8`, `:26` (C1 a).
- **Web today:** buttons use a vellum gradient and a 2 px press (`M src/style.css:163`, `:176`). Choices use the existing game controls.
- **Change / size:** **M**. Lift the stone face, edges, selected state and reduced-motion press rule into an agreed shared control style. Keep coins, emblems, portraits and badges out of it.
- **Host coupling:** `#app-root` scope only; no host call. Replace the scope and asset path.
- **Depends on:** LOOK-13 and LOOK-31. **Risk:** broad selectors erase coin faces or change native choice labels; the fault history contains both cases.
- **Taste:** **yes**. Approval of the plugin look does not itself approve a web-wide control change.

### LOOK-11 — Lining digits and one type scale

- **Kind:** (b).
- **Evidence:** `R src/plugin/app.css:4`, `:25`, `:86`, `:139`, `:201`; `I/25-fault-round-2b.md:27`, `:32`; `I/27-fault-round-4.md:36`.
- **Web today:** the base has type tokens, but table text still uses raw sizes (`M src/ui/table.css:22`, `:28`). Some rows use tabular figures (`M src/style.css:256`); the page has no general lining-number rule.
- **Change / size:** **S** for lining digits; **M** for table token use and narrow title scaling. Lift only the matching rules.
- **Host coupling:** plugin page and title selectors; no host API.
- **Depends on:** LOOK-17 and LOOK-28. **Risk:** text width changes. The release still imports the game's type; a system-font proposal is not the final code (`R src/plugin/app.css:1`).
- **Taste:** **yes** for a new web type treatment. A wrong or cut digit is a fault after proof.

### LOOK-12 — Symbols-only board setting

- **Kind:** (b). Shared drawing support exists, but the web does not use it.
- **Evidence:** `R src/plugin/board-view.ts:17`; `R src/plugin/art.ts:3`; `R src/render/PaintedView.ts:130`, `:252`; `R src/render/marks.ts:187`; `R src/plugin/index.html:64`.
- **Web today:** it makes a painted `BoardView` (`M src/main.ts:69`). Settings can show piece letters; there is no symbols-only control. The interface at `R src/render/PaintedView.ts:12` does not expose `setSymbols`.
- **Change / size:** **M**. Lift image loading and the setting. Save it with local web settings. Expose the shared method through the web view interface. Keep preview ghosts in the same look.
- **Host coupling:** `BoardSettings`, plugin settings tools, widget errors and the plugin SVG build transform. Replace these with local settings and normal web assets.
- **Depends on:** the settings/save lane. **Risk:** image decode failure, wrong army colour and a painted ghost on a symbol board.
- **Taste:** **yes** for the new option and its default.

### LOOK-13 — 48 px touch targets, also on tablets

- **Kind:** (b).
- **Evidence:** `R src/plugin/app.css:297` to `:330`; `I/24-fault-round-2a.md:23`, `:56`; `I/27-fault-round-4.md:35`, `:43`; `I/36-android-fixes.md:24`, `:30` (F9, M4, M11).
- **Web today:** `--tap` is 44 px (`M src/style.css:95`). The broad phone rule stops at 720 px (`:635`). Settings labels have a separate 44 px floor; table bar buttons are already 60 px (`M src/ui/table.css:38`, `:57`). Thus the web does **not** share the plugin's 44 px bar fault, but some web controls remain below 48 px.
- **Change / size:** **M**. Reuse coarse-pointer detection and measured target rules. Prefer a real 48 px box where room permits. Reserve the hit layer where the row must stay small.
- **Host coupling:** `data-touch` comes from host context; the web can use `(pointer: coarse)`.
- **Depends on:** LOOK-14, LOOK-20. **Risk:** hit layers cover Cancel, Moves or a checkbox. Preserve edge hit checks and the plugin's 4 px bar reserve only where needed.
- **Taste:** **yes** for a new 48 px web standard. Once chosen, overlap has one right fix.

### LOOK-14 — Compact phone rows and Back in the player strip

- **Kind:** (b).
- **Evidence:** `R src/plugin/app.css:181`, `:230` to `:254`; `I/21-iphone-test-fixes.md:69`; layout B in `R docs/specs/taste-recommended/issues/04-owner-decisions.md:16`.
- **Web today:** short phones use 44 px strips but retain a 57 px context row, Moves row and a 60 px bar (`M src/ui/table.css:105`). There is no plugin-style page header above the web table.
- **Change / size:** **M**. Reuse compact rows where needed; decide how web Home and Menu serve Back. Use the actual web table box, not host height.
- **Host coupling:** page-sheet, `data-page`, table-screen container and plugin Back routes.
- **Depends on:** LOOK-13, LOOK-15, LOOK-34. **Risk:** the extra Back space cuts a name; removing Moves can hide history. Do not copy a redundant page-header fix.
- **Taste:** **yes** for row sizes, Back position and how to open Moves.

### LOOK-15 — Board scroll that preserves taps and piece drags

- **Kind:** (b), with the shared mechanism in LOOK-08.
- **Evidence:** `R src/plugin/app.css:169`, `:263` to `:287`; `R src/plugin/screens/board.ts:83`; `P/35-touch-scroll.md:19`, `:26`; `I/38-merge-5.md:60`; ticket 39 F-2.
- **Web today:** body overflow is hidden and the canvas has `touch-action: none` (`M src/style.css:125`, `:691`). The web has no 210 px board floor or scroll screen. The shared merge leaves both CSS rules in place.
- **Change / size:** **M**. Lift `pan-y`, a bounded scroll box and a minimum board size. Set `canDrag` from the web's local turn, busy, lesson and review state. Expose that hook on `BoardView`; the current interface does not include it. Keep square taps; allow scroll from empty or enemy squares and from a locked board.
- **Host coupling:** `.page-sheet` and the frame; the gate uses the plugin seat. Replace them with web state and direct page bounds.
- **Depends on:** LOOK-08, LOOK-14, LOOK-34. **Risk:** a swipe selects a piece; a drag scrolls; the bar remains below the fold. Desktop WebKit raw touch is not proof of native Safari pan (`P/35-touch-scroll.md:30`).
- **Taste:** **yes** for the board floor and scroll layout. Swipe selection and lost drag are faults.

### LOOK-16 — Side-panel scroll and medium landscape

- **Kind:** (b).
- **Evidence:** `R src/plugin/app.css:289` to `:295`; `R tools/plugin-ui-build.mjs:17` to `:27`; `I/26-fault-round-3.md:27` (F34).
- **Web today:** the side layout starts at 900 px, or in landscape at heights up to 500 px (`M src/ui/table.css:62`). It has no `overflow-y: auto` on `.table-side`. The plugin adds a landscape case up to 640 px of table-screen height. The web's 820 × 600 layout therefore differs; the plugin's 82 px baseline is not a web measurement.
- **Change / size:** **M**. Lift side-panel scrolling and the useful landscape break point into web CSS. The build-time rewrite does not change the source stylesheet used by the web.
- **Host coupling:** measured table-screen container; no host call in the CSS.
- **Depends on:** LOOK-34. **Risk:** portrait misclassification, a narrow board beside a fixed 340 px column, or hidden controls. Device appearance is **unverified** here.
- **Taste:** **yes** for layout break points; lost controls are faults.

### LOOK-17 — Reflow setup choices and page titles at 200%

- **Kind:** (b).
- **Evidence:** `R src/plugin/screens/setup.css:9` to `:20`; `R src/plugin/app.css:197` to `:203`, `:304`; `I/27-fault-round-4.md:36`, `:42`; rounds 5 to 7, `I/28-fault-rounds-5-7.md:14`.
- **Web today:** New game has three mode columns and a one-row segment group (`M src/style.css:330`, `:345`). The phone Menu title forces `nowrap` (`M src/ui/table.css:134`). The same restrictive source rules exist, but web overflow at 197 px is **unverified**.
- **Change / size:** **S** for wrap rules; **M** with the web setup page. Lift whole-word wrapping, minimum text size, stacked modes and two-per-line segments. Keep the second row's hit layer off the first row.
- **Host coupling:** plugin setup and page-title selectors only.
- **Depends on:** LOOK-11, LOOK-13, LOOK-34. **Risk:** tiny text can make a zoom repair ineffective. The title must still grow under zoom.
- **Taste:** approval for a new layout or type size; clear clipping needs no taste choice.

### LOOK-18 — Scrollable zoom end card; Safari N1 and Android F-1

- **Kind:** (b).
- **Evidence:** `R src/plugin/screens/end.css:1`, `:19` to `:40`; `I/32-qa2-faults.md:22`, `:71`; `I/38-merge-5.md:68`, `:83`; `I/39-device-faults.md:13`. This covers QA 1 T1, QA 2 C, Safari 201 × 357 and Android 206 × 395.
- **Web today:** it uses a native modal, generic viewport max-height and overflow, and a different end form (`M src/style.css:280`, `:441`; `M src/game-end.ts:60`). It has no host Back control or composer gap. It already scrolls, so the exact plugin hidden-frame fault is not present in the same structure. First-view action access at web 200% is **unverified**.
- **Change / size:** **M**. Reuse result-first action order, short-view spacing and action bounds. Use the web dialog's viewport limit. Lift the F-1 rule only if the web card needs it: below 320 px, hide the decorative win line while retaining the result title.
- **Host coupling:** `.frame`, plugin end class, Back reserve and server result facts.
- **Depends on:** the end-screen lane and LOOK-34. **Risk:** width-only caps make tall narrow views scroll without need. A cut button can be too weak a scroll cue.
- **Taste:** **yes** for hiding art or win words and for a cut-action cue. Unreachable actions have one right fix after proof.

### LOOK-19 — Short-landscape end card

- **Kind:** (b).
- **Evidence:** `R src/plugin/screens/end.css:42` to `:54`; `I/36-android-fixes.md:26`, `:38` to `:44` (T-B).
- **Web today:** generic modal scroll limits apply. It keeps 104 px king art and normal margins (`M src/style.css:449`, `:453`). It has no short-landscape end rule.
- **Change / size:** **S** after the end design is chosen. Lift the height query, smaller gaps, hidden art and action-first order. Keep title, result and first action visible before focus can scroll the card.
- **Host coupling:** the frame height calculation; replace it with the direct web viewport.
- **Depends on:** LOOK-18. **Risk:** focus starts below the result; a landscape rule changes narrow portrait. The plugin records a 160 px card case, not a fresh web result.
- **Taste:** **yes** for spacing and hidden art; missing action access is a fault.

### LOOK-20 — Two-row card strips through 440 px

- **Kind:** (b).
- **Evidence:** `R src/plugin/app.css:255` to `:260`, `:278`; `I/37-k-picks.md:28`; `I/38-merge-5.md:92`. Commits `d23eb6bf`, `2578ad9f`.
- **Web today:** the player strip is a flex row (`M src/ui/table.css:17`). Web Menu still calls card mode Coming (`M index.html:222`), and `M src/ui/powers.ts:41` builds power coins only. Thus the reported four-card name squeeze is not a current web card path.
- **Change / size:** **S** for the layout after card UI exists. Give name and rating the full first row. Place four cards and an optional power coin in the second row. Below 320 px, the final code uses one sideways scroll row, **not** the earlier wrapped-coins proposal.
- **Host coupling:** container width and strip IDs; no host API.
- **Depends on:** the card-mode lane, LOOK-13, LOOK-15. **Risk:** 44 px more strip height reduces board size. K1 does not apply to the seat's lone king coin.
- **Taste:** **yes** for the two rows and sideways scroll.

### LOOK-21 — Card faces and a 2 × 2 setup grid

- **Kind:** (b).
- **Evidence:** `R src/plugin/card-face.ts:7`; `R src/plugin/art.ts:1`; `R src/plugin/screens/setup.ts:75`, `:122`; `R src/plugin/screens/setup.css:5`; `R docs/specs/owner-decisions/issues/07-cards.md:76`.
- **Web today:** the web king picker already uses `powerArt` and `emblemArt` (`M src/new-game.ts:9`, `:138`, `:189`). It has no four-card picker in its current New game path.
- **Change / size:** **M** after card setup is connected. Lift `cardArt`, the card face, the two-column grid, visible rule and cost, and the 140 ms selected lift. Keep plain names where no painting or scene exists.
- **Host coupling:** plugin asset glob, plugin draft/settings and sheet actions. The art and CSS have no `window.openai` or MCP call; the setup screen does.
- **Depends on:** card setup, LOOK-11, LOOK-31. **Risk:** plugin URL transforms do not work unchanged in the web build; a random example hand can look like a fixed deal.
- **Taste:** **yes**. The owner chose the plugin grid without a chest. Do not revive a chest as an automatic web change.

### LOOK-22 — Distinct hand rings and readable spent coins

- **Kind:** (b).
- **Evidence:** `R src/plugin/app.css:124` to `:136`; `R src/plugin/screens/board.css:40`; `R docs/specs/owner-decisions/issues/26-picks.md:81` (G2 a).
- **Web today:** the shared coin has a light radial face and a used opacity of 0.7 (`M src/style.css:497`, `:511`). It has no card-hand rings.
- **Change / size:** **S** once cards exist. Lift the dark face and gold ring for the player's cards, dark stone ring for the other hand, face-sized art and 0.85 spent opacity. Keep the armed ring.
- **Host coupling:** `#app-root` and player-strip selectors only.
- **Depends on:** LOOK-05, LOOK-20, LOOK-21. **Risk:** a broad stone or disabled rule wins over the radial face. Different ring colours need enough contrast, also when spent.
- **Taste:** **yes** for hand colours and dim level. Text that fails the agreed contrast limit is a fault.

### LOOK-23 — Short game motion, card effects and a live win

- **Kind:** (b). The shared reduced-motion repair is LOOK-02.
- **Evidence:** `R src/plugin/screens/board.css:39` to `:49`; `R src/plugin/screens/setup.css:53`; `R src/plugin/screens/end.css:57`; `R src/plugin/app.css:404`; gates at `R src/plugin/screens/board.ts:308`, `:340`, `:415`, `:466`.
- **Web today:** it already has painted moves, live power scenes, a title entrance and a full end ceremony. It has no plugin card-deal/spend pulse, emblem flip, check-portrait pulse or sword-button pulse.
- **Change / size:** **M**. Lift only approved moments: 320 ms deal with 60 ms steps, 300 ms spend pulse, 320 ms emblem flip/board reveal/end rise, 600 ms check pulse and 400 ms ready pulse. Gate JS motion as well as CSS. Do not replace the web ceremony by accident.
- **Host coupling:** live-start/remount state and plugin view revisions. Motion art and CSS are reusable; event timing must come from web state.
- **Depends on:** LOOK-02, cards, end flow. **Risk:** replay on restore, a restart on strip redraw, or controls blocked by motion. The plugin uses negative delays to retain motion progress.
- **Taste:** **yes** for each new moment. The 600 ms pulse also exceeds ticket 22's general 400 ms aim; do not claim all effects meet that aim.

### LOOK-24 — Armed rule text, full stops and keyboard scroll

- **Kind:** (b).
- **Evidence:** `R src/plugin/screens/board.ts:383`; `R src/plugin/screens/board.css:17`; `R docs/specs/owner-decisions/issues/26-picks.md:61`; `I/32-qa2-faults.md:135` (G); `Q/qa/rolling-3/report.md:14`.
- **Web today:** armed powers use the context line. Short phones clamp it with hidden overflow (`M src/ui/table.css:118`). The web has no plugin card-armed rule line.
- **Change / size:** **S** for rule text and focus; **M** with card arming. Lift target-first text, a stop after the card name, and a focusable scroll area only when armed. The plugin limits this box to two lines in normal phone portrait; below 320 px it shows all text and scrolls the page.
- **Host coupling:** card/turn draft and status rank; no host call in the text box.
- **Depends on:** LOOK-06, LOOK-15, LOOK-21. **Risk:** rolling QA 3 still finds no cue for the 40 px inner scroll box. Reuse the keyboard access, but do not call the visual cue solved.
- **Taste:** **yes** for text order and inner scroll. Cut text and absent keyboard access are faults.

### LOOK-25 — A real piece portrait before the rule text

- **Kind:** (b).
- **Evidence:** `R src/plugin/screens/board.ts:390`; `R src/plugin/app.css:410`; `I/28-qa1-swap-line.md:18`; `Q/qa/rolling-2/report.md:20`, `:49` (QA 1 T4/T5).
- **Web today:** All rules sits in context actions after the text (`M index.html:46`). On short phones it becomes an information mark (`M src/ui/table.css:121`).
- **Change / size:** **S**. Reuse the portrait control, correct army colour, fallback and All rules accessible name. The plugin also uses `pieceTitle` for capitalized piece names (`R src/read.ts:7`). A web caller must opt in to that text change; the merge alone does not change it. Keep a stable focus target through redraw.
- **Host coupling:** plugin art loader and selected-piece state only.
- **Depends on:** LOOK-21 for asset routing, LOOK-31. **Risk:** it consumes text width or shows no face for a custom piece. QA 2's claim of a wrong Maester portrait is later refuted; do not build a new art correction from that report alone (`Q/qa/rolling-3/report.md:10`).
- **Taste:** **yes** for portrait position and replacing the information mark. A missing or wrong image has one right fix once proved.

### LOOK-26 — Recent moves in the free phone row

- **Kind:** (b).
- **Evidence:** `R src/plugin/screens/board.css:57`; `R src/plugin/screens/board.ts:434`; `R src/plugin/index.html:70`; `R src/plugin/app.css:388`; `I/28-qa1-moves-band.md:19` (T7).
- **Web today:** Moves opens a modal list (`M index.html:68`; `M src/ui/table.css:48`). The free row stays empty. The web shows the full last-move sentence in a two-line box (`M src/ui/table.css:33`). The plugin adds a separate 24 px short-move/time band on short screens.
- **Change / size:** **M**. Lift the 108 px inline list, actual free-height measurement, close state, latest-move scroll and sheet fallback. Keep the control before its region in DOM order and keep `aria-controls`/`aria-expanded`.
- **Host coupling:** replayed server history and plugin route lifecycle. Use local game history instead.
- **Depends on:** LOOK-14, LOOK-34. **Risk:** the list changes board size or hides history on short phones. The final plugin enables it only when the portrait layout has enough measured free space.
- **Taste:** **yes** for using the free row this way.

### LOOK-27 — Profile, scroll art, totals and badges fit a phone

- **Kind:** (b).
- **Evidence:** `R src/plugin/screens/profile.css:11` to `:46`; `R src/plugin/screens/profile.ts:41`, `:45`; `I/25-fault-round-2b.md:23`; `I/27-fault-round-4.md:34`, `:41`, `:42` (F15, M3, M13).
- **Web today:** Account shows the signed-in person and account actions (`M src/account/account.ts:25`, `:52`). The web does not import the plugin Profile/history/badges page (`M src/main.ts:196`). Thus this exact profile squeeze has no current web page.
- **Change / size:** **M** after a web Profile route exists. Reuse one page scroll, border-image rollers that do not darken long lists, narrow totals with gaps, feature icons on another line, narrow dates, three-column zoom badges and the darker W mark.
- **Host coupling:** profile and games MCP reads, plugin routes and art URLs. Replace them with the web account/service path.
- **Depends on:** profile/account lane, LOOK-28, LOOK-31. **Risk:** contrast changes after More; names remain cut with an ellipsis by design. Do not call every name fully visible.
- **Taste:** **yes** for parchment art and layout. Overlap and failed contrast are faults.

### LOOK-28 — Game-row time, wrap and dot spacing

- **Kind:** (b). Includes device F-4.
- **Evidence:** `R src/plugin/games-list.ts:7`, `:14`, `:34`; `R src/plugin/app.css:61`, `:63`; `I/27-fault-round-4.md:37` to `:39`; `I/39-device-faults.md:16`. Commits `29ba68cd`, `5d0ccd64` keep the dot with its date and scope the rule.
- **Web today:** the local home shows one saved game and a daily army (`M src/ui/home-view.ts:21`, `:31`). It has no plugin inbox row list. The plugin's doubled first-dot gap is absent from that path.
- **Change / size:** **S** after the web games list exists. Lift side plus start time, no seconds, distinct friend-wait text, English UI date format, nonbreaking AM/PM, and a separate dot in an inline group. Keep the dot with its detail on wrap.
- **Host coupling:** InboxEntry and MCP game actions; date and row helpers do not call the host.
- **Depends on:** games/profile lane. **Risk:** device locale, local time and fixed English words can disagree; an unscoped `.game-detail` rule changes other rows.
- **Taste:** **yes** for date format and wording. Unequal gap caused by the row structure is a fault.

### LOOK-29 — Centre direct sheet actions

- **Kind:** (b). Device F-3.
- **Evidence:** `R src/plugin/screens/board.css:27`, `:35`; `R src/plugin/screens/board.ts:266`, `:275`; `I/39-device-faults.md:15`.
- **Web today:** powers read in the context line, not the plugin Use sheet (`M src/ui/powers.ts:55`). Generic web buttons start at the left, but dialog form buttons already centre (`M src/style.css:304`). The exact reported Use-sheet fault is absent.
- **Change / size:** **S** when a web card/power sheet is added. Lift the direct-child action rule. Keep move-choice list rows left aligned.
- **Host coupling:** `#board-sheet` markup only; no host call.
- **Depends on:** board/card sheet lane. **Risk:** a broad rule centres move rows or changes menu grid alignment.
- **Taste:** no for this fixed action-label fault. A different sheet design needs approval.

### LOOK-30 — WebKit focus and stable table placement

- **Kind:** (b) for the product fixes only.
- **Evidence:** `R src/plugin/app.ts:29`; `R src/plugin/screens/board.ts:239`; `R src/plugin/screens/board.ts:43`; `R src/plugin/screens/setup.ts:95`, `:110`; `I/21-iphone-test-fixes.md:70`, `:75`.
- **Web today:** it uses native modal dialogs and explicit Menu focus return (`M src/ui/menu.ts:58`, `:68`). Power-coin redraw also restores focus (`M src/ui/powers.ts:47`). The main table does not move between plugin route sections.
- **Change / size:** **S** for a specific missing opener/focus case when new sheets arrive. Reuse `preventScroll`, stable control IDs and the guard against moving a table that is already in its parent. Do not add a global click-focus listener without a web need.
- **Host coupling:** plugin route sections and nonmodal dialogs made modal with `inert` and a scrim. No host API in the fixes themselves.
- **Depends on:** any lifted sheet. **Risk:** focus jumps, scroll resets and late focus after a user moves away. A pointer click does not always focus a WebKit button.
- **Taste:** no for a lost focus/scroll fault. LOOK-36 covers test-only WebKit repairs.

### LOOK-31 — Name coins, features and results for screen readers

- **Kind:** (b).
- **Evidence:** `R src/plugin/screens/board.ts:300`, `:313`; `R src/plugin/screens/friend.ts:15`; `R src/plugin/card-face.ts:11`; `P/14-f8-accessible-rows.md:9`, `:26`; `R src/plugin/screens/setup.ts:31`; `R src/plugin/index.html:49`; `R src/plugin/app.css:87`.
- **Web today:** the board has live status and move announcements. Power labels name the king/power, with ownership explained in the read note (`M src/ui/coin.ts:17`; `M src/ui/powers.ts:75`). It has no card-owner, profile-result or feature-inbox controls.
- **Change / size:** **S** per lifted component. Keep Your/Opponent ownership, named feature images, won/drawn/lost result images, decorative art hidden from speech, native inputs and full button names. For new code fields, reuse characters capitalization, no auto-correct or spell check, a Go key hint, and the darker placeholder. These phone input fixes have no current local-game code field to repair.
- **Host coupling:** the plugin seat tells which hand is yours. Local two-player web play needs White/Black ownership when there is no fixed viewer.
- **Depends on:** cards/profile/online UI. **Risk:** duplicate names, silent feature marks, or a false Your label in pass-and-play. Do not replace the web's richer live announcements.
- **Taste:** no for missing or false accessible names. New visible words need approval.

### LOOK-32 — Full last-turn marks and card-user targets

- **Kind:** (b), though it calls shared mark drawing.
- **Evidence:** `R src/plugin/screens/board.ts:343` to `:349`; `I/24-fault-round-2a.md:20`, `:24`, `:57` (F1, F11).
- **Web today:** `M src/screen/play.ts:227` marks only the last landing, shove squares, or same-square victims. It does not show the full plugin source/landing/affected-square trail for every step of a Haste turn. There is no web card-user selection path yet.
- **Change / size:** **S** for the last-turn trail; **M** with cards. Lift the turn-step scan and source/landing/victim/drop/pass rules. Feed existing `highlight` marks. For Vault, mark each eligible user before a piece is selected.
- **Host coupling:** plugin replay history and turn draft; use local `game.history` and turn start instead. The renderer is already shared.
- **Depends on:** card lane for Vault users. **Risk:** pass erases prior turn marks, a drop invents a source, or several steps show an incorrect turn boundary.
- **Taste:** **yes** for changing visible web last-move marks. False or missing marks against that choice are faults.

### LOOK-33 — Beginner notes after an unusual enemy move

- **Kind:** (b). Shared helper alone does not enable the web feature.
- **Evidence:** `R src/read.ts:219`; `R src/context-line.ts:49`; `R src/plugin/screens/board.ts:355`; `I/33-rc-review-faults.md:31`.
- **Web today:** it has piece lessons and reads, but does not call `teachNote` in the live board. The web `refreshTable` supplies no `teach` field (`M src/screen/play.ts:258`).
- **Change / size:** **S**. Lift the once-per-game event tracking and the rule that an unseen lesson gets priority when the note can show. Use the local Beginner setting and move history.
- **Host coupling:** plugin level and replayed history; no host call in the note logic.
- **Depends on:** LOOK-06 and LOOK-34 for readable status text. **Risk:** repeat notes on load, or mark a lesson seen while check hides it. The release review fixes that latter case.
- **Taste:** **yes** for new help words, when to teach, and how often.

## (c) Web work with no matching plugin user path

### LOOK-34 — Fit the web's own Home, lessons and review at phone zoom

- **Kind:** (c). Plugin CSS provides parts, but no equivalent covers these local web paths together.
- **Evidence:** `M src/ui/home.css:1`, `:8`, `:19`; `M src/ui/table.css:41`, `:105`; `M src/screen/keys.ts:78`; `M src/style.css:125`. The plugin zoom rule is `R src/plugin/app.css:268` and names only seat, board and end screen sections.
- **Web today:** Home shares the table grid; lessons use progress and lesson actions; review has local move controls. The body cannot scroll. At 200% the short-phone grid still reserves two strips, context, Moves and the bar. The web has no page wrapper that can take the plugin's overflow rule.
- **Change / size:** **L** for a complete plan and fit across these paths; a single board fault can be **S**. Add direct-page reflow using the existing web structure. Use the reusable rules in LOOK-14 to LOOK-19. Keep local two-player handover, lessons, Home and review reachable.
- **Depends on:** the chosen web phone layout; LOOK-13, LOOK-15, LOOK-17, LOOK-18. **Risk:** copying plugin section selectors fixes nothing. Copying its fixed frame loses web viewport space. Runtime failures and exact web sizes remain **unverified**; no browser check is permitted in this survey.
- **Taste:** **yes** for layout and board floor. Confirmed hidden text or unreachable controls need a fix after proof. This is a web design/check gap, not a claim that every named local path currently fails.

## (d) Plugin-only parts: do not lift to the web

### LOOK-35 — Host frame, safe-area messages and display diagnostics

- **Kind:** (d).
- **Evidence:** `R src/plugin/app.css:7`, `:10`, `:182`; `R src/plugin/app.ts:34`, `:522`; `I/21-iphone-test-fixes.md:17`, `:25`; `P/29-release-candidate.md:136` (F26).
- **Web today:** its table uses `100dvh` and browser safe-area values (`M src/ui/table.css:5`, `:9`, `:37`). It has no ChatGPT header, composer or inline/fullscreen switch.
- **Change / size:** **S / no web edit**. Do not copy the 96/128 px composer reserve, host capability state, position-based host table workaround, collapse/resume display routing or the removed Display check long press.
- **Host coupling:** host messages, safeAreaInsets, widget state, `window.openai` and the containing frame.
- **Depends on:** none. **Risk:** applying these rules to the web wastes height and can create the small-board fault they are meant to solve in the host. The final release removes the diagnostic line; do not list it as a shipped web improvement.
- **Taste:** no.

### LOOK-36 — WebKit, motion and swipe check repairs

- **Kind:** (d) as product work. They can inform later web checks, but do not repair web UI code.
- **Evidence:** `P/30-webkit.md:32`, `:48`; `I/43-pr61-ci-webkit.md:29`; `I/43-ci-motion.md:21`; `I/43-ci-swipe.md:21`; `I/44-ci-scroll.md:47`.
- **Web today:** none of these plugin test-harness paths is part of its runtime imports.
- **Change / size:** **S / no web edit**. These changes set keyboard focus before a retention test, wait for board readiness and win-motion completion, record short motion states in-page, await host context, and keep native swipe endpoints inside the frame.
- **Depends on:** LOOK-01 for the new readiness meaning. **Risk:** a passing desktop WebKit wheel check is not a native iOS swipe check. Some Linux failures are test-input or timing faults; do not turn them into claimed product fixes. Saved tickets retain their Linux recheck limits.
- **Taste:** no.

### LOOK-37 — Refuted size and art findings

- **Kind:** (d) as proposed fixes. There is no confirmed change to lift.
- **Evidence:** `I/28-qa1-tall-board.md:17`; `I/24-fault-round-2a.md:26`; `Q/qa/rolling-3/report.md:10`; `Q/qa/rolling-2/report.md:25`, `:31`, `:49`.
- **Web today:** its canvas also fits the lesser of available width and height (`M src/render/PaintedView.ts:94`). No web evidence proves that a tall-phone empty band permits a wider board.
- **Change / size:** **S / no web edit**. QA 1 T6 gets a bounds check, not a larger board. Later review refutes QA 2 A/B's forced-fit diagnosis and E's wrong-portrait claim. A scrollable 210 px board is an approved alternative to fitting all rows at once.
- **Depends on:** LOOK-15, LOOK-25. **Risk:** old QA cause text can contradict the final design. Use final code and later findings, not a dropped ticket draft.
- **Taste:** a larger board or moving the bar is an open design choice, not an automatic fault fix.

### LOOK-38 — Device items kept out of ticket 39

- **Kind:** (d) for the current web lift; these are not built release fixes.
- **Evidence:** `I/39-device-faults.md:8`; `Q/tickets/issues/39-device-faults.md:7`; `Q/qa/device-recheck-1/report.md:84`, `:93`.
- **Web today:** it has no stone plugin board-menu grid, plugin Resume label or seat setup hint. Thus the same reported controls do not exist.
- **Change / size:** **S / no web edit** now. F-5 proposes more bottom padding for a two-line stone menu label. T-1 proposes shorter friend Resume detail. T-2 proposes an end-card fade. T-3 proposes a shorter seat hint or a second row. The owner explicitly excludes these from F-1 to F-4.
- **Depends on:** LOOK-10, LOOK-18, LOOK-20 if those components later move to web. **Risk:** reporting these proposals as shipped would overstate PR 61. The release code still has the old menu padding and full Resume detail.
- **Taste:** **yes** for T-1 to T-3. F-5 is a later cosmetic fault, not authority for an unasked design change.

## (e) The web already has the part

### LOOK-39 — The game's look, art and shared board

- **Kind:** (e).
- **Evidence:** `M src/main.ts:1`, `:4`, `:14`, `:69`; `R src/plugin/app.css:1`; `R src/plugin/board-view.ts:7`; `R src/plugin/art.ts:1`; owner rule in `docs/lessons/browser-checks-and-ui.md:3`.
- **Web today:** it owns the parchment floor, game fonts, painted figures, stone board, marks and game sheets that the plugin reuses. The plugin art helper routes existing game assets plus its own badge, scroll and control art. F21 contains kings inside the plugin inline card (`R src/plugin/app.css:157`). The web title has its own phone fit rule (`M src/style.css:652`); it has no plugin inline-card frame.
- **Change / size:** **S / no web edit**. Keep one visual base. The new stone controls, card faces and profile art are separately listed above.
- **Depends on:** none. **Risk:** importing all plugin CSS back into the web also imports the host frame and strong overrides. Sharing assets is not the same as sharing the page layout.
- **Taste:** no to retain the current base. New improvements need approval.

### LOOK-40 — Keyboard board play and live speech

- **Kind:** (e).
- **Evidence:** `M index.html:34`, `:46`, `:77`; `M src/screen/keys.ts:59` to `:95`; `M src/screen/play.ts:290`; plugin comparison: `R src/plugin/screens/board.ts:249`.
- **Web today:** arrows move a square cursor; Enter/Space select; the cursor says piece, selected state and legal targets; moves have a live announcement. It supports a read key and review navigation. The plugin's keyboard path does not add this whole feature to the web.
- **Change / size:** **S / no web edit**. Retain it when lifting controls.
- **Depends on:** LOOK-07 for improved shared words. **Risk:** a new modal, motion lock or scroll region can catch the keys or suppress announcements. A plugin `aria-label` update alone is not a substitute for the existing live regions.
- **Taste:** no for retaining access. New key bindings or visible help are choices.

### LOOK-41 — Modal focus, Escape and scroll cues

- **Kind:** (e).
- **Evidence:** `M src/ui/menu.ts:18`, `:51`, `:58`, `:65`, `:68`, `:82`; `M src/ui/table.css:44`, `:130`; `M src/ui/powers.ts:47`.
- **Web today:** native modal sheets limit interaction to the sheet. Menu has page Back, Escape handling, top-of-page reset and explicit return focus. The menu shows a bottom shade when more rows remain. Power coins keep focus through redraw. The plugin's U2 repair raises its custom sheets and scrims above raised controls (`R src/plugin/app.css:40`). The web's native modal already uses the browser top layer.
- **Change / size:** **S / no web edit**. Reuse this native path before copying the plugin's manual focus trap and `inert` handling.
- **Depends on:** any new sheet must use it correctly. **Risk:** a new custom nonmodal overlay can bypass the native behavior. The existing shade is a possible input to the open end-card cue choice; it is not already on the end card.
- **Taste:** no for correct focus. New shade placement needs approval.

### LOOK-42 — Home action already has a separate detail line

- **Kind:** (e) for K2's layout pattern.
- **Evidence:** `M src/ui/home-view.ts:26`, `:27`; `M src/ui/home.css:9` to `:11`; plugin K2: `R src/plugin/app.ts:606`, `R src/plugin/app.css:164`; `I/37-k-picks.md:30`.
- **Web today:** `home-main` is a column with a main label and `home-detail`. It does not put the plugin's long Resume sentence in one forced line.
- **Change / size:** **S / no web edit** for the two-line pattern. A new multi-game Resume control should reuse this structure and retain its full accessible name.
- **Depends on:** the games/home lane for multi-game behavior. **Risk:** long names can still need more than two physical lines; plugin K2 does not promise exactly two lines for every friend name.
- **Taste:** no to keep the current structure. New Resume words need approval.

### LOOK-43 — Sound, threats, power scenes, lessons and reduced CSS motion

- **Kind:** (e) for the base features.
- **Evidence:** `M src/main.ts:5`; `M src/screen/play.ts:233`, `:303`, `:324`; `M src/new-game.ts:138`, `:189`; `M src/ceremony.ts:23`; `M src/style.css:681`; plugin ticket `I/22-thematic-redesign.md:15`, `:18`.
- **Web today:** it already has sound, threat arrows, animated power/emblem art, piece lessons and a system motion rule. These begin as web parts that the plugin can use, not the reverse. The web also has an Animations pace control.
- **Change / size:** **S / no web edit** for feature presence. LOOK-02 still fixes a real gap inside shared canvas motion. LOOK-23 lists the extra plugin moments.
- **Depends on:** none. **Risk:** generic CSS motion suppression does not stop JS canvas motion or Web Animations by itself.
- **Taste:** no to retain the existing features. New sounds, effects or timing need approval.

### LOOK-44 — Stable end board and ordered king fall

- **Kind:** (e) for the existing web flow. The plugin-specific F14/F35 fixes do not need a web copy.
- **Evidence:** `M src/screen/play.ts:306` to `:313`; `M src/game-end.ts:78`; `M src/ceremony.ts:133` to `:147`; plugin comparison: `R src/plugin/screens/board.css:9`, `R src/plugin/screens/board.ts:412`; `I/27-fault-round-4.md:33`.
- **Web today:** it completes the move, then enters the end flow. The ceremony awaits the final move before it sets the fallen king. The modal overlays the same table; it does not swap to a plugin end-table route.
- **Change / size:** **S / no web edit** for F14 stable bounds and F35 fall ordering. The plugin needs its own `!animating` guard and retained bar grid space.
- **Depends on:** LOOK-18 for any new web end layout. **Risk:** a new web end screen could remove those guarantees. Runtime bounds are **unverified** in this read-only survey.
- **Taste:** no for correct ordering and stable geometry. A shorter live win ceremony is LOOK-23 and needs approval.

### LOOK-45 — Armed-coin ring exists; QA 3 visibility is unverified

- **Kind:** (e) for source support. The reported visual weakness remains **unverified**.
- **Evidence:** `M src/style.css:510`; `R src/style.css:511`, `:705`; `R src/plugin/app.css:132`; `Q/qa/rolling-3/report.md:26` to `:30` (T-R3-1).
- **Web today:** `.coin[data-state='armed']` has a selected gold/ink ring. The plugin imports that shared rule. Its card rule excludes armed coins from the unarmed shadow rule; this is not source proof that no armed style exists.
- **Change / size:** **S / no web edit** for an armed power ring. When cards move to web, inspect the computed style and a rendered sample before declaring a missing state or lifting a new ring.
- **Depends on:** LOOK-22. **Risk:** selector order, art or scale can make a real style hard to see. This source check neither proves the QA screenshot wrong nor proves a new ring fix exists on the release head.
- **Taste:** a stronger ring is an improvement for the owner. If a computed style removes the agreed state, repair that fault.

### LOOK-46 — Computer replies already animate on the web

- **Kind:** (e) for local computer play. The plugin replay repair is separate.
- **Evidence:** `M src/screen/play.ts:279`, `:286`, `:299`; `R src/plugin/screens/board.ts:509`; `I/28-fault-rounds-5-7.md:13` (F35-1). The current web player strip also keeps Computer and level in separate fields (`M src/ui/table.ts:196`), so F19's duplicate Computer text is absent.
- **Web today:** both a person move and a local computer move use `commit`, which awaits `view.animateMove` before it syncs the board. It does not depend on a plugin poll/replay path. The keyboard cursor has its own event path (`M src/screen/keys.ts:74`).
- **Change / size:** **S / no web edit** for the local computer animation or strip label. A later online web view can reuse the plugin's ordered replay loop and generation guard.
- **Depends on:** the online client lane for remote replay. **Risk:** starting a replay after a new game, or syncing the final position before the move draws. Do not infer a current web fault from a plugin replay fault.
- **Taste:** no for a missing promised move animation. New motion is LOOK-23.

## Open questions for the owner

1. **Should the web use the plugin's stone controls and new motion?** Options: 1) keep the current web controls; 2) use stone controls only; 3) use stone controls plus selected motion moments. **Pick: 2**, with separate motion samples later. On yes, prepare one web sample and keep the current game fonts, board and art.
2. **At phone zoom, should the board retain a minimum size while the page scrolls?** Options: 1) fit all rows and shrink the board; 2) keep a board floor and scroll to lower controls. **Pick: 2**, but choose the floor from a direct web sample, not the plugin's 210 px host value. On yes, plan LOOK-15 and LOOK-34 across Home, lessons, review and two-player handover.
3. **Should all touch controls use at least 48 px, also on tablets?** Options: 1) retain the current 44 px standard; 2) use 48 px where touch applies. **Pick: 2**. On yes, keep the web's already larger bar and use real boxes where possible. Check any hit layer for overlap.
4. **Should the web adopt two-row card strips and the plugin card-face grid when cards are connected?** Options: 1) use the plugin layout; 2) ask for another layout sample. **Pick: 1** as the sample starting point. On yes, keep names above cards through 440 px, and show the board-height cost before build approval.
5. **Should very small boards hide coordinates?** Options: 1) use the release rule below 8 CSS px; 2) keep tiny coordinates. **Pick: 1**. This choice reaches the web through shared code at merge, so decide before merge if the owner wants a different result.
6. **Should short end cards use the plugin's hidden art and decorative win-line rules?** Options: 1) use compact text and a scroll cue; 2) retain all art and scroll it. **Pick: 1**, with the result title always visible. On yes, show a direct-web win and loss at 200% and in short landscape. Keep the separate question of an end-card fade open; it is not a built ticket 39 fix.
7. **Should the web add Symbols only, recent moves and Beginner notes?** Options for each: 1) add it; 2) keep the current web feature set. **Pick: 1 for Symbols only and recent moves; 2 for extra live notes until a text sample is approved.** On yes, keep local save, keyboard and screen-reader behavior. Do not bring in plugin settings or host calls.
8. **Should the web change last-move marks to show the full last turn?** Options: 1) keep the current landing marks; 2) use the plugin's source, landing and affected-square trail. **Pick: 2**. On yes, show one normal move, one Haste turn, one shove and one pass before the visual build.
