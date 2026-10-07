import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const script = resolve('scripts/ci/check-overrides.mjs')

function checkOverrides(overrides: string) {
  const directory = mkdtempSync(join(tmpdir(), 'check-overrides-'))
  try {
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify({
        dependencies: { next: '^16.3.8', sharp: '0.35.4' },
        devDependencies: { '@types/react': '^19.3.0' },
      })
    )
    writeFileSync(
      join(directory, 'pnpm-workspace.yaml'),
      `overrides:\n${overrides}\n`
    )
    return spawnSync(process.execPath, [script], {
      cwd: directory,
      encoding: 'utf8',
    })
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

describe('CI dependency overrides', () => {
  it('accepts matching literals and overrides of transitive dependencies', () => {
    const result = checkOverrides('  sharp: 0.35.4\n  esbuild: 0.28.1')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('2 overrides checked, 0 mismatched')
  })

  it('rejects a stale override that hides a direct dependency update', () => {
    const result = checkOverrides('  next: 16.3.6')
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('next is ^16.3.8')
  })

  it('accepts references to updated dependency and devDependency specs', () => {
    const result = checkOverrides(
      '  next: $next\n  \'@types/react\': "$@types/react"'
    )
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('2 overrides checked, 0 mismatched')
  })

  it('rejects a reference to an incompatible direct dependency', () => {
    const result = checkOverrides('  next: $sharp')
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('next is ^16.3.8')
  })

  it('rejects a reference to an absent direct dependency', () => {
    const result = checkOverrides('  next: $missing')
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('1 mismatched')
  })
})
