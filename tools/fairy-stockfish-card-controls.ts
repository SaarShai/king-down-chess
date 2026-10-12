/** The move-count shortcut may skip ordinary quiets, but not quiet card turns. */
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Uci} from './fairy-stockfish-smoke';
import {configureFull,fullTurns} from './fairy-stockfish-full';
import {DEFAULT_RULES,POWERS_BALANCED,setRules} from '../src/rules/rules';
import {toFen} from '../src/rules/setup';
import {fullFixtures} from './fairy-stockfish-full-check';
const must=(x:unknown,s:string):void=>{if(!x)throw Error(s);};
const [binary,out]=process.argv.slice(2);must(!existsSync(out),'Preserve existing control output');mkdirSync(out,{recursive:true});
const fs=new Uci(resolve(binary),resolve('tools/fairy-stockfish.ini'));fs.stderrPath=resolve(out,'stderr.log');
const card=(token:string):boolean=>token.split(',').some(a=>(parseInt(a.split(':')[1],16)&63)!==0);
try{
 await fs.query('uci',s=>s==='uciok');await fs.ready('setoption name Use NNUE value false');
 const rows=[];
 for(const f of fullFixtures().filter(f=>['card-true-Spawn2-0','card-true-Control-0','card-true-Freeze-0'].includes(f.name))){
  const hand=f.rules.hands[0];setRules(f.rules);const pos=f.pos;await configureFull(fs);await fs.ready('position fen '+toFen(pos));
  const lines=await fs.query('kdpruneinspect',s=>s==='kdpruneinspectok'),retained=lines.filter(s=>s.startsWith('retained ')).map(s=>s.slice(9)),legal=[...fullTurns(pos).keys()],cards=legal.filter(card);
  must(cards.length>0,'Positive card fixture empty');must(retained.every(m=>legal.includes(m)),'Illegal retained move');
  const missing=cards.filter(m=>!retained.includes(m));rows.push({hand,legal:legal.length,cards:cards.length,retained:retained.length,missing});writeFileSync(resolve(out,'checks.json'),JSON.stringify(rows,null,2));must(!missing.length,'Quiet card turns pruned: '+hand);
  must(legal.some(m=>!card(m)&&!retained.includes(m)),'Ordinary quiet negative control did not separate');
 }
 writeFileSync(resolve(out,'complete.json'),JSON.stringify({pass:true,rows},null,2)+'\n');
}finally{fs.close();setRules(DEFAULT_RULES);}
