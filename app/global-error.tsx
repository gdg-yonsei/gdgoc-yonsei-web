'use client' // 오류 경계는 클라이언트 컴포넌트여야 한다

/**
 * 앱 전체의 마지막 오류 경계(Next 특수 파일). 루트 레이아웃까지 실패했을 때 `<html>`부터 직접 그린다.
 */
import './site.css'
import { useEffect } from 'react'

/**
 * 루트 레이아웃에서 난 오류를 받는 최후의 오류 경계. 모든 페이지가 불러오므로 작게 유지한다
 * (로고 그림 없이 글자만). 여기서는 언어를 알 수 없어 두 언어로 함께 보여 준다.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  /** 오류 경계 안쪽을 서버에서 다시 받아 그린다(Next 16.3 권장 복구 방식). */
  retry: () => void
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
          onClick={() => retry()}
          className="pressable bg-on-stage text-stage inline-flex min-h-12 items-center rounded-full px-6 font-semibold"
        >
          Try again · <span lang="ko">다시 시도</span>
        </button>
      </body>
    </html>
  )
}
