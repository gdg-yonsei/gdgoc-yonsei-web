import { expect, test } from '@playwright/test'
import { ADMIN_STORAGE_STATE } from './setup/constants'

test.describe('Better Auth social sign-in', () => {
  for (const provider of [
    {
      id: 'github',
      host: 'github.com',
      buttonName: 'Sign in with Github',
    },
    {
      id: 'google',
      host: 'accounts.google.com',
      buttonName: 'Sign in with Google',
    },
  ] as const) {
    test(`${provider.id} form creates a provider authorization request`, async ({
      page,
    }) => {
      await page.route(`https://${provider.host}/**`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<!doctype html><title>OAuth provider</title>',
        })
      })

      await page.goto('/auth/sign-in', { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: provider.buttonName }).click()
      await expect(page).toHaveURL((url) => url.hostname === provider.host)

      const authorizationURL = new URL(page.url())
      const stateCookie = (await page.context().cookies()).find(
        (cookie) => cookie.name === 'better-auth.state'
      )

      expect(authorizationURL.searchParams.get('state')).toBeTruthy()
      expect(stateCookie?.httpOnly).toBe(true)
      expect(stateCookie?.sameSite).toBe('Lax')
    })
  }
})

test.describe('Better Auth passkey lifecycle', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE })

  test('registers a passkey, signs out, and signs back in', async ({
    page,
  }) => {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('WebAuthn.enable', { enableUI: false })
    const { authenticatorId } = await cdp.send(
      'WebAuthn.addVirtualAuthenticator',
      {
        options: {
          protocol: 'ctap2',
          ctap2Version: 'ctap2_1',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
          automaticPresenceSimulation: true,
          isUserVerified: true,
        },
      }
    )

    await page.addInitScript(() => {
      const credentials = navigator.credentials
      const createCredential = credentials.create.bind(credentials)

      Object.defineProperty(credentials, 'create', {
        configurable: true,
        value: async (options: CredentialCreationOptions) => {
          try {
            return await createCredential(options)
          } catch (error) {
            const message =
              error instanceof Error
                ? `${error.name}: ${error.message}`
                : String(error)
            sessionStorage.setItem('e2e-webauthn-error', message)
            throw error
          }
        },
      })
    })

    await page.goto('/admin/profile', { waitUntil: 'domcontentloaded' })

    let registrationMessage = ''
    const registrationDialog = new Promise<void>((resolve, reject) => {
      page.once('dialog', async (dialog) => {
        try {
          registrationMessage = dialog.message()
          await dialog.accept()
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    })

    await page.getByRole('button', { name: 'Register Passkey' }).click()
    await registrationDialog

    const { credentials } = await cdp.send('WebAuthn.getCredentials', {
      authenticatorId,
    })
    const webAuthnError = await page.evaluate(() =>
      sessionStorage.getItem('e2e-webauthn-error')
    )

    expect(
      registrationMessage,
      webAuthnError ?? 'Passkey registration failed'
    ).toBe('The passkey has been registered.')
    expect(credentials).toHaveLength(1)

    await page.getByRole('button', { name: 'Sign Out' }).click()
    await expect(page).toHaveURL(/\/auth\/sign-in$/)

    await page.getByRole('button', { name: 'Sign in with Passkey' }).click()
    await expect(page).toHaveURL(/\/(?:en\/)?admin$/, { timeout: 15_000 })
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' })
    ).toBeVisible()
  })
})
