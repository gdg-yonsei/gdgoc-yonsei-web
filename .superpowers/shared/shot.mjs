// Usage: node shot.mjs <url> <w>x<h> <out.png> [--reduced] [--dark] [--wait=ms] [--scroll=px] [--full] [--eval=js]
import { chromium } from '@playwright/test'
const [url, size, out, ...flags] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
const opt = Object.fromEntries(flags.map((f) => { const s = f.replace(/^--/, ''); const i = s.indexOf('='); return i < 0 ? [s, true] : [s.slice(0, i), s.slice(i + 1)] }))
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: Number(opt.dpr ?? 1),
  reducedMotion: opt.reduced ? 'reduce' : 'no-preference',
  colorScheme: opt.dark ? 'dark' : 'light',
  hasTouch: Boolean(opt.touch),
  isMobile: Boolean(opt.touch),
  javaScriptEnabled: !opt.nojs,
})
const page = await context.newPage()
const logs = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(url, { waitUntil: 'networkidle' })
if (opt['ko-font']) {
  // QA-only: this headless box has no Korean system font, so stand one in.
  await page.addStyleTag({ content: `
    html.site { font-family: var(--font-flex), 'Pretendard Variable', sans-serif !important; }
    html.site .font-code, html.site .hero-eyebrow, html.site .hero-meta, html.site .hero-cue, html.site .locale-switch, html.site time { font-family: var(--font-code-mono), 'Pretendard Variable', monospace !important; }
    html.site .font-display, html.site .hero-title, html.site .mobile-menu-link, html.site .site-footer-wordmark, html.site h1, html.site h2, html.site h3 { font-family: var(--font-flex), 'Pretendard Variable', sans-serif !important; }` })
  await page.waitForTimeout(600)
}
if (opt.mouse) { const [mx, my] = String(opt.mouse).split(',').map(Number); await page.mouse.move(mx - 40, my - 40); await page.mouse.move(mx, my, { steps: 8 }) }
if (opt.click) { await page.click(String(opt.click)); await page.waitForTimeout(700) }
if (opt.css) { await page.addStyleTag({ content: String(opt.css) }); await page.waitForTimeout(300) }
if (opt.scroll) { await page.evaluate((y) => window.scrollTo(0, y), Number(opt.scroll)); }
await page.waitForTimeout(Number(opt.wait ?? 600))
if (opt.eval) { console.log('eval:', JSON.stringify(await page.evaluate(opt.eval))) }
await page.screenshot({ path: out, fullPage: Boolean(opt.full) })
console.log('saved', out)
if (logs.length) console.log(logs.slice(0, 10).join('\n'))
await browser.close()
