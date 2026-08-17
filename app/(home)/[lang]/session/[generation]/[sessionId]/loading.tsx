export default function SessionDetailLoading() {
  return (
    <div
      role="status"
      aria-label="Loading session details"
      className="min-h-screen w-full pt-24"
    >
      <div className="mx-auto h-10 w-full max-w-4xl animate-pulse rounded-xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="mx-auto mt-6 h-14 w-full max-w-2xl animate-pulse rounded-xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="mx-auto mt-8 aspect-video w-full max-w-xl animate-pulse rounded-2xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="mx-auto mt-10 w-full max-w-4xl space-y-4 px-4">
        <div className="h-7 w-1/3 animate-pulse rounded-lg bg-neutral-200 motion-reduce:animate-none" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-neutral-200 motion-reduce:animate-none" />
        <div className="h-4 w-5/6 animate-pulse rounded-lg bg-neutral-200 motion-reduce:animate-none" />
      </div>
      <span className="sr-only">Loading session details</span>
    </div>
  )
}
