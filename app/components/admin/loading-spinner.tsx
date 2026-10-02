'use client'

/**
 * 원형 로딩 스피너.
 */

/**
 * 회전하는 원형 스피너.
 *
 * `className`을 넘기면 기본 크기·색 클래스를 통째로 대신한다(합치지 않는다).
 * `cn`(tailwind-merge)을 쓰지 않는 이유: `border-neutral-*`가 앞의 `border-t-*` 색을
 * 덮어써 회전 표시가 사라지기 때문이다.
 * @param className 크기·테두리 색 클래스(기본: `size-10 border-4 border-t-sky-500 border-neutral-300/50`)
 */
export default function LoadingSpinner({
  className = 'size-10 border-4 border-t-sky-500 border-neutral-300/50',
}: {
  className?: string
}) {
  return (
    <div className={`${className} animate-spin rounded-full border-solid`} />
  )
}
