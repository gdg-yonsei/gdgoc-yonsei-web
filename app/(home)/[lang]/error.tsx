'use client'

/**
 * 공개 페이지의 오류 경계(클라이언트 컴포넌트). 언어를 알 수 없어도 되도록 두 언어 문구를 함께 렌더링한다.
 */
import { useEffect } from 'react'
import LocalizedText from '@/app/components/localized-text'

/**
 * 오류 안내와 다시 시도 버튼.
 * @param retry 오류 경계 안쪽을 서버에서 다시 받아 그린다(Next 16.3의 복구 방식)
 */
export default function PublicError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  /** 오류 경계 안쪽을 서버에서 다시 받아 그린다(Next 16.3 권장 복구 방식). */
  retry: () => void
}) {
  // 렌더링 중 부수효과를 피하려고 effect에서 브라우저 콘솔에 남긴다.
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 pt-28 pb-20 text-center">
      <p
        aria-hidden="true"
        className="font-code text-fg-subtle text-xs tracking-[0.18em] uppercase"
      >
        {'<error />'}
      </p>
      <h2 className="font-display text-4xl font-bold tracking-tight [font-variation-settings:'ROND'_100]">
        <LocalizedText en="Something went wrong" ko="문제가 발생했어요" />
      </h2>
      <p className="text-fg-muted max-w-md">
        <LocalizedText
          en="An unexpected error occurred. Please try again."
          ko="예기치 않은 오류가 발생했어요. 다시 시도해 주세요."
        />
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="pressable bg-fg text-paper inline-flex min-h-12 items-center rounded-full px-6 font-semibold"
      >
        <LocalizedText en="Try again" ko="다시 시도" />
      </button>
    </section>
  )
}
