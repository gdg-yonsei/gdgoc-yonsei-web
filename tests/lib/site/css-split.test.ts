import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Landing styles are render-blocking CSS that no other page uses: they load
// with the home route instead of the global bundle every page downloads.
describe('landing CSS', () => {
  it('ships with the home page, not the global bundle', () => {
    expect(readFileSync('app/globals.css', 'utf8')).not.toContain(
      'site-home.css'
    )
    expect(readFileSync('app/(home)/[lang]/page.tsx', 'utf8')).toContain(
      "import '@/app/styles/site-home.css'"
    )
  })
})
