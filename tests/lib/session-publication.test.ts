import { describe, expect, it } from 'vitest'
import {
  getSessionPublicationImageError,
  hasCustomSessionMainImage,
  SESSION_PUBLICATION_IMAGE_ERROR,
} from '@/lib/server/session-publication'

describe('session publication representative image policy', () => {
  it('recognizes local and absolute default image URLs including query strings', () => {
    expect(hasCustomSessionMainImage('/session-default.png')).toBe(false)
    expect(hasCustomSessionMainImage('/session-default.png?v=legacy')).toBe(
      false
    )
    expect(
      hasCustomSessionMainImage(
        'https://gdgoc.yonsei.ac.kr/session-default.png?legacy=1'
      )
    ).toBe(false)
    expect(
      hasCustomSessionMainImage(
        'https://image.gdgyonsei.moveto.kr/sessions/custom.webp'
      )
    ).toBe(true)
  })

  it('requires a custom image for a newly published session', () => {
    expect(
      getSessionPublicationImageError({
        nextDisplayOnWebsite: true,
        nextMainImage: '/session-default.png',
      })
    ).toBe(SESSION_PUBLICATION_IMAGE_ERROR)

    expect(
      getSessionPublicationImageError({
        nextDisplayOnWebsite: true,
        nextMainImage: 'https://image.gdgyonsei.moveto.kr/sessions/custom.webp',
      })
    ).toBeNull()
  })

  it('allows hidden sessions to retain the default image', () => {
    expect(
      getSessionPublicationImageError({
        nextDisplayOnWebsite: false,
        nextMainImage: '/session-default.png',
      })
    ).toBeNull()
  })

  it('blocks a hidden-to-public transition without a custom image', () => {
    expect(
      getSessionPublicationImageError({
        previousDisplayOnWebsite: false,
        previousMainImage: '/session-default.png',
        nextDisplayOnWebsite: true,
        nextMainImage: '/session-default.png',
      })
    ).toBe(SESSION_PUBLICATION_IMAGE_ERROR)
  })

  it('grandfathers an unchanged legacy public default image', () => {
    expect(
      getSessionPublicationImageError({
        previousDisplayOnWebsite: true,
        previousMainImage: '/session-default.png',
        nextDisplayOnWebsite: true,
        nextMainImage: '/session-default.png',
      })
    ).toBeNull()
  })

  it('blocks replacing a public custom image with the default image', () => {
    expect(
      getSessionPublicationImageError({
        previousDisplayOnWebsite: true,
        previousMainImage:
          'https://image.gdgyonsei.moveto.kr/sessions/custom.webp',
        nextDisplayOnWebsite: true,
        nextMainImage: '/session-default.png',
      })
    ).toBe(SESSION_PUBLICATION_IMAGE_ERROR)
  })
})
