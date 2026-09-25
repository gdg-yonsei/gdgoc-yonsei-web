import { chromium } from '@playwright/test'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 320, height: 640 } })
await p.goto(process.argv[2], { waitUntil: 'networkidle' })
console.log(await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > 321).map((e) => `${e.tagName}.${e.className.toString().slice(0,50)} right=${Math.round(e.getBoundingClientRect().right)} text=${(e.textContent||'').slice(0,40)}`).slice(0, 12).join('\n')))
await b.close()
