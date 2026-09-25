// Usage: BASE=http://localhost:3100 node engine-profile.mjs [desktop|mobile]
// CPU profile of a scroll through the landing at 4x CPU. Splits the time by
// top-level callback, then shows what anime.js's engine tick (the function
// that calls requestAnimationFrame from the motion chunk) spends it on.
import { chromium, devices } from '@playwright/test'
const base = process.env.BASE ?? 'http://localhost:3100'
const profileName = process.argv[2] ?? 'desktop'
const browser = await chromium.launch()
const context = await browser.newContext(profileName === 'mobile' ? devices['Pixel 7'] : { viewport: { width: 1366, height: 768 } })
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await page.goto(`${base}/en`, { waitUntil: 'load' })
await page.waitForSelector('html[data-home-motion="ready"]', { timeout: 20000 }).catch(() => {})
await page.waitForTimeout(1500)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await cdp.send('Profiler.enable')
await cdp.send('Profiler.setSamplingInterval', { interval: 200 })
await cdp.send('Profiler.start')
const height = await page.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < height; y += 120) {
  if (profileName === 'mobile') await page.evaluate(() => scrollBy(0, 120))
  else await page.mouse.wheel(0, 120)
  await page.waitForTimeout(40)
}
await page.waitForTimeout(1000)
const { profile } = await cdp.send('Profiler.stop')
await browser.close()

const byId = new Map(profile.nodes.map((node) => [node.id, node]))
const parent = new Map()
for (const node of profile.nodes) for (const child of node.children ?? []) parent.set(child, node.id)
const stackOf = (id) => {
  const stack = []
  for (let at = id; at !== undefined; at = parent.get(at)) stack.unshift(byId.get(at))
  return stack.slice(1) // drop (root)
}
const file = (node) => node.callFrame.url.split('/').pop().split('?')[0] || ''
const label = (node) => `${node.callFrame.functionName || '(anon)'}${file(node) ? `@${file(node)}:${node.callFrame.lineNumber}:${node.callFrame.columnNumber}` : ''}`

const sources = new Map()
async function excerpt(node) {
  const url = node.callFrame.url
  if (!url.includes('/_next/static/chunks/')) return ''
  if (!sources.has(url)) sources.set(url, await fetch(url).then((r) => r.text()).then((t) => t.split('\n')).catch(() => []))
  const line = sources.get(url)[node.callFrame.lineNumber] ?? ''
  return line.slice(node.callFrame.columnNumber, node.callFrame.columnNumber + 80).replace(/\s+/g, ' ')
}

const top = {}
const engine = {}
const engineLeaves = {}
let engineTotal = 0
let total = 0
let engineNode
profile.samples.forEach((id, index) => {
  const dt = (profile.timeDeltas[index] ?? 0) / 1000
  total += dt
  const stack = stackOf(id)
  const first = stack[0]
  if (!first) return
  const key = ['(idle)', '(program)', '(garbage collector)'].includes(first.callFrame.functionName) ? first.callFrame.functionName : label(first)
  top[key] = (top[key] ?? 0) + dt
  const at = stack.findIndex((node) => node.callFrame.functionName === 'eH')
  if (at < 0) return
  engineNode ??= stack[at]
  engineTotal += dt
  const path = stack.slice(at + 1, at + 4)
  const pathKey = path.map(label).join(' > ') || '(self)'
  engine[pathKey] ??= { ms: 0, nodes: path }
  engine[pathKey].ms += dt
  const leaf = stack.at(-1)
  const leafKey = file(leaf) ? label(leaf) : leaf.callFrame.functionName || '(anon native)'
  engineLeaves[leafKey] ??= { ms: 0, node: leaf }
  engineLeaves[leafKey].ms += dt
})

const fmt = (ms) => `${ms.toFixed(0).padStart(6)}ms`
console.log(`profile ${profileName}: ${total.toFixed(0)}ms sampled, engine tick ${engineTotal.toFixed(0)}ms`)
console.log('\n-- top-level entries')
for (const [key, ms] of Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(fmt(ms), key)
console.log('\n-- engine tick, by the three frames under it')
for (const [key, { ms, nodes }] of Object.entries(engine).sort((a, b) => b[1].ms - a[1].ms).slice(0, 14)) {
  console.log(fmt(ms), key)
  const last = nodes.at(-1)
  if (last) console.log('         ', await excerpt(last))
}
console.log('\n-- engine tick, by leaf (native calls include the style/layout they force)')
for (const [key, { ms, node }] of Object.entries(engineLeaves).sort((a, b) => b[1].ms - a[1].ms).slice(0, 14)) {
  console.log(fmt(ms), key, file(node) ? `  ${await excerpt(node)}` : '')
}

// Inclusive time inside each scene's constructor, and what it went on.
const SCENES = ['hero', 'manifesto', 'programs', 'parts', 'log', 'releases', 'join']
const perScene = {}
profile.samples.forEach((id, index) => {
  const dt = (profile.timeDeltas[index] ?? 0) / 1000
  const stack = stackOf(id)
  const at = stack.findIndex((node) => SCENES.includes(node.callFrame.functionName) && file(node))
  if (at < 0) return
  const name = stack[at].callFrame.functionName
  perScene[name] ??= { ms: 0, parts: {} }
  perScene[name].ms += dt
  const leaf = stack.at(-1)
  const below = stack[at + 1]
  const key = `${below ? label(below) : '(self)'} … ${file(leaf) ? label(leaf) : leaf.callFrame.functionName || '(native)'}`
  perScene[name].parts[key] = (perScene[name].parts[key] ?? 0) + dt
})
console.log('\n-- scene set-up (inclusive)')
for (const [name, { ms, parts }] of Object.entries(perScene).sort((a, b) => b[1].ms - a[1].ms)) {
  console.log(fmt(ms), name)
  for (const [key, partMs] of Object.entries(parts).sort((a, b) => b[1] - a[1]).slice(0, 5)) console.log('   ', fmt(partMs), key)
}
