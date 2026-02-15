import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataForm from '@/app/components/data-form'
import MenuBar from '@/app/components/admin/menu-bar'
import ToggleMenubarButton from '@/app/components/admin/toggle-menubar-button'

vi.mock('@/app/components/admin/user-auth-control-panel-client', () => ({
  default: () => React.createElement('div', {}, 'User Panel'),
}))

vi.mock('@/app/components/admin/home-page-button', () => ({
  default: () => React.createElement('button', { type: 'button' }, 'Home'),
}))

vi.mock('@/app/components/admin/refresh-all-data-button', () => ({
  default: () =>
    React.createElement('button', { type: 'button' }, 'Refresh Cache'),
}))

describe('DataForm and admin menu components', () => {
  it('submits form data through server action and renders action error', async () => {
    const action = vi.fn(async () => ({ error: 'Validation failed' }))
    const user = userEvent.setup()

    render(
      <DataForm action={action}>
        <input name="title" defaultValue="my-title" />
        <button type="submit">Submit</button>
      </DataForm>
    )

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(action).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Validation failed')).toBeVisible()
    })

    const [, formData] = action.mock.calls[0]
    expect((formData as FormData).get('title')).toBe('my-title')
  })

  it('opens and closes mobile admin menu through toggle and backdrop', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <>
        <ToggleMenubarButton />
        <MenuBar
          navigations={[
            {
              name: 'Generations',
              path: '/admin/generations',
              dataResource: 'generationsPage',
            } as never,
          ]}
        />
      </>
    )

    expect(
      screen.queryByRole('link', { name: 'Generations' })
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Generations' })).toBeVisible()
      expect(screen.getByText('User Panel')).toBeVisible()
    })

    const overlay = container.querySelector('.backdrop-blur') as HTMLElement
    await user.click(overlay)

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'Generations' })
      ).not.toBeInTheDocument()
    })
  })
})
