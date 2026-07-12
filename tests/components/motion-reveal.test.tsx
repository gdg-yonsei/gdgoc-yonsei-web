import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Reveal from '@/app/components/motion/reveal'

describe('Reveal', () => {
  it('renders its children', () => {
    render(<Reveal>hello reveal</Reveal>)
    expect(screen.getByText('hello reveal')).toBeInTheDocument()
  })
})
