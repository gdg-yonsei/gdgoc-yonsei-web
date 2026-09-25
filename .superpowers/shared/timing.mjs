// Usage: node timing.mjs <url> — budget network (150ms, 200KB/s), 4x CPU; resources finished before FCP+300ms.
import { chromium, devices } from '@playwright/test'
const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Desktop Chrome'], javaScriptEnabled: process.env.NOJS !== '1' }); const p = await ctx.newPage(); if (process.env.NOPRETENDARD === '1') await p.route('**/fonts/pretendard/**', (r) => r.abort())
const cdp = await ctx.newCDPSession(p)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 100_000 })
await p.goto(process.argv[2], { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
const r = await p.evaluate(() => {
  const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0
  const nav = performance.getEntriesByType('navigation')[0]
  const res = performance.getEntriesByType('resource').filter((e) => e.startTime < fcp + 300).map((e) => [Math.round(e.startTime), Math.round(e.responseEnd), e.transferSize, e.initiatorType, e.name.replace(location.origin, '').slice(0, 70)])
  return { fcp: Math.round(fcp), doc: [Math.round(nav.responseStart), Math.round(nav.responseEnd), nav.transferSize], res }
})
console.log('FCP', r.fcp, 'doc start/end/bytes', r.doc.join(' '))
for (const x of r.res) console.log(x.join('\t'))
await b.close()
