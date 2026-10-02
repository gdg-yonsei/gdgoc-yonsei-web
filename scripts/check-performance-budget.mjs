/**
 * 성능 예산 검사(`pnpm perf:budget <report.json> [baseline.json]`).
 *
 * `measure-next-performance.mjs`가 만든 측정 보고서를 읽어 라우트별 절대 상한(JS·RSC 전송량, 요청 수,
 * LCP·CLS·INP·TBT)과 기준선 대비 JS 증가율(5%)을 넘으면 실패한다. CI(`ci.yml`)의 성능 단계에서 실행된다.
 */
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

// 2026-09-25 승인: anime.js 엔진과 랜딩 장면(docs/superpowers/specs/2026-09-25-landing-motion-design.md)은
// 홈 라우트에서만, 첫 페인트 이후에 불러온다. 측정값은 인코딩 기준 37,674바이트(홈 전체 195,911B)라
// 홈 상한은 그 합계에 5KB 미만을 더한 값이다. 이 청크가 없던 기준선과 처음 비교할 때는 평소의 5%에
// 더해 청크 크기만큼 늘어날 수 있다.
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

  // 한국어 글자용 Pretendard unicode-range 서브셋은 승인된 비용이다(2026-09-24). 그래도 위의 요청 수
  // 절대 상한(75개)에는 포함된다.
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
