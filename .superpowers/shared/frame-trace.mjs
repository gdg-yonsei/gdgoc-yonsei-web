// Usage: BASE=http://localhost:3100 node frame-trace.mjs <scene> [desktop|mobile]
// Scrolls to one scene at 4x CPU under a Chrome trace and splits the main
// thread's time by trace event (style, layout, paint, layerize, script...).
import { chromium, devices } from '@playwright/test'
const base = process.env.BASE ?? 'http://localhost:3100'
const scene = process.argv[2] ?? 'join'
const profileName = process.argv[3] ?? 'desktop'
const browser = await chromium.launch()
const context = await browser.newContext(profileName === 'mobile' ? devices['Pixel 7'] : { viewport: { width: 1366, height: 768 } })
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await page.goto(`${base}/en`, { waitUntil: 'load' })
await page.waitForSelector('html[data-home-motion="ready"]', { timeout: 20000 }).catch(() => {})
// EXTRA_CSS hides or changes things to isolate a cost.
if (process.env.EXTRA_CSS) await page.addStyleTag({ content: process.env.EXTRA_CSS })
await page.waitForTimeout(1500)
// Park two screens above the scene, so it arms during the traced scroll.
const top = await page.evaluate((name) => (document.querySelector(`[data-scene="${name}"]`) ?? document.querySelector(`.${name}`)).getBoundingClientRect().top + scrollY, scene)
await page.evaluate((y) => scrollTo(0, y), Math.max(0, top - 2 * 768))
await page.waitForTimeout(1500)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
const events = []
cdp.on('Tracing.dataCollected', ({ value }) => events.push(...value))
const done = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve))
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' })
for (let i = 0; i < 40; i += 1) {
  if (profileName === 'mobile') await page.evaluate(() => scrollBy(0, 80))
  else await page.mouse.wheel(0, 80)
  await page.waitForTimeout(40)
}
await page.waitForTimeout(1500)
await cdp.send('Tracing.end')
await done
await browser.close()

const main = events.find((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain')
const onMain = events.filter((e) => main && e.pid === main.pid && e.tid === main.tid && e.ph === 'X' && e.dur)
// Self time per event name: an event's duration minus its children's.
onMain.sort((a, b) => a.ts - b.ts || b.dur - a.dur)
const self = new Map()
const stack = []
for (const event of onMain) {
  while (stack.length && stack.at(-1).ts + stack.at(-1).dur <= event.ts) stack.pop()
  const parent = stack.at(-1)
  if (parent) self.set(parent, (self.get(parent) ?? parent.dur) - event.dur)
  self.set(event, event.dur)
  stack.push(event)
}
const byName = {}
for (const [event, us] of self) byName[event.name] = (byName[event.name] ?? 0) + Math.max(0, us)
const tasks = onMain.filter((e) => e.name === 'RunTask' && e.dur > 50_000)
console.log(`${scene} ${profileName}: ${tasks.length} tasks over 50ms; longest ${tasks.map((t) => Math.round(t.dur / 1000)).sort((a, b) => b - a).slice(0, 6).join(', ')}ms`)
for (const [name, us] of Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 16)) console.log(`${(us / 1000).toFixed(1).padStart(8)}ms  ${name}`)

// A timeline of the long tasks: when, how long, and what they were made of.
if (process.env.TIMELINE) {
  const t0 = onMain[0]?.ts ?? 0
  for (const task of onMain.filter((e) => e.name === 'RunTask' && e.dur > 16_000)) {
    const inside = {}
    for (const [event, us] of self) {
      if (event !== task && event.ts >= task.ts && event.ts + event.dur <= task.ts + task.dur) inside[event.name] = (inside[event.name] ?? 0) + Math.max(0, us)
    }
    const top = Object.entries(inside).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, us]) => `${name} ${(us / 1000).toFixed(0)}`).join(', ')
    const styles = onMain.filter((e) => e.name === 'UpdateLayoutTree' && e.ts >= task.ts && e.ts < task.ts + task.dur).map((e) => e.args?.elementCount ?? e.args?.beginData?.elementCount).filter(Boolean)
    console.log(`${((task.ts - t0) / 1000).toFixed(0).padStart(6)}ms ${(task.dur / 1000).toFixed(0).padStart(4)}ms  ${top}${styles.length ? `  restyled ${styles.join('+')}` : ''}`)
  }
}
