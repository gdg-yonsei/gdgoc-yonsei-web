import { writeFile } from 'node:fs/promises'
import { chromium, devices } from '@playwright/test'

const baseURL = process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3100'
const outputPath = process.env.PERF_OUTPUT
const settleMs = Number(process.env.PERF_SETTLE_MS ?? 3_000)

const profiles = {
  desktop: {
    context: devices['Desktop Chrome'],
    cpuSlowdown: 4,
  },
  mobile: {
    context: devices['Pixel 7'],
    cpuSlowdown: 4,
  },
}

function absolute(pathname) {
  return new URL(pathname, baseURL).href
}

async function discoverRepresentativeRoutes(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()

  async function firstLink(pathname, pattern) {
    await page.goto(absolute(pathname), { waitUntil: 'domcontentloaded' })
    const href = await page
      .locator(`a[href^="${pattern}"]`)
      .first()
      .getAttribute('href')
    if (!href) {
      throw new Error(
        `No representative link matching ${pattern} on ${pathname}`
      )
    }
    return href
  }

  async function firstGenerationWithDetail(indexPath) {
    await page.goto(absolute(indexPath), { waitUntil: 'domcontentloaded' })
    const generationLinks = await page
      .locator(`a[href^="${indexPath}/"]`)
      .evaluateAll((links) => [
        ...new Set(
          links.map((link) => link.getAttribute('href')).filter(Boolean)
        ),
      ])

    for (const generationLink of generationLinks) {
      await page.goto(absolute(generationLink), {
        waitUntil: 'domcontentloaded',
      })
      const detail = page.locator(`a[href^="${generationLink}/"]`).first()
      if ((await detail.count()) > 0) {
        return {
          generation: generationLink,
          detail: await detail.getAttribute('href'),
        }
      }
    }

    throw new Error(`No generation with a detail link below ${indexPath}`)
  }

  const project = await firstGenerationWithDetail('/ko/project')
  const session = await firstGenerationWithDetail('/ko/session')
  const memberGeneration = await firstLink('/ko/member', '/ko/member/')

  await context.close()

  return [
    '/ko',
    '/en',
    '/ko/project',
    project.generation,
    project.detail,
    '/ko/session',
    session.generation,
    session.detail,
    '/ko/member',
    memberGeneration,
    '/ko/calendar',
  ]
}

async function installObservers(page) {
  await page.addInitScript(() => {
    window.__nextPerf = { cls: 0, inp: 0, lcp: 0, tbt: 0 }

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__nextPerf.cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })

    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const latest = entries.at(-1)
      if (latest) window.__nextPerf.lcp = latest.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId > 0) {
          window.__nextPerf.inp = Math.max(
            window.__nextPerf.inp,
            entry.duration
          )
        }
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 })

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__nextPerf.tbt += Math.max(0, entry.duration - 50)
      }
    }).observe({ type: 'longtask', buffered: true })
  })
}

async function measureRoute(browser, pathname, profileName, profile) {
  const context = await browser.newContext(profile.context)
  const page = await context.newPage()
  await installObservers(page)

  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 200_000,
    uploadThroughput: 93_750,
  })
  await cdp.send('Emulation.setCPUThrottlingRate', {
    rate: profile.cpuSlowdown,
  })

  const requests = []
  page.on('request', (request) => {
    requests.push(
      request
        .allHeaders()
        .then((headers) => ({
          resourceType: request.resourceType(),
          url: request.url(),
          isPrefetch:
            headers['next-router-prefetch'] === '1' ||
            headers.purpose === 'prefetch' ||
            headers['sec-purpose']?.includes('prefetch') === true,
        }))
        .catch(() => null)
    )
  })

  const startedAt = Date.now()
  const response = await page.goto(absolute(pathname), { waitUntil: 'load' })
  await page.waitForTimeout(settleMs)

  if (profileName === 'mobile') {
    await page
      .getByRole('button', {
        name: /탐색 메뉴 열기|open navigation menu/i,
      })
      .click()
    await page.waitForTimeout(250)
  }

  const browserMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0]
    const resources = performance.getEntriesByType('resource')
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(
      (entry) => entry.name === 'first-contentful-paint'
    )?.startTime
    const isJavaScript = (entry) =>
      entry.initiatorType === 'script' || /\.(?:m?js)(?:\?|$)/.test(entry.name)
    const isRsc = (entry) =>
      entry.name.includes('_rsc=') || entry.name.includes('.rsc')
    const sum = (entries, field) =>
      entries.reduce((total, entry) => total + (entry[field] || 0), 0)

    return {
      cls: window.__nextPerf.cls,
      fcpMs: fcp ?? null,
      inpMs: window.__nextPerf.inp || null,
      lcpMs: window.__nextPerf.lcp || null,
      tbtMs: window.__nextPerf.tbt,
      ttfbMs: navigation
        ? navigation.responseStart - navigation.requestStart
        : null,
      domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
      loadMs: navigation?.loadEventEnd ?? null,
      transferredBytes: navigation
        ? navigation.transferSize + sum(resources, 'transferSize')
        : sum(resources, 'transferSize'),
      encodedBodyBytes: navigation
        ? navigation.encodedBodySize + sum(resources, 'encodedBodySize')
        : sum(resources, 'encodedBodySize'),
      jsTransferredBytes: sum(resources.filter(isJavaScript), 'transferSize'),
      jsEncodedBodyBytes: sum(
        resources.filter(isJavaScript),
        'encodedBodySize'
      ),
      rscTransferredBytes: sum(resources.filter(isRsc), 'transferSize'),
      rscEncodedBodyBytes: sum(resources.filter(isRsc), 'encodedBodySize'),
      resourceCount: resources.length + 1,
    }
  })

  page.removeAllListeners('request')
  const settledRequests = (await Promise.all(requests)).filter(Boolean)
  const result = {
    profile: profileName,
    pathname,
    status: response?.status() ?? null,
    wallTimeMs: Date.now() - startedAt,
    requestCount: settledRequests.length,
    prefetchRequestCount: settledRequests.filter(
      (request) => request.isPrefetch
    ).length,
    scriptRequestCount: settledRequests.filter(
      (request) => request.resourceType === 'script'
    ).length,
    ...browserMetrics,
  }

  await context.close()
  return result
}

const browser = await chromium.launch({ headless: true })

try {
  const routes = await discoverRepresentativeRoutes(browser)
  const results = []

  for (const [profileName, profile] of Object.entries(profiles)) {
    for (const pathname of routes) {
      const result = await measureRoute(browser, pathname, profileName, profile)
      results.push(result)
      process.stdout.write(`${JSON.stringify(result)}\n`)
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseURL,
    network: {
      latencyMs: 150,
      downloadBytesPerSecond: 200_000,
      uploadBytesPerSecond: 93_750,
    },
    cpuSlowdown: 4,
    settleMs,
    routes,
    results,
  }

  if (outputPath) {
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
  }
} finally {
  await browser.close()
}
