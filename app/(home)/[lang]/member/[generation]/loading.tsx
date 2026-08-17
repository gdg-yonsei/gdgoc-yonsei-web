export default function MemberGenerationLoading() {
  return (
    <div
      role="status"
      aria-label="Loading members"
      className="min-h-screen w-full pt-20"
    >
      <div className="mx-auto mt-8 h-12 w-48 animate-pulse rounded-xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="mx-auto my-8 h-10 w-full max-w-2xl animate-pulse rounded-xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 px-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex h-28 animate-pulse items-center gap-3 rounded-2xl bg-white p-4 motion-reduce:animate-none"
          >
            <div className="size-20 rounded-full bg-neutral-200" />
            <div className="h-6 flex-1 rounded-lg bg-neutral-200" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading members</span>
    </div>
  )
}
