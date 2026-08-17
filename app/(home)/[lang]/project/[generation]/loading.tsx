export default function ProjectGenerationLoading() {
  return (
    <div
      role="status"
      aria-label="Loading projects"
      className="min-h-screen w-full pt-20"
    >
      <div className="mx-auto mt-8 h-12 w-48 animate-pulse rounded-xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="mx-auto my-8 h-10 w-full max-w-2xl animate-pulse rounded-xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg bg-white ring-2 ring-neutral-200"
          >
            <div className="aspect-3/2 w-full animate-pulse bg-neutral-200 motion-reduce:animate-none" />
            <div className="space-y-3 p-3">
              <div className="h-7 w-3/4 animate-pulse rounded-lg bg-neutral-200 motion-reduce:animate-none" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-neutral-200 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading projects</span>
    </div>
  )
}
