import { chromium } from '@playwright/test'
import { instant } from '@next/playwright'

const baseURL = process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3100'

function absolute(pathname) {
  return new URL(pathname, baseURL).href
}

async function assertVisible(locator, label) {
  try {
    await locator.waitFor({ state: 'visible', timeout: 10_000 })
  } catch (error) {
    throw new Error(`Instant navigation did not expose ${label}`, {
      cause: error,
    })
  }
}

async function firstGenerationWithDetail(page, indexPath) {
  await page.goto(absolute(indexPath), { waitUntil: 'domcontentloaded' })
  const generationLinks = await page
    .locator(`a[href^="${indexPath}/"]`)
    .evaluateAll((links) => [
      ...new Set(
        links.map((link) => link.getAttribute('href')).filter(Boolean)
      ),
    ])

  for (const generation of generationLinks) {
    await page.goto(absolute(generation), { waitUntil: 'domcontentloaded' })
    const detailLink = page.locator(`a[href^="${generation}/"]`).first()
    if ((await detailLink.count()) > 0) {
      return {
        detail: await detailLink.getAttribute('href'),
        generation,
      }
    }
  }

  throw new Error(`No detail route is available below ${indexPath}`)
}

async function verifyNavigation(
  page,
  { assertShell, destination, label, link, source }
) {
  await page.goto(absolute(source), { waitUntil: 'domcontentloaded' })
  const destinationLink = page
    .locator(`a[href="${link ?? destination}"]`)
    .first()
  await assertVisible(destinationLink, `${label} link`)
  await page.waitForTimeout(500)

  await instant(page, async () => {
    await destinationLink.click()
    await page.waitForURL((url) => url.pathname === destination)
    await assertVisible(page.locator('header'), `${label} persistent header`)
    await assertShell()
  })

  process.stdout.write(`PASS ${label}\n`)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()

try {
  const project = await firstGenerationWithDetail(page, '/en/project')
  const session = await firstGenerationWithDetail(page, '/en/session')

  await page.goto(absolute('/en/member'), { waitUntil: 'domcontentloaded' })
  const memberGeneration = await page
    .locator('a[href^="/en/member/"]')
    .first()
    .getAttribute('href')

  if (!project.detail || !session.detail || !memberGeneration) {
    throw new Error('Could not discover every representative public route')
  }

  await verifyNavigation(page, {
    source: '/en',
    destination: '/en/project',
    label: 'homepage -> project index',
    assertShell: () =>
      assertVisible(
        page.getByRole('heading', { name: 'Projects by Generation' }),
        'project index heading'
      ),
  })

  await verifyNavigation(page, {
    source: '/en/project',
    destination: project.generation,
    label: 'project index -> generation',
    assertShell: () =>
      assertVisible(
        page.getByRole('heading', { name: 'Projects' }),
        'project generation heading'
      ),
  })

  await verifyNavigation(page, {
    source: project.generation,
    destination: project.detail,
    label: 'project generation -> detail',
    assertShell: () =>
      assertVisible(
        page.getByRole('status', { name: 'Loading project details' }),
        'project detail skeleton'
      ),
  })

  await verifyNavigation(page, {
    source: '/en',
    destination: '/en/session',
    label: 'homepage -> session index',
    assertShell: () =>
      assertVisible(
        page.getByRole('heading', { name: 'Sessions by Generation' }),
        'session index heading'
      ),
  })

  await verifyNavigation(page, {
    source: '/en/session',
    destination: session.generation,
    label: 'session index -> generation',
    assertShell: () =>
      assertVisible(
        page.getByRole('heading', { name: 'Sessions' }),
        'session generation heading'
      ),
  })

  await verifyNavigation(page, {
    source: session.generation,
    destination: session.detail,
    label: 'session generation -> detail',
    assertShell: () =>
      assertVisible(
        page.getByRole('status', { name: 'Loading session details' }),
        'session detail skeleton'
      ),
  })

  await verifyNavigation(page, {
    source: '/en/member',
    destination: memberGeneration,
    label: 'member index -> generation',
    assertShell: () =>
      assertVisible(
        page.getByRole('heading', { name: 'Members' }),
        'member generation heading'
      ),
  })

  await page.goto(absolute(project.generation), {
    waitUntil: 'domcontentloaded',
  })
  await page.locator(`a[href="${project.detail}"]`).first().click()
  await page.waitForURL((url) => url.pathname === project.detail)
  await assertVisible(
    page.locator('main h1:visible').first(),
    'project detail content'
  )
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await page.waitForURL((url) => url.pathname === project.generation)
  await assertVisible(
    page.locator(`a[href="${project.detail}"]:visible`).first(),
    'project list after back navigation'
  )
  process.stdout.write('PASS detail -> back navigation state\n')
} finally {
  await context.close()
  await browser.close()
}
