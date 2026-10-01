import { describe, expect, it, vi } from 'vitest'

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }))

vi.mock('@/lib/server/logger', () => ({
  logger: { error: mockLoggerError },
}))

import { parseProjectForm } from '@/lib/server/form-data/admin-forms'

function form(entries: Record<string, string>) {
  const data = new FormData()
  data.set('participants', '[]')
  data.set('contentImages', '[]')
  for (const [key, value] of Object.entries(entries)) data.set(key, value)
  return data
}

describe('parseProjectForm tags', () => {
  it('parses the tags JSON field', () => {
    expect(
      parseProjectForm(form({ tags: '["Next.js","Firebase"]' })).tags
    ).toEqual(['Next.js', 'Firebase'])
  })

  it('treats a missing field as no tags', () => {
    expect(parseProjectForm(form({})).tags).toEqual([])
  })

  it('drops non-string entries and malformed JSON', () => {
    expect(parseProjectForm(form({ tags: '[1, "Go", null]' })).tags).toEqual([
      'Go',
    ])
    expect(parseProjectForm(form({ tags: '{oops' })).tags).toEqual([])
    expect(mockLoggerError).toHaveBeenCalledWith(
      'form-data.project',
      expect.anything(),
      { field: 'tags' }
    )
  })
})
