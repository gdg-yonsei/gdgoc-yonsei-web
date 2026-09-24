import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Client components ship to every visitor. The public chrome must not pull
 * tailwind-merge (via `cn`, ~9 KB gz) or the whole bilingual copy dictionary
 * into the browser; server parents pass the few strings they need as props.
 */
const ROOTS = [
  'app/components/site',
  'app/components/header',
  'app/(home)/[lang]/_components',
]
const FORBIDDEN = [
  /from ['"]@\/lib\/cn['"]/,
  /from ['"]@\/lib\/contents\/site-copy['"]/,
]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

const EXTENSIONS = ['.tsx', '.ts']

function resolveImport(from: string, specifier: string): string | null {
  const base = specifier.startsWith('@/')
    ? specifier.slice(2)
    : specifier.startsWith('.')
      ? join(dirname(from), specifier)
      : null
  if (!base) return null
  for (const extension of EXTENSIONS) {
    const candidate = `${base}${extension}`
    if (existsSync(candidate)) return candidate
  }
  return null
}

/** Value (not type-only) imports of a module that resolve inside the repo. */
function valueImports(path: string): string[] {
  const source = readFileSync(path, 'utf8')
  const specifiers = [
    ...source.matchAll(/^import\s+(?!type\b)[^'"]*?from\s+['"]([^'"]+)['"]/gm),
  ].map((match) => match[1]!)
  return specifiers
    .map((specifier) => resolveImport(path, specifier))
    .filter((resolved): resolved is string => resolved !== null)
}

/** 'use client' modules under ROOTS plus everything they import by value. */
function clientModules() {
  const entries = ROOTS.flatMap(files).filter(
    (path) =>
      /\.(tsx?|jsx?)$/.test(path) &&
      /^['"]use client['"]/m.test(readFileSync(path, 'utf8'))
  )
  const seen = new Set<string>()
  const queue = [...entries]
  while (queue.length > 0) {
    const path = queue.pop()!
    if (seen.has(path)) continue
    seen.add(path)
    queue.push(...valueImports(path).filter((dep) => !dep.startsWith('lib/cn')))
  }
  return [...seen].filter((path) => !path.startsWith('lib/contents/'))
}

describe('public client bundles', () => {
  it('finds the client modules it guards', () => {
    expect(clientModules().length).toBeGreaterThan(0)
  })

  it.each(clientModules())('%s avoids cn and the copy dictionary', (path) => {
    const source = readFileSync(path, 'utf8')
    for (const pattern of FORBIDDEN) expect(source).not.toMatch(pattern)
  })
})
