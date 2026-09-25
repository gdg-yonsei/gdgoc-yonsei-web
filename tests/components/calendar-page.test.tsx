import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SessionCalendar from '@/app/(home)/[lang]/calendar/session-calendar'
import { toCalendarEvents, type CalendarSession } from '@/lib/site/calendar'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string
    children: React.ReactNode
  }) => <a href={href}>{children}</a>,
}))

const sessions: CalendarSession[] = [
  {
    id: 'past',
    name: 'Kickoff',
    nameKo: '킥오프',
    category: 'tech_talk',
    startAt: new Date('2026-09-10T19:00:00.000Z'),
    endAt: new Date('2026-09-10T21:00:00.000Z'),
    location: 'Engineering Hall',
    locationKo: '공학관',
    partName: null,
    generationName: '6th',
  },
  {
    id: 'upcoming',
    name: 'Demo Day',
    nameKo: '데모데이',
    category: 'demo_day',
    startAt: new Date('2026-10-15T18:00:00.000Z'),
    endAt: new Date('2026-10-15T21:00:00.000Z'),
    location: null,
    locationKo: null,
    partName: null,
    generationName: '6th',
  },
]

function renderCalendar(lang: 'en' | 'ko' = 'en') {
  const events = toCalendarEvents(sessions, lang, '2026-09-24T03:00:00.000Z')
  return render(
    <SessionCalendar lang={lang} events={events} serverToday="2026-09-24" />
  )
}

describe('SessionCalendar', () => {
  it('shows the current month with links to published sessions', () => {
    renderCalendar()

    expect(
      screen.getByRole('heading', { level: 2, name: 'September 2026' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kickoff' })).toHaveAttribute(
      'href',
      '/en/session/6th/past'
    )
    expect(
      screen.getByRole('button', {
        name: 'Thursday, September 10, 2026, 1 session',
      })
    ).toBeInTheDocument()
  })

  it('lists sessions that have not happened yet as scheduled, unlinked', async () => {
    const user = userEvent.setup()
    renderCalendar()

    await user.click(screen.getByRole('button', { name: 'Next month' }))

    expect(
      screen.getByRole('heading', { level: 2, name: 'October 2026' })
    ).toBeInTheDocument()
    const agenda = screen.getByRole('list', { name: 'October 2026' })
    const entry = within(agenda)
      .getByText('Demo Day', { selector: '.calendar-entry-title' })
      .closest('li')!
    expect(within(entry).queryByRole('link')).toBeNull()
    expect(within(entry).getByText('Scheduled')).toBeInTheDocument()
    expect(within(entry).getByText(/18:00–21:00/)).toBeInTheDocument()
  })

  it('narrows the agenda to a selected day and back', async () => {
    const user = userEvent.setup()
    renderCalendar('ko')

    const day = screen.getByRole('button', {
      name: '2026년 9월 11일 금요일, 세션 없음',
    })
    await user.click(day)

    expect(day).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('이 날에는 세션이 없습니다.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '이번 달 전체 보기' }))
    expect(screen.getByRole('link', { name: '킥오프' })).toBeInTheDocument()
  })
})
