import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: 'C:/Users/emily/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: '+e.message));
await page.goto('http://localhost:5174/wcc', { waitUntil: 'networkidle' }).catch(e=>errors.push('GOTO '+e.message));
await page.waitForTimeout(2000);
const probe = async (tag) => {
  const m = await page.evaluate(() => {
    const el = document.querySelector('.wcc-language-switch');
    if (!el) return { found:false };
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { found:true, position:cs.position, zIndex:cs.zIndex, top:Math.round(r.top),
      rightGap:Math.round(window.innerWidth-r.right), w:Math.round(r.width), h:Math.round(r.height),
      label:el.querySelector('span')?.textContent, btn:el.querySelector('button')?.textContent };
  });
  console.log(tag, JSON.stringify(m));
};
await probe('EN');
await page.screenshot({ path: 'wcc-lang-en.png', clip: { x: 980, y: 0, width: 460, height: 200 } });
await page.click('.wcc-language-switch button');
await page.waitForTimeout(800);
await probe('HY');
await page.screenshot({ path: 'wcc-lang-hy.png', clip: { x: 980, y: 0, width: 460, height: 200 } });
await page.screenshot({ path: 'wcc-hero-full.png' });
console.log('ERRORS', JSON.stringify(errors));
await browser.close();
