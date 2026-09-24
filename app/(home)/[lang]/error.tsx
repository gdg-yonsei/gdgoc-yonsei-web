'use client'

import LocalizedText from '@/app/components/localized-text'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error(error)

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
        onClick={reset}
        className="pressable bg-fg text-paper inline-flex min-h-12 items-center rounded-full px-6 font-semibold"
      >
        <LocalizedText en="Try again" ko="다시 시도" />
      </button>
    </section>
  )
}
