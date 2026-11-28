import { beforeEach, describe, expect, it } from 'vitest'
import { findUnacceptableImages } from '@/lib/server/services/admin/images/shared'

describe('findUnacceptableImages', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example/'
  })

  it('accepts fresh uploads under the target prefix and site static images', () => {
    expect(
      findUnacceptableImages(
        [
          'https://cdn.example/projects/11111111-1111-4111-8111-111111111111.png',
          '/project-default.png',
          '/gdgoc-logo.png',
          null,
          '',
        ],
        [],
        'projects'
      )
    ).toEqual([])
  })

  it('keeps whatever the row already had, including legacy forms', () => {
    const legacy = [
      'https://old-bucket.example/projects/a.png',
      'projects/raw-key.png',
    ]
    expect(findUnacceptableImages(legacy, legacy, 'projects')).toEqual([])
  })

  it('rejects new values that are external, of another kind, or lookalikes', () => {
    const rejected = [
      'https://tracker.example/pixel.png',
      'https://cdn.example/sessions/a.png',
      'https://cdn.example/projects/a.png?x=1',
      'https://cdn.example.evil.test/projects/a.png',
      'https://evil.example/project-default.png',
      '//evil.example/project-default.png',
      'javascript:alert(1)',
      'data:image/svg+xml,<svg onload=alert(1)>',
      'https://cdn.example/projects/a.svg',
    ]
    expect(findUnacceptableImages(rejected, [], 'projects')).toEqual(rejected)
  })
})
