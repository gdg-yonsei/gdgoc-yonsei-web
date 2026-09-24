import { describe, expect, it, vi } from 'vitest'

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }))

vi.mock('@/lib/server/logger', () => ({
  logger: { error: mockLoggerError },
}))

import getProjectFormData from '@/lib/server/form-data/get-project-form-data'

function form(entries: Record<string, string>) {
  const data = new FormData()
  data.set('participants', '[]')
  data.set('contentImages', '[]')
  for (const [key, value] of Object.entries(entries)) data.set(key, value)
  return data
}

describe('getProjectFormData tags', () => {
  it('parses the tags JSON field', () => {
    expect(
      getProjectFormData(form({ tags: '["Next.js","Firebase"]' })).tags
    ).toEqual(['Next.js', 'Firebase'])
  })

  it('treats a missing field as no tags', () => {
    expect(getProjectFormData(form({})).tags).toEqual([])
  })

  it('drops non-string entries and malformed JSON', () => {
    expect(getProjectFormData(form({ tags: '[1, "Go", null]' })).tags).toEqual([
      'Go',
    ])
    expect(getProjectFormData(form({ tags: '{oops' })).tags).toEqual([])
    expect(mockLoggerError).toHaveBeenCalledWith(
      'form-data.project',
      expect.anything(),
      { field: 'tags' }
    )
  })
})
