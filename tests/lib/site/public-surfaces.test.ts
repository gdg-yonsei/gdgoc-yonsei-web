import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/* Use system-scheme tokens for public text and surfaces to avoid light islands in dark mode.
 * Stage surfaces stay dark in both schemes, so white-alpha and hover:bg-white states are allowed. */
const ROOTS = [
  'app/(home)/[lang]',
  'app/components/site',
  'app/components/header',
  'app/components/footer.tsx',
]
const FIXED_NEUTRAL =
  /\b(?:bg|text|border|ring|divide|from|via|to)-(?:neutral|gray|slate|zinc|stone)-\d{2,3}\b/
const SOLID_WHITE = /(?<![\w:-])bg-white(?![\w/-])/

function files(path: string): string[] {
  return statSync(path).isDirectory()
    ? readdirSync(path).flatMap((name) => files(join(path, name)))
    : [path]
}

const sources = ROOTS.flatMap(files).filter((path) => /\.tsx?$/.test(path))

describe('public surfaces follow the colour scheme', () => {
  it.each(sources)('%s uses scheme tokens', (path) => {
    const source = readFileSync(path, 'utf8')
    expect(source).not.toMatch(FIXED_NEUTRAL)
    expect(source).not.toMatch(SOLID_WHITE)
  })
})
