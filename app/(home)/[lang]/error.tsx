'use client'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error(error)

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="text-neutral-600">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-neutral-950 px-6 py-2 text-white transition-colors hover:bg-neutral-800"
      >
        Try again
      </button>
    </div>
  )
}
