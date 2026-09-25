// Usage: node dev-errors.mjs <url> — prints console errors after load.
import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().split('\n')[0]) })
await page.goto(process.argv[2], { waitUntil: 'load', timeout: 180000 })
await page.waitForTimeout(3000)
console.log(process.argv[2], '->', errors.length ? errors : 'no console errors')
await browser.close()
