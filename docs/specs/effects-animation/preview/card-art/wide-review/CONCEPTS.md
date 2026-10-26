# Nine missing released-card paintings

All scenes: wide 16:9; painted gouache/oil fantasy; visible brushwork, stone, carved ivory and dark wood; a tactile chess world with medieval architecture and natural magic. Use a clear focal action, atmospheric depth and quiet space around the main silhouette. No labels, letters, arrows, movement diagrams, interface marks or decorative border. The scene may choose one legal example; it need not illustrate every legal choice.

## Mirror — `MirrorB`

**Exact player effect:** “play another card from your hand; it stays in your hand”. Mirror pays the copied card's cost and spends Mirror, not the source card. It cannot copy another Mirror.

**One scene:** One hand presents a parchment spell-card to an antique mirror. The other hand reaches through the glass to grip and retrieve the reflection card. Both cards carry the same small frost motif; the original stays intact. The real card’s front faces the mirror; its navy/gold back faces the camera. The reflected copy stays inside, behind the glass sheen, while the right wrist crosses the surface boundary. This follows the owner’s revised concept and supersedes the earlier emitted-frost scene.

**Traps:** Mirror copies a card in the player's own hand, not the opponent's last card. Do not duplicate or transform a chess piece. Reserve borrowed piece movement for Mimic/Control. An object mirror is part of the scene, not an outer card frame.

**Evidence:** `src/powers-ui.ts:17,96`; `src/rules/cards-2014.test.ts:105–114`; `src/rules/engine.ts:1317`.

## Firewall — `Firewall`

**Exact player effect:** With `markFree`: “none of your pieces can be taken on your opponent’s next turn; then make your move”. Without it: “as your move, none of your pieces can be taken on your opponent’s next turn”. The ward also stops Curse and the enemy-piece swap.

**One scene:** A small ivory army stands in a windswept courtyard at night. Amber protective fire curls around every ally, from the nearest pawn to the rook and bishop behind it. The rook moves safely through its own flowing flames. Dark attackers wait beyond the warm protective light. Low flame tongues, embers and reflected gold on intact ivory convey shelter.

**Traps:** This protects the whole friendly army for one enemy turn. It is not an attacking inferno, a permanent terrain wall, a one-piece ward, or the unrelated FirewallB swap. No damaged allies or blocked friendly passage.

**Evidence:** `src/powers-ui.ts:97`; `src/rules/rules.ts:114–116`; `src/rules/cards-2014.test.ts:125–153`; `src/rules/engine.ts:1777`.

## Earth Quake — `EarthQuake`

**Exact player effect:** “choose a square: each piece next to it, except a king, is pushed one square straight away from it if that square is empty”. Both sides' pieces can move; diagonal neighbours push diagonally.

**One scene:** An empty paving stone heaves at the centre of a vast chess courtyard. A low wave of earth and ochre dust pushes an ivory knight and a dark pawn apart toward clear neighbouring stones. Their solid bodies remain intact. Broken mortar and airborne stone chips express force; a distant upright king stays calm beyond the disturbance.

**Traps:** Pushes are outward from one square, not random displacement, capture, a board-wide shake or a swap. Do not topple a king, swallow a piece, push onto an occupied square, or turn broken paving into a new game obstacle.

**Evidence:** `src/powers-ui.ts:99`; `src/rules/engine.ts:1594–1612`; `src/rules/cards-2014.test.ts:188–213`.

## Burn — `Burn`

**Exact player effect:** “one of your pieces (not a pawn or the king) takes an enemy piece on d4, e4, d5 or e5 as a queen would”. The mover lands on the target square and keeps its type; pieces block the queen line.

**One scene:** An ivory rook surges diagonally across an open stone avenue into a dark knight at the heart of the board. A short white-hot fire wake follows the rook; a broad asymmetric orange plume and dark sparks obscure the defeated knight. Four central courtyard stones and distant architecture on every side place the encounter in the middle of the realm. The rook's crenellations remain clear.

**Traps:** Show a moving capture in the central four squares. No ranged fireball from a stationary piece, queen transformation, pawn attacker, arbitrary target location or mass area damage. Keep the result distinct from Fire Starter's distant fortress edge.

**Evidence:** `src/powers-ui.ts:101`; `src/rules/engine.ts:1615–1638`; `src/rules/cards-2014.test.ts:232–249`.

## Fire Starter — `FireStarter`

**Exact player effect:** “one of your pieces (not a pawn or the king) takes an enemy piece on the enemy back rank as a queen would”. The mover lands there and keeps its type; pieces block the queen line.

**One scene:** An ivory knight drives along a long, clear diagonal of worn stone toward a dark rook at the enemy fortress's last row. A narrow red-gold fire wake leads into a local plume at the rook. The far board edge, a sheer drop beyond the final paving stones, and looming battlements make this a deep incursion into the enemy's home ground. The knight keeps its horse-head silhouette.

