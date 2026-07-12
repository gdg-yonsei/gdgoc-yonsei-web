import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
import { afterEach, vi } from 'vitest'

process.env.AUTH_DRIZZLE_URL ??=
  'postgres://postgres:postgres@localhost:5432/test'
process.env.NEXT_PUBLIC_SITE_URL ??= 'https://gdgoc.yonsei.ac.kr'
process.env.NEXT_PUBLIC_IMAGE_URL ??= 'https://cdn.example/'
process.env.CLOUDFLARE_ACCOUNT_ID ??= 'test-account'
process.env.R2_ACCESS_KEY ??= 'test-access-key'
process.env.R2_SECRET_KEY ??= 'test-secret-key'
process.env.R2_BUCKET_NAME ??= 'test-bucket'
process.env.RESEND_API_KEY ??= 'test-resend-key'

type NextImageMockProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string | { src?: string }
  blurDataURL?: string
  fill?: boolean
  placeholder?: 'blur' | 'empty'
}

type NextLinkMockProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  href: string | { pathname?: string }
  children?: React.ReactNode
}

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    blurDataURL,
    fill,
    placeholder,
    ...props
  }: NextImageMockProps) => {
    void blurDataURL
    void fill
    void placeholder
    return React.createElement('img', {
      src: typeof src === 'string' ? src : src?.src,
      alt,
      ...props,
    })
  },
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
        ({
          children,
          ...props
        }: React.PropsWithChildren<Record<string, unknown>>) =>
          React.createElement(tag, props, children),
    }
  )

vi.mock('motion/react', () => {
  const proxy = createMotionProxy()
  return {
    motion: proxy,
    m: proxy,
    LazyMotion: ({ children }: React.PropsWithChildren) => children,
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
    domAnimation: {},
    domMax: {},
    useReducedMotion: () => true,
    useScroll: () => ({
      scrollYProgress: { get: () => 0, on: () => () => {} },
    }),
    useTransform: () => 0,
    animate: (
      _from: number,
      to: number,
      options?: { onUpdate?: (value: number) => void }
    ) => {
      options?.onUpdate?.(to)
      return { stop: () => {} }
    },
  }
})

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

if (!window.matchMedia) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
