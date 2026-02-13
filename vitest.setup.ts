import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
import { afterEach, vi } from 'vitest'

type NextImageMockProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string | { src?: string }
}

type NextLinkMockProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string | { pathname?: string }
  children?: React.ReactNode
}

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: NextImageMockProps) =>
    React.createElement('img', {
      src: typeof src === 'string' ? src : src?.src,
      alt,
      ...props,
    }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: NextLinkMockProps) =>
    React.createElement(
      'a',
      {
        href: typeof href === 'string' ? href : href?.pathname,
        ...props,
      },
      children
    ),
}))

const createMotionProxy = () =>
  new Proxy(
    {},
    {
      get:
        (_, tag: string) =>
        ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
          React.createElement(tag, props, children),
    }
  )

vi.mock('motion/react', () => ({
  motion: createMotionProxy(),
}))

vi.mock('motion/react-client', () => createMotionProxy())

vi.stubGlobal('alert', vi.fn())

class IntersectionObserverMock {
  observe = vi.fn()

  unobserve = vi.fn()

  disconnect = vi.fn()

  takeRecords = vi.fn(() => [])

  root = null

  rootMargin = '0px'

  thresholds = [0]
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
})

Object.defineProperty(globalThis.HTMLElement.prototype, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
