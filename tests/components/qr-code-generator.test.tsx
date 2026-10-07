import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import QRCodeGenerator from '@/app/components/admin/qr-code-generator'
import { getAdminMessages } from '@/lib/admin-i18n'
import type { Locale } from '@/lib/i18n'

const renderGenerator = (locale: Locale = 'en') =>
  render(
    <AdminI18nProvider locale={locale} messages={getAdminMessages(locale)}>
      <QRCodeGenerator />
    </AdminI18nProvider>
  )

// The heading icon is also an svg, so match the code by excluding decorative ones.
const qrCode = () => document.querySelector('svg:not([aria-hidden])')

afterEach(() => vi.restoreAllMocks())

describe('QRCodeGenerator', () => {
  it('names what to type and explains the empty preview', () => {
    renderGenerator()

    expect(
      screen.getByRole('textbox', { name: 'Text or URL to encode' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Type text or a URL above to see its QR code here.')
    ).toBeInTheDocument()
  })

  it('draws the code for the typed value and drops the empty message', async () => {
    const user = userEvent.setup()
    renderGenerator()

    await user.type(screen.getByRole('textbox'), 'https://gdgoc.dev')

    expect(qrCode()).not.toBeNull()
    expect(
      screen.queryByText('Type text or a URL above to see its QR code here.')
    ).not.toBeInTheDocument()
  })

  it('shows an inline error instead of a stale code when the value is too long', () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    renderGenerator()
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: 'short' } })
    fireEvent.change(input, { target: { value: 'x'.repeat(23648) } })

    expect(alert).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This is too long for a QR code. Shorten it to under 23,648 characters.'
    )
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(
      'This is too long for a QR code. Shorten it to under 23,648 characters.'
    )
    expect(qrCode()).toBeNull()
  })

  it('uses Korean copy for the Korean admin', () => {
    renderGenerator('ko')

    expect(
      screen.getByRole('textbox', { name: 'QR 코드로 만들 텍스트 또는 URL' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '위에 텍스트나 URL을 입력하면 여기에 QR 코드가 나타납니다.'
      )
    ).toBeInTheDocument()
  })
})