**Traps:** The target stands on the enemy back rank, not the attacker's back rank or any arbitrary edge. The knight travels to capture; it does not shoot from home, leap over a blocker, become a queen or ignite an entire rank.

**Evidence:** `src/powers-ui.ts:102`; `src/rules/engine.ts:1615–1638`; `src/rules/cards-2014.test.ts:252–258`.

## Control — `Control`

**Exact player effect:** “one of your pieces (not a pawn or the king) moves and takes this turn as a friendly piece next to it does”. The friendly donor is also neither pawn nor king; the mover keeps its type.

**One scene:** An ivory rook and ivory knight begin shoulder to shoulder in a rain-dark courtyard. Teal breath-like light spills from the rook's crenellations into the knight. The still-solid knight advances straight along the avenue toward a dark target while the rook remains behind. Matching ivory material and gentle shared light establish willing allies; the borrowed force feels like wind passing between them.

**Traps:** No enemy mind control, puppet strings, ownership change or transformation. The donor must be adjacent and friendly. Distinguish this close exchange with a possible capture from Mimic's quiet borrowing of a friendly type anywhere on the board.

**Evidence:** `src/powers-ui.ts:103`; `src/rules/engine.ts:1640–1667`; `src/rules/cards-2014.test.ts:269–291`.

## Rally — `Rally`

**Exact player effect:** “move one of your pieces, then a different one (the second move is optional); neither move captures”. Pawns and the king are eligible too.

**One scene:** At sunrise, an ivory rook and an ivory knight redeploy together across a spacious castle forecourt. Each heads toward its own empty paving stone. Warm gold light touches their two distinct silhouettes, and two small dust clouds mark separate quiet footfalls. A plain, unlettered pennant and dawn above the wall give the scene a sense of renewed purpose.

**Traps:** Exactly two different friendly movers, not one piece shown twice. No fallen enemies, collisions, attacks, swaps or an entire army charging. Do not imply that the second move is mandatory.

**Evidence:** `src/powers-ui.ts:107`; `src/rules/rules.ts:127–128`; `src/rules/engine.ts:1560–1563`.

## Morph — `MorphP`

**Exact player effect:** “one of your pawns becomes a knight or a bishop where it stands”. The new ordinary piece is permanent; the action takes the turn and captures nothing.

**One scene:** A single ivory pawn transforms into an ivory knight on one unchanged courtyard stone. Its round upper form opens like soft carved petals into a recognisable horse head while the same pedestal stays planted in its footprint. A lilac cocoon, dust of ivory and gentle warm light hold the eye on one body changing in place. The surrounding stones remain empty.

**Traps:** Choose knight for this scene; bishop is the other legal result. Do not show a queen, two spawned units, movement to another square, an enemy pawn, or transformation of an existing non-pawn piece. Keep this separate from Mimic/Control, which retain the original piece type.

**Evidence:** `src/powers-ui.ts:114`; `src/rules/engine.ts:1716–1723`; `src/rules/morph-soft.test.ts:36–83`.

## Curse — `Curse`

**Exact player effect:** “move an enemy piece or pawn (not the king) one square, to an empty square”. It may move in any direction, stays the enemy's and keeps its type. No capture occurs.

**One scene:** A dark knight is tugged sideways by low violet smoke onto the immediately adjacent empty courtyard slab. Its dark wood, metal details and horse-head form remain unchanged. Wisps cling around its base, and a short scrape through dust joins the neighbouring stones. Ivory pieces watch from a distance through the mist. The action is an unwelcome small displacement, not an attack that destroys it.

**Traps:** No converted ally, captured victim, paralysis, long teleport or enemy king. The piece remains dark and whole. A pawn example would also have to avoid the first and last ranks.

**Evidence:** `src/powers-ui.ts:90`; `src/rules/engine.ts:1535–1547`.

## Existing art context

The current authority is `src/content/cards.ts:23–33`: these nine entries are released and have `art: null`; Mimic already has `ui/cards/mimic.webp`.

The older inventory records legacy source mappings, not current approved replacements: Mirror → `illus_07.jpg`; Firewall → `illus_10.jpg`; Control → `control (2).jpg`; Curse → `illus_09.jpg`. It records no source for Earth Quake, Burn, Fire Starter, Rally or MorphP. See `docs/specs/chatgpt-mvp/notes/e-art.md:266–294`. Its historical shipped-count is stale relative to the current catalog; do not use it as the runtime list.

The existing effect study reinforces useful material distinctions: Mirror uses reflective facets over a copied frost spell; Control uses teal essence from an adjacent rook; Mimic uses pale glass for borrowed quiet movement; Firewall uses protective flames; Burn and Fire Starter use fire following the moving piece. See `docs/specs/effects-animation/issues/03-cards.md:39–48`. These are animation references, not evidence that a missing painting already exists.

Read-only rule/source inspection only. No images, game files, gallery files or tracker files changed. No test run is needed for this design brief.
