import { chromium } from 'playwright';
const url = 'http://localhost:5174/wcc';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', m => { if (m.type()==='error') errors.push('CONSOLE: '+m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: '+e.message));
const failed = [];
page.on('requestfailed', r => failed.push(r.url()+' -> '+(r.failure()?.errorText||'')));
const resp = [];
page.on('response', r => { if (r.status()>=400) resp.push(r.status()+' '+r.url()); });
await page.goto(url, { waitUntil: 'networkidle' }).catch(e=>errors.push('GOTO: '+e.message));
await page.waitForTimeout(2500);
await page.screenshot({ path: 'wcc-hero.png' });
const m = await page.evaluate(() => {
  const root = document.querySelector('.wcc-landing');
  const hero = document.querySelector('.wcc-hero');
  const sub = document.querySelector('.wcc-hero__subtitle');
  const lang = document.querySelector('.wcc-language-switch');
  const r = el => el ? el.getBoundingClientRect() : null;
  return {
    rootScrollH: root?.scrollHeight, rootClientH: root?.clientHeight,
    rootOverflowX: root ? getComputedStyle(root).overflowX : null,
    bodyScrollW: document.body.scrollWidth, winW: window.innerWidth,
    heroRect: r(hero), subRect: r(sub), langRect: r(lang),
    circles: document.querySelectorAll('.wcc-circle').length,
  };
});
console.log('METRICS', JSON.stringify(m));
await page.evaluate(() => { const el=document.querySelector('.wcc-landing'); el && el.scrollTo({top: el.clientHeight*1.05}); });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'wcc-scroll1.png' });
await page.evaluate(() => { const el=document.querySelector('.wcc-landing'); el && el.scrollTo({top: el.scrollHeight}); });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'wcc-bottom.png' });
console.log('ERRORS', JSON.stringify(errors));
console.log('FAILED_REQ', JSON.stringify(failed.slice(0,20)));
console.log('HTTP_ERR', JSON.stringify(resp.slice(0,20)));
await browser.close();
