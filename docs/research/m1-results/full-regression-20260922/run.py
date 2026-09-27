from pathlib import Path
import subprocess,json,time,os
w=Path('/Users/new/projects/king-down-supervised-20260921'); d=Path('/Users/new/projects/king-down-supervised-20260921-control/full-regression-20260922')
os.environ['PATH']='/usr/local/bin:/usr/bin:/bin'
s={'pid':os.getpid(),'state':'running','started':time.time(),'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=w,text=True).strip(),'checks':[]}
def save(): (d/'state.json').write_text(json.dumps(s,indent=2)+'\n')
save()
try:
 for label,cmd in [('typescript',['./node_modules/.bin/tsc','--noEmit']),('full-tests',['./node_modules/.bin/vitest','run'])]:
  start=time.time()
  with (d/(label+'.log')).open('w') as out:
   r=subprocess.run(cmd,cwd=w,stdout=out,stderr=subprocess.STDOUT,timeout=600)
  s['checks'].append({'name':label,'exitCode':r.returncode,'elapsed':time.time()-start});save()
 s['state']='passed' if all(x['exitCode']==0 for x in s['checks']) else 'failed'
except Exception as e:s.update(state='failed',error=str(e))
s['finished']=time.time();save()
