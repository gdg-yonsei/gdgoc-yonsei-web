// Usage: node boxes.mjs <url> <selector...> — width/scrollWidth of the first match at 320px.
import { chromium } from '@playwright/test'
const [url, ...sels] = process.argv.slice(2)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 320, height: 640 } })
await p.goto(url, { waitUntil: 'networkidle' })
for (const s of sels) console.log(s, await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return 'none'; const cs = getComputedStyle(e); return `w=${Math.round(e.getBoundingClientRect().width)} sw=${e.scrollWidth} display=${cs.display} overflowX=${cs.overflowX}` }, s))
await b.close()
