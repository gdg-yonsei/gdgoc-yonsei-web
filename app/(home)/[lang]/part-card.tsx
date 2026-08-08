/**
 * A native disclosure keeps every part description server-rendered while
 * providing a keyboard-accessible, zero-JavaScript interaction.
 */
export function PartCard({
  title,
  content,
}: {
  title: string
  content: string
}) {
  return (
    <details className="disclosure-card group min-h-80 overflow-hidden rounded-2xl bg-white ring-2 ring-white">
      <summary className="flex min-h-80 cursor-pointer list-none flex-col items-center justify-center gap-6 p-6 text-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-600">
        <h3 className="text-3xl font-semibold md:text-4xl">{title}</h3>
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-black/10 text-3xl transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <p className="border-t border-neutral-200 p-6 leading-7 text-gray-700">
        {content}
      </p>
    </details>
  )
}
