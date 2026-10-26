# Motion direction for King Down

Research and proposals, 24 October 2026. Awaiting owner feedback; no implementation approved by this document.

## Recommendation

Make important changes feel like events in a painted fantasy world, then return the board to a calm, legible state. The next investment should be continuity, material behaviour and emotional emphasis. More simultaneous particles are not the objective.

The five proposed samples are: card casting and expenditure as one event; promotion; check onset and resolution; material-specific state release; and an optional king-specific victory seal. These are ranked below. Most refine existing work rather than fill absent features.

The companion [evidence review](game-motion-evidence-2026-10-24.md) covers four perception research sources, traditional animation, book excerpts, game feel and accessibility. It distinguishes experiments from practitioner advice and states access limits. This document adds first-party game accounts, official GUI guidance and game-specific design decisions.

## What successful games and guidance contribute

### Hearthstone: materials can carry information and personality

Hadidjah Chamberlin's [Developer Insights: The Art Behind THE SCIENCE](https://hearthstone.blizzard.com/en-gb/news/22552047/developer-insights-the-art-behind-the-science) (Blizzard, 26 October 2018) explains class identity through palettes, shapes and materials. Her Magnetic example replaced small UI arrows with larger, simpler magical forms. She also discusses keeping persistent effects restrained and reserving exceptional treatment for consequential moments. This is a first-person production account, not an experiment establishing that effects increase engagement.

Transfer: use readable masses of frost, smoke, light or pigment, with a recognizable source. Keep approved materials consistent across card, state and disappearance. Do not import full-screen effects, card draw rules, or elaborate animations for every turn.

### League of Legends: attention should match importance

Riot's [Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/) (12 March 2021) puts gameplay communication, visual hierarchy and limited noise together. It stresses recognizable silhouettes and consistency between appearance and mechanical meaning. Its [VFX education page](https://www.riotgames.com/en/artedu/visual-effects) also describes the balance between satisfaction, clear state/action information and a cohesive but differentiated visual language.

Transfer: check deserves a stronger onset than an ordinary status change; ground ambience deserves less attention than either. Faces, silhouettes, occupancy and active rule exceptions remain readable. An effect's footprint must not suggest an area of influence the rules do not provide. These are production principles, not measured King Down thresholds.

### Into the Breach: interface clarity can constrain the design

Matthew Davis's [GDC 2019 postmortem slides](https://media.gdcvault.com/gdc2019/presentations/Into%20the%20Breach%20Postmortem%20Final.pdf), particularly slides 7, 13 and 27–35, describe readability, limited menus, visible attacks and a chess-like interface as design constraints. The slides show how the information the UI could communicate constrained attack types and directions. Slides were inspected; the full talk was not watched.

Transfer: the player should be able to inspect the board after motion ends and still understand it. This supports keeping the owner's excluded indicators static. It does not justify introducing animated threat previews or changing King Down's rules to match another game.

### VALORANT: keep essential information when rendering is simplified

Brandon Wang's [VALORANT Shaders and Gameplay Clarity](https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity) (30 June 2020) connects art, performance and competitive integrity, including preserving useful information across graphics settings.

Transfer: phone scale, reduced motion and lower effect quality must preserve state, ownership and exceptions. Cosmetic embers can disappear; protection meaning cannot. We do not need its 3D shader architecture or frame-rate target.

### GUI and accessibility

Apple's [Motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion) recommends purposeful, brief, precise feedback, optional motion and cancellation rather than unnecessary waiting. Microsoft's [Xbox Accessibility Guideline 117](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/117) addresses disabling distracting motion and keeping text readable amid moving content. These are platform/practitioner guidelines. The companion note separately documents W3C criteria and their conformance levels.

Transfer: important words and controls remain accessible immediately; an ornamental finish may continue without delaying the next action. Motion-off shows the same information directly. Persistent decorative motion is controllable, and offscreen animation stops. None of these sources establishes a universal duration for our effects.

### Books: observe, draw and stage the material

