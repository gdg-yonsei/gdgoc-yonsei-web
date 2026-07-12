import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutHero from '@/app/components/about/about-hero'
import StatsSection from '@/app/components/about/stats-section'

describe('AboutHero', () => {
  it('renders kinetic headline lines', () => {
    render(<AboutHero lang={'en'} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'We connect students,'
    )
  })
})

describe('StatsSection', () => {
  // vitest mock의 useReducedMotion은 항상 true → 즉시 최종값이 보여야 함 (스펙 §9)
  it('shows final values immediately under reduced motion', () => {
    render(
      <StatsSection
        stats={{
          sessionCount: 60,
          participantTotal: 450,
          partCount: 7,
          projectCount: 8,
        }}
        lang={'en'}
      />
    )
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('450')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })
})
