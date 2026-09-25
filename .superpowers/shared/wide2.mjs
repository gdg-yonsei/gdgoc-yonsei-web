import { chromium } from '@playwright/test'
const [url, root] = process.argv.slice(2)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 320, height: 640 } })
await p.goto(url, { waitUntil: 'networkidle' })
console.log(await p.evaluate((root) => [...document.querySelectorAll(root + ' *')].filter((e) => e.getBoundingClientRect().right > 305 && e.getBoundingClientRect().width > 0).map((e) => `${e.tagName}.${e.className.toString().slice(0,40)} w=${Math.round(e.getBoundingClientRect().width)} right=${Math.round(e.getBoundingClientRect().right)} "${(e.textContent||'').slice(0,50)}"`).slice(0, 10).join('\n'), root))
await b.close()
