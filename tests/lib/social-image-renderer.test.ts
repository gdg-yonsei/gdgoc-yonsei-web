import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { createSocialImageResponse } from '@/lib/seo/social-image'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife: vi.fn() }))

describe('social image renderer', () => {
  it('emits a compressed 1200×630 JPEG with cache headers', async () => {
    const response = await createSocialImageResponse({
      title: '한글 제목이 선명하게 표시되는 GDGoC Yonsei 기술 세션',
      generation: '4th',
      category: '기술 세션',
      date: '2026. 8. 14.',
      representativeImage: null,
      version: 'updated-at-version',
      locale: 'ko',
    })
    const jpeg = Buffer.from(await response.arrayBuffer())
    const metadata = await sharp(jpeg).metadata()

    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(response.headers.get('cache-control')).toContain('immutable')
    expect(jpeg.byteLength).toBeLessThanOrEqual(750 * 1024)
    expect(metadata).toMatchObject({
      format: 'jpeg',
      width: 1200,
      height: 630,
    })
  })

  it('keeps invalid-route fallback cards on a short cache lifetime', async () => {
    const response = await createSocialImageResponse({
      title: 'GDGoC Yonsei Session',
      generation: '',
      category: 'Community Event',
      date: '',
      representativeImage: null,
      version: 'fallback',
      locale: 'en',
    })

    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=300, stale-while-revalidate=3600'
    )
  })

  it('draws fallback cards on the GDG stage with halftone brackets', async () => {
    const response = await createSocialImageResponse({
      title: 'Stage card',
      generation: '25-26',
      category: 'Tech Talk',
      date: 'Nov 4, 2025',
      representativeImage: null,
      version: 'stage-card',
      locale: 'en',
    })
    const { data, info } = await sharp(
      Buffer.from(await response.arrayBuffer())
    )
      .raw()
      .toBuffer({ resolveWithObject: true })
    const pixel = (x: number, y: number) => {
      const index = (y * info.width + x) * info.channels
      return [data[index]!, data[index + 1]!, data[index + 2]!] as const
    }

    // A neutral near-black corner, not the old navy.
    const [r, g, b] = pixel(8, 8)
    expect(Math.max(r, g, b)).toBeLessThan(48)
    expect(Math.abs(b - r)).toBeLessThan(10)

    // Capsule colours show through on the right-hand side.
    let colourful = 0
    for (let x = 700; x < 1190; x += 7) {
      for (let y = 100; y < 560; y += 7) {
        const [pr, pg, pb] = pixel(x, y)
        if (Math.max(pr, pg, pb) - Math.min(pr, pg, pb) > 80) colourful += 1
      }
    }
    expect(colourful).toBeGreaterThan(50)
  })

  it('darkens light photos enough behind the meta line to read it', async () => {
    const response = await createSocialImageResponse({
      title: 'Photo card',
      generation: '25-26',
      category: 'Project',
      date: '',
      // A light grey placeholder, like a bright photograph.
      representativeImage: '/default-image.png',
      version: 'photo-contrast',
      locale: 'en',
    })
    const { data, info } = await sharp(
      Buffer.from(await response.arrayBuffer())
    )
      .raw()
      .toBuffer({ resolveWithObject: true })
    const index = (398 * info.width + 40) * info.channels

    // The meta line (#b4b4b4, 26px bold) needs ≥ 3:1: a background at or
    // below 70 gives it about 4.5:1.
    expect(
      Math.max(data[index]!, data[index + 1]!, data[index + 2]!)
    ).toBeLessThan(70)
  })

  it.runIf(process.env.RUN_SOCIAL_IMAGE_INTEGRATION === 'true')(
    'renders an allowlisted production R2 representative photograph',
    async () => {
      const content = {
        title: 'Representative image integration test',
        generation: '4th',
        category: 'Tech Talk',
        date: 'Aug 14, 2026',
        version: 'r2-integration',
        locale: 'en' as const,
      }
      const [photoResponse, fallbackResponse] = await Promise.all([
        createSocialImageResponse({
          ...content,
          representativeImage:
            'https://image.gdgyonsei.moveto.kr/sessions/c0d03088-ae47-4028-90bd-99fee2de7ebb.png',
        }),
        createSocialImageResponse({
          ...content,
          representativeImage: null,
        }),
      ])
      const photo = Buffer.from(await photoResponse.arrayBuffer())
      const fallback = Buffer.from(await fallbackResponse.arrayBuffer())
      const metadata = await sharp(photo).metadata()

      expect(createHash('sha256').update(photo).digest('hex')).not.toBe(
        createHash('sha256').update(fallback).digest('hex')
      )
      expect(photo.byteLength).toBeLessThanOrEqual(750 * 1024)
      expect(metadata).toMatchObject({
        format: 'jpeg',
        width: 1200,
        height: 630,
      })

      console.info(
        `Production R2 OG JPEG: ${photo.byteLength} bytes, ${metadata.width}×${metadata.height}`
      )
    }
  )
})
