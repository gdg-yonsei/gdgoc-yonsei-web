import { describe, expect, it } from 'vitest'
import activitySectionContents from '@/lib/contents/activity-section'

describe('activity section content', () => {
  it.each(activitySectionContents)(
    '$key reads as prose, without list items flattened into a sentence',
    ({ content }) => {
      expect(content.en).not.toMatch(/\s-\s/)
      expect(content.ko).not.toMatch(/\s-\s/)
    }
  )
})
