'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error(error)

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-xl font-bold">An error occurred</h2>
      <p className="text-sm text-neutral-600">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-neutral-950 px-4 py-2 text-sm text-white transition-colors hover:bg-neutral-800"
      >
        Try again
      </button>
    </div>
  )
}
