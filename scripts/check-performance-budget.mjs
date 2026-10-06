// 보고서의 라우트별 절대 상한과 기준선 대비 JS 증가율 5%를 검사한다: pnpm perf:budget <report.json> [baseline.json].
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

// 홈 전용 첫 페인트 이후 모션 청크는 37,674B, 홈 합계 195,911B다. 절대 상한은 합계에 5KB 미만 여유를 둔다.
// 청크 없는 기준선과 최초 비교할 때는 평소 5% 증가 허용량에 이 청크 크기를 더한다.
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

  // 승인된 한국어 Pretendard 서브셋은 회귀 비용에서 빼지만 요청 수 절대 상한 75개에는 포함한다.
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
