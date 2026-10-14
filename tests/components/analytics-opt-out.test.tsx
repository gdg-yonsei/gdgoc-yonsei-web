import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import AnalyticsOptOut from '@/app/components/site/analytics-opt-out'

const copy = {
  enabled: '방문 분석 수집이 켜져 있습니다.',
  disabled: '방문 분석 수집을 거부했습니다.',
  gpc: '브라우저의 GPC 설정에 따라 방문 분석을 수집하지 않습니다.',
  disable: '수집 거부',
  enable: '수집 허용',
}

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    configurable: true,
    value: undefined,
  })
})

describe('AnalyticsOptOut', () => {
  it('opts out, removes identifiers and can opt back in', async () => {
    localStorage.setItem('gyms_vid', '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22')
    render(<AnalyticsOptOut copy={copy} buttonClassName="btn" />)

    expect(screen.getByRole('status')).toHaveTextContent(copy.enabled)
    await userEvent.click(screen.getByRole('button', { name: copy.disable }))

    expect(screen.getByRole('status')).toHaveTextContent(copy.disabled)
    expect(localStorage.getItem('gyms_optout')).toBe('1')
    expect(localStorage.getItem('gyms_vid')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: copy.enable }))
    expect(localStorage.getItem('gyms_optout')).toBeNull()
  })

  it('explains GPC and offers no toggle when the browser sends it', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      configurable: true,
      value: true,
    })
    render(<AnalyticsOptOut copy={copy} buttonClassName="btn" />)
    expect(screen.getByRole('status')).toHaveTextContent(copy.gpc)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
