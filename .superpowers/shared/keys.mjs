// Usage: node keys.mjs <url> [stops] — tabs through the page; prints each focus stop and its outline.
import { chromium } from '@playwright/test'
const [url, stops = '80'] = process.argv.slice(2)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
await p.goto(url, { waitUntil: 'networkidle' })
const seen = []
for (let i = 0; i < Number(stops); i++) {
  await p.keyboard.press('Tab')
  seen.push(await p.evaluate(() => {
    const el = document.activeElement
    const cs = getComputedStyle(el)
    const glyph = el.closest('.part-module')?.querySelector('.pg-swap-a, .pg-layer-top, .pg-node, .pg-mesh, .pg-draw, .pg-ring')
    return [el.tagName, (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34), cs.outlineStyle + ' ' + cs.outlineWidth,
      glyph ? getComputedStyle(glyph).translate + '|' + getComputedStyle(glyph).animationName + '|' + getComputedStyle(glyph).transform.slice(0, 20) : '']
  }))
}
seen.forEach((s, i) => console.log(String(i + 1).padStart(3), s.join('  ·  ')))
await b.close()
