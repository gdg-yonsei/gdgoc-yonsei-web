// Usage: node .superpowers/shared/req-diff.mjs <path> [runs]
// Lists request origins/types for a page under the perf script's throttling.
import { chromium, devices } from '@playwright/test'
const path = process.argv[2]
const runs = Number(process.argv[3] ?? 2)
const browser = await chromium.launch()
for (let run = 0; run < runs; run += 1) {
  const context = await browser.newContext(devices['Desktop Chrome'])
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const seen = []
  page.on('request', (r) => seen.push(`${r.resourceType()} ${new URL(r.url()).host}${new URL(r.url()).pathname.slice(0, 50)}`))
  await page.goto(`http://127.0.0.1:3100${path}`, { waitUntil: 'load' })
  await page.waitForTimeout(3000)
  const counts = {}
  for (const s of seen) { const k = s.split(' ')[0] + ' ' + s.split(' ')[1].split('/')[0]; counts[k] = (counts[k] ?? 0) + 1 }
  console.log(`run ${run + 1}: ${seen.length}`, JSON.stringify(counts))
  await context.close()
}
await browser.close()
