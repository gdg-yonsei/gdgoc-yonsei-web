export default function ProjectGenerationLoading() {
  return (
    <div role="status" aria-label="Loading projects" className="site-page">
      <span className="skeleton-bar h-4 w-48" />
      <span className="skeleton-bar mt-6 h-14 w-2/3" />
      <span className="skeleton-bar mt-4 h-5 w-full max-w-xl" />
      <div className="release-grid mt-8">
        {Array.from({ length: 3 }, (_, index) => (
          <span key={index} className="skeleton-bar aspect-[4/5] rounded-3xl" />
        ))}
      </div>
      <span className="sr-only">Loading projects</span>
    </div>
  )
}
