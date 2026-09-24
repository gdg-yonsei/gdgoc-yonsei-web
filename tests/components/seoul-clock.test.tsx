import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SeoulClock from '@/app/components/site/seoul-clock'

describe('SeoulClock', () => {
  afterEach(() => vi.useRealTimers())

  it('shows the current time in Seoul regardless of the machine zone', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-23T10:04:00Z'))
    render(<SeoulClock label="Sinchon, Seoul" />)
    expect(screen.getByText('19:04')).toBeInTheDocument()
  })
})
