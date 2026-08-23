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

function fail(result, metric, actual, budget) {
  failures.push(
    `${result.profile} ${result.pathname}: ${metric} ${actual} exceeds ${budget}`
  )
}

for (const result of report.results) {
  if (result.status !== 200) fail(result, 'status', result.status, 200)
  if (result.jsEncodedBodyBytes > 170_000) {
    fail(result, 'encoded JS bytes', result.jsEncodedBodyBytes, 170_000)
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

  const jsRegressionBudget = Math.ceil(before.jsEncodedBodyBytes * 1.05)
  if (result.jsEncodedBodyBytes > jsRegressionBudget) {
    fail(
      result,
      'encoded JS regression bytes',
      result.jsEncodedBodyBytes,
      jsRegressionBudget
    )
  }

  const requestRegressionBudget = before.requestCount + 4
  if (result.requestCount > requestRegressionBudget) {
    fail(
      result,
      'request-count regression',
      result.requestCount,
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
