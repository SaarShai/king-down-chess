# Confidence and result files from stride_b.py output.
# Usage: python3 finalize.py <outdir>   (reads <outdir>/proto.json, writes results.json + results.csv)
import json, sys, csv, math
OUT = sys.argv[1]
rows = json.load(open(f'{OUT}/proto.json'))
TILE = 112.0
by = {(r['character'], r['facing'], r['army']): r for r in rows}

def switches(ids):
    if ids[0] is None: return None
    return sum(ids[i] != ids[i - 1] for i in range(len(ids)))

for r in rows:
    m = r['detail']
    other = by.get((r['character'], r['facing'], 'black' if r['army'] == 'white' else 'white'))
    agree = None
    if r['stride'] is not None and other and other['stride'] is not None and r['stride'] > 0 and other['stride'] > 0:
        agree = abs(r['stride'] - other['stride']) / ((r['stride'] + other['stride']) / 2)
    r['armyDisagreement'] = None if agree is None else round(agree, 3)
    sw = switches(r['footIds'])
    r['footSwitches'] = sw
    if m is None:
        r['confidence'] = 'none'; r['stride'] = None
        miss = sum(s is None for s in r['stance'])
        r['reason'] = f'No planted foot is found in {miss} of {r["frames"]} pose changes. The stride is not measured.'
        continue
    n = r['frames']
    track = m['track_residual_game']
    unc = track * math.sqrt(n) / TILE  # squares per cycle, from per-change tracking error
    rel = unc / r['stride'] if r['stride'] > 0 else float('inf')
    r['trackResidualPx'] = round(track, 2); r['strideUncertainty'] = round(unc, 3); r['skateResidualPx'] = round(m['skate_px_game'], 2)
    r['meanScore'] = round(m['score'], 3); r['minScore'] = round(m['min_score'], 3)
    # rule ambiguity: another stance rule fits almost as well but gives a different stride
    best = m['track_residual_game']
    rivals = [v for k, v in (r.get('variants') or {}).items() if v and k != r.get('rule') and v['residual'] <= 1.5 * best + 0.5]
    ambig = max([abs(v['stride'] - r['stride']) for v in rivals], default=0.0)
    r['ruleAmbiguity'] = round(ambig, 3)
    nocolour = any(st and st.get('colour') is False for st in r['stance'])
    if r['stride'] < 0.05:
        r['confidence'] = 'low'
        r['reason'] = (f'The planted foot moves back only {r["stride"]:.3f} squares per cycle in the art (residual {track:.1f} game px). '
                       'No travel speed stops the skate; the runtime also rejects a stride of 0 or less.')
        continue
    good_sw = sw == 2
    amb_rel = ambig / r['stride']
    if track <= 2.5 and m['min_score'] >= 0.8 and rel <= 0.15 and good_sw and amb_rel <= 0.1 and not nocolour and (agree is None or agree <= 0.15):
        c = 'high'
    elif track <= 5.0 and m['min_score'] >= 0.7 and rel <= 0.35 and sw is not None and sw % 2 == 0 and amb_rel <= 0.25 and (agree is None or agree <= 0.30):
        c = 'medium'
    else:
        c = 'low'
    r['confidence'] = c
    bits = [f'residual {track:.1f} game px ({rel * 100:.0f}% of stride)', f'match {m["min_score"]:.2f} min']
    if not good_sw: bits.append(f'foot hand-over count {sw}, not 2')
    if amb_rel > 0.1: bits.append(f'other stance rule gives {ambig:.2f} sq different')
    if nocolour: bits.append('boot colour not found in one pose change')
    if agree is not None: bits.append(f'other army differs {agree * 100:.0f}%')
    r['reason'] = 'Planted foot tracked in all pose changes; ' + '; '.join(bits) + '.'

keep = ['id', 'character', 'army', 'facing', 'frames', 'cycleMs', 'holds', 'oldStride', 'stride', 'confidence', 'reason',
        'rule', 'ruleAmbiguity', 'trackResidualPx', 'strideUncertainty', 'skateResidualPx', 'meanScore', 'minScore', 'armyDisagreement', 'footSwitches', 'variants', 'footIds', 'stance', 'detail']
res = [{k: r.get(k) for k in keep} for r in rows]
json.dump(res, open(f'{OUT}/results.json', 'w'), indent=1)
cols = keep[:-3]
with open(f'{OUT}/results.csv', 'w', newline='') as f:
    w = csv.writer(f); w.writerow(cols)
    for r in res: w.writerow([json.dumps(r[c]) if isinstance(r[c], (list, dict)) else r[c] for c in cols])
from collections import Counter
print(Counter(r['confidence'] for r in res))
