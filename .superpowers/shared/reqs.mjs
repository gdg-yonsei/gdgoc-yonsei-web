import { chromium } from '@playwright/test'
const [url, mode = 'desktop'] = process.argv.slice(2)
const browser = await chromium.launch()
const context = await browser.newContext(mode === 'mobile' ? { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 720 } })
const page = await context.newPage()
const reqs = []
page.on('request', (r) => reqs.push(`${r.resourceType().padEnd(10)} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`))
await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(3000)
console.log(reqs.length, 'requests')
console.log(reqs.join('\n'))
await browser.close()
