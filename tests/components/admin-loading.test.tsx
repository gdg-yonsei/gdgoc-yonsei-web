import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Loading from '@/app/(admin)/loading'
import { DashboardStatsSkeleton } from '@/app/(admin)/admin/dashboard-stats'
import {
  AdminCardSkeleton,
  AdminTableSkeleton,
} from '@/app/components/admin/skeleton'

describe('admin loading announcements', () => {
  it('announces dashboard statistics while hiding their decorative skeletons', () => {
    render(<DashboardStatsSkeleton label={'Loading dashboard'} />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard')
    expect(screen.getByRole('status')).not.toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })
  it.each([Loading, AdminTableSkeleton, AdminCardSkeleton])(
    '%s announces loading without exposing decorative skeletons',
    (Component) => {
      render(<Component />)
      expect(screen.getByRole('status')).toHaveTextContent(/Loading/i)
      expect(screen.getByRole('status')).not.toHaveAttribute(
        'aria-hidden',
        'true'
      )
    }
  )
})
