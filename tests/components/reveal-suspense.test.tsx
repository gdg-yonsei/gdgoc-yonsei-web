import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import RevealSuspense from '@/app/components/site/reveal-suspense'

const pending = new Promise<never>(() => {})

function Pending(): never {
  // Suspense는 아직 끝나지 않은 Promise를 던져 기다린다.
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw pending
}

describe('RevealSuspense', () => {
  it('shows the content once it is ready', () => {
    render(
      <RevealSuspense fallback={<p>Loading</p>}>
        <p>Ready</p>
      </RevealSuspense>
    )
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('shows the skeleton while the content suspends', () => {
    render(
      <RevealSuspense fallback={<p>Loading</p>}>
        <Pending />
      </RevealSuspense>
    )
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
