"""Summarize pulled scores; visual review remains a separate step."""
import collections
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
records, statuses = [], []
for part in sorted(root.glob('part-*')):
    statuses.append(json.loads((part / 'status.json').read_text()))
    records.extend(json.loads((part / 'scores.json').read_text()))
if not records or any(s['exit'] for s in statuses):
    raise ValueError('Missing or failed results')
if len(statuses) != statuses[0]['parts'] or {s['part'] for s in statuses} != set(range(statuses[0]['parts'])):
    raise ValueError('Missing or duplicate parts')
if any(s['totalEntries'] != statuses[0]['totalEntries'] for s in statuses) or len(records) != statuses[0]['totalEntries']:
    raise ValueError('Entry count does not match the source')
groups = collections.defaultdict(lambda: {'rife': [], 'film': []})
gaps = []
for record in records:
    e = record['entry']
    group = (e['character'], e['army'], e['direction'])
    for gap in record['gaps']:
        values = {k: sum(v) / len(v) for k, v in gap['scores'].items()}
        for method, value in values.items():
            groups[group][method].append(value)
        gaps.append((min(values.values()), values, record['folder'], gap['gap']))
lines = ['# Movement in-betweens', '', 'The score is the fraction of visible output pixels that are partly transparent and outside both key-frame soft edges. Lower is better. Motion can raise the score without a ghost. Use the sheets to confirm redraws.', '', f"Entries: {len(records)}. Gaps: {len(gaps)}. In-betweens: {len(gaps) * 6}. GPU wall time: {sum(s['seconds'] for s in statuses) / 3600:.2f} hours.", '', '| Character | Army | Direction | Lower score | RIFE mean | FILM mean | Difference |', '| --- | --- | --- | --- | ---: | ---: | ---: |']
for (character, army, direction), methods in sorted(groups.items()):
    r = sum(methods['rife']) / len(methods['rife'])
    f = sum(methods['film']) / len(methods['film'])
    winner = 'tie' if abs(r - f) < 1e-9 else ('RIFE' if r < f else 'FILM')
    lines.append(f'| {character} | {army} | {direction} | {winner} | {r:.4f} | {f:.4f} | {abs(r-f):.4f} |')
lines += ['', '## Highest shared scores: inspect as redraw candidates', '', 'Ranked by the lower of the two gap means. This rank alone does not confirm a visible ghost.', '', '| Entry | Gap | RIFE | FILM | Lower score |', '| --- | ---: | ---: | ---: | ---: |']
for lower, values, folder, gap in sorted(gaps, reverse=True)[:50]:
    lines.append(f"| {folder} | {gap} | {values['rife']:.4f} | {values['film']:.4f} | {lower:.4f} |")
(root / 'summary.md').write_text('\n'.join(lines) + '\n')
print(f'{len(records)} entries, {len(gaps)} gaps, {len(gaps) * 6} frames')
