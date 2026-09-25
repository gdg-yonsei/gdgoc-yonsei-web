import { chromium, devices } from '@playwright/test'
const [url] = process.argv.slice(2)
const browser = await chromium.launch()
const context = await browser.newContext(devices['Pixel 7'])
const page = await context.newPage()
await page.addInitScript(() => {
  window.__shifts = []
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      if (e.hadRecentInput) continue
      window.__shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), sources: (e.sources || []).map((s) => ({ node: s.node ? `${s.node.nodeName}.${String(s.node.className || '').slice(0, 40)}` : null, from: [Math.round(s.previousRect.x), Math.round(s.previousRect.y), Math.round(s.previousRect.width), Math.round(s.previousRect.height)], to: [Math.round(s.currentRect.x), Math.round(s.currentRect.y), Math.round(s.currentRect.width), Math.round(s.currentRect.height)] })) })
    }
  }).observe({ type: 'layout-shift', buffered: true })
})
const cdp = await context.newCDPSession(page)
await cdp.send('Network.enable')
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 })
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(3000)
console.log(JSON.stringify(await page.evaluate(() => window.__shifts), null, 1))
await browser.close()
