// Usage: node lcp2.mjs <url> [mobile] [block] — like lcp.mjs; `block` aborts Pretendard requests.
import { chromium, devices } from '@playwright/test'
const [url, profile, mode] = process.argv.slice(2)
const b = await chromium.launch()
const ctx = await b.newContext(profile === 'mobile' ? devices['Pixel 7'] : devices['Desktop Chrome'])
const p = await ctx.newPage()
if (mode === 'block') await p.route('**/fonts/pretendard/**', (r) => r.abort())
const cdp = await ctx.newCDPSession(p)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 100_000 })
await p.addInitScript(() => {
  window.__lcp = []
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lcp.push([Math.round(e.startTime), e.size, e.element?.tagName, e.element?.textContent?.slice(0, 24)]))).observe({ type: 'largest-contentful-paint', buffered: true })
})
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
const fcp = await p.evaluate(() => Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0))
console.log('FCP', fcp, 'LCP entries', JSON.stringify(await p.evaluate(() => window.__lcp)))
await b.close()
