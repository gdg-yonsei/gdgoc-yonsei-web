// Usage: BASE=http://localhost:3100 node forced-layout.mjs [desktop|mobile]
// Scrolls the landing at 4x CPU with style/layout reads wrapped: every read
// slower than 1ms (it forced a style recalc or layout) is logged with its
// caller, then grouped by caller.
import { chromium, devices } from '@playwright/test'
const base = process.env.BASE ?? 'http://localhost:3100'
const profileName = process.argv[2] ?? 'desktop'
const browser = await chromium.launch()
const context = await browser.newContext(profileName === 'mobile' ? devices['Pixel 7'] : { viewport: { width: 1366, height: 768 } })
await context.addInitScript(() => {
  window.__slow = []
  window.__armed = false
  const wrap = (proto, name, kind) => {
    const descriptor = Object.getOwnPropertyDescriptor(proto, name)
    if (!descriptor) return
    const original = descriptor.value ?? descriptor.get
    const timed = function (...args) {
      if (!window.__armed) return original.apply(this, args)
      const start = performance.now()
      const result = original.apply(this, args)
      const took = performance.now() - start
      if (took > 1) window.__slow.push({ name, took, at: start, stack: new Error().stack.split('\n').slice(2, 7).map((line) => line.trim()) })
      return result
    }
    Object.defineProperty(proto, name, kind === 'get' ? { ...descriptor, get: timed } : { ...descriptor, value: timed })
  }
  wrap(Element.prototype, 'getBoundingClientRect')
  wrap(CSSStyleDeclaration.prototype, 'getPropertyValue')
  for (const name of ['offsetHeight', 'offsetWidth', 'offsetTop', 'offsetLeft']) wrap(HTMLElement.prototype, name, 'get')
  for (const name of ['clientHeight', 'clientWidth', 'scrollHeight', 'scrollWidth']) wrap(Element.prototype, name, 'get')
})
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await page.goto(`${base}/en`, { waitUntil: 'load' })
await page.waitForSelector('html[data-home-motion="ready"]', { timeout: 20000 }).catch(() => {})
await page.waitForTimeout(1500)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await page.evaluate(() => {
  window.__armed = true
  window.__resizes = []
  new ResizeObserver(() => window.__resizes.push([Math.round(performance.now()), document.body.offsetHeight])).observe(document.body)
})
const height = await page.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < height; y += 120) {
  if (profileName === 'mobile') await page.evaluate(() => scrollBy(0, 120))
  else await page.mouse.wheel(0, 120)
  await page.waitForTimeout(40)
}
await page.waitForTimeout(1000)
const { slow, resizes } = await page.evaluate(() => ({ slow: window.__slow, resizes: window.__resizes }))
await browser.close()

const sources = new Map()
async function where(frame) {
  const match = frame.match(/at (?:(\S+) )?\(?(https?:\/\/[^)]+):(\d+):(\d+)\)?$/)
  if (!match) return frame
  const [, fn, url, line, column] = match
  if (!sources.has(url)) sources.set(url, await fetch(url).then((r) => r.text()).then((t) => t.split('\n')).catch(() => []))
  const code = (sources.get(url)[Number(line) - 1] ?? '').slice(Number(column) - 1, Number(column) + 60).replace(/\s+/g, ' ')
  return `${fn ?? '(anon)'}@${url.split('/').pop()}:${line}:${column}  ${code}`
}
const groups = {}
for (const entry of slow) {
  const key = `${entry.name} <- ${entry.stack.slice(0, 2).join(' <- ')}`
  groups[key] ??= { ms: 0, count: 0, entry }
  groups[key].ms += entry.took
  groups[key].count++
}
const total = slow.reduce((sum, entry) => sum + entry.took, 0)
console.log(`${profileName}: ${slow.length} forced reads over 1ms, ${total.toFixed(0)}ms in all; body resized ${resizes.length}x`)
console.log('body resizes [ms, height]:', JSON.stringify(resizes))
for (const [, { ms, count, entry }] of Object.entries(groups).sort((a, b) => b[1].ms - a[1].ms).slice(0, 12)) {
  console.log(`\n${ms.toFixed(0).padStart(6)}ms ${String(count).padStart(4)}x  ${entry.name}`)
  for (const frame of entry.stack.slice(0, 4)) console.log('          ', await where(frame))
}
