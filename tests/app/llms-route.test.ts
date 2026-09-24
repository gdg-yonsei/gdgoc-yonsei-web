import { describe, expect, it } from 'vitest'
import { GET } from '@/app/llms.txt/route'

describe('llms.txt', () => {
  it('describes the site, its hubs, their filters and the official channels', async () => {
    const response = GET()
    const text = await response.text()

    expect(response.headers.get('content-type')).toBe(
      'text/plain; charset=utf-8'
    )
    for (const expected of [
      'Session Log',
      'https://gdgoc.yonsei.ac.kr/en/session',
      'https://gdgoc.yonsei.ac.kr/ko/project',
      '/en/session/{generation}',
      'category (tech_talk, part_session, hackathon, demo_day, devrel)',
      'tag (tech stack)',
      'Front-End, Back-End, ML/AI, Cloud, UI/UX, DevRel',
      'https://www.instagram.com/gdg.yonseiuniv/',
    ]) {
      expect(text).toContain(expected)
    }
  })
})
