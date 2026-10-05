// The Mud King's colours, for his resting effect (king-effects.mjs) and his capture (king-captures.mjs).
// Muted to sit with the game's palette (src/style.css: ink #2b2621, ink-soft #5b5045, gold-ink #7a5712,
// stone-500 #8a8072) and the painted board's warm stone: olive and sage greens, earth browns.
export const GRASS_ROOT=['#3c3f26','#444529','#4b4a2c'];
export const GRASS_TIP=['#8e9258','#9c9d63','#aaa871'];
export const LEAF=['#6f7442','#7d8150','#5f6439'];
// Vine stems: outline (ink), body (a warm mid brown, lighter than the dark squares' wood so it reads on
// both stones), lit edge; thorns pale bone with an ink edge so they read on the brown stem.
export const VINE={outline:'#2b2621',body:'#8a6a45',lit:'#c4a679',tendril:'#8a6a45',thorn:'#d9c8a4'};
// Leaf fill from its stem to its tip.
export const LEAF_GRADIENT=['#4f5332','#8a8d58'];
