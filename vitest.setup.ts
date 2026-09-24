import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
import { afterEach, vi } from 'vitest'

process.env.AUTH_DRIZZLE_URL ??=
  'postgres://postgres:postgres@localhost:5432/test'
process.env.BETTER_AUTH_SECRET ??= 'test-secret-at-least-32-characters-long'
process.env.BETTER_AUTH_URL ??= 'http://localhost:3000'
process.env.GITHUB_CLIENT_ID ??= 'test-github-client-id'
process.env.GITHUB_CLIENT_SECRET ??= 'test-github-client-secret'
process.env.GOOGLE_CLIENT_ID ??= 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET ??= 'test-google-client-secret'
// Pinned, not defaulted: CI exports the e2e server's origin
// (http://127.0.0.1:3100), and canonical-URL tests must not depend on it.
process.env.NEXT_PUBLIC_SITE_URL = 'https://gdgoc.yonsei.ac.kr'
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

type NextLinkMockProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  href: string | { pathname?: string }
  children?: React.ReactNode
  prefetch?: boolean | null | 'auto'
  replace?: boolean
  scroll?: boolean
  transitionTypes?: string[]
}

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    prefetch,
    replace,
    scroll,
    transitionTypes,
    ...props
  }: NextLinkMockProps) => {
    // Router-only props never reach the DOM.
    void prefetch
    void replace
    void scroll
    void transitionTypes
    return React.createElement(
      'a',
      {
        href: typeof href === 'string' ? href : href?.pathname,
        ...props,
      },
      children
    )
  },
}))

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  // Next.js runs a React canary with <ViewTransition>; the react package
  // Vitest resolves has none, so here it renders its children unchanged.
  const PassThrough = ({ children }: { children?: React.ReactNode }) => children
  return { ...actual, ViewTransition: actual.ViewTransition ?? PassThrough }
})

/** motion 전용 props는 DOM으로 흘려보내면 React가 unknown-prop 경고를 냅니다. */
const MOTION_ONLY_PROPS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'whileInView',
  'layout',
  'layoutId',
])

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
          React.createElement(
            tag,
            Object.fromEntries(
              Object.entries(props).filter(
                ([key]) => !MOTION_ONLY_PROPS.has(key)
              )
            ),
            children
          ),
    }
  )

vi.mock('motion/react', () => ({
  motion: createMotionProxy(),
  // AnimatePresence는 테스트에서 exit 애니메이션 없이 자식을 그대로 통과시킵니다.
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
  useReducedMotion: () => false,
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

// jsdom lacks the modal dialog API used by the mobile menu. Mirror the
// browser contract: `open` attribute plus a `close` event.
const dialogPrototype = (globalThis.HTMLDialogElement ?? globalThis.HTMLElement)
  .prototype as HTMLDialogElement

if (typeof dialogPrototype.showModal !== 'function') {
  dialogPrototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  dialogPrototype.show = dialogPrototype.showModal
  dialogPrototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
