import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Public pages follow the system colour scheme (site-theme.css), so their
 * surfaces and text must come from the scheme tokens (bg-paper, text-fg …).
 * Tailwind's fixed neutrals or a solid white would leave light islands in the
 * dark scheme. White-alpha on stage surfaces is fine: the stage is dark in
 * both schemes, and state variants such as `hover:bg-white` on a stage button
 * are allowed.
 */
const ROOTS = [
  'app/(home)/[lang]',
  'app/components/site',
  'app/components/header',
  'app/components/footer.tsx',
]
const SKIP = /2026-freshman-ot/
const FIXED_NEUTRAL =
  /\b(?:bg|text|border|ring|divide|from|via|to)-(?:neutral|gray|slate|zinc|stone)-\d{2,3}\b/
const SOLID_WHITE = /(?<![\w:-])bg-white(?![\w/-])/

function files(path: string): string[] {
  return statSync(path).isDirectory()
    ? readdirSync(path).flatMap((name) => files(join(path, name)))
    : [path]
}

const sources = ROOTS.flatMap(files).filter(
  (path) => /\.tsx?$/.test(path) && !SKIP.test(path)
)

describe('public surfaces follow the colour scheme', () => {
  it.each(sources)('%s uses scheme tokens', (path) => {
    const source = readFileSync(path, 'utf8')
    expect(source).not.toMatch(FIXED_NEUTRAL)
    expect(source).not.toMatch(SOLID_WHITE)
  })
})
