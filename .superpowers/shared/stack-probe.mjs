// Usage: node .superpowers/shared/stack-probe.mjs [baseURL]
// Prints, per viewport and locale, each program card's height, its sticky
// slot (computed top) and the room left below that slot.
import { chromium } from '@playwright/test'

const base = process.argv[2] ?? 'http://localhost:3100'
const cases = [
  ['en', 1366, 768],
  ['en', 1366, 657],
  ['en', 1440, 789],
  ['en', 1024, 700],
  ['en', 768, 1024],
  ['en', 768, 640],
  ['en', 1920, 960],
  ['ko', 1366, 657],
  ['ko', 1024, 700],
]

const only = process.env.PROBE_CASES?.split(',')
const browser = await chromium.launch()
for (const [lang, width, height] of cases) {
  if (only && !only.includes(`${lang}:${width}x${height}`)) continue
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(`${base}/${lang}`, { waitUntil: 'load' })
  if (process.env.PROBE_CSS) await page.addStyleTag({ content: process.env.PROBE_CSS })
  await page.locator('.program-stack').scrollIntoViewIfNeeded()
  await page.waitForTimeout(Number(process.env.PROBE_WAIT ?? 150))
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('.program-card')].map((card) => {
      const style = getComputedStyle(card)
      const h = card.getBoundingClientRect().height
      const top = parseFloat(style.top)
      return {
        title: card.querySelector('h3')?.textContent,
        position: style.position,
        h: Math.round(h),
        rem: +(h / 16).toFixed(1),
        top: Math.round(top),
        room: Math.round(innerHeight - top),
        cardH: card.style.getPropertyValue('--card-h'),
      }
    })
  )
  console.log(`\n${lang} ${width}×${height}`)
  for (const row of rows) {
    console.log(
      `  ${String(row.title).padEnd(26)} ${row.position.padEnd(7)} h=${row.h} (${row.rem}rem) top=${row.top} room=${row.room} ${row.h <= row.room ? 'fits' : 'TOO TALL'} --card-h=${row.cardH}`
    )
  }
  await page.close()
}
await browser.close()
