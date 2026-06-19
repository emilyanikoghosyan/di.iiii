import { chromium } from 'playwright'

const base = 'http://localhost:5174'
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

// 1. Landing
await page.goto(base + '/wcc', { waitUntil: 'networkidle' }).catch((e) => errors.push('GOTO: ' + e.message))
await page.waitForTimeout(2500)
await page.screenshot({ path: 'wcc-1-landing.png' })

// 2. Click "Enter exhibition" -> transition
const enter = page.locator('.wcc-enter-button').first()
const hasEnter = await enter.count()
if (hasEnter) {
    await enter.click()
    await page.waitForTimeout(900) // mid-transition
    await page.screenshot({ path: 'wcc-2-transition.png' })
    await page.waitForTimeout(2200) // settle into scene
}
await page.screenshot({ path: 'wcc-3-scene.png' })

const state = await page.evaluate(() => ({
    path: window.location.pathname,
    hasScene: !!document.querySelector('.wcc-scene'),
    hasCanvas: !!document.querySelector('.wcc-scene__canvas canvas'),
    hint: document.querySelector('.wcc-scene__hint')?.textContent || null
}))
console.log('AFTER_ENTER', JSON.stringify(state))

// 3. Click an artwork (center of canvas) to focus + open concept panel
const canvas = page.locator('.wcc-scene__canvas canvas')
if (await canvas.count()) {
    const box = await canvas.boundingBox()
    if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(1200)
    }
}
await page.screenshot({ path: 'wcc-4-artwork.png' })
const panel = await page.evaluate(() => {
    const p = document.querySelector('.wcc-scene__panel')
    return p ? { title: p.querySelector('.wcc-scene__panel-title')?.textContent, artist: p.querySelector('.wcc-scene__panel-artist')?.textContent } : null
})
console.log('PANEL', JSON.stringify(panel))

// 4. Direct load of /wcc/scene
await page.goto(base + '/wcc/scene', { waitUntil: 'networkidle' }).catch((e) => errors.push('GOTO2: ' + e.message))
await page.waitForTimeout(2500)
await page.screenshot({ path: 'wcc-5-direct-scene.png' })
const direct = await page.evaluate(() => ({
    path: window.location.pathname,
    hasCanvas: !!document.querySelector('.wcc-scene__canvas canvas')
}))
console.log('DIRECT', JSON.stringify(direct))

console.log('ERRORS', JSON.stringify(errors.slice(0, 25)))
await browser.close()
