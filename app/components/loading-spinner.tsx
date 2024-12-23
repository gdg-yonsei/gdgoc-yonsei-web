'use client'

/**
 * Loading Spinner
 *
 * Default CSS: size-10 border-4 border-t-sky-500 border-neutral-300/50
 * @param className
 * @constructor
 */
export default function LoadingSpinner({
  className = 'size-10 border-4 border-t-sky-500 border-neutral-300/50',
}: {
  className?: string
}) {
  return (
    <div className={`${className} border-solid rounded-full animate-spin`} />
  )
}
