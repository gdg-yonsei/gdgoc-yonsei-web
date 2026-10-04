import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import DisconnectButton from '@/app/(admin)/admin/profile/mcp/disconnect-button'

it('shows an actionable error on a failed disconnect and allows retry', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const action = vi.fn(async () => ({ failed: true }))
  render(
    <DisconnectButton
      action={action}
      clientId="client-1"
      clientName="Test AI"
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect: Test AI' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not disconnect this AI tool. Please try again.'
  )
  expect(
    screen.getByRole('button', { name: 'Disconnect: Test AI' })
  ).toBeEnabled()
  expect(action).toHaveBeenCalledTimes(1)
})
