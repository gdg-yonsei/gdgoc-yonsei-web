'use client' // Error boundaries must be Client Components

import './globals.css'
import { useEffect } from 'react'

/**
 * Last-resort boundary for errors in the root layout. Every page loads it, so
 * it stays small: text on the stage, no logo artwork. Bilingual because no
 * locale is known here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en" className="site" data-color-scheme="auto">
      <head>
        <title>Something went wrong · GDGoC Yonsei</title>
      </head>
      <body className="bg-stage text-on-stage flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center font-sans">
        <p aria-hidden="true" className="text-on-stage-muted font-mono text-sm">
          {'<error />'}
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="text-on-stage-muted max-w-md">
          The page couldn&apos;t load. Try again in a moment.
          <br />
          <span lang="ko">
            페이지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </span>
        </p>
        <button
          type="button"
          onClick={reset}
          className="pressable bg-on-stage text-stage inline-flex min-h-12 items-center rounded-full px-6 font-semibold"
        >
          Try again · <span lang="ko">다시 시도</span>
        </button>
      </body>
    </html>
  )
}
