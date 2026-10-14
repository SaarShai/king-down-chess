// Render the study approval sample. Use --serve for an interactive local preview.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { transform } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const runs = process.argv.includes('--runs');
const measurements = process.argv.includes('--measurements');
const out = runs ? '/tmp/king-down-run-sample' : measurements ? '/tmp/king-down-measurement-sample' : '/tmp/king-down-study-sample';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.ts': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
// The worktree root, with the game's public folder at /fonts and /ui (as the game serves them); a .ts file goes out as
// plain JS, an import with no extension finds its .ts file (as Vite resolves the game's imports), and
// import.meta.env.BASE_URL is '/'.
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (/^\/(fonts|ui)\//.test(path)) path = `/public${path}`;
  path = join(root, path);
  if (!path.startsWith(root)) return res.writeHead(403).end();
  try {
    if (!extname(path)) path += '.ts';
    let body = await readFile(path);
    if (path.endsWith('.ts')) body = (await transform(body.toString(), { loader: 'ts', define: { 'import.meta.env': '{"BASE_URL":"/"}' } })).code;
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/docs/specs/designer-test-framework/sample/${runs ? 'runs' : measurements ? 'measurements' : 'sample'}.html`;

if(process.argv.includes('--serve')){ console.log(base); await new Promise(()=>{}); }
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const faults=[];
for(const [size,viewport] of Object.entries({desktop:{width:1440,height:900},phone:{width:390,height:844},...(runs?{small:{width:375,height:667}}:{})})){
 for(const state of runs ? ['approve','running','ready','review','linked','partial','disconnected','unknown','unavailable'] : measurements ? ['plan','preview','link'] : ['board','test','results','failure']){
 const page=await browser.newPage({viewport,reducedMotion:'reduce'});
 page.on('pageerror',e=>faults.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)faults.push(`${r.status()} ${r.url()}`)});
 await page.goto(`${base}?state=${state}`);
 await page.waitForFunction(()=>window.sampleReady);
 await page.evaluate(()=>document.fonts.ready);
 if(runs)await page.frameLocator('iframe').locator('#board canvas').waitFor();
 const bounds=await page.evaluate(()=>{const b=document.querySelector('#board, .sheet').getBoundingClientRect(),a=document.querySelector('.alert, .sheet').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,board:[b.x,b.y,b.right,b.bottom],alertBottom:a.bottom,height:innerHeight}});
 if(bounds.overflow||bounds.board[3]>bounds.height||bounds.board[2]>viewport.width||(state==='failure'&&bounds.alertBottom>bounds.height))faults.push(`${size} ${state} ${JSON.stringify(bounds)}`);
 if(runs&&state==='approve'){
  for(const [target,expected] of [['m1','M1: 40 games'],['kaggle','Kaggle: 40 games'],['both','M1: 20 games']]){
   await page.selectOption('#target',target);
   const split=await page.locator('#allocation').innerText();
   if(!split.includes(expected)||(target==='both'&&!split.includes('Kaggle: 20 games'))||!split.includes(target==='kaggle'?'blocks 1–20 · 4 workers':target==='m1'?'blocks 1–20 · 8 workers':'blocks 11–20 · 4 workers'))faults.push(`allocation ${target}`);
  }
  for(const [label,next] of [['Approve and start 40 games','running'],['Sample: show collected results','ready'],['Review results','review'],['Link selected measurement','linked']]){
   await page.getByRole('button',{name:label,exact:true}).click();
   if(await page.evaluate(()=>window.sampleState)!==next)faults.push(`flow ${next}`);
  }
  for(const next of ['partial','disconnected','unknown','unavailable','approve']){
   await page.selectOption('#sample-view',next);
   if(await page.evaluate(()=>window.sampleState)!==next)faults.push(`nav ${next}`);
  }
 }
 await page.screenshot({path:`${out}/${state}-${size}.png`});
 await page.close();
 }
}
await browser.close();server.close();
console.log(JSON.stringify({out,faults}));if(faults.length)process.exitCode=1;
