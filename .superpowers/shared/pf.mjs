import { chromium } from '@playwright/test'
import fs from 'node:fs'
const G = JSON.parse(fs.readFileSync('tests/e2e/.auth/seed-data.json')).generationName
const b = await chromium.launch(); const p = await b.newPage()
p.on('response', async (r) => {
  const u = new URL(r.url())
  if (!u.pathname.includes(`/member/${G}`) && !u.search.includes('_rsc')) return
  const h = r.headers(); let len = 0; try { len = (await r.body()).length } catch {}
  console.log(r.status(), u.pathname, r.request().headers()['next-router-segment-prefetch'] ?? '-', 'postponed=' + (h['x-nextjs-postponed'] ?? ''), 'cache=' + (h['x-nextjs-cache'] ?? ''), 'len=' + len)
})
await p.goto('http://localhost:3100/en/member', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
await b.close()
