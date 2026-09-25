import { chromium, devices } from '@playwright/test'
const base = 'http://127.0.0.1:3100'
const browser = await chromium.launch()
const results = []
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)

// 1) No horizontal overflow at key widths
for (const path of ['/en', '/ko']) {
  for (const width of [320, 360, 390, 768, 1280, 1920]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(base + path, { waitUntil: 'networkidle' })
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
    check(`no horizontal scroll ${path} @${width}`, sw === iw, `${sw} vs ${iw}`)
    await ctx.close()
  }
}

// 2) Skip link
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  await page.goto(base + '/en', { waitUntil: 'networkidle' })
  await page.keyboard.press('Tab')
  const first = await page.evaluate(() => ({ text: document.activeElement?.textContent, top: document.activeElement?.getBoundingClientRect().top }))
  check('first Tab focuses the visible skip link', first.text === 'Skip to content' && first.top >= 0, JSON.stringify(first))
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  const focused = await page.evaluate(() => document.activeElement?.id)
  check('Enter on skip link moves focus to #main', focused === 'main', `activeElement#${focused}`)
  await ctx.close()
}

// 3) Mobile menu lifecycle
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'] })
  const page = await ctx.newPage()
  await page.goto(base + '/en/session', { waitUntil: 'networkidle' })
  const trigger = page.getByRole('button', { name: 'Open navigation menu' })
  await trigger.click()
  const open = await page.evaluate(() => document.querySelector('dialog')?.open)
  check('menu opens as a modal dialog', open === true)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  const afterEsc = await page.evaluate(() => ({ open: document.querySelector('dialog')?.open, focus: document.activeElement?.getAttribute('aria-label') }))
  check('Escape closes the menu and returns focus to the trigger', afterEsc.open === false && afterEsc.focus === 'Open navigation menu', JSON.stringify(afterEsc))
  await trigger.click()
  await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: /^Calendar/ }).click()
  await page.waitForURL('**/en/calendar')
  const closed = await page.evaluate(() => [...document.querySelectorAll('dialog')].every((d) => !d.open))
  check('menu link navigates and closes the menu', page.url().endsWith('/en/calendar') && closed, page.url())
  await ctx.close()
}

// 4) Reduced motion keeps the poster
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(base + '/en', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  const r = await page.evaluate(() => ({ gl: document.querySelector('[data-hero]')?.dataset.gl ?? null, anim: getComputedStyle(document.querySelector('.bracket-poster')).animationName }))
  check('reduced motion: no WebGL field and static brackets', r.gl === null && r.anim === 'none', JSON.stringify(r))
  await ctx.close()
}

// 5) Language switch keeps the path
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  await page.goto(base + '/ko/session', { waitUntil: 'networkidle' })
  const href = await page.locator('header [role=group] a[hreflang="en"]').first().getAttribute('href')
  check('language switch on /ko/session points to /en/session', href === '/en/session', href)
  await ctx.close()
}

// 6) 404
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const response = await page.goto(base + '/en/project/not-a-generation')
  const h1 = await page.locator('h1').textContent()
  check('invalid generation returns the restyled 404 with status 404', response?.status() === 404 && h1?.trim() === '404', `${response?.status()} "${h1}"`)
  await ctx.close()
}

await browser.close()
console.log(results.join('\n'))
console.log(results.every((r) => r.startsWith('PASS')) ? 'ALL QA CHECKS PASSED' : 'QA FAILURES PRESENT')
