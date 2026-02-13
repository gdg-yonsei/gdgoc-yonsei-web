import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-auth/webauthn', () => ({
  signIn: vi.fn(),
}))

vi.mock('@/app/components/auth/sign-out-button/actions', () => ({
  default: vi.fn(),
}))

import { signIn } from 'next-auth/webauthn'
import RegisterPasskeyButton from '@/app/components/auth/register-passkey-button'
import { SignOutButton } from '@/app/components/auth/sign-out-button'
import GithubSubmitButton from '@/app/(admin)/auth/sign-in/sign-in-options/github/github-submit-button'
import GoogleSubmitButton from '@/app/(admin)/auth/sign-in/sign-in-options/google/google-submit-button'

const mockedSignIn = vi.mocked(signIn)

describe('auth components', () => {
  beforeEach(() => {
    mockedSignIn.mockReset()
    vi.mocked(globalThis.alert).mockClear()
  })

  it('calls signIn and shows success alert on passkey registration', async () => {
    mockedSignIn.mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<RegisterPasskeyButton />)

    await user.click(screen.getByRole('button', { name: 'Register Passkey' }))

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith('passkey', {
        action: 'register',
      })
      expect(globalThis.alert).toHaveBeenCalledWith(
        'The passkey has been registered.'
      )
    })
  })

  it('shows fail alert when passkey signIn rejects', async () => {
    mockedSignIn.mockRejectedValue(new Error('already registered'))

    const user = userEvent.setup()
    render(<RegisterPasskeyButton />)

    await user.click(screen.getByRole('button', { name: 'Register Passkey' }))

    await waitFor(() => {
      expect(globalThis.alert).toHaveBeenCalledWith(
        'The passkey is already registered.'
      )
    })
  })

  it('renders sign out button', () => {
    render(<SignOutButton />)

    expect(
      screen.getByRole('button', { name: /Sign Out/i })
    ).toBeInTheDocument()
  })

  it('disables github sign-in button after click to prevent duplicate submit', async () => {
    const user = userEvent.setup()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <GithubSubmitButton />
      </form>
    )

    const button = screen.getByRole('button', { name: /Sign in with Github/i })
    await user.click(button)

    expect(button).toBeDisabled()
  })

  it('disables google sign-in button after click to prevent duplicate submit', async () => {
    const user = userEvent.setup()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <GoogleSubmitButton />
      </form>
    )

    const button = screen.getByRole('button', { name: /Sign in with Google/i })
    await user.click(button)

    expect(button).toBeDisabled()
  })
})
