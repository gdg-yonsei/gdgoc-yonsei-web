// Usage: node scripts.mjs <url> — lists JS responses with encoded sizes.
import { chromium } from '@playwright/test'
const b = await chromium.launch(); const p = await b.newPage()
const rows = []
p.on('response', async (r) => { if (r.request().resourceType() !== 'script') return; let n = 0; try { n = (await r.body()).length } catch {} rows.push([n, new URL(r.url()).pathname]) })
await p.goto(process.argv[2], { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
rows.sort((a, c) => c[0] - a[0]).forEach(([n, u]) => console.log(String(n).padStart(8), u))
await b.close()
