import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CalendarPage from '@/app/(home)/[lang]/calendar/page'
import { CALENDAR_EMBED_URL } from '@/app/(home)/[lang]/calendar/google-calendar'

describe('CalendarPage', () => {
  it('frames the embed and offers the calendar in a new tab', () => {
    render(<CalendarPage params={Promise.resolve({ lang: 'en' })} />)

    expect(screen.getByTitle('GDGoC Yonsei Google Calendar')).toHaveAttribute(
      'src',
      CALENDAR_EMBED_URL
    )
    expect(
      screen.getByRole('link', { name: /Open in Google Calendar/ })
    ).toHaveAttribute('target', '_blank')
  })
})
