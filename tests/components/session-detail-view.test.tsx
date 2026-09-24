import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import SessionDetailView, {
  type SessionDetail,
} from '@/app/components/site/session-detail/session-detail-view'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
} from '@/lib/contents/archive-copy'
import type { LogSession } from '@/lib/site/session-log'

const session: SessionDetail = {
  id: '6bf4a326-52ec-4da5-b204-9a67c7332a0f',
  title: 'Sixth T19',
  category: 'tech_talk',
  description: '## Agenda',
  startAt: new Date('2025-11-04T19:00:00.000Z'),
  endAt: new Date('2025-11-04T21:00:00.000Z'),
  location: 'Engineering Hall B039',
  partName: 'Cloud',
  generationName: '25-26',
  mainImage: '/session-default.png',
  images: [],
}

const neighbour = (id: string, name: string): LogSession => ({
  id,
  name,
  nameKo: name,
  category: 'tech_talk',
  type: null,
  mainImage: '/session-default.png',
  startAt: new Date('2025-11-11T19:00:00.000Z'),
  endAt: null,
  location: null,
  locationKo: null,
  createdAt: new Date('2025-10-01T00:00:00.000Z'),
  updatedAt: new Date('2025-10-01T00:00:00.000Z'),
  partName: 'Cloud',
  generationName: '25-26',
  generationStartDate: '2025-03-01',
})

function renderDetail(overrides: Partial<SessionDetail> = {}) {
  return render(
    <SessionDetailView
      lang="en"
      session={{ ...session, ...overrides }}
      related={[neighbour('r1', 'Cloud Run Workshop')]}
      previous={neighbour('p1', 'Fifth T19')}
      next={null}
      copy={sessionArchiveCopy.en}
      common={archiveCommonCopy.en}
    />
  )
}

describe('SessionDetailView', () => {
  it('names the page, the trail and the facts', () => {
    renderDetail()
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sixth T19' })
    ).toBeInTheDocument()
    expect(
      within(trail).getByRole('link', { name: 'Sessions' })
    ).toHaveAttribute('href', '/en/session')
    expect(within(trail).getByRole('link', { name: '25-26' })).toHaveAttribute(
      'href',
      '/en/session/25-26'
    )
    expect(within(trail).getByText('Sixth T19')).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByText('19:00–21:00 KST')).toBeInTheDocument()
    expect(screen.getByText('Tuesday, November 4, 2025')).toHaveAttribute(
      'datetime',
      '2025-11-04T19:00:00+09:00'
    )
    expect(screen.getByText('6bf4a32')).toBeInTheDocument()
  })

  it('draws a poster instead of a stock photo', () => {
    const { container } = renderDetail()

    expect(container.querySelector('.session-poster')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull()
  })

  it('shows the gallery when real photos exist', () => {
    renderDetail({
      mainImage: 'https://image.gdgyonsei.moveto.kr/sessions/1.webp',
      images: ['https://image.gdgyonsei.moveto.kr/sessions/2.webp'],
    })

    expect(screen.getByRole('group', { name: 'Sixth T19' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Next image' })
    ).toBeInTheDocument()
  })

  it('says when the schedule is not set yet', () => {
    renderDetail({ startAt: null, endAt: null, location: null })

    expect(screen.getAllByText('Date to be announced').length).toBeGreaterThan(
      0
    )
    expect(screen.getByText('To be announced')).toBeInTheDocument()
  })

  it('links related sessions and the previous session', () => {
    renderDetail()

    expect(
      screen.getByRole('link', { name: /Cloud Run Workshop/ })
    ).toHaveAttribute('href', '/en/session/25-26/r1')
    expect(
      screen.getByRole('link', { name: /Previous session/ })
    ).toHaveAttribute('href', '/en/session/25-26/p1')
    expect(screen.queryByRole('link', { name: /Next session/ })).toBeNull()
  })
})
