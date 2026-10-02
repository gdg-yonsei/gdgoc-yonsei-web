import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockedLocale } = vi.hoisted(() => ({ mockedLocale: vi.fn() }))

vi.mock('@/lib/admin-i18n/server', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/admin-i18n')>('@/lib/admin-i18n')
  return { ...actual, getAdminLocale: mockedLocale }
})

import AdminNotFound from '@/app/(admin)/admin/not-found'

describe('admin not-found page', () => {
  it('renders inside the admin shell without its own document', async () => {
    mockedLocale.mockResolvedValue('en')
    const { container } = render(await AdminNotFound())

    expect(screen.getByText('Page not found')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Back to dashboard' })
    ).toHaveAttribute('href', '/en/admin')
    // 관리자 루트 레이아웃 안에 렌더링되므로 <html>·<body>를 다시 그리면 안 된다.
    expect(container.querySelector('html, body')).toBeNull()
  })

  it('follows the admin language', async () => {
    mockedLocale.mockResolvedValue('ko')
    render(await AdminNotFound())

    expect(screen.getByText('페이지를 찾을 수 없습니다')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '대시보드로 돌아가기' })
    ).toHaveAttribute('href', '/ko/admin')
  })
})
