import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import SessionLog from '@/app/components/site/session-log/session-log'
import { sessionArchiveCopy } from '@/lib/contents/archive-copy'
import { groupSessionLog, type LogSession } from '@/lib/site/session-log'

const sixthT19: LogSession = {
  id: 'a',
  name: 'Sixth T19',
  nameKo: '여섯 번째 T19',
  category: 'tech_talk',
  type: 'General Session',
  mainImage: '/session-default.png',
  startAt: new Date('2025-11-04T19:00:00.000Z'),
  endAt: new Date('2025-11-04T21:00:00.000Z'),
  location: 'Engineering Hall B039',
  locationKo: '공학원 B039',
  createdAt: new Date('2025-10-01T00:00:00.000Z'),
  updatedAt: new Date('2025-10-01T00:00:00.000Z'),
  partName: 'Cloud',
  generationName: '25-26',
  generationStartDate: '2025-03-01',
}

const buildDay: LogSession = {
  ...sixthT19,
  id: 'b',
  name: 'Build Day',
  category: 'hackathon',
  startAt: null,
  endAt: null,
  partName: null,
  mainImage: 'https://image.gdgyonsei.moveto.kr/sessions/b.webp',
}

describe('SessionLog', () => {
  it('nests generation sections, month headings and session rows on the hub', () => {
    render(
      <SessionLog
        id="session-log"
        lang="en"
        copy={sessionArchiveCopy.en}
        showGenerations
        generations={groupSessionLog([sixthT19, buildDay])}
      />
    )
    const generation = screen.getByRole('region', { name: /25-26/ })

    expect(
      within(generation).getByRole('heading', {
        level: 2,
        name: '25-26 2 sessions',
      })
    ).toBeInTheDocument()
    expect(
      within(generation).getByRole('heading', {
        level: 3,
        name: 'November 2025',
      })
    ).toBeInTheDocument()
    expect(
      within(generation).getByRole('heading', {
        level: 3,
        name: 'Date to be announced',
      })
    ).toBeInTheDocument()
    expect(
      within(generation).getByRole('heading', { level: 4, name: 'Sixth T19' })
    ).toBeInTheDocument()
  })

  it('writes the facets and search text the filter island reads', () => {
    render(
      <SessionLog
        id="session-log"
        lang="en"
        copy={sessionArchiveCopy.en}
        showGenerations
        generations={groupSessionLog([sixthT19, buildDay])}
      />
    )
    const link = screen.getByRole('link', { name: 'Sixth T19' })
    const row = link.closest('li')

    expect(link).toHaveAttribute('href', '/en/session/25-26/a')
    expect(row).toHaveAttribute('data-f-category', 'tech_talk')
    expect(row).toHaveAttribute('data-f-part', 'Cloud')
    expect(row).toHaveAttribute('data-f-generation', '25-26')
    expect(row?.getAttribute('data-search')).toContain('sixth t19')
    expect(screen.getByText('TUE 2025.11.04 19:00')).toHaveAttribute(
      'datetime',
      '2025-11-04T19:00:00+09:00'
    )
  })

  it('shows thumbnails only for real photos', () => {
    render(
      <SessionLog
        id="session-log"
        lang="en"
        copy={sessionArchiveCopy.en}
        showGenerations
        generations={groupSessionLog([sixthT19, buildDay])}
      />
    )

    expect(
      screen
        .getByRole('link', { name: 'Sixth T19' })
        .closest('li')
        ?.querySelector('img')
    ).toBeNull()
    expect(
      screen
        .getByRole('link', { name: 'Build Day' })
        .closest('li')
        ?.querySelector('img')
    ).toHaveAttribute('alt', '')
  })

  it('drops the generation level on generation pages, in Korean too', () => {
    render(
      <SessionLog
        id="session-log"
        lang="ko"
        copy={sessionArchiveCopy.ko}
        showGenerations={false}
        generations={groupSessionLog([sixthT19])}
      />
    )

    expect(screen.queryByRole('region')).toBeNull()
    expect(
      screen.getByRole('heading', { level: 2, name: '2025년 11월' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: '여섯 번째 T19' })
    ).toBeInTheDocument()
    expect(screen.getByText('공학원 B039')).toBeInTheDocument()
  })
})
