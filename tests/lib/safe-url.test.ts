import { describe, expect, it } from 'vitest'
import { httpUrlOrNull, isHttpUrl } from '@/lib/safe-url'

describe('safe url helpers', () => {
  it('accepts only http and https urls', () => {
    expect(isHttpUrl('https://github.com/gdg-yonsei/web')).toBe(true)
    expect(isHttpUrl('http://localhost:3000/demo')).toBe(true)

    for (const value of [
      'javascript:alert(1)',
      ' javascript:alert(1)',
      'JAVASCRIPT:alert(1)',
      'data:text/html;base64,PHNjcmlwdD4=',
      'vbscript:msgbox(1)',
      'mailto:someone@example.com',
      '//evil.example/path',
      '/relative/path',
      'not a url',
      '',
    ]) {
      expect(isHttpUrl(value)).toBe(false)
    }
  })

  it('drops stored links that are not web urls before they reach an href', () => {
    expect(httpUrlOrNull('https://demo.example')).toBe('https://demo.example')
    expect(httpUrlOrNull('javascript:alert(1)')).toBeNull()
    expect(httpUrlOrNull(null)).toBeNull()
    expect(httpUrlOrNull(undefined)).toBeNull()
  })
})
