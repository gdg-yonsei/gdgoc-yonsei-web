import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/* Shared transitions need share="auto" and default="none" to avoid animating unrelated navigation.
 * Suspense reveals can wait up to 500 ms for fonts/images, delaying detail and generation LCP. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

const named = ['app/components', 'app/(home)']
  .flatMap(files)
  .filter((path) => path.endsWith('.tsx'))
  .flatMap((path) =>
    [
      ...readFileSync(path, 'utf8').matchAll(
        /<ViewTransition\s[^>]*name=[^>]*>/g
      ),
    ].map((match) => [path, match[0]] as const)
  )

describe('named view transitions', () => {
  it('exist (the guard has something to check)', () => {
    expect(named.length).toBeGreaterThan(0)
  })

  it.each(named)('%s morphs only when paired', (_path, tag) => {
    expect(tag).toContain('share="auto"')
    expect(tag).toContain('default="none"')
  })
})
