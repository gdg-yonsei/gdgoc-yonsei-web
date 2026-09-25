// Usage: node jsenc.mjs <url> — JS resources with encoded (on-the-wire) sizes.
import { chromium } from '@playwright/test'
const b = await chromium.launch(); const p = await b.newPage()
await p.goto(process.argv[2], { waitUntil: 'networkidle' }); await p.waitForTimeout(3000)
const rows = await p.evaluate(() => performance.getEntriesByType('resource')
  .filter((e) => /\.js(\?|$)/.test(e.name))
  .map((e) => [e.encodedBodySize, new URL(e.name).pathname]))
rows.sort((a, c) => c[0] - a[0]).forEach(([n, u]) => console.log(String(n).padStart(8), u))
console.log(String(rows.reduce((s, [n]) => s + n, 0)).padStart(8), 'TOTAL')
await b.close()
