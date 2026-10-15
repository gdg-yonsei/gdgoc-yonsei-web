import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setRootParams } from '@/tests/mocks/next-root-params'
import PrivacyPolicyPage from '@/app/(home)/[lang]/privacy-policy/page'

// JSX의 빈 표현식 뒤에 남은 문장 부호는 화면에 글자로 찍힌다.
function strayPunctuation(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const found: string[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? ''
    if (/^[;,]$/.test(text)) found.push(text)
  }
  return found
}

describe('privacy policy page', () => {
  it.each(['ko', 'en'])('renders no stray punctuation in %s', async (lang) => {
    setRootParams({ lang })
    const { container } = render(await PrivacyPolicyPage())
    expect(container.querySelector('#analytics')).not.toBeNull()
    expect(strayPunctuation(container)).toEqual([])
  })
})
