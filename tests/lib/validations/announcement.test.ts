import { describe, expect, it } from 'vitest'
import { announcementValidation } from '@/lib/validations/announcement'

const base = { title: 'Title', body: 'Body', ctaLabel: null, ctaHref: null }

describe('announcementValidation', () => {
  it('accepts an announcement without a button', () => {
    expect(announcementValidation.safeParse(base).success).toBe(true)
  })

  it.each(['/admin', '/admin/mcp', '/admin/sessions?view=list', '/admin#mcp'])(
    'accepts the GYMS path %s as the button link',
    (ctaHref) => {
      expect(
        announcementValidation.safeParse({ ...base, ctaLabel: 'Open', ctaHref })
          .success
      ).toBe(true)
    }
  )

  it.each([
    'https://evil.example',
    '//evil.example/admin',
    '/admin//evil.example',
    '/administrator',
    '/en/admin/mcp',
    'javascript:alert(1)',
  ])('rejects %s as the button link', (ctaHref) => {
    expect(
      announcementValidation.safeParse({ ...base, ctaLabel: 'Open', ctaHref })
        .success
    ).toBe(false)
  })

  it('requires the button label and link together', () => {
    expect(
      announcementValidation.safeParse({ ...base, ctaLabel: 'Open' }).success
    ).toBe(false)
    expect(
      announcementValidation.safeParse({ ...base, ctaHref: '/admin/mcp' })
        .success
    ).toBe(false)
  })

  it('rejects a blank title or body', () => {
    expect(
      announcementValidation.safeParse({ ...base, title: '   ' }).success
    ).toBe(false)
    expect(
      announcementValidation.safeParse({ ...base, body: '' }).success
    ).toBe(false)
  })
})
