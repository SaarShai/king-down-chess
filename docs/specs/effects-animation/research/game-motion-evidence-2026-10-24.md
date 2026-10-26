# Evidence for purposeful game motion

Date: 2026-10-24. Scope: perception research, animation craft, game feel, and access. This note proposes samples; it does not approve implementation or change a rule.

## Decision to test

Give a new animation one clear job: show **what changed, what caused it, or what has ended**. Keep its main event local to the relevant object. Leave a readable final state after the motion stops. Test comprehension separately from visual preference.

King Down already has fire, ice, protection, archer targeting, check, swap, shove, hint, king ground effects, and 23 saved GUI studies. Do not treat those as new ideas. The owner excludes new ordinary combat and motion for selection, destinations, generic captures, threats, last move, reserve drops, extra-move availability, and Ice King ground. Selection circles stay below figures. Four cards are single use; do not imply a refill. Prefer material effects to diagrams.

## Sources and transfer

Each item separates evidence from a proposed use. Publication dates below come from the work or its record, not the search engine's crawl date. University copies contain the original papers. Book access is limited as stated.

### 1. Animation must fit the information

**Barbara Tversky, Julie Bauer Morrison, Mireille Bétrancourt. _Animation: can it facilitate?_ International Journal of Human-Computer Studies 57, 247–262 (2002).** [Original paper, author-supplied preprint hosted by Carleton](https://serc.carleton.edu/download/files/676/Tversky_2002.pdf).

- **Method and finding:** A critical review of learning studies, not a new experiment. Apparent animation benefits often come with extra information or different interaction. The authors propose congruence between the representation and the concept, plus ease of perception and understanding. Motion that is too fast or complex can fail these tests. They identify real-time change and spatial reorientation as promising uses.
- **Limit:** The reviewed tests concern learning mechanical, biological, and computational systems. The authors expressly limit their negative conclusion to that scope. This is not proof that UI animation is useless.
- **King Down inference:** A card's transition to spent can communicate a change in state. A loop on an unchanged card cannot claim the same purpose. Keep the spent state visible; do not make players remember a brief flare.
- **Read:** Abstract; review conclusions; “Caveats” and “Implications,” preprint pp. 19–22.

### 2. Preserve identity through a real change

**Jeffrey Heer and George G. Robertson. _Animated Transitions in Statistical Data Graphics._ IEEE Transactions on Visualization and Computer Graphics 13(6), 1240–1247 (2007).** [Original paper](https://sites.stat.columbia.edu/gelman/communication/HeerRobertson2007.pdf).

- **Method and finding:** Two controlled experiments with 24 people familiar with charts. Tasks test tracking two objects and estimating value changes. Animation improves performance in several conditions. Staging is not uniformly better: in the donut change task, direct animation beats staged animation; stacked-bar change estimates show no significant animation-condition effect. Preference and accuracy are separate measures.
- **Limit:** Charts on desktop monitors, with 1.25-second animated transitions in the tracking task. This does not establish an ideal duration for chess, a mobile screen, or a short particle effect.
- **King Down inference:** For an existing promotion or transformation, keep the square and visual anchor stable while the identity changes. Use only enough stages to explain the change; do not turn each event into a long sequence.
- **Read:** Sections 5.1, 5.2.1, 5.3, and 6. These results support continuity, not a universal easing curve or time budget.

### 3. Attention is a scarce resource

**Lyn Bartram, Colin Ware, Tom Calvert. _Moticons: detection, distraction and task._ International Journal of Human-Computer Studies 58(5), 515–545 (May 2003).** [Original manuscript](https://www.interruptions.net/literature/Bartram-IJHCS03.pdf); [publisher record](https://www.sciencedirect.com/science/article/pii/S1071581903000211).

- **Method and finding:** Dual-task experiments compare moving icons with colour/shape changes. A later experiment tests detection and distraction during text work, Solitaire, and Tetris. Motion is detected well in peripheral locations. Travelling cues receive the highest distraction ratings; zoom cues also rate high. Small anchored motion can attract attention with less reported distraction.
- **Limit:** Small student samples, large viewing angles in the early tests, and repeated cues lasting seconds. Subjective distraction is not the same as lost chess performance. These results do not prove that a tiny, brief ember will be noticed.
- **King Down inference:** Spend attention at the event's location. A card's material can change in place. A large trail crossing the board needs a stronger reason. Stop after the event; persistent motion can compete with the next decision.
- **Read:** Experiment 1 method/results; Experiment 3; conclusions, manuscript pp. 24–26.

### 4. A large change can still be missed

**Ronald A. Rensink, J. Kevin O'Regan, James J. Clark. _To See or Not to See: The Need for Attention to Perceive Changes in Scenes._ Psychological Science 8(5), 368–373 (1997).** [Author-hosted original manuscript](https://www.cs.ubc.ca/~rensink/publications/download/PsychSci.rr.pdf).

- **Method and finding:** Observers search 48 scene pairs for changes in colour, location, or presence. Brief blanks separate the images. Ten observers take part in each experiment. Under flicker, even large changes can take many alternations to find. Removing the blanks makes detection much faster. Verbal cues and scene interest affect detection.
- **Limit:** Repeated photographs with artificial interruptions, not a live game. This does not quantify how a King Down flare affects attention.
- **King Down inference:** Do not cover the board with a simultaneous flash when the useful information is a local transformation. Preserve the scene around that change. A clear final state is necessary when players look away during the event.
- **Read:** General Method; Experiments 1 and 3; discussion. Use this as a reason to test missed events, not a claim that every burst causes change blindness.

### 5. Stage one idea and give materials different motion

**John Lasseter. _Principles of Traditional Animation Applied to 3D Computer Animation._ ACM SIGGRAPH Computer Graphics 21(4), 35–44 (July 1987).** [Original paper, university copy](https://cgvr.cs.uni-bremen.de/teaching/cg_literatur/Principles%20of%20traditional%20animation%20applied%20to%203D%20computer%20animation.pdf).

- **Method and advice:** A craft paper based on traditional animation and production examples, not a controlled user study. Anticipation directs attention before an action. Staging gives the audience one clear main idea. Follow-through and different responses of flexible and rigid parts communicate material and mass.
- **Limit:** Film spectators do not choose moves or wait for an interface to respond. A film's preparation time can become input delay in a game.
- **King Down inference:** Give a spell a brief material preparation, one readable change, then a small decay. Keep stone/metal stable while cloth, smoke, light, or sparks respond. Do not bend a whole painted figure to make every effect feel active.
- **Read:** Sections 2.1 and 2.3–2.5, especially the two lamps sharing attention in _Luxo Jr._

### 6. Timing and spacing are different controls

**Richard Williams. _The Animator's Survival Kit._ First edition 2001; expanded edition 2009.** [Publisher's expanded-edition record](https://www.faber.co.uk/product/9780571238347-the-animators-survival-kit/); [original book excerpt, pp. 23–44](https://d1b10bmlvqabco.cloudfront.net/attach/hzacuh48ewd5wy/grqphq0hpmb/hzimwnw6jr63/willams01basics.pdf).

- **Method and advice:** On pp. 37–38, a coin and bouncing-ball exercise separates when an event happens from the positions between events. Two movements can take the same total time but feel different because their spacing changes. This is a practical demonstration and craft lesson, not an efficacy trial.
- **Limit and access:** Only the excerpt was inspected, including rendered pp. 37–38. The excerpt has no edition front matter. The publisher record dates the expanded edition to 5 November 2009; no claim here depends on additions in that edition. The full book was not read.
- **King Down inference:** Compare a short spark release with a slower ash settle while keeping the total event time fixed. Choose the motion that conveys the intended material before adding particles.

### 7. Game feel is more than added spectacle

**Steve Swink. _Game Feel: A Game Designer's Guide to Virtual Sensation._ First edition, copyright 2009.** [Publisher record](https://www.routledge.com/Game-Feel-A-Game-Designers-Guide-to-Virtual-Sensation/Swink/p/book/9780123743282). Supporting first-person source: **_Game Feel: The Secret Ingredient_ (23 November 2007).** [Author's article](https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient).

- **Method and advice:** The author's article describes input, response, context, polish, metaphor, and rules. Its polish section treats effects as cues to physical properties and recommends ranking them by the impression they must convey. This is practitioner analysis, not a controlled test of retention or enjoyment.
- **Limit and access:** The book's publisher description and contents were available through the index; direct page access returned an error. The full book was not read. The substantive claims above come from the opened author article, especially sections 4–5. Its focus is real-time control of an object.
- **King Down inference:** Give a single-use token a convincing material loss. Do not infer that screen shake, hit stop, or extra combat movement helps turn-based chess because it helps an action-game example.

### 8. Keep meaning when motion is disabled

**W3C Web Accessibility Initiative. _Understanding SC 2.3.3: Animation from Interactions_ and _Understanding SC 2.3.1: Three Flashes or Below Threshold_, WCAG 2.2 guidance, accessed 24 October 2026.** [Interaction animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html); [flash thresholds](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html).

- **Status and guidance:** These explanatory pages describe standards, not an animation experiment. SC 2.3.3 is Level AAA: users can disable interaction-triggered motion unless it is essential. The guidance recommends a control or the platform's reduced-motion preference. SC 2.3.1 is Level A: no more than three flashes in a second, or flashing below the specified thresholds. Combined area, contrast, and red flashes matter.
- **Limit:** Passing a threshold does not prove comfort for every viewer. An accessibility setting cannot undo a flash already shown.
- **King Down inference:** Each candidate needs a clear static end state. In reduced motion, omit travel, scaling, and shake; show the state change directly. Treat a material flare as a bounded brightening and decay, not repeated blinking. Check overlapping effects together.

## Three candidate opportunities

These are design inferences, not outcomes proved by the sources. Check the saved studies and implemented events before calling any candidate new.

| Candidate | Information it gives | Material treatment to sample | Boundary |
| --- | --- | --- | --- |
| Single-use card or power is spent | This particular resource is now gone | The seal cracks or loses its light in place; a short ash or dust fall ends in the existing spent state | Trigger only on confirmed use. No apparent refill, replenishing orbit, or extra rule. Keep remaining resources easy to count. |
| Existing promotion or identity-changing effect resolves | This is the same board location with a new piece identity | Keep the base fixed; a close material veil breaks to reveal the new silhouette; residue settles locally | Only where the current rules already transform a piece. Do not add a transformation rule or animate ordinary captures. |
| Match result becomes final | The game has ended, and the outcome is settled | A single local material change on the result seal or crown, followed by a stable result panel | Outcome text remains immediate and readable. No added fight, board shake, repeated celebration, or obstruction of review. |

## Check the samples

Use the same real event and final state in a static version and a motion version. Ask viewers what changed, which resource or piece changed, and what can happen next. Record errors and missed events. Then ask about appeal and distraction. Do not use preference as a substitute for comprehension.

Check a dense board at phone size, overlapping events, a player looking away at onset, and reduced motion. Confirm that selection stays below figures and that the event adds no delay to an accepted action. Use the already saved studies where they answer the question. These are proposed checks, not a claim that user tests have run.

## Evidence gaps

No source here tests King Down, painted chess pieces, its four-card hand, or the proposed effects. None establishes a universal duration, particle count, easing curve, or number of simultaneous effects. The studies are largely desktop-era work with different tasks. Book advice is craft evidence; the specific excerpts do not establish measurable gains. The next useful evidence is a rendered, event-specific comparison and a short comprehension check, not a larger bibliography.
