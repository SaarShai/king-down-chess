// Render the study approval sample. Use --serve for an interactive local preview.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { transform } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const out = '/tmp/king-down-study-sample';
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
const base = `http://127.0.0.1:${server.address().port}/docs/specs/designer-test-framework/sample/sample.html`;

if(process.argv.includes('--serve')){ console.log(base); await new Promise(()=>{}); }
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const faults=[];
for(const [size,viewport] of Object.entries({desktop:{width:1440,height:900},phone:{width:390,height:844}})){
 for(const state of ['board','test','results','failure']){
 const page=await browser.newPage({viewport,reducedMotion:'reduce'});
 page.on('pageerror',e=>faults.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)faults.push(`${r.status()} ${r.url()}`)});
 await page.goto(`${base}?state=${state}`);
 await page.waitForFunction(()=>window.sampleReady);
 await page.evaluate(()=>document.fonts.ready);
 const bounds=await page.evaluate(()=>{const b=document.querySelector('#board').getBoundingClientRect(),a=document.querySelector('.alert').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,board:[b.x,b.y,b.right,b.bottom],alertBottom:a.bottom,height:innerHeight}});
 if(bounds.overflow||bounds.board[3]>bounds.height||bounds.board[2]>viewport.width||(state==='failure'&&bounds.alertBottom>bounds.height))faults.push(`${size} ${state} ${JSON.stringify(bounds)}`);
 await page.screenshot({path:`${out}/${state}-${size}.png`});
 await page.close();
 }
}
await browser.close();server.close();
console.log(JSON.stringify({out,faults}));if(faults.length)process.exitCode=1;
