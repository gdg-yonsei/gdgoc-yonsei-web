import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import GlobalError from '@/app/global-error'

describe('GlobalError', () => {
  it('offers a bilingual retry on the stage without the heavy logo', () => {
    const html = renderToStaticMarkup(
      <GlobalError error={new Error('boom')} reset={() => {}} />
    )

    expect(html).toContain('<h1')
    expect(html).toContain('Something went wrong')
    expect(html).toContain('lang="ko"')
    expect(html).toContain('bg-stage')
    // Every page loads this boundary: the old lockup SVG cost ~1 KB of JS.
    expect(html).not.toContain('<svg')
  })
})
