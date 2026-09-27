"""Independent CLI acceptance scenarios using copies of real validation records, never study data."""
from pathlib import Path
import copy,json,subprocess,sys,tempfile
w=Path(sys.argv[1]);output=Path(sys.argv[2])
fixture=Path('/Users/za/Documents/king down chess/docs/research/m1-results/worker-validation-20260922/m1-worker-validation-20260922-a.jsonl')
base=[json.loads(x) for x in fixture.read_text().splitlines()][:2]
checks=[]
with tempfile.TemporaryDirectory(prefix='kdc-provenance-audit-') as td:
 def check(name,a,b,expected,markers=()):
  pa,pb=Path(td)/'a.jsonl',Path(td)/'b.jsonl'
  for p,rs in [(pa,a),(pb,b)]:p.write_text(''.join(json.dumps(r)+'\n' for r in rs))
  p=subprocess.run([str(w/'node_modules/.bin/tsx'),'tools/conditions.ts','--pair',str(pa)+','+str(pb)],cwd=w,capture_output=True,text=True,timeout=20)
  text=p.stdout+p.stderr;ok=(p.returncode==0 if expected=='allow' else p.returncode!=0) and all(s.lower() in text.lower() for s in markers)
  checks.append({'name':name,'passed':ok,'exitCode':p.returncode,'expected':expected,'markers':markers,'output':text})
 check('same source/spec accepted and practical-cost caveat',base,base,'allow',['do not prove matching practical cost','per-game'])
 for field in ('src','specKey','rulesKey'):
  r=copy.deepcopy(base);r[1][field]='changed-identity';check('mixed '+field,r,base,'reject')
  r=copy.deepcopy(base);r[1].pop(field);check('partly missing '+field,base,r,'reject')
 r=copy.deepcopy(base)
 for a in r:a['src']='another-engine'
 check('known source mismatch',base,r,'reject')
 r=copy.deepcopy(base)
 for a in r:a.update(specKey='treatment-spec',rulesKey='treatment-rule')
 check('intentional spec/rules difference qualified',base,r,'allow',['treatment-spec','treatment-rule','review the frozen specs','practical budgets'])
 legacy=copy.deepcopy(base)
 for a in legacy:
  for k in ('src','specKey','rulesKey'):a.pop(k)
 check('legacy both unverified',legacy,legacy,'allow',['UNVERIFIED'])
 check('one side missing unverified',legacy,base,'allow',['UNVERIFIED'])
 for field in ('src','specKey','rulesKey'):
  r=copy.deepcopy(base)
  for a in r:a[field]='   '
  check('whitespace-only '+field+' is rejected',r,r,'reject')
output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(checks,indent=2)+'\n')
print(json.dumps({'passed':sum(x['passed'] for x in checks),'total':len(checks),'failures':[x['name'] for x in checks if not x['passed']]}))
