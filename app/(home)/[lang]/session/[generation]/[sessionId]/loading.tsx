export default function SessionDetailLoading() {
  return (
    <div
      role="status"
      aria-label="Loading session details"
      className="site-page"
    >
      <span className="skeleton-bar h-4 w-64 max-w-full" />
      <div className="border-rule mt-6 grid gap-3 border-t-[6px] pt-5">
        <span className="skeleton-bar h-3 w-32" />
        <span className="skeleton-bar h-12 w-4/5" />
        <span className="skeleton-bar h-5 w-60 max-w-full" />
      </div>
      <span className="skeleton-bar mt-7 h-24 w-full" />
      <span className="skeleton-bar mt-8 aspect-video w-full rounded-3xl" />
      <span className="sr-only">Loading session details</span>
    </div>
  )
}
