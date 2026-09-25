import { readFile } from 'node:fs/promises'

const [reportPath, baselinePath] = process.argv.slice(2)

if (!reportPath) {
  throw new Error(
    'Usage: node scripts/check-performance-budget.mjs <report.json> [baseline.json]'
  )
}

const report = JSON.parse(await readFile(reportPath, 'utf8'))
const baseline = baselinePath
  ? JSON.parse(await readFile(baselinePath, 'utf8'))
  : null
const failures = []

// Approved 2026-09-25: the anime.js engine and the landing scenes
// (docs/superpowers/specs/2026-09-25-landing-motion-design.md) load on the
// home routes only, after first paint. Measured at 37,674 encoded bytes
// (home 195,911 B), so the home cap is that total plus under 5 KB, and the
// first comparison against a baseline without them may grow by the chunk on
// top of the usual 5%.
const HOME_ROUTES = new Set(['/en', '/ko'])
const HOME_JS_CAP = 200_000
const HOME_MOTION_ALLOWANCE = 37_000

function fail(result, metric, actual, budget) {
  failures.push(
    `${result.profile} ${result.pathname}: ${metric} ${actual} exceeds ${budget}`
  )
}

for (const result of report.results) {
  if (result.status !== 200) fail(result, 'status', result.status, 200)
  const jsCap = HOME_ROUTES.has(result.pathname) ? HOME_JS_CAP : 170_000
  if (result.jsEncodedBodyBytes > jsCap) {
    fail(result, 'encoded JS bytes', result.jsEncodedBodyBytes, jsCap)
  }
  if (result.rscEncodedBodyBytes > 70_000) {
    fail(result, 'encoded RSC bytes', result.rscEncodedBodyBytes, 70_000)
  }
  if (result.requestCount > 75) {
    fail(result, 'requests', result.requestCount, 75)
  }
  if (result.prefetchRequestCount > 25) {
    fail(result, 'prefetch requests', result.prefetchRequestCount, 25)
  }
  if (result.lcpMs > 2_500) fail(result, 'LCP ms', result.lcpMs, 2_500)
  if (result.cls > 0.05) fail(result, 'CLS', result.cls, 0.05)
  if (result.inpMs !== null && result.inpMs > 250) {
    fail(result, 'interaction latency ms', result.inpMs, 250)
  }
  if (result.tbtMs > 2_500) fail(result, 'TBT ms', result.tbtMs, 2_500)

  const before = baseline?.results.find(
    (candidate) =>
      candidate.profile === result.profile &&
      candidate.pathname === result.pathname
  )

  if (!before) continue

  const motionAllowance =
    HOME_ROUTES.has(result.pathname) && result.homeMotion && !before.homeMotion
      ? HOME_MOTION_ALLOWANCE
      : 0
  const jsRegressionBudget =
    Math.ceil(before.jsEncodedBodyBytes * 1.05) + motionAllowance
  if (result.jsEncodedBodyBytes > jsRegressionBudget) {
    fail(
      result,
      'encoded JS regression bytes',
      result.jsEncodedBodyBytes,
      jsRegressionBudget
    )
  }

  // Pretendard's unicode-range subsets for Korean text are an approved cost
  // (2026-09-24); they still count toward the absolute 75-request cap above.
  const withoutPretendard = (sample) =>
    sample.requestCount - (sample.pretendardRequestCount ?? 0)
  const requestRegressionBudget = withoutPretendard(before) + 4
  if (withoutPretendard(result) > requestRegressionBudget) {
    fail(
      result,
      'request-count regression',
      withoutPretendard(result),
      requestRegressionBudget
    )
  }

  const lcpRegressionBudget = Math.ceil(before.lcpMs * 1.35)
  if (result.lcpMs > lcpRegressionBudget) {
    fail(result, 'LCP regression ms', result.lcpMs, lcpRegressionBudget)
  }
}

if (failures.length > 0) {
  process.stderr.write(`Performance budget failed:\n${failures.join('\n')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(
    `Performance budget passed for ${report.results.length} route/profile samples.\n`
  )
}
