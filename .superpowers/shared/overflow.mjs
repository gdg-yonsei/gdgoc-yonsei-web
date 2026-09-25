// Usage: node overflow.mjs <base> <path...> — prints horizontal overflow at 320px.
import { chromium } from '@playwright/test'
const [base, ...paths] = process.argv.slice(2)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 320, height: 640 } })
for (const path of paths) {
  await p.goto(base + path, { waitUntil: 'networkidle' })
  const d = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log(d === 0 ? 'ok  ' : 'OVER', d, path)
}
await b.close()
