import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PartsBentoGrid from '@/app/components/home/parts-bento-grid'

describe('PartsBentoGrid', () => {
  it('renders all six fixed parts with Organizer spanning wide', () => {
    render(<PartsBentoGrid lang={'en'} />)

    for (const title of [
      'Organizer',
      'Front-End',
      'Back-End',
      'ML/AI',
      'UI/UX',
      'DevRel',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }

    const organizerCard = screen
      .getByRole('heading', { name: 'Organizer' })
      .closest('article')
    expect(organizerCard?.className).toContain('md:col-span-2')
  })
})
