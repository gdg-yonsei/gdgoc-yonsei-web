'use client'

/** className은 기본 크기·색을 통째로 대체한다.
 * tailwind-merge가 border-t 색을 덮어 회전 표시를 지울 수 있어 cn을 쓰지 않는다. */
export default function LoadingSpinner({
  className = 'size-10 border-4 border-t-sky-500 border-neutral-300/50',
}: {
  className?: string
}) {
  return (
    <div
      aria-hidden={'true'}
      className={`${className} animate-spin rounded-full border-solid motion-reduce:animate-none`}
    />
  )
}
