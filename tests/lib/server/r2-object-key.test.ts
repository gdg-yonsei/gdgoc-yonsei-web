import { beforeEach, describe, expect, it } from 'vitest'
import {
  getSafeImageExtension,
  normalizeR2ImageObjectKey,
} from '@/lib/server/r2-object-key'

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
      normalizeR2ImageObjectKey('https://cdn.example/projects/abc-123.png', 'projects')
    ).toBe('projects/abc-123.png')
  })

  it('normalizes valid raw object key', () => {
    expect(normalizeR2ImageObjectKey('projects/abc-123.png', 'projects')).toBe(
      'projects/abc-123.png'
    )
  })

  it('rejects unsafe or out-of-scope keys', () => {
    expect(
      normalizeR2ImageObjectKey('https://evil.example/projects/abc-123.png', 'projects')
    ).toBeNull()
    expect(normalizeR2ImageObjectKey('users/abc-123.png', 'projects')).toBeNull()
    expect(normalizeR2ImageObjectKey('projects/../../secrets.png', 'projects')).toBeNull()
    expect(normalizeR2ImageObjectKey('projects/abc-123.txt', 'projects')).toBeNull()
  })
})
