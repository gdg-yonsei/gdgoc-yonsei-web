import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrivacyPolicyPage from '@/app/(home)/[lang]/privacy-policy/page'
import TermsOfServicePage from '@/app/(home)/[lang]/terms-of-service/page'

const pages = [
  ['privacy', PrivacyPolicyPage],
  ['terms', TermsOfServicePage],
] as const

describe.each(pages)('%s page', (_, Page) => {
  it.each(['en', 'ko'] as const)(
    '%s: one h1, a breadcrumb and no hard-coded light surfaces',
    async (lang) => {
      const { container } = render(
        await Page({ params: Promise.resolve({ lang }) })
      )

      expect(container.querySelectorAll('h1')).toHaveLength(1)
      expect(
        screen.getByRole('navigation', {
          name: lang === 'ko' ? '이동 경로' : 'Breadcrumb',
        })
      ).toBeInTheDocument()
      expect(container.innerHTML).not.toMatch(
        /bg-white|bg-neutral-|text-neutral-|text-gray-|ring-gray-|border-gray-/
      )
    }
  )
})
