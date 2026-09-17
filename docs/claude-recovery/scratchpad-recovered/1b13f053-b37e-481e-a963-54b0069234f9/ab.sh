#!/bin/zsh
cd "/Users/za/Documents/king down chess"
D=/private/tmp/claude-501/-Users-za-Documents-king-down-chess/1b13f053-b37e-481e-a963-54b0069234f9/scratchpad
run() { for i in 1 2 3 4 5 6 7; do npx tsx $D/bench.mjs; done | sed 's/.* in //;s/ ms//' | sort -n | head -1; }
cp src/rules/engine.ts $D/withguard.ts
echo "with includes-guard: $(run) ms"
python3 - <<'PY'
p='src/rules/engine.ts'; s=open(p).read()
i=s.index('  // Catapult lobs, walked backwards'); j=s.index('\n  return false;\n}', i)
open(p,'w').write(s[:i] + '  // BENCH: off' + s[j:])
PY
echo "catapult walk off:  $(run) ms"
cp $D/withguard.ts src/rules/engine.ts
python3 - <<'PY'
p='src/rules/engine.ts'; s=open(p).read()
open(p,'w').write(s.replace('if (board.includes(piece(C, by))) for (const [df, dr] of ORTHO) {', 'for (const [df, dr] of ORTHO) {'))
PY
echo "no guard, always walk: $(run) ms"
cp $D/withguard.ts src/rules/engine.ts
echo restored
