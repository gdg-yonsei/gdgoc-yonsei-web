/**
 * Post-deploy smoke test: read-only GET requests against a running site.
 *
 * Covers what unit and e2e tests cannot see on the real deployment: the
 * build's runtime dependencies (e.g. satori's wasm for social images), the
 * production database behind public pages, redirects and response headers.
 *
 * Usage: node scripts/ci/smoke-test.mjs https://gdgoc.yonsei.ac.kr
 */
import { appendFileSync } from 'node:fs'

const baseURL = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? '').replace(
  /\/+$/,
  ''
)
if (!baseURL) {
  console.error('Usage: node scripts/ci/smoke-test.mjs <base-url>')
  process.exit(2)
}

const WARMUP_ATTEMPTS = Number(process.env.SMOKE_WARMUP_ATTEMPTS ?? 20)
const WARMUP_DELAY_MS = Number(process.env.SMOKE_WARMUP_DELAY_MS ?? 15_000)
const REQUEST_TIMEOUT_MS = 30_000
const results = []

function absolute(pathOrUrl) {
  return new URL(pathOrUrl, `${baseURL}/`).href
}

async function request(pathOrUrl, init = {}) {
  const started = performance.now()
  const response = await fetch(absolute(pathOrUrl), {
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { 'user-agent': 'gdgoc-smoke-test' },
    ...init,
  })
  const body = init.method === 'HEAD' ? '' : await response.text()
  return { response, body, ms: Math.round(performance.now() - started) }
}

async function check(name, fn) {
  try {
    const detail = await fn()
    results.push({ name, ok: true, detail })
    console.log(`ok   ${name}${detail ? ` — ${detail}` : ''}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    results.push({ name, ok: false, detail: message })
    console.log(`::error title=Smoke test failed::${name}: ${message}`)
  }
}

function expectStatus(response, expected, label) {
  const ok = Array.isArray(expected)
    ? expected.includes(response.status)
    : response.status === expected
  if (!ok) {
    throw new Error(
      `${label} returned ${response.status}, expected ${expected}`
    )
  }
}

function firstMatch(body, pattern, label) {
  const match = body.match(pattern)
  if (!match) throw new Error(`no ${label} found`)
  return match[1]
}

async function expectPage(pathname, marker) {
  const { response, body, ms } = await request(pathname)
  expectStatus(response, 200, pathname)
  if (!response.headers.get('content-type')?.includes('text/html')) {
    throw new Error(`${pathname} is not HTML`)
  }
  if (marker && !body.includes(marker)) {
    throw new Error(`${pathname} does not contain ${JSON.stringify(marker)}`)
  }
  return { body, detail: `${response.status} in ${ms} ms` }
}

async function expectImage(url) {
  const { response, ms } = await request(url)
  expectStatus(response, 200, url)
  const type = response.headers.get('content-type') ?? ''
  if (!type.startsWith('image/')) {
    throw new Error(`${url} returned ${type || 'no content-type'}`)
  }
  return `${type} in ${ms} ms`
}

function ogImage(body) {
  return firstMatch(
    body,
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
    'og:image'
  )
}

// A fresh container can take a while to accept traffic after the deploy
// reports done; wait until the home page answers before judging anything.
async function waitForSite() {
  for (let attempt = 1; attempt <= WARMUP_ATTEMPTS; attempt += 1) {
    try {
      const { response } = await request('/ko')
      if (response.status === 200) return
      console.log(`waiting for ${baseURL}/ko (status ${response.status})`)
    } catch (error) {
      console.log(`waiting for ${baseURL}/ko (${error.message})`)
    }
    await new Promise((resolve) => setTimeout(resolve, WARMUP_DELAY_MS))
  }
  throw new Error(`${baseURL}/ko did not return 200 in time`)
}

await waitForSite()

for (const locale of ['ko', 'en']) {
  await check(`home /${locale}`, async () => {
    const { detail } = await expectPage(`/${locale}`, '<html')
    return detail
  })
}

await check('root redirects to a locale', async () => {
  const { response } = await request('/')
  expectStatus(response, [307, 308], '/')
  const location = response.headers.get('location') ?? ''
  if (!/\/(ko|en)(\/|$)/.test(location)) {
    throw new Error(`redirects to ${location}`)
  }
  return location
})

await check('locale redirect keeps the query string', async () => {
  const { response } = await request('/session?smoke=1')
  expectStatus(response, [307, 308], '/session?smoke=1')
  const location = response.headers.get('location') ?? ''
  if (!location.includes('smoke=1')) throw new Error(`redirects to ${location}`)
  return location
})

await check('no x-powered-by header', async () => {
  const { response } = await request('/ko')
  if (response.headers.has('x-powered-by')) {
    throw new Error(`x-powered-by: ${response.headers.get('x-powered-by')}`)
  }
})

await check('sitemap.xml', async () => {
  const { response, body } = await request('/sitemap.xml')
  expectStatus(response, 200, '/sitemap.xml')
  if (!body.includes('<urlset')) throw new Error('not a sitemap')
  return `${(body.match(/<url>/g) ?? []).length} urls`
})

await check('robots.txt', async () => {
  const { response } = await request('/robots.txt')
  expectStatus(response, 200, '/robots.txt')
})

await check('site social image', async () => {
  const { body } = await expectPage('/ko')
  return expectImage(ogImage(body))
})

// Detail pages and their generated (satori) social images, one per kind.
for (const [kind, pattern] of [
  ['session', /href="(\/ko\/session\/[^"/]+\/[0-9a-f-]{36})"/],
  ['project', /href="(\/ko\/project\/[^"/]+\/[0-9a-f-]{36})"/],
]) {
  let detailPath = null
  await check(`${kind} list`, async () => {
    const { body, detail } = await expectPage(`/ko/${kind}`)
    detailPath = firstMatch(body, pattern, `${kind} detail link`)
    return detail
  })
  if (!detailPath) continue

  let detailBody = ''
  await check(`${kind} detail ${detailPath}`, async () => {
    const page = await expectPage(detailPath)
    detailBody = page.body
    return page.detail
  })
  if (!detailBody) continue

  await check(`${kind} social image`, () => expectImage(ogImage(detailBody)))
}

await check('member directory', async () => {
  const { detail } = await expectPage('/ko/member')
  return detail
})

await check('admin is reachable', async () => {
  const { response } = await request('/admin')
  if (response.status >= 500)
    throw new Error(`/admin returned ${response.status}`)
  return String(response.status)
})

await check('unknown route is a 404', async () => {
  const { response } = await request('/ko/this-route-does-not-exist-smoke')
  expectStatus(response, 404, 'unknown route')
})

const failed = results.filter((result) => !result.ok)

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    `### Smoke test — ${baseURL}`,
    '',
    '| Check | Result | Detail |',
    '| --- | --- | --- |',
    ...results.map(
      (result) =>
        `| ${result.name} | ${result.ok ? '✅' : '❌'} | ${(result.detail ?? '').replaceAll('|', '\\|')} |`
    ),
    '',
  ]
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`)
}

console.log(`${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length > 0 ? 1 : 0)
