// Self-test of the shared check module (checks-and-hooks/05): each assertion must fail on a bad page
// and pass on a good page. It builds the pages with page.setContent and needs no server.
// Run: node tools/check-selftest.mjs (exit 0 when all pass; exit 1 and the fault named when one fails).
import { imageIs, insideViewport, launch, minTarget, noOverlap, noRunningAnimations, noSidewaysScroll, textNotCut } from './lib/checks.mjs';

const viewport = { width: 390, height: 844 };
const page_ = body => `<!doctype html><html><head><style>body{margin:0;font:16px sans-serif}</style></head><body>${body}</body></html>`;

const spin = '<style>@keyframes spin{to{transform:rotate(1turn)}}</style>';
const golem = 'ui/workshop/clay-golem-w.webp';
const img = (base, src) => page_(`<base href="${base}"><img id="me" src="${src}" alt="me" width="40" height="40">`);

/** Each case: the assertion, the selector it names, a bad page that must fail and the good pages that must pass. */
const cases = [
  { name: 'minTarget', selector: 'button',
    run: (p, s) => minTarget(p, s),
    bad: page_('<button style="width:30px;height:30px">x</button>'),
    good: page_('<button style="width:44px;height:44px">x</button>') },
  { name: 'noSidewaysScroll', selector: 'html',
    run: (p, s) => noSidewaysScroll(p, s),
    bad: page_('<div style="width:600px;height:20px">wide row</div>'),
    good: page_('<div style="width:100%;height:20px">row</div>') },
  { name: 'insideViewport (below the fold)', selector: '#box',
    run: (p, s) => insideViewport(p, s),
    bad: page_('<div id="box" style="position:absolute;left:10px;top:900px;width:50px;height:50px"></div>'),
    good: page_('<div id="box" style="position:absolute;left:10px;top:100px;width:50px;height:50px"></div>') },
  { name: 'insideViewport (past the right edge)', selector: '#box',
    run: (p, s) => insideViewport(p, s),
    bad: page_('<div id="box" style="position:absolute;left:360px;top:10px;width:50px;height:50px"></div>'),
    good: page_('<div id="box" style="position:absolute;left:330px;top:10px;width:50px;height:50px"></div>') },
  { name: 'noOverlap', selector: '.box',
    run: (p, s) => noOverlap(p, s),
    bad: page_('<div class="box" style="position:absolute;left:0;top:0;width:50px;height:50px"></div><div class="box" style="position:absolute;left:30px;top:30px;width:50px;height:50px"></div>'),
    good: page_('<div class="box" style="position:absolute;left:0;top:0;width:50px;height:50px"></div><div class="box" style="position:absolute;left:50px;top:0;width:50px;height:50px"></div>') },
  { name: 'textNotCut', selector: '.label',
    run: (p, s) => textNotCut(p, s),
    bad: page_('<div class="label" style="width:40px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">A long label</div>'),
    good: page_('<div class="label" style="width:200px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">A long label</div>') },
  { name: 'noRunningAnimations', selector: 'html',
    run: (p, s) => noRunningAnimations(p, s),
    bad: page_(`${spin}<div style="width:20px;height:20px;animation:spin 1s linear infinite"></div>`),
    good: page_(`${spin}<div style="width:20px;height:20px;animation:spin 1s linear infinite paused"></div>`) },
  { name: 'imageIs (wrong image name)', selector: '#me',
    run: (p, s) => imageIs(p, s, golem),
    bad: img('http://127.0.0.1:9/app/', './ui/workshop/antler-guardian-w.webp'),
    // The right image under a relative base and under an absolute base.
    good: [img('http://127.0.0.1:9/app/', `./${golem}`), img('http://127.0.0.1:9/app/', `/${golem}`)] },
];

const faults = [];
const browser = await launch();
try {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  for (const c of cases) {
    await page.setContent(c.bad);
    let message = null;
    try { await c.run(page, c.selector); } catch (e) { message = e.message; }
    if (message === null) faults.push(`${c.name}: the bad page passed`);
    else for (const part of [c.selector, `${viewport.width}x${viewport.height}`, 'box x=']) {
      if (!message.includes(part)) faults.push(`${c.name}: the failure message has no "${part}": ${message}`);
    }
    for (const good of [].concat(c.good)) {
      await page.setContent(good);
      try { await c.run(page, c.selector); } catch (e) { faults.push(`${c.name}: a good page failed: ${e.message}`); }
    }
  }
} finally { await browser.close(); }

if (faults.length) { for (const f of faults) console.error(`FAIL ${f}`); process.exit(1); }
console.log(`ok ${cases.length} cases`);
