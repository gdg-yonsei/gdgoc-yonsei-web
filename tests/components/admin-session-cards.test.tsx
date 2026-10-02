import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import RegisterSessionCard from '@/app/(admin)/admin/sessions/register-session-card'
import SessionCard from '@/app/(admin)/admin/sessions/session-card'

const startAt = new Date('2026-11-04T19:00:00.000Z')

function renderRegisterCard(
  locale: 'en' | 'ko',
  sessionNameKo: string | null = '정기 세션'
) {
  return render(
    <RegisterSessionCard
      sessionId="s1"
      sessionName="Weekly Session"
      sessionNameKo={sessionNameKo}
      part="Web"
      startAt={startAt}
      endAt={null}
      maxCapacity={20}
      participants={3}
      locale={locale}
    />
  )
}

function renderSessionCard(locale: 'en' | 'ko') {
  return render(
    <SessionCard
      session={{
        id: 's1',
        mainImage: '/default-image.png',
        name: 'Weekly Session',
        nameKo: '정기 세션',
        startAt,
      }}
      locale={locale}
    />
  )
}

describe('admin session cards', () => {
  it('show the session name in the admin language', () => {
    renderRegisterCard('en')
    expect(
      screen.getByRole('heading', { name: 'Weekly Session' })
    ).toBeInTheDocument()

    renderSessionCard('ko')
    expect(screen.getByText('정기 세션')).toBeInTheDocument()
  })

  it('show the Korean name on Korean screens and fall back when it is missing', () => {
    renderRegisterCard('ko')
    expect(
      screen.getByRole('heading', { name: '정기 세션' })
    ).toBeInTheDocument()

    renderRegisterCard('ko', null)
    expect(
      screen.getByRole('heading', { name: 'Weekly Session' })
    ).toBeInTheDocument()
  })

  it('shows the English name on English screens for joined sessions', () => {
    renderSessionCard('en')
    expect(screen.getByText('Weekly Session')).toBeInTheDocument()
  })
})
