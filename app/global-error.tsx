'use client' // Error boundaries must be Client Components

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <head>
        <title>Something went wrong!</title>
      </head>
      <body
        className={
          'flex h-screen w-screen flex-col items-center justify-center bg-neutral-50 p-4'
        }
      >
        <div
          className={
            'w-full max-w-4xl rounded-xl border-2 border-neutral-300 bg-white p-4'
          }
        >
          <h2 className={'text-4xl font-bold'}>Something went wrong!</h2>
          <button
            onClick={() => reset()}
            className={'rounded-lg bg-neutral-950 p-2 text-center text-white'}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
