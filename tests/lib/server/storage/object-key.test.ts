import { beforeEach, describe, expect, it } from 'vitest'
import {
  getSafeImageExtension,
  isUploadedImageUrl,
  normalizeR2ImageObjectKey,
} from '@/lib/server/storage/object-key'

describe('r2 object key security helpers', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example/'
  })

  it('extracts only safe image extensions', () => {
    expect(getSafeImageExtension('photo.png')).toBe('png')
    expect(getSafeImageExtension('photo.JPEG')).toBe('jpeg')
    expect(getSafeImageExtension('photo')).toBeNull()
    expect(getSafeImageExtension('photo.php')).toBeNull()
    expect(getSafeImageExtension('../photo.png')).toBeNull()
  })

  it('normalizes valid object key from full image URL', () => {
    expect(
      normalizeR2ImageObjectKey(
        'https://cdn.example/projects/abc-123.png',
        'projects'
      )
    ).toBe('projects/abc-123.png')
  })

  it('normalizes valid raw object key', () => {
    expect(normalizeR2ImageObjectKey('projects/abc-123.png', 'projects')).toBe(
      'projects/abc-123.png'
    )
  })

  it('rejects unsafe or out-of-scope keys', () => {
    expect(
      normalizeR2ImageObjectKey(
        'https://evil.example/projects/abc-123.png',
        'projects'
      )
    ).toBeNull()
    expect(
      normalizeR2ImageObjectKey('users/abc-123.png', 'projects')
    ).toBeNull()
    expect(
      normalizeR2ImageObjectKey('projects/../../secrets.png', 'projects')
    ).toBeNull()
    expect(
      normalizeR2ImageObjectKey('projects/abc-123.txt', 'projects')
    ).toBeNull()
  })

  it('refuses SVG, which can carry scripts', () => {
    expect(getSafeImageExtension('logo.svg')).toBeNull()
    expect(
      normalizeR2ImageObjectKey(
        'https://cdn.example/projects/logo.svg',
        'projects'
      )
    ).toBeNull()
  })

  it('accepts only the exact public URL of an upload under the prefix', () => {
    expect(
      isUploadedImageUrl('https://cdn.example/projects/abc-123.png', 'projects')
    ).toBe(true)
    expect(
      isUploadedImageUrl(
        'https://cdn.example/users/member-1/abc-123.webp',
        'users'
      )
    ).toBe(true)

    for (const value of [
      'https://evil.example/projects/abc-123.png',
      'https://cdn.example.evil.test/projects/abc-123.png',
      'https://cdn.example/sessions/abc-123.png',
      'https://cdn.example/projects/abc-123.png?x=1',
      'https://cdn.example/projects/../users/abc-123.png',
      'projects/abc-123.png',
      '/project-default.png',
      'javascript:alert(1)',
    ]) {
      expect(isUploadedImageUrl(value, 'projects')).toBe(false)
    }
  })
})
