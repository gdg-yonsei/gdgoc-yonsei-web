export default function ProjectDetailLoading() {
  return (
    <div
      role="status"
      aria-label="Loading project details"
      className="site-page"
    >
      <span className="skeleton-bar h-4 w-64 max-w-full" />
      <span className="skeleton-bar mt-6 h-4 w-24" />
      <span className="skeleton-bar mt-4 h-14 w-3/4" />
      <span className="skeleton-bar mt-4 h-6 w-full max-w-2xl" />
      <span className="skeleton-bar mt-8 aspect-video w-full rounded-[1.75rem]" />
      <span className="sr-only">Loading project details</span>
    </div>
  )
}
