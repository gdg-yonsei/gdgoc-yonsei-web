import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import McpInstallGuide from '@/app/components/admin/mcp-install-guide'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'

const MCP_URL = 'https://gdgoc.yonsei.ac.kr/api/mcp'

function renderGuide(locale: 'en' | 'ko' = 'en') {
  return render(
    <AdminI18nProvider locale={locale} messages={getAdminMessages(locale)}>
      <McpInstallGuide mcpUrl={MCP_URL} />
    </AdminI18nProvider>
  )
}

describe('McpInstallGuide', () => {
  it('shows a tab for every supported client', () => {
    renderGuide()

    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent)
    expect(tabs).toEqual([
      'Claude Code',
      'Codex',
      'Claude (web)',
      'Claude Desktop',
      'ChatGPT (web)',
      'ChatGPT Desktop',
    ])
  })

  it('shows the Claude Code command with the server URL by default', () => {
    renderGuide()

    expect(screen.getByRole('tab', { name: 'Claude Code' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(
      screen.getByText(`claude mcp add --transport http gyms ${MCP_URL}`)
    ).toBeInTheDocument()
  })

  it('switches guides by click and arrow keys', async () => {
    const user = userEvent.setup()
    renderGuide()

    await user.click(screen.getByRole('tab', { name: 'Codex' }))
    expect(
      screen.getByText(`codex mcp add gyms --url ${MCP_URL}`)
    ).toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Claude (web)' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'Add custom connector'
    )
  })

  it('copies the server URL to the clipboard', async () => {
    const user = userEvent.setup()
    renderGuide()

    await user.click(
      screen.getByRole('button', { name: 'Copy: MCP server URL' })
    )
    await expect(navigator.clipboard.readText()).resolves.toBe(MCP_URL)
    expect(
      screen.getByRole('button', { name: 'Copy: MCP server URL' })
    ).toHaveTextContent('Copied')
  })

  it('announces a clipboard failure and allows retry', async () => {
    const user = userEvent.setup()
    renderGuide()
    const write = vi.spyOn(navigator.clipboard, 'writeText')
    write.mockRejectedValueOnce(new Error('Clipboard unavailable'))
    const button = screen.getByRole('button', { name: 'Copy: MCP server URL' })
    await user.click(button)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Copy failed. Try again.'
    )
    await user.click(button)
    expect(button).toHaveTextContent('Copied')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders Korean copy', () => {
    renderGuide('ko')

    expect(screen.getByText('AI 에 GYMS 연결하기 (MCP)')).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'ChatGPT (웹)' })
    ).toBeInTheDocument()
  })
})
