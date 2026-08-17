export default function SessionGenerationLoading() {
  return (
    <div
      role="status"
      aria-label="Loading sessions"
      className="min-h-screen w-full pt-20"
    >
      <div className="mx-auto mt-8 h-12 w-48 animate-pulse rounded-xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="mx-auto my-8 h-10 w-full max-w-2xl animate-pulse rounded-xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-44 overflow-hidden rounded-2xl border border-neutral-200 bg-white"
          >
            <div className="w-2/5 animate-pulse bg-neutral-200 motion-reduce:animate-none sm:w-1/2" />
            <div className="flex flex-1 flex-col justify-between p-4">
              <div className="h-7 w-4/5 animate-pulse rounded-lg bg-neutral-200 motion-reduce:animate-none" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-neutral-200 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading sessions</span>
    </div>
  )
}
