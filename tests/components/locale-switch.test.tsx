import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LocaleSwitch from '@/app/components/site/locale-switch'

describe('LocaleSwitch', () => {
  it('names each option with its visible abbreviation (WCAG 2.5.3)', () => {
    render(<LocaleSwitch lang="en" pathname="/en/session" label="Language" />)

    // Voice-control users say what they see: "KO".
    expect(screen.getByRole('link', { name: /^KO\b/ })).toHaveAttribute(
      'href',
      '/ko/session'
    )
  })

  it('marks the current language', () => {
    render(<LocaleSwitch lang="ko" pathname="/ko" label="언어" />)
    expect(
      screen.getByText('KO', { exact: false }).closest('[aria-current]')
    ).toHaveAttribute('aria-current', 'true')
  })

})
