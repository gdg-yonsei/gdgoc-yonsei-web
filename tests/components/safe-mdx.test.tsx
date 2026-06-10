import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SafeMDX from '@/app/components/safe-mdx'

describe('SafeMDX', () => {
  it('renders markdown formatting without evaluating raw HTML', () => {
    const source = `
# Heading

**bold**

<img src="x" onerror="alert(1)" />
`

    const { container } = render(<SafeMDX source={source} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Heading' })
    ).toBeInTheDocument()
    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).not.toContain('alert(1)')
  })

  it('returns empty markup for empty content', () => {
    const { container } = render(<SafeMDX source={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
