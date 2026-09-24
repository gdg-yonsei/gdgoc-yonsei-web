import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Client components ship to every visitor. The public chrome must not pull
 * tailwind-merge (via `cn`, ~9 KB gz) or a whole bilingual copy dictionary
 * into the browser; server parents pass the few strings they need as props.
 */
const ROOTS = [
  'app/components/site',
  'app/components/header',
  'app/(home)/[lang]/_components',
]
const FORBIDDEN = [
  'lib/cn.ts',
  'lib/contents/site-copy.ts',
  'lib/contents/archive-copy.ts',
]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

function resolveImport(from: string, specifier: string): string | null {
  const base = specifier.startsWith('@/')
    ? specifier.slice(2)
    : specifier.startsWith('.')
      ? join(dirname(from), specifier)
      : null
  if (!base) return null
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    join(base, 'index.tsx'),
    join(base, 'index.ts'),
  ]) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

/** Value imports, side-effect imports, re-exports and lazy import()s (their
    chunks ship to the browser too) that resolve inside the repo. */
function dependencies(path: string): string[] {
  const source = readFileSync(path, 'utf8')
  return [
    ...source.matchAll(/^import\s+(?!type\b)[^'"]*?from\s+['"]([^'"]+)['"]/gm),
    ...source.matchAll(/^import\s+['"]([^'"]+)['"]/gm),
    ...source.matchAll(/^export\s+(?!type\b)[^'"]*?from\s+['"]([^'"]+)['"]/gm),
    ...source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
  ]
    .map((match) => resolveImport(path, match[1]!))
    .filter((resolved): resolved is string => resolved !== null)
}

/** Every module a 'use client' file under ROOTS reaches by value. */
function clientGraph(): Set<string> {
  const queue = ROOTS.flatMap(files).filter(
    (path) =>
      /\.(tsx?|jsx?)$/.test(path) &&
      /^['"]use client['"]/m.test(readFileSync(path, 'utf8'))
  )
  const seen = new Set<string>()
  while (queue.length > 0) {
    const path = queue.pop()!
    if (seen.has(path)) continue
    seen.add(path)
    queue.push(...dependencies(path))
  }
  return seen
}

describe('public client bundles', () => {
  it('finds the client modules it guards', () => {
    expect(clientGraph().size).toBeGreaterThan(0)
  })

  it.each(FORBIDDEN)('never reach %s', (forbidden) => {
    expect([...clientGraph()]).not.toContain(forbidden)
  })

  it('resolves relative and index imports', () => {
    expect(
      resolveImport(
        'app/components/site/filter-bar.tsx',
        '../../../lib/site/format'
      )
    ).toBe('lib/site/format.ts')
  })
})
