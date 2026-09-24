import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sample = (overrides: Record<string, number>) => ({
  profile: 'mobile',
  pathname: '/ko',
  status: 200,
  jsEncodedBodyBytes: 150_000,
  rscEncodedBodyBytes: 10_000,
  requestCount: 30,
  prefetchRequestCount: 5,
  lcpMs: 1_500,
  cls: 0,
  inpMs: null,
  tbtMs: 500,
  ...overrides,
})

function runBudget(report: object, baseline: object) {
  const dir = mkdtempSync(join(tmpdir(), 'perf-budget-'))
  writeFileSync(join(dir, 'report.json'), JSON.stringify(report))
  writeFileSync(join(dir, 'baseline.json'), JSON.stringify(baseline))
  try {
    execFileSync(
      'node',
      [
        'scripts/check-performance-budget.mjs',
        join(dir, 'report.json'),
        join(dir, 'baseline.json'),
      ],
      { encoding: 'utf8', stdio: 'pipe' }
    )
    return { ok: true, output: '' }
  } catch (error) {
    return { ok: false, output: String((error as { stderr?: string }).stderr) }
  }
}

const baseline = { results: [sample({})] }

describe('performance budget', () => {
  it('does not count approved Pretendard subsets as a request regression', () => {
    const report = {
      results: [sample({ requestCount: 42, pretendardRequestCount: 10 })],
    }
    expect(runBudget(report, baseline)).toEqual({ ok: true, output: '' })
  })

  it('still flags other request regressions', () => {
    const report = {
      results: [sample({ requestCount: 42, pretendardRequestCount: 2 })],
    }
    const result = runBudget(report, baseline)
    expect(result.ok).toBe(false)
    expect(result.output).toContain('request-count regression')
  })

  it('keeps Pretendard inside the absolute request cap', () => {
    const report = {
      results: [sample({ requestCount: 80, pretendardRequestCount: 50 })],
    }
    const result = runBudget(report, {
      results: [sample({ requestCount: 70 })],
    })
    expect(result.ok).toBe(false)
    expect(result.output).toContain('requests 80 exceeds 75')
  })
})
