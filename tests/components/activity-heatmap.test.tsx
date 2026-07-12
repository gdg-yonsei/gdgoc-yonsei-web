import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ActivityHeatmap from '@/app/components/home/activity-heatmap'
import { buildHeatmapWeeks } from '@/lib/heatmap'

const REFERENCE = new Date('2026-07-11T09:00:00.000Z')

describe('ActivityHeatmap', () => {
  it('renders 52 week cells and the empty caption when there is no data', () => {
    render(
      <ActivityHeatmap weeks={buildHeatmapWeeks([], REFERENCE)} lang={'en'} />
    )
    expect(screen.getAllByRole('button')).toHaveLength(52)
    expect(screen.getByText('No activities recorded yet.')).toBeInTheDocument()
  })

  it('shows week details when a filled cell receives focus', () => {
    const weeks = buildHeatmapWeeks(
      [
        {
          id: 's-1',
          name: 'T19 Week 1',
          nameKo: 'T19 1주차',
          startAt: '2026-07-07T10:00:00.000Z',
          category: 'tech_talk',
          participantCount: 12,
        },
      ],
      REFERENCE
    )
    render(<ActivityHeatmap weeks={weeks} lang={'en'} />)

    const filledCell = screen.getByRole('button', {
      name: 'Week of 2026-07-06: 1 activities',
    })
    fireEvent.focus(filledCell)

    expect(screen.getByText('T19 Week 1')).toBeInTheDocument()
    expect(screen.getByText(/12 participants/)).toBeInTheDocument()
  })
})
