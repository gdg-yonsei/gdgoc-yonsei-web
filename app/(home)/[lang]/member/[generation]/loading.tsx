export default function MemberGenerationLoading() {
  return (
    <div role="status" aria-label="Loading members" className="site-page">
      <span className="skeleton-bar h-4 w-48" />
      <span className="skeleton-bar mt-6 h-14 w-2/3" />
      <span className="skeleton-bar mt-4 h-5 w-full max-w-xl" />
      <div className="archive-skeleton">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className="skeleton-bar h-20 w-full" />
        ))}
      </div>
      <span className="sr-only">Loading members</span>
    </div>
  )
}