Joseph Gilland's *Elemental Magic* (2009) is especially relevant to the approved painted direction. The [publisher's original sample](https://booksite.elsevier.com/samplechapters/9780240811635/01~Front_Matter.pdf), especially preface pp. XVII–XIX, encourages drawing to understand effects and careful observation of natural phenomena before digital execution. Only the front matter and preface were available here; no claim of reading the full technical chapters.

Together with the inspected Richard Williams excerpt, John Lasseter's craft paper and Steve Swink's author article in the evidence note, this suggests designing a few strong poses and their spacing before adding decorative complexity. That is our design inference, not a quotation from a book. Fluffy cloud volume, fracture and melt, curling flame and heavy settling dust should each behave differently.

## Decisions for future samples

1. Give each event one focal moment. Order overlapping consequences by what the player must understand; do not queue a long ceremony for every affected piece.
2. Design onset, stable state and ending together. An effect being present must agree with the actual rule; its fading residue cannot masquerade as continued protection.
3. Use broad painted silhouettes, textured edges and a small number of distinct material forms. Keep the figure's identity, tile and neighbouring pieces readable. Details are subordinate to the phone-size read.
4. Keep the material identity stable. Fire rises and curls; frost branches and fractures; cloud masses swell and disperse; protection encloses. Avoid assigning the same expanding ring to every meaning.
5. Prefer local changes. A moving connection across the board must explain something that two coordinated local cues cannot. Test both before committing to travel.
6. Fit new orchestration inside current event timing where possible. Proposed timings below are starting points for testing, not research-derived constants or added delays.
7. Outcome text and state remain inspectable. Reduced motion uses direct replacements, stable shapes and labels. No information depends on colour, particle motion or sound alone.
8. Preview on a dense real board, in both orientations and at phone scale. A large isolated showcase is insufficient evidence.

Owner constraints remain: no ordinary combat animation; selection, destinations, extra-move availability, generic capture targets, bite order, threats, reserve drops and last move stay static; selection circles stay below figures. Keep approved Sky clouds, Lava A, Firewall and Guard. Ice King ground remains absent. Frozen and Ice Wall are distinct approved states. GUI studies remain banked unless separately authorized. No card refill or rule changes.

## Five recommended samples

### 1. A card casts its spell and becomes spent

**Scope:** orchestration/refinement of existing card-spend UI and board spell effects, not 21 replacement animations. Highest priority for a single representative sample.

**Trigger:** a legal card action is committed. Selection alone does not trigger it.

**Visible sequence:** the card's painted emblem gathers a small amount of its material. At release, that material catches at the affected square and grows directly into the existing approved effect. The card's seal loses its light and becomes the existing spent state. Freeze uses crystalline growth; Firewall uses a warm curl and smoke. Ownership and card identity are explicit even when the opponent's hand was previously hidden.

**Timing to try:** 100–150 ms of preparation, release within roughly 250–350 ms, then the existing effect's duration. The resource settles within about 500 ms. This is one coordinated event, not a new pre-roll before the current spell.

**Two treatments to compare:** coordinated material changes at source and destination; versus a brief, narrow material wisp connecting them. Prefer the local version if a crossing trail distracts or looks like an attack. Avoid moving a giant card over the board.

**End/reduced motion:** the committed board outcome and spent card remain explicit; omit travel and particle decay. Nothing draws a replacement card.

**Why:** connects choice, consequence and cost. A player should be able to answer which card was used and what it changed.

### 2. Promotion as a small ascension

**Scope:** a dedicated transformation treatment for ordinary pawn promotion. Promotion choice GUI and MorphP card transformation already exist; this does not replace them or introduce new promotion choices. The current general scene path handles normal promotion movement; the proposed addition is an authored reveal of its new identity.

**Trigger:** the existing promotion choice is confirmed and the pawn reaches its destination. On a capturing promotion, add no new combat beat.

**Visible sequence:** keep the base of the figure fixed. A close, rising veil of painted gold dust briefly gathers around the pawn; the new silhouette resolves within it, then two or three larger flakes fall and disappear. The destination never becomes empty or ambiguous. Never stretch the old artwork into the new figure. The chosen piece, not a generic queen or crown, is the payoff.

**Timing to try:** approximately 650–800 ms, with the new identity recognizable by the midpoint. Fold into the existing move resolution rather than adding a long second sequence.

**End/reduced motion:** an ordinary, stable promoted piece; direct artwork replacement in reduced motion, with the chosen piece named in existing UI/history.

**Why:** a rare earned change deserves more character than a silent asset swap, while maintaining continuity of the square.

### 3. Check arrives with authority, then stays readable

**Scope:** refinement of existing check, cause links and GUI check alert. Not a new threat indicator or a combat sequence.

**Trigger:** a position newly enters check, or the checking source materially changes.

**Visible sequence:** a brief warm edge accent identifies the checker while a rough rust-red painted wash presses inward beneath the king. The check emblem lands with the weight of a seal impression. The existing causal connection remains readable, and the onset settles into the already strengthened static danger state. No attack projectile, shake, strobe, or repeated pulse. Multiple checkers remain jointly identifiable without firing several animations in succession.

**Timing to try:** 350–500 ms for onset. When check ends, let its danger wash withdraw in 180–250 ms without a celebratory burst.

**End/reduced motion:** stable king mark, checker/cause information and check instruction. When resolved, remove obsolete warnings immediately; no moving indication is needed.

**Why:** separates the emotional interruption from the information needed to make a legal response. It gives the drama the owner requested without competing with deliberation.

### 4. States end in the material they began with

**Scope:** refinement of the existing clear phase for Freeze, Ice Wall and Firewall. Preserve approved formation and held appearance. This is not an Ice King ground proposal.

**Trigger:** the engine actually removes the state from a surviving piece. Never imply expiry early or add a release effect to a captured piece.

**Visible sequence:** frozen material develops a few fine internal breaks, loosens into broad translucent flakes and evaporates close to the feet. Ice Wall loses its joined structure before the last crystal fragments vanish. Firewall curls upward into a last small ember and a soft smoke trace. The material no longer encloses the piece as soon as the state has ended; residue is visibly aftermath, not protection.

**Timing to try:** 350–550 ms, with a much quieter final third. Several expiries can share one short beat without becoming a board-wide flash.

**End/reduced motion:** clean original piece and correct active-state labels. Direct removal with motion off. No persistent confetti or new idle animation.

**Why:** the ending explains regained freedom or lost protection, instead of merely disappearing. The successful material vocabulary makes the cause recognizable.

### 5. A king-specific victory seal

**Scope:** optional extension of the banked victory design. Lowest priority because the owner already likes the interface animations. Keep its composition, words and controls.

**Trigger:** a confirmed victory result, once per result. Not on screen refresh or reconnect.

**Visible sequence:** a small painted seal beside the result title takes on the winning king's material. Sky: a dense cloud parts to reveal it, with a final soft wisp. Lava: a tiny molten seam cools into an embossed mark. The ornament belongs to the result panel and does not spread across the board. Start with these approved materials before considering other kings.

**Timing to try:** 800–1,000 ms for the optional finish, concurrent with the existing reveal. Never hold back result text, review or rematch for it.

**End/reduced motion:** a still embossed seal and fully usable result screen; the completed seal appears directly with motion off.

**Why:** a short memorable reward that belongs to King Down and its chosen king, without requiring generic confetti or more action choreography.

## Why these five, and how to choose

Card continuity and promotion offer the best first pair: one frequent causal event and one rare payoff. Check refinement is valuable but must outperform the already approved version. State release follows because it carries a rule change. The victory seal is a discretionary aesthetic extension, not a defect to fix.

Do not prioritize more looping ground effects, a new Ice King treatment, attention on every legal move, animated threat maps, or a second set of generic GUI bounces. Those either conflict with feedback or offer less value than improving important transitions.

For each selected concept, make a static comparison and a restrained animated sample using the same real event. Ask separately: what changed, why, what is possible now, and which version feels better? Test dense mobile positions, missed onsets, overlapping state changes, rapid input, replay/resync, and reduced motion. In a busy sequence, check supersedes decorative payoff; a next action cancels residual flourish. No user study has yet been run for these concepts, and none is claimed.

## Local evidence and verification

Compared against `docs/specs/effects-animation/coverage.md`, the 23-study GUI inventory, `src/ui/motion.ts`, `src/render/effects/card.ts`, `src/render/effects/states.ts`, `src/render/effects/board-effects.ts`, and `src/render/PaintedView.ts`. State clear phases and source cues already exist. The coverage table contains historical integration wording; owner decisions govern the proposal scope.

Research sources include empirical work, first-party production accounts and inspected book material. No source establishes that these five designs are optimal for this game; they are ranked design hypotheses for owner feedback. No code, rules, assets or preview behaviour changed.
