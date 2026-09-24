import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * React streams a <ViewTransition> Suspense reveal through
 * document.startViewTransition and holds the new content back until web
 * fonts and in-view images load (up to 500 ms, or until 2.3 s after
 * navigation). On pages whose streamed content holds the largest paint that
 * delay lands on LCP, so the animated reveal (RevealSuspense) is kept to the
 * landing's below-the-fold sections.
 */
const LCP_PAGES = ['session', 'project', 'member'].map((section) =>
  join('app/(home)/[lang]', section)
)

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return pages(path)
    return name === 'page.tsx' ? [path] : []
  })
}

describe('animated Suspense reveals', () => {
  it.each(LCP_PAGES.flatMap(pages))(
    '%s streams with plain Suspense',
    (path) => {
      expect(readFileSync(path, 'utf8')).not.toContain('RevealSuspense')
    }
  )
})
