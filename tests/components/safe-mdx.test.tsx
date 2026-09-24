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

  it('demotes headings under a page that already has its own h1', () => {
    const { container } = render(
      <SafeMDX source={'# Overview\n\n###### Deep'} headingOffset={1} />
    )

    expect(container.querySelector('h1')).toBeNull()
    expect(container.querySelector('h2')).toHaveTextContent('Overview')
    // Levels stop at h6.
    expect(container.querySelector('h6')).toHaveTextContent('Deep')
  })
})
