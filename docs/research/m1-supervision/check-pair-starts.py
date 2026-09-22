"""Independent CLI checks using synthetic records, not research game results."""
import copy
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile

workspace = Path(sys.argv[1])
output = Path(sys.argv[2])
fixture = Path(__file__).parent / 'statistics-fixture.jsonl.txt'
base = json.loads(fixture.read_text().splitlines()[0])

def rec(game_id, result=1):
    r = copy.deepcopy(base)
    r.update(gameId=game_id, seed=game_id + 30, result=result, plies=10)
    return r

checks = []
with tempfile.TemporaryDirectory(prefix='pair-independent-') as temporary:
    a_path, b_path = (Path(temporary) / name for name in ['a.jsonl', 'b.jsonl'])
    def check(name, a, b, predicate):
        for path, records in [(a_path, a), (b_path, b)]:
            path.write_text(''.join(json.dumps(r) + '\n' for r in records))
        p = subprocess.run([str(workspace / 'node_modules/.bin/tsx'), 'tools/conditions.ts', '--pair', f'{a_path},{b_path}'], cwd=workspace, capture_output=True, text=True, timeout=15)
        combined = p.stdout + p.stderr
        checks.append({'name': name, 'passed': bool(predicate(p.returncode, combined)), 'returnCode': p.returncode, 'output': combined})
    check('matching pair mean +0.500', [rec(1), rec(2)], [rec(1, 0), rec(2)], lambda rc, out: rc == 0 and bool(re.search(r'result\s+\+?0\.500', out, re.I)))
    for side in ['A', 'B']:
        a, b = [rec(1), rec(2)], [rec(1), rec(2)]
        (a if side == 'A' else b).append(rec(1))
        check('duplicate ID in ' + side, a, b, lambda rc, out: rc != 0 and 'duplicate' in out.lower() and '1' in out)
    for field, value in [('startFen', base['startFen'].replace(' w ', ' b ')), ('seed', 999), ('openingPlies', 99), ('colourSwapped', True)]:
        b = rec(1)
        b[field] = value
        check('reject mismatched ' + field, [rec(1)], [b], lambda rc, out, field=field: rc != 0 and field.lower() in out.lower() and '1' in out)
    check('unmatched counts A=1 B=2', [rec(1), rec(2), rec(3)], [rec(1), rec(2), rec(4), rec(5)], lambda rc, out: rc == 0 and 'unmatched' in out.lower() and bool(re.search(r'\bA\b\s*[:=]?\s*1\b', out)) and bool(re.search(r'\bB\b\s*[:=]?\s*2\b', out)))
    check('zero pairs has no estimate or invalid number', [rec(1)], [rec(2)], lambda rc, out: rc == 0 and not re.search(r'NaN|Infinity', out) and bool(re.search(r'no (?:paired )?(?:estimate|pairs|shared|matched)|0 (?:shared |matched )?(?:pairs|games)', out, re.I)))
    check('one pair no confidence interval', [rec(1)], [rec(1, 0)], lambda rc, out: rc == 0 and not re.search(r'NaN|Infinity|±', out) and bool(re.search(r'interval.*(?:unavailable|not available)|(?:unavailable|not available).*interval|descriptive', out, re.I)))
result = {'fixtureKind': 'synthetic records, not played games', 'passed': sum(c['passed'] for c in checks), 'total': len(checks), 'checks': checks}
output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['passed', 'total']}))
sys.exit(0 if all(c['passed'] for c in checks) else 1)
