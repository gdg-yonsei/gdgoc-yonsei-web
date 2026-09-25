// Usage: node lcp.mjs <url> [mobile] — prints LCP candidates with 4x CPU and the budget's network.
import { chromium, devices } from '@playwright/test'
const [url, profile] = process.argv.slice(2)
const b = await chromium.launch()
const ctx = await b.newContext(profile === 'mobile' ? devices['Pixel 7'] : devices['Desktop Chrome'])
const p = await ctx.newPage()
const cdp = await ctx.newCDPSession(p)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 100_000 })
await p.addInitScript(() => {
  window.__lcp = []
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lcp.push({ t: Math.round(e.startTime), size: e.size, tag: e.element?.tagName, cls: e.element?.className?.toString?.().slice(0, 40), text: e.element?.textContent?.slice(0, 50), url: e.url?.slice(-50) }))).observe({ type: 'largest-contentful-paint', buffered: true })
})
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
console.log(JSON.stringify(await p.evaluate(() => window.__lcp), null, 1))
const fonts = await p.evaluate(() => performance.getEntriesByType('resource').filter((r) => r.name.includes('font') || r.name.endsWith('.woff2')).map((r) => [Math.round(r.responseEnd), r.name.split('/').pop()]))
console.log(fonts)
await b.close()
