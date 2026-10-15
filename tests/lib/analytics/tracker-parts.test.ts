import { describe, expect, it, vi } from 'vitest'
import { classifyClick } from '@/lib/analytics/tracker/clicks'
import { createEngagementTimer } from '@/lib/analytics/tracker/engagement'
import { createEventQueue } from '@/lib/analytics/tracker/queue'
import { scrollPercent } from '@/lib/analytics/tracker/scroll'

const ORIGIN = 'https://gdgoc.yonsei.ac.kr'

describe('createEngagementTimer', () => {
  it('counts only active time', () => {
    let now = 0
    const timer = createEngagementTimer(() => now, true)
    now = 5_000
    timer.pause()
    now = 65_000
    timer.resume()
    now = 70_000
    expect(timer.total()).toBe(10_000)
  })

  it('starts paused for a hidden page and ignores repeated calls', () => {
    let now = 0
    const timer = createEngagementTimer(() => now, false)
    now = 1_000
    timer.resume()
    timer.resume()
    now = 3_000
    timer.pause()
    timer.pause()
    expect(timer.total()).toBe(2_000)
  })
})

describe('scrollPercent', () => {
  it('reports how far the viewport bottom reached', () => {
    expect(scrollPercent(0, 800, 4_000)).toBe(20)
    expect(scrollPercent(3_200, 800, 4_000)).toBe(100)
    expect(scrollPercent(0, 800, 600)).toBe(100)
  })
})

describe('classifyClick', () => {
  const link = (
    href: string | null,
    extra: Partial<{ ctaLabel: string; download: boolean }> = {}
  ) => ({
    href,
    ctaLabel: extra.ctaLabel ?? null,
    download: extra.download ?? false,
  })

  it.each([
    [
      link('https://www.instagram.com/gdg.yonseiuniv/?igsh=x'),
      {
        kind: 'outbound',
        targetUrl: 'https://www.instagram.com/gdg.yonseiuniv/',
      },
    ],
    [
      link('mailto:gdsc.yonsei.univ@gmail.com?subject=hi'),
      { kind: 'contact', targetUrl: 'mailto:gdsc.yonsei.univ@gmail.com' },
    ],
    [
      link(`${ORIGIN}/files/intro.pdf`),
      { kind: 'download', targetUrl: '/files/intro.pdf' },
    ],
    [
      link('webcal://calendar.google.com/calendar/ical/x/public/basic.ics'),
      {
        kind: 'download',
        targetUrl:
          'webcal://calendar.google.com/calendar/ical/x/public/basic.ics',
      },
    ],
    [
      link(`${ORIGIN}/ko/calendar`, { ctaLabel: 'join_calendar' }),
      { kind: 'cta', label: 'join_calendar', targetUrl: '/ko/calendar' },
    ],
    [
      link(null, { ctaLabel: 'join_button' }),
      { kind: 'cta', label: 'join_button', targetUrl: undefined },
    ],
  ])('classifies %o', (input, expected) => {
    expect(classifyClick(input, ORIGIN)).toEqual(expected)
  })

  it('ignores ordinary internal links', () => {
    expect(classifyClick(link(`${ORIGIN}/ko/project`), ORIGIN)).toBeNull()
  })
})

describe('createEventQueue', () => {
  const event = (n: number) => ({
    type: 'engagement' as const,
    pageViewId: `p${n}`,
    sessionId: 's',
    engagementMs: n,
    maxScrollPercent: 0,
  })

  it('flushes immediately on request, at 10 events, and adds ageMs', () => {
    let now = 0
    const send = vi.fn()
    const queue = createEventQueue(send, () => now)

    queue.push(event(1))
    now = 250
    queue.push(event(2), { immediate: true })
    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(send.mock.calls[0]![0] as string)).toEqual({
      events: [
        { ...event(1), ageMs: 250 },
        { ...event(2), ageMs: 0 },
      ],
    })

    for (let n = 0; n < 10; n += 1) queue.push(event(n))
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('splits a large flush into batches of 20', () => {
    const send = vi.fn()
    const queue = createEventQueue(send, () => 0)
    for (let n = 0; n < 9; n += 1) queue.push(event(n))
    queue.flush()
    queue.flush()
    expect(send).toHaveBeenCalledTimes(1)
  })
})
