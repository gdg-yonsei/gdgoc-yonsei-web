// Usage: node scroll-trace.mjs [desktop|mobile] — wheel-scrolls the landing at
// 4x CPU and reports long animation frames (>50ms) and who caused them.
import { chromium, devices } from '@playwright/test'
const profile = process.argv[2] ?? 'desktop'
const browser = await chromium.launch()
const context = await browser.newContext(profile === 'mobile' ? devices['Pixel 7'] : { viewport: { width: 1366, height: 768 } })
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
const base = process.env.BASE ?? 'http://localhost:3100'
await page.goto(`${base}/en`, { waitUntil: 'load' })
// Branches without the landing motion never mark the page ready.
await page.waitForSelector('html[data-home-motion="ready"]', { timeout: 6000 }).catch(() => {})
await page.waitForTimeout(1500)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await page.evaluate(() => {
  window.__loaf = []
  // Which scene fills the middle of the screen, sampled every frame.
  window.__where = []
  const sample = () => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    window.__where.push([performance.now(), el?.closest('[data-scene]')?.getAttribute('data-scene') ?? 'other'])
    requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__loaf.push({ t: e.startTime, d: Math.round(e.duration), block: Math.round(e.blockingDuration), scripts: (e.scripts || []).map((s) => `${(s.sourceURL || '').split('/').pop()}:${s.sourceFunctionName || s.invoker}:${Math.round(s.duration)}`).slice(0, 3) })
  }).observe({ type: 'long-animation-frame', buffered: false })
})
const height = await page.evaluate(() => document.documentElement.scrollHeight)
const start = Date.now()
for (let y = 0; y < height; y += 120) {
  if (profile === 'mobile') await page.evaluate(() => scrollBy(0, 120))
  else await page.mouse.wheel(0, 120)
  await page.waitForTimeout(40)
}
await page.waitForTimeout(1500)
const loaf = await page.evaluate(() => {
  const where = window.__where
  const sceneAt = (t) => { let scene = 'other'; for (const [at, name] of where) { if (at > t) break; scene = name } return scene }
  return window.__loaf.map((entry) => ({ ...entry, scene: sceneAt(entry.t) }))
})
const perScene = {}
for (const e of loaf) { perScene[e.scene] ??= { frames: 0, blocking: 0 }; perScene[e.scene].frames++; perScene[e.scene].blocking += e.block }
console.log('per scene:', JSON.stringify(perScene))
const byCause = {}
for (const e of loaf) {
  const text = e.scripts.join(' ')
  const cause = /IdleCallback|IntersectionObserver/.test(text) ? 'arming' : /:eH:|FrameRequestCallback/.test(text) ? 'engine' : text ? 'other-script' : 'rendering'
  byCause[cause] ??= { frames: 0, blocking: 0 }
  byCause[cause].frames++
  byCause[cause].blocking += e.block
}
console.log('by cause:', JSON.stringify(byCause))
const frames = loaf.length
const worst = [...loaf].sort((a, b) => b.d - a.d).slice(0, 6)
console.log(JSON.stringify({ profile, scrollMs: Date.now() - start, longFrames: frames, totalBlocking: loaf.reduce((s, e) => s + e.block, 0), worst }, null, 1))
await browser.close()
