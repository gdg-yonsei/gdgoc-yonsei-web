import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Hero from '@/app/components/home/hero'

describe('Hero', () => {
  it('renders the headline and CTA links', () => {
    render(<Hero lang={'en'} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Connect. Learn. Grow.'
    )
    expect(screen.getByRole('link', { name: 'About us' })).toHaveAttribute(
      'href',
      '/en/about'
    )
    expect(screen.getByRole('link', { name: 'Join us' })).toHaveAttribute(
      'href',
      '/en/recruit'
    )
  })

  it('renders Korean CTAs for ko locale', () => {
    render(<Hero lang={'ko'} />)
    expect(screen.getByRole('link', { name: '소개 보기' })).toHaveAttribute(
      'href',
      '/ko/about'
    )
  })
})
